import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import mime from "mime-types";

/**
 *  !!!!! Must be Carefull with Middleware don't Cache index.html but cache static assets for better performance. This is crucial for SPA routing to work correctly without serving stale content.
 *
 * Reads with `fs` instead of `res.sendFile` / `express.static`. Those use the
 * `send` package, which cannot read files inside a pkg snapshot. `fs.readFile`
 * can.
 */

export const serveClient = (
  clientPath: string,
  ignorePaths: string[] = ["/api"],
) => {
  const indexPath = path.join(clientPath, "index.html");

  const sendDiskFile = (
    res: Response,
    filePath: string,
    noCache: boolean,
    next: NextFunction,
  ) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        next(err);
        return;
      }

      const contentType = mime.lookup(filePath) || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Cache-Control",
        noCache
          ? "no-cache, no-store, must-revalidate"
          : "public, max-age=28800",
      );
      res.send(data);
    });
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const reqPath = req.path;

    if (ignorePaths.some((prefix) => reqPath.startsWith(prefix))) {
      next();
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (reqPath === "/" || reqPath === "/index.html") {
      sendDiskFile(res, indexPath, true, next);
      return;
    }

    const relativePath = reqPath.replace(/^[/\\]+/, "");
    const filePath = path.normalize(path.join(clientPath, relativePath));
    const relativeToRoot = path.relative(clientPath, filePath);

    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
      next();
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isFile()) {
        sendDiskFile(res, filePath, path.extname(filePath) === ".html", next);
        return;
      }

      sendDiskFile(res, indexPath, true, next);
    });
  };
};
