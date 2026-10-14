import { BACKUP_DIR_PATH } from "#/config/constants.js";
import envConfig from "#/config/env.js";
import { backupDatabase } from "#/lib/backups.js";
import { permissionProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import fs from "node:fs";
import path from "node:path";
import { type Router, Router as ExpressRouter } from "express";
import userService from "../user/user.service.js";

let isBackupRunning = false;
let backupStartedAt: Date | null = null;

// Only User with Permission * can Access This Routes
// Its Highly Critical Routes, so we need to be careful with it
// Specially Download backup , as we don't wanted randome person download the backup and get whole database

const databaseManagementRouter = router({
  createBackup: permissionProcedure("*").mutation(async ({ ctx }) => {
    if (isBackupRunning) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Backup is already running",
      });
    }
    isBackupRunning = true;
    backupStartedAt = new Date();
    try {
      const backup = await backupDatabase(
        envConfig.DATABASE_URL,
        BACKUP_DIR_PATH,
        7,
      );
      return backup;
    } finally {
      isBackupRunning = false;
    }
  }),

  getBackupProgress: permissionProcedure("*").query(async () => {
    return {
      isRunning: isBackupRunning,
      startedAt: isBackupRunning ? backupStartedAt : null,
    };
  }),

  getBackupList: permissionProcedure("*").query(async () => {
    // descending Sorted by file name becuase name start with timestamp
    return fs
      .readdirSync(BACKUP_DIR_PATH)
      .filter((file) => file.endsWith(".dump"))
      .map((file) => ({
        name: file,
        size: fs.statSync(path.join(BACKUP_DIR_PATH, file)).size,
        createdAt: fs.statSync(path.join(BACKUP_DIR_PATH, file)).birthtime,
      }))
      .sort((a, b) => b.name.localeCompare(a.name));
  }),
});

export const expressDatabaseManagementRouter: Router = ExpressRouter();

expressDatabaseManagementRouter.post(
  "/download/:backupName",
  async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }
    if (!req.session.user.role?.permissions.includes("*")) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    const password = req.body.password as string;
    if (!password) {
      return res.status(400).json({
        error: { message: "Password is required for download database" },
      });
    }

    const isPasswordValid = await userService.verifyPassword(
      req.session.user.id,
      password,
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: { message: "Invalid password for download database" } });
    }

    const backupDir = path.resolve(BACKUP_DIR_PATH);
    const filename = req.params.backupName;

    const filePath = path.resolve(backupDir, filename);

    if (
      !filename ||
      path.basename(filename) !== filename ||
      !filePath.startsWith(backupDir + path.sep)
    ) {
      return res.status(400).json({ error: { message: "Invalid filename" } });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: "File not found" } });
    }

    res.download(filePath);
  },
);

export default databaseManagementRouter;
