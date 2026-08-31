import { publicProcedure, router } from "#/trpc.js";
import { z } from "zod";
import { mediaService } from "./media.service.js";
import { TRPCError } from "@trpc/server";
import { Readable } from "node:stream";

const supportedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 100MB

const mediaRouter = router({
  uploadFile: publicProcedure
    .input(z.custom<globalThis.FormData>((value) => value instanceof FormData))
    .mutation(async ({ input }) => {
      const file = input.get("file");
      if (!file) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No file provided",
        });
      }
      if (!(file instanceof File)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file Value",
        });
      }
      if (!supportedFileTypes.includes(file.type)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported file type",
        });
      }
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image size exceeds the maximum allowed size",
        });
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds the maximum allowed size",
        });
      }
      const nodeStream = Readable.fromWeb(file.stream());
      try {
        const media = await mediaService.uploadFile(nodeStream, {
          originalFileName: file.name,
        });
        return media;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file",
        });
      }
    }),
});

export default mediaRouter;
