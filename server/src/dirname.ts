import path from "node:path";
import { fileURLToPath } from "node:url";
import { IS_PACKAGED } from "#/config/constants.js";
// const modulePath = fileURLToPath(import.meta.url);
// const moduleDir = path.dirname(modulePath);

// console.log("Lib > Utils", {
//   modulePath,
//   moduleDir,
// });

// Note: When app is packaged using pkg, the exec path is the actual path of the app, and dirpath is snapshot path and all files goes in

export function getAppDirname(isSnapshotPath: boolean = true) {
  if (isSnapshotPath === false && IS_PACKAGED) {
    // If the app is not running from a snapshot file systme and is package dusing pkg, the exec path is the actual path of the app
    return path.join(path.dirname(process.execPath));
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
}
