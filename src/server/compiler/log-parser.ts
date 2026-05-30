import type { LatexCompilerEngine, LatexNormalizedErrorType, LatexSourceContext, ParsedLatexError } from "@/server/compiler/types";

export type ParseLatexLogOptions = {
  engine?: LatexCompilerEngine;
  source?: string;
  sourceFilePath?: string;
};

type LogErrorCandidate = {
  rawMessage: string;
  file?: string;
  line?: number;
};

const defaultEngine: LatexCompilerEngine = "pdflatex";

export const parseLatexLog = (log: string, options: ParseLatexLogOptions = {}): ParsedLatexError[] => {
  const engine = options.engine ?? defaultEngine;
  const candidates = extractErrorCandidates(log, options.sourceFilePath);

  return candidates.map((candidate) => {
    const normalizedType = normalizeError(candidate.rawMessage);

    return {
      engine,
      file: candidate.file,
      line: candidate.line,
      severity: "error",
      rawMessage: candidate.rawMessage,
      normalizedType,
      sourceContext: getSourceContext(options.source, candidate.line),
      hints: createHints(candidate.rawMessage, normalizedType, options.source)
    };
  });
};

const extractErrorCandidates = (log: string, fallbackFile?: string): LogErrorCandidate[] => {
  const lines = log.split(/\r?\n/);
  const candidates: LogErrorCandidate[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (!line.startsWith("!")) {
      continue;
    }

    const continuation = collectContinuation(lines, index + 1);
    const rawMessage = [line, ...continuation.lines].join("\n").trim();
    const fileLine = findFileLineNear(lines, index, fallbackFile);

    candidates.push({
      rawMessage,
      file: fileLine.file,
      line: fileLine.line
    });

    index += continuation.consumed;
  }

  return candidates;
};

const collectContinuation = (lines: string[], startIndex: number) => {
  const collected: string[] = [];
  let consumed = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (line.startsWith("!") || line.startsWith("Output written on ")) {
      break;
    }

    if (/^l\.\d+/.test(line) || line.trim().length > 0) {
      collected.push(line);
      consumed += 1;
    }

    if (/^l\.\d+/.test(line)) {
      break;
    }
  }

  return {
    lines: collected,
    consumed
  };
};

const findFileLineNear = (lines: string[], errorIndex: number, fallbackFile?: string) => {
  const localWindow = lines.slice(errorIndex, Math.min(lines.length, errorIndex + 8));
  const lineFromLocalWindow = findLineNumber(localWindow);
  const fileFromLocalWindow = findFileName(localWindow);

  if (lineFromLocalWindow || fileFromLocalWindow) {
    return {
      file: fileFromLocalWindow ?? fallbackFile,
      line: lineFromLocalWindow
    };
  }

  const previousWindow = lines.slice(Math.max(0, errorIndex - 10), errorIndex + 1);

  return {
    file: findFileName(previousWindow) ?? fallbackFile,
    line: findLineNumber(previousWindow)
  };
};

const findLineNumber = (lines: string[]) => {
  for (const line of lines) {
    const fileLineMatch = line.match(/:(\d+):/);

    if (fileLineMatch?.[1]) {
      return Number(fileLineMatch[1]);
    }

    const latexLineMatch = line.match(/^l\.(\d+)/);

    if (latexLineMatch?.[1]) {
      return Number(latexLineMatch[1]);
    }
  }

  return undefined;
};

const findFileName = (lines: string[]) => {
  for (const line of lines) {
    const fileLineMatch = line.match(/(?:^|\s)([^()\s]+\.tex):\d+:/);

    if (fileLineMatch?.[1]) {
      return fileLineMatch[1];
    }

    const inputMatch = line.match(/\(([^()\s]+\.tex)\b/);

    if (inputMatch?.[1]) {
      return inputMatch[1];
    }
  }

  return undefined;
};

const normalizeError = (rawMessage: string): LatexNormalizedErrorType => {
  if (/No shape named [`'][^`']+[`'] is known/.test(rawMessage)) {
    return "unknown_tikz_node";
  }

  if (/right=of|left=of|above=of|below=of|node distance|Unknown function `of'|I do not know the key.*\/tikz\/(?:right|left|above|below)/i.test(rawMessage)) {
    return "missing_tikz_library";
  }

  if (/Undefined control sequence/.test(rawMessage)) {
    return "undefined_control_sequence";
  }

  if (/File [`'][^`']+\.sty[`'] not found/.test(rawMessage)) {
    return "missing_package";
  }

  return "latex_error";
};

const getSourceContext = (source: string | undefined, line: number | undefined): LatexSourceContext | undefined => {
  if (!source || !line || line < 1) {
    return undefined;
  }

  const sourceLines = source.split(/\r?\n/);
  const index = line - 1;

  return {
    before: sourceLines.slice(Math.max(0, index - 2), index),
    line: sourceLines[index] ?? "",
    after: sourceLines.slice(index + 1, index + 3)
  };
};

const createHints = (rawMessage: string, normalizedType: LatexNormalizedErrorType, source: string | undefined) => {
  if (normalizedType === "missing_tikz_library") {
    return ["Likely missing TikZ library. Consider adding \\usetikzlibrary{positioning}."];
  }

  if (normalizedType === "unknown_tikz_node") {
    const missingNode = rawMessage.match(/No shape named [`']([^`']+)[`'] is known/)?.[1];
    const definedNodes = collectDefinedTikzNodes(source);
    const closestNode = missingNode ? findClosestString(missingNode, definedNodes) : undefined;

    if (missingNode && closestNode) {
      return [`Possible node-name mismatch: ${closestNode} vs ${missingNode}.`];
    }

    if (missingNode) {
      return [`TikZ references node '${missingNode}', but no matching node definition was found in source.`];
    }
  }

  if (normalizedType === "undefined_control_sequence") {
    return ["Check for a misspelled command or a missing LaTeX package."];
  }

  if (normalizedType === "missing_package") {
    const packageName = rawMessage.match(/File [`']([^`']+\.sty)[`'] not found/)?.[1];
    return packageName ? [`Install or remove dependency on missing package ${packageName}.`] : ["Install or remove the missing package dependency."];
  }

  return [];
};

const collectDefinedTikzNodes = (source: string | undefined) => {
  if (!source) {
    return [];
  }

  const nodes = new Set<string>();
  const nodeRegex = /\\node(?:\[[^\]]*\])?\s*\(([^)]+)\)/g;
  let match = nodeRegex.exec(source);

  while (match) {
    if (match[1]) {
      nodes.add(match[1]);
    }

    match = nodeRegex.exec(source);
  }

  return [...nodes];
};

const findClosestString = (target: string, candidates: string[]) => {
  let bestCandidate: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(target, candidate);

    if (distance < bestDistance) {
      bestCandidate = candidate;
      bestDistance = distance;
    }
  }

  return bestDistance <= Math.max(2, Math.ceil(target.length / 2)) ? bestCandidate : undefined;
};

const levenshteinDistance = (left: string, right: string) => {
  const matrix = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0));

  for (let index = 0; index <= left.length; index += 1) {
    matrix[index][0] = index;
  }

  for (let index = 0; index <= right.length; index += 1) {
    matrix[0][index] = index;
  }

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      matrix[leftIndex][rightIndex] = Math.min(
        matrix[leftIndex - 1][rightIndex] + 1,
        matrix[leftIndex][rightIndex - 1] + 1,
        matrix[leftIndex - 1][rightIndex - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
};
