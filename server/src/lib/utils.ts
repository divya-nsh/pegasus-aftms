import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

export function getAppDirname() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");
}

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false); // port is already in use
    });

    server.once("listening", () => {
      server.close(() => resolve(true)); // port is available
    });

    server.listen(port, "127.0.0.1");
  });
}
