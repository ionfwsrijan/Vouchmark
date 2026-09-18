// Portable bootstrapper for the demo API used by Playwright's webServer.
// Runs the Python local_server on port 8000 regardless of OS (py / python3).
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const python = process.platform === "win32" ? "py" : "python3";
const server = spawn(python, ["../backend/tools/local_server.py", "8000"], {
  cwd: root,
  stdio: "inherit",
});

server.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => server.kill());