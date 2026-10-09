import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  sourcemap: true,
  minify: false,
  outfile: "dist/index.js",
});
