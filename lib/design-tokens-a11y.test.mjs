import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = await readFile(path.join(root, "app/ds-tokens/colors.css"), "utf8");

function declarations(selector) {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  assert.notEqual(start, -1, `Missing ${selector} token block`);
  assert.notEqual(end, -1, `Unclosed ${selector} token block`);
  return new Map(
    [...css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
}

const light = declarations(":root");
const dark = new Map([...light, ...declarations(':root[data-theme="dark"]')]);
const auto = new Map([...light, ...declarations(':root[data-theme="auto"]')]);

function resolve(tokens, token, seen = new Set()) {
  assert(!seen.has(token), `Circular token reference: ${[...seen, token].join(" -> ")}`);
  const value = tokens.get(token);
  assert(value, `Missing token ${token}`);
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  return reference ? resolve(tokens, reference[1], new Set([...seen, token])) : value;
}

function luminance(hex) {
  const channels = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index + 1, index + 3), 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(tokens, foreground, background) {
  const foregroundHex = resolve(tokens, foreground);
  const backgroundHex = resolve(tokens, background);
  assert.match(foregroundHex, /^#[\da-f]{6}$/i, `${foreground} must resolve to an opaque hex colour`);
  assert.match(backgroundHex, /^#[\da-f]{6}$/i, `${background} must resolve to an opaque hex colour`);
  const [first, second] = [luminance(foregroundHex), luminance(backgroundHex)].sort((a, b) => b - a);
  return (first + 0.05) / (second + 0.05);
}

const textPairs = [
  ["--text-body", "--surface-card"],
  ["--text-muted", "--surface-card"],
  ["--text-link", "--surface-card"],
  ["--text-on-brand", "--surface-brand-strong"],
  ["--text-on-coral", "--coral-600"],
  ["--text-on-accent", "--accent"],
  ["--control-disabled-text", "--control-disabled-bg"],
  ["--status-sol-text", "--status-sol-bg"],
  ["--status-brand-text", "--status-brand-bg"],
  ["--status-neutral-text", "--status-neutral-bg"],
  ["--status-success-text", "--status-success-bg"],
  ["--status-danger-text", "--status-danger-bg"],
  ["--cat-gaming-fg", "--cat-gaming-bg"],
  ["--cat-music-fg", "--cat-music-bg"],
  ["--cat-film-fg", "--cat-film-bg"],
  ["--cat-sports-fg", "--cat-sports-bg"],
  ["--cat-outdoor-fg", "--cat-outdoor-bg"],
  ["--cat-creative-fg", "--cat-creative-bg"],
  ["--cat-social-fg", "--cat-social-bg"],
  ["--cat-courses-fg", "--cat-courses-bg"],
  ["--cat-club-fg", "--cat-club-bg"],
  ["--text-on-brand", "--cat-gaming-fg"],
  ["--text-on-brand", "--cat-music-fg"],
  ["--text-on-brand", "--cat-film-fg"],
  ["--text-on-brand", "--cat-sports-fg"],
  ["--text-on-brand", "--cat-outdoor-fg"],
  ["--text-on-brand", "--cat-creative-fg"],
  ["--text-on-brand", "--cat-social-fg"],
  ["--text-on-brand", "--cat-courses-fg"],
  ["--text-on-brand", "--cat-club-fg"],
];

const uiPairs = [
  ["--border-strong", "--surface-card"],
  ["--focus-ring", "--focus-ring-offset"],
  ["--icon-brand", "--surface-card"],
  ["--icon-brand", "--surface-brand-soft"],
  ["--icon-nav", "--surface-card"],
  ["--icon-nav", "--surface-brand-soft"],
  ["--icon-muted", "--surface-card"],
];

for (const [theme, tokens] of [["light", light], ["dark", dark], ["auto", auto]]) {
  test(`${theme} semantic text pairs meet WCAG AA`, () => {
    for (const [foreground, background] of textPairs) {
      assert(
        contrast(tokens, foreground, background) >= 4.5,
        `${foreground} on ${background} must meet 4.5:1 in ${theme} theme`,
      );
    }
  });

  test(`${theme} UI indicator pairs meet WCAG AA non-text contrast`, () => {
    for (const [foreground, background] of uiPairs) {
      assert(
        contrast(tokens, foreground, background) >= 3,
        `${foreground} on ${background} must meet 3:1 in ${theme} theme`,
      );
    }
  });
}