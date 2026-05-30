import { spawn } from "node:child_process";
import type { ProcessResult, ProcessRunner } from "@/server/compiler/types";

export const runProcess: ProcessRunner = (command, args, options) => {
  return new Promise<ProcessResult>((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let isSettled = false;
    let timedOut = false;

    const timeout = windowlessSetTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, options.timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      clearTimeout(timeout);
      resolve({
        exitCode: null,
        stdout,
        stderr: `${stderr}${error.message}`,
        timedOut
      });
    });

    child.on("close", (exitCode) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      clearTimeout(timeout);
      resolve({
        exitCode,
        stdout,
        stderr,
        timedOut
      });
    });
  });
};

const windowlessSetTimeout = (callback: () => void, timeoutMs: number) => setTimeout(callback, timeoutMs);
