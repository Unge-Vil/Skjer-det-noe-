import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveApiKey, bearerToken } from "@/lib/api/auth";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** POST /api/v1/media — upload an image and return a URL for image_url. */
export async function POST(req: Request) {
  const ipLimited = enforceRateLimit({ bucket: "api_v1_media_post_ip", key: limitKey([clientIp(req)]), max: 60, windowMs: 60_000 });
  if (ipLimited) return ipLimited;

  const key = await resolveApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });

  const keyLimited = enforceRateLimit({ bucket: "api_v1_media_post_key", key: limitKey([key.id]), max: 30, windowMs: 60_000 });
  if (keyLimited) return keyLimited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "validation_error", message: "file is required" }, { status: 422 });

  const extension = ALLOWED_TYPES[file.type];
  if (!extension || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "validation_error", message: "file must be a PNG, JPEG, or WebP image no larger than 5 MB" }, { status: 422 });
  }

  const path = `org/${key.organizationId}/api/${crypto.randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) return NextResponse.json({ error: "internal_error", message: "Failed to upload image" }, { status: 500 });

  const { data } = admin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}