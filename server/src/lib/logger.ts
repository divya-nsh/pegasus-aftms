// logger.ts
import pino from "pino";
import { IS_DEVELOPMENT } from "./env.js";
import { IS_PACKAGED } from "#/config/constants.js";

export const logger = pino({
  level: IS_DEVELOPMENT ? "debug" : "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: IS_PACKAGED ? {} : null,
  redact: ["password", "*.password"],
  // Pretty output in dev only; raw JSON in production
  ...(!IS_PACKAGED
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});
