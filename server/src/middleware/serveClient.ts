import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import path from "path";

/**
 *  !!!!! Must be Carefull with Middleware don't Cache index.html but cache static assets for better performance. This is crucial for SPA routing to work correctly without serving stale content.
 */

export const serveClient = (
  clientPath: string,
  ignorePaths: string[] = ["/api"],
) => {
  const indexPath = path.join(clientPath, "index.html");

  const staticMiddleware = express.static(clientPath, {
    // maxAge: "8h",
    etag: true,
    index: false,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const reqPath = req.path;

    // 🔴 Ignore API or custom backend routes
    if (ignorePaths.some((p) => reqPath.startsWith(p))) {
      return next();
    }

    // 🟡 Never cache index.html
    if (reqPath === "/" || reqPath === "/index.html") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.sendFile(indexPath, (err) => {
        if (err) next(err);
      });
    }

    // 🟢 Serve static assets
    staticMiddleware(req, res, () => {
      // 🔁 SPA fallback
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(indexPath, (err) => {
        if (err) next(err);
      });
    });
  };
};
