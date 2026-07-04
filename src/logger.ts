import { pino } from "pino";

const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";
const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "test" ? "silent" : "info");

export const logger = pino({
  level,
  transport: isDev ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});
