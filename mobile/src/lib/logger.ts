type Level = "info" | "warn" | "error";
type Payload = Record<string, unknown>;

function log(level: Level, event: string, payload?: Payload): void {
  if (!__DEV__) return;
  const entry = { ts: new Date().toISOString(), level, event, ...payload };
  if (level === "error") {
    console.error("[ErrorLife]", JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn("[ErrorLife]", JSON.stringify(entry));
  } else {
    console.log("[ErrorLife]", JSON.stringify(entry));
  }
}

export const logger = {
  info:  (event: string, payload?: Payload) => log("info",  event, payload),
  warn:  (event: string, payload?: Payload) => log("warn",  event, payload),
  error: (event: string, payload?: Payload) => log("error", event, payload),
};
