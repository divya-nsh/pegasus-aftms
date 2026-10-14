import { getAppDirname } from "#/dirname.js";
import path from "path";

const SESSION_COOKIE_NAME = "sid";
const SCHEDULE_NUMBER_PREFIX = "SCH-";

const IS_PACKAGED = !!(process as any).pkg;

// Paths
const BACKUP_DIR_PATH = path.join(getAppDirname(false), "./data", "backups");

const UPLOADS_DIR_PATH = path.join(getAppDirname(false), "./data", "uploads");

export {
  SESSION_COOKIE_NAME,
  SCHEDULE_NUMBER_PREFIX,
  IS_PACKAGED,
  BACKUP_DIR_PATH,
  UPLOADS_DIR_PATH,
};