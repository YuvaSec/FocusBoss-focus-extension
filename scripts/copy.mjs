import { mkdir, cp } from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url).pathname;
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });
