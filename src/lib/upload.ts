import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import { slugify } from "./format";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Nén & chuyển ảnh sang WebP (tối đa 1600px), lưu vào UPLOAD_DIR/yyyy/mm.
 * Trả về URL public dạng /uploads/yyyy/mm/ten-anh-xxxx.webp
 */
export async function saveImage(file: File, opts: { maxWidth?: number } = {}) {
  if (!ACCEPT.includes(file.type)) throw new Error("Định dạng ảnh không hỗ trợ");
  if (file.size > MAX_BYTES) throw new Error("Ảnh vượt quá 10MB");
  const buf = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  await fs.mkdir(path.join(UPLOAD_DIR, dir), { recursive: true });
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "anh";
  const name = `${base}-${crypto.randomBytes(3).toString("hex")}.webp`;
  await sharp(buf)
    .rotate()
    .resize({ width: opts.maxWidth ?? 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, dir, name));
  return `/uploads/${dir}/${name}`;
}

export async function saveImages(files: File[], opts?: { maxWidth?: number }) {
  const urls: string[] = [];
  for (const f of files) if (f && f.size > 0) urls.push(await saveImage(f, opts));
  return urls;
}
