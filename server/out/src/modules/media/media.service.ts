import fs from "fs";
import crypto from "crypto";
import path from "path";
import mime from "mime-types";
import { pipeline } from "stream/promises";
import db from "#/db/db.js";
import { mediaTable } from "#/db/schema.js";
import { and, eq, inArray, lt, or } from "drizzle-orm";

export const MEDIA_FOLDER_PATH = path.join(process.cwd(), "uploads");
const CLEANUP_JOB_INTERVAL_MS = 1000 * 60 * 30; // 30 minutes
const CLEANUP_BATCH_SIZE = 1000; // 1000 media records per batch
const DRAFT_MEDIA_RETENTION_INTERVAL_MS = 1000 * 60 * 60 * 4; // 4 hours
const ARCHIVED_MEDIA_RETENTION_INTERVAL_MS = 1000 * 60 * 30; // 30 minutes

type DBTransaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

function getUploadPath(fileMimeType: string) {
  let resolvedPath = MEDIA_FOLDER_PATH;
  // if (fileMimeType.startsWith("image/")) {
  //   resolvedPath = path.join(MEDIA_FOLDER_PATH, "images");
  // } else if (fileMimeType.startsWith("video/")) {
  //   resolvedPath = path.join(MEDIA_FOLDER_PATH, "videos");
  // } else if (fileMimeType.startsWith("application/")) {
  //   resolvedPath = path.join(MEDIA_FOLDER_PATH, "documents");
  // } else {
  //   resolvedPath = path.join(MEDIA_FOLDER_PATH, "other");
  // }
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  return resolvedPath;
}

class MediaService {
  constructor() {
    this.startCleanupJob(CLEANUP_BATCH_SIZE);
  }

  async uploadFile(
    stream: NodeJS.ReadableStream | ReadableStream,
    meta: { originalFileName: string },
  ) {
    const { originalFileName } = meta;
    const ext = originalFileName.split(".").pop();
    if (!ext) {
      throw new Error("Invalid file extension");
    }
    const mimeType = mime.lookup(ext as string) || "";
    const uploadsPath = getUploadPath(mimeType);
    const relativePath = `${crypto.randomUUID()}.${ext}`;
    const internalStoragePath = path.join(uploadsPath, relativePath);
    const writeStream = fs.createWriteStream(internalStoragePath);

    const [mediaRecord] = await db
      .insert(mediaTable)
      .values({
        path: relativePath,
        originalFileName,
        mimeType,
        size: 0,
        status: "draft",
      })
      .returning({
        id: mediaTable.id,
      });

    // After Media Row insert start uploading failing uplaoding will keep media meta draft and eventually gone be deleted on next cleanup
    await pipeline(stream, writeStream);
    const stats = await fs.promises.stat(internalStoragePath);

    await db
      .update(mediaTable)
      .set({
        size: stats.size,
      })
      .where(eq(mediaTable.id, mediaRecord!.id));

    return {
      id: mediaRecord!.id,
      path: relativePath,
      originalFileName,
      mimeType,
      size: stats.size,
    };
  }

  //  Activate Media to prevent automatic deletion
  async activateMedia(id: number | number[], tx: DBTransaction) {
    const [mediaRecord] = await tx
      .update(mediaTable)
      .set({
        status: "active",
        statusUpdatedAt: new Date(),
      })
      .where(inArray(mediaTable.id, Array.isArray(id) ? id : [id]))
      .returning({
        id: mediaTable.id,
      });

    return mediaRecord ? true : false;
  }

  async markForDeletion(id: number | number[], tx: DBTransaction) {
    const [mediaRecord] = await tx
      .update(mediaTable)
      .set({
        status: "archived",
        statusUpdatedAt: new Date(),
      })
      .where(inArray(mediaTable.id, Array.isArray(id) ? id : [id]))
      .returning({
        id: mediaTable.id,
      });

    return mediaRecord ? true : false;
  }

  async deleteMediaFromDiskIfExists(storagePath: string) {
    const filePath = path.join(MEDIA_FOLDER_PATH, storagePath);

    try {
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async getById(id: number) {
    const [mediaRecord] = await db
      .select()
      .from(mediaTable)
      .where(eq(mediaTable.id, id));
    return mediaRecord;
  }

  async startCleanupJob(batchSize: number) {
    console.log("Starting cleanup job");
    const mediaRecords = await db
      .select()
      .from(mediaTable)
      .where(
        or(
          and(
            eq(mediaTable.status, "archived"),
            lt(
              mediaTable.statusUpdatedAt,
              new Date(Date.now() - ARCHIVED_MEDIA_RETENTION_INTERVAL_MS),
            ),
          ),
          and(
            eq(mediaTable.status, "draft"),
            lt(
              mediaTable.statusUpdatedAt,
              new Date(Date.now() - DRAFT_MEDIA_RETENTION_INTERVAL_MS),
            ),
          ),
        ),
      )
      .limit(batchSize);

    for (const mediaRecord of mediaRecords) {
      await this.deleteMediaFromDiskIfExists(mediaRecord.path);
      // First make sure file is deleted from disk before deleting the media record
      await db.delete(mediaTable).where(eq(mediaTable.id, mediaRecord.id));
    }

    console.log("Cleanup job completed");

    setTimeout(() => {
      this.startCleanupJob(batchSize);
    }, CLEANUP_JOB_INTERVAL_MS);
  }
}

export const mediaService = new MediaService();
