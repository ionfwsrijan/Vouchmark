// Point a production build at the local demo API (same dist/config.js trick
// as backend/scripts/run-local.ps1), so Playwright can drive the real flow.
import { writeFileSync } from "node:fs";

writeFileSync(
  new URL("../dist/config.js", import.meta.url),
  'window.APP_CONFIG = { "apiUrl": "/api" };\n',
  "utf8",
);
console.log("dist/config.js → apiUrl=/api");