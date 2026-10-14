// Shared crypto and share format, used by index.html (students) and admin.html (lecturer).
//
// A code (8 chars) is stretched with PBKDF2 into:
//   - a folder id   (where the share lives:  s/<id>/)
//   - an AES-256 key (what unlocks its files)
// Nothing readable is ever stored in the repo: file names, titles and contents are all encrypted.
(function (global) {
  "use strict";
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  const LEN = 8;
  const ITER = 400000;
  const cr = global.crypto || globalThis.crypto;
  const subtle = cr.subtle;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const rnd = (n) => cr.getRandomValues(new Uint8Array(n));

  const normalise = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const pretty = (c) => c.slice(0, 4) + "-" + c.slice(4);
  const valid = (c) => c.length === LEN && [...c].every((ch) => ALPHABET.includes(ch));

  function newCode() {
    let out = "";
    while (out.length < LEN) {
      for (const b of rnd(16)) {
        if (b < 248 && out.length < LEN) out += ALPHABET[b % ALPHABET.length]; // unbiased
      }
    }
    return out;
  }

  async function derive(code, salt) {
    const base = await subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITER }, base, 384));
    const id = Array.from(bits.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
    const key = await subtle.importKey("raw", bits.slice(16, 48), { name: "AES-GCM" }, false,
      ["encrypt", "decrypt"]);
    return { id, key };
  }

  async function seal(key, data) {
    const iv = rnd(12);
    const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, data));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv);
    out.set(ct, 12);
    return out;
  }

  async function unseal(key, buf) {
    const b = new Uint8Array(buf);
    return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12)));
  }

  // files: [{name, type, data: ArrayBuffer}] -> {code, id, expires, entries:[{path, bytes}]}
  async function buildShare({ salt, title, module, days, files }) {
    const code = newCode();
    const { id, key } = await derive(code, salt);
    const now = new Date();
    const expires = days > 0 ? new Date(now.getTime() + days * 864e5).toISOString() : null;
    const entries = [];
    const list = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      entries.push({ path: `s/${id}/${i}.bin`, bytes: await seal(key, new Uint8Array(f.data)) });
      list.push({ name: f.name, type: f.type || "application/octet-stream", size: f.data.byteLength, f: `${i}.bin` });
    }
    const manifest = { title, module, created: now.toISOString(), files: list };
    entries.push({ path: `s/${id}/m.bin`, bytes: await seal(key, enc.encode(JSON.stringify(manifest))) });
    entries.push({ path: `s/${id}/meta.json`,
      bytes: enc.encode(JSON.stringify({ v: 1, created: now.toISOString(), expires })) });
    return { code, id, expires, entries, manifest };
  }

  // base: site root URL ending in "/"
  async function openShare(code, salt, base, fetchFn) {
    const get = fetchFn || ((u, o) => fetch(u, o));
    const { id, key } = await derive(code, salt);
    const r = await get(`${base}s/${id}/meta.json`, { cache: "no-store" });
    if (r.status === 404) return { status: "notfound" };
    if (!r.ok) throw new Error("network " + r.status);
    const meta = await r.json();
    if (meta.expires && new Date(meta.expires) < new Date()) return { status: "expired" };
    const m = await get(`${base}s/${id}/m.bin`, { cache: "no-store" });
    if (!m.ok) throw new Error("network " + m.status);
    const manifest = JSON.parse(dec.decode(await unseal(key, await m.arrayBuffer())));
    return {
      status: "ok", id, meta, manifest,
      async file(f) {
        const res = await get(`${base}s/${id}/${f.f}`);
        if (!res.ok) throw new Error("network " + res.status);
        return unseal(key, await res.arrayBuffer());
      },
    };
  }

  function sizeText(n) {
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return i ? n.toFixed(1) + " " + u[i] : n + " B";
  }

  global.MS = { ALPHABET, LEN, ITER, normalise, pretty, valid, newCode, derive, seal, unseal,
    buildShare, openShare, sizeText };
})(typeof window !== "undefined" ? window : globalThis);
