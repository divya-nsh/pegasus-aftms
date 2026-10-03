import path from "node:path";
import { fileURLToPath } from "node:url";

export function getAppDirname() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
}
