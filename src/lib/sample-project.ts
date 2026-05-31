import type { ProjectFile } from "@/types/project";

export const sampleFiles: ProjectFile[] = [
  {
    id: "main",
    path: "main.tex",
    language: "latex",
    content: String.raw`\documentclass{article}
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}

\title{Learning Interpretable Transformers}
\author{Research Team}

\begin{document}
\maketitle

\section{Method}
We model the agentic diagram workflow as a verified compiler loop.

% Right-click in the editor to add a generated diagram here.

\section{Results}
The generated figure remains source-controlled LaTeX.

\end{document}
`
  },
  {
    id: "refs",
    path: "refs.bib",
    language: "bibtex",
    content: String.raw`@article{knuth1984tex,
  title={Literate Programming},
  author={Knuth, Donald E.},
  journal={The Computer Journal},
  year={1984}
}`
  },
  {
    id: "figure-placeholder",
    path: "figures/generated/diagram_001.tex",
    language: "latex",
    content: String.raw`% Generated diagrams will be saved here after approval.
% Stage 1 compiles standalone TikZ before inserting into main.tex.
`
  }
];
