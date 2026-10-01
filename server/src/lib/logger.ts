// logger.ts
import pino from "pino";
import { IS_DEVELOPMENT } from "./env.js";

export const logger = pino({
  level: IS_DEVELOPMENT ? "debug" : "info",
  redact: ["password", "*.password"],
  // Pretty output in dev only; raw JSON in production
  transport: {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" },
  },
});
