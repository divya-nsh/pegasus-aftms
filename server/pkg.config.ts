import { exec } from "@yao-pkg/pkg";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("Packaging...");
console.time("Completed In");

if (!fs.existsSync("./bin")) {
  fs.mkdirSync("./bin");
}

fs.rmSync("./bin/server.exe", { force: true });

await exec({
  input: "./dist/index.js",
  output: "./bin/server.exe",
  targets: ["node24-win-x64"],
  bytecode: false,
  public: true,
  compress: "None",
  debug: false,
  config: path.resolve("./package.json"),
});

console.timeEnd("Completed In");

console.log(
  "File Size",
  (fs.statSync("./bin/server.exe").size / 1024 / 1024).toFixed(0),
  "MB",
);

// Run the generated EXE

const result = spawnSync("./bin/server.exe", ["--list-files"], {
  stdio: "inherit",
});

console.log("Exited with code:", result.status);
