import type { LatexCompilerEngine } from "@/server/compiler/types";

export type StandaloneFigureOptions = {
  engine?: LatexCompilerEngine;
  borderPt?: number;
};

const hasDocumentClass = (source: string) => /\\documentclass(?:\[[^\]]*\])?\{[^}]+\}/.test(source);

export const createStandaloneFigureSource = (source: string, options: StandaloneFigureOptions = {}): string => {
  if (hasDocumentClass(source)) {
    return source;
  }

  const border = options.borderPt ?? 4;

  return [
    `\\documentclass[tikz,border=${border}pt]{standalone}`,
    "\\usepackage{tikz}",
    "\\usepackage{pgfplots}",
    "\\pgfplotsset{compat=1.18}",
    "\\begin{document}",
    source.trim(),
    "\\end{document}",
    ""
  ].join("\n");
};
