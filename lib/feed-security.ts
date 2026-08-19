import { isIP } from "node:net";

const MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

interface FetchFeedOptions {
  fetchImpl?: FetchLike;
  resolveHostname?: (
    hostname: string,
    fetchImpl: FetchLike,
    signal: AbortSignal,
  ) => Promise<void>;
  maxBytes?: number;
  timeoutMs?: number;
}

function blockedIpv4(address: string): boolean {
  const [first, second] = address.split(".").map(Number);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function blockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  return (
    normalized.startsWith("::") ||
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    /^fe[c-f]/.test(normalized) ||
    normalized.startsWith("ff")
  );
}

function assertPublicIp(address: string): void {
  const version = isIP(address);
  if (
    version === 0 ||
    (version === 4 && blockedIpv4(address)) ||
    (version === 6 && blockedIpv6(address))
  ) {
    throw new Error("feed_url_not_allowed");
  }
}

export function validateFeedUrl(input: string | URL): URL {
  const url = input instanceof URL ? new URL(input) : new URL(input);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("feed_url_not_allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (
    !hostname.includes(".") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".corp")
  ) {
    throw new Error("feed_url_not_allowed");
  }

  if (isIP(hostname)) assertPublicIp(hostname);
  return url;
}

interface DnsAnswer {
  type?: number;
  data?: string;
}

async function resolveDnsType(
  hostname: string,
  type: "A" | "AAAA",
  fetchImpl: FetchLike,
  signal: AbortSignal,
): Promise<string[]> {
  const endpoint = new URL("https://cloudflare-dns.com/dns-query");
  endpoint.searchParams.set("name", hostname);
  endpoint.searchParams.set("type", type);

  const response = await fetchImpl(endpoint, {
    headers: { accept: "application/dns-json" },
    redirect: "error",
    signal,
  });
  if (!response.ok) throw new Error("feed_dns_failed");

  const body = (await response.json()) as { Answer?: DnsAnswer[] };
  const expectedType = type === "A" ? 1 : 28;
  return (body.Answer ?? [])
    .filter((answer) => answer.type === expectedType && answer.data)
    .map((answer) => answer.data as string);
}

export async function resolvePublicHostname(
  hostname: string,
  fetchImpl: FetchLike,
  signal: AbortSignal,
): Promise<void> {
  const normalized = hostname.replace(/^\[|\]$/g, "");
  if (isIP(normalized)) {
    assertPublicIp(normalized);
    return;
  }

  const addresses = (
    await Promise.all([
      resolveDnsType(normalized, "A", fetchImpl, signal),
      resolveDnsType(normalized, "AAAA", fetchImpl, signal),
    ])
  ).flat();
  if (addresses.length === 0) throw new Error("feed_dns_failed");
  addresses.forEach(assertPublicIp);
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  const contentEncoding = response.headers.get("content-encoding");
  if (contentEncoding && contentEncoding.toLowerCase() !== "identity") {
    throw new Error("feed_compression_not_allowed");
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("feed_too_large");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("feed_too_large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function fetchCalendarFeed(
  input: string,
  options: FetchFeedOptions = {},
): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resolver = options.resolveHostname ?? resolvePublicHostname;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    let url = validateFeedUrl(input);
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      await resolver(url.hostname, fetchImpl, controller.signal);
      const response = await fetchImpl(url, {
        cache: "no-store",
        headers: {
          accept: "text/calendar, text/plain;q=0.9",
          "accept-encoding": "identity",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects === MAX_REDIRECTS) throw new Error("feed_too_many_redirects");
        const location = response.headers.get("location");
        if (!location) throw new Error("feed_fetch_failed");
        url = validateFeedUrl(new URL(location, url));
        continue;
      }

      if (!response.ok) throw new Error("feed_fetch_failed");
      return await readLimitedBody(response, maxBytes);
    }
    throw new Error("feed_too_many_redirects");
  } catch (error) {
    if (controller.signal.aborted) throw new Error("feed_timeout");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}