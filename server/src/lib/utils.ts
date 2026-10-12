import net from "node:net";

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

import { exec } from "node:child_process";

export function openUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`start "" "${url}"`, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// export function getCreatedByMeta(userId: number) {
//   return {
//     createdById: userId,
//     updatedById: userId,
//   };
// }

export function createdMeta(userId: number | null) {
  return {
    createdById: userId,
  };
}

export function updatedMeta(userId: number | null) {
  return {
    updatedById: userId,
  };
}
