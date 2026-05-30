export type LatexCompilerEngine = "pdflatex" | "xelatex" | "lualatex";

export type CompileArtifactKind = "pdf" | "png" | "svg" | "log" | "auxiliary";

export type CompileArtifact = {
  name: string;
  path: string;
  kind: CompileArtifactKind;
  sizeBytes: number;
};

export type LatexCompileRequest = {
  jobId?: string;
  source: string;
  engine?: LatexCompilerEngine;
  timeoutMs?: number;
};

export type LatexCompileResult = {
  jobId: string;
  workspacePath: string;
  sourcePath: string;
  succeeded: boolean;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  compileLog: string;
  artifacts: CompileArtifact[];
};

export type ProcessResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type ProcessRunner = (
  command: string,
  args: string[],
  options: {
    cwd?: string;
    timeoutMs: number;
  }
) => Promise<ProcessResult>;
