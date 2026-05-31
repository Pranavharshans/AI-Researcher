export type LatexCompilerEngine = "pdflatex" | "xelatex" | "lualatex";

export type LatexErrorSeverity = "error" | "warning";

export type LatexNormalizedErrorType =
  | "latex_error"
  | "missing_tikz_library"
  | "unknown_tikz_node"
  | "undefined_xcolor_color"
  | "undefined_control_sequence"
  | "missing_package"
  | "timeout"
  | "warning";

export type LatexSourceContext = {
  before: string[];
  line: string;
  after: string[];
};

export type ParsedLatexError = {
  engine: LatexCompilerEngine;
  file?: string;
  line?: number;
  severity: LatexErrorSeverity;
  rawMessage: string;
  normalizedType: LatexNormalizedErrorType;
  sourceContext?: LatexSourceContext;
  hints: string[];
};

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
  parsedErrors?: ParsedLatexError[];
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
