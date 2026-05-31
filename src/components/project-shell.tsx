"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  FileCode2,
  Folder,
  GitBranch,
  PanelLeft,
  Play,
  Search,
  Settings,
  TerminalSquare
} from "lucide-react";
import { AddDiagramDialog, type AddDiagramRequest } from "@/components/workspace/add-diagram-dialog";
import { EditorPane } from "@/components/workspace/editor-pane";
import { FileTree } from "@/components/workspace/file-tree";
import { PreviewPane } from "@/components/workspace/preview-pane";
import { StatusBar } from "@/components/workspace/status-bar";
import { initialAgentEvents, sampleFiles } from "@/lib/sample-project";
import type { CompileState, DiagramPreviewApproval, DiagramPreviewStatus, ProjectFile } from "@/types/project";

export const ProjectShell = () => {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(sampleFiles);
  const [activeFileId, setActiveFileId] = useState(sampleFiles[0]?.id ?? "");
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [agentStatus, setAgentStatus] = useState("AI status: waiting for diagram request");
  const [isAddDiagramOpen, setIsAddDiagramOpen] = useState(false);
  const [diagramPreview, setDiagramPreview] = useState<DiagramPreviewApproval | null>(null);

  const activeFile = useMemo(
    () => projectFiles.find((file) => file.id === activeFileId) ?? projectFiles[0],
    [activeFileId, projectFiles]
  );

  const runCompile = () => {
    setCompileState("running");
    window.setTimeout(() => setCompileState("success"), 900);
  };

  const startAddDiagram = () => {
    setAgentStatus("AI status: Add diagram selected; prompt dialog is next");
    setIsAddDiagramOpen(true);
  };

  const submitDiagramRequest = (request: AddDiagramRequest) => {
    setCompileState("success");
    setAgentStatus("AI status: diagram compiled; waiting for approval; OpenRouter pending key");
    setDiagramPreview(createPreviewFromRequest(request));
    setIsAddDiagramOpen(false);
  };

  const updateDiagramApproval = (status: DiagramPreviewStatus) => {
    setDiagramPreview((preview) => (preview ? { ...preview, status } : preview));

    if (status === "kept") {
      setAgentStatus("AI status: diagram approved; insertion is next");
      return;
    }

    if (status === "changes-requested") {
      setAgentStatus("AI status: revision requested; feedback loop is next");
      return;
    }

    setAgentStatus("AI status: diagram discarded; source was not inserted");
  };

  const keepDiagram = () => {
    if (!diagramPreview) {
      return;
    }

    const insertion = insertApprovedDiagram(projectFiles, diagramPreview);
    setProjectFiles(insertion.files);
    setActiveFileId("main");
    setCompileState("running");
    setDiagramPreview({ ...diagramPreview, status: "kept" });
    setAgentStatus(`AI status: diagram inserted into ${insertion.mainFilePath}; compiling main document`);

    window.setTimeout(() => {
      setCompileState("success");
      setAgentStatus(`AI status: diagram saved to ${diagramPreview.sourcePath} and inserted into ${insertion.mainFilePath}`);
    }, 650);
  };

  const submitDiagramRevision = (feedback: string) => {
    setCompileState("running");
    setAgentStatus("AI status: revising existing diagram source");

    window.setTimeout(() => {
      setCompileState("success");
      setAgentStatus("AI status: revised diagram compiled; waiting for approval; OpenRouter pending key");
      setDiagramPreview((preview) => (preview ? revisePreviewFromFeedback(preview, feedback) : preview));
    }, 650);
  };

  return (
    <main className="project-shell" aria-label="Agentic LaTeX Diagram Editor">
      <header className="top-bar">
        <div className="project-identity">
          <button className="icon-button" type="button" aria-label="Toggle file tree">
            <PanelLeft aria-hidden="true" />
          </button>
          <div className="project-title-group">
            <div className="project-kicker">Research workspace</div>
            <button className="project-title-button" type="button">
              Learning Interpretable Transformers
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="top-actions" aria-label="Project actions">
          <div className="search-box" role="search">
            <Search aria-hidden="true" />
            <span>Find in project</span>
            <kbd>/</kbd>
          </div>
          <button className="ghost-button" type="button">
            <GitBranch aria-hidden="true" />
            main
          </button>
          <button className="primary-button" type="button" onClick={runCompile}>
            <Play aria-hidden="true" />
            Compile
          </button>
          <button className="icon-button" type="button" aria-label="Project settings">
            <Settings aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="workspace-grid" aria-label="LaTeX editing workspace" data-preview-open={Boolean(diagramPreview)}>
        <aside className="file-sidebar" aria-label="Project files">
          <div className="panel-heading">
            <div>
              <p>Project</p>
              <h2>Files</h2>
            </div>
            <Folder aria-hidden="true" />
          </div>
          <FileTree files={projectFiles} activeFileId={activeFile.id} onSelectFile={setActiveFileId} />
        </aside>

        <EditorPane file={activeFile} onAddDiagram={startAddDiagram} />

        <PreviewPane
          compileState={compileState}
          diagramPreview={diagramPreview}
          events={initialAgentEvents}
          onDiscardDiagram={() => updateDiagramApproval("discarded")}
          onKeepDiagram={keepDiagram}
          onRequestChanges={() => updateDiagramApproval("changes-requested")}
          onSubmitRevision={submitDiagramRevision}
        />
      </section>

      <StatusBar
        compileState={compileState}
        activeFilePath={activeFile?.path ?? "main.tex"}
        agentStatus={agentStatus}
        leftIcon={<FileCode2 aria-hidden="true" />}
        rightIcon={compileState === "success" ? <CheckCircle2 aria-hidden="true" /> : <TerminalSquare aria-hidden="true" />}
        agentIcon={<Bot aria-hidden="true" />}
      />
      <AddDiagramDialog
        isOpen={isAddDiagramOpen}
        onClose={() => setIsAddDiagramOpen(false)}
        onSubmit={submitDiagramRequest}
      />
    </main>
  );
};

const createPreviewFromRequest = (request: AddDiagramRequest): DiagramPreviewApproval => ({
  id: "diagram-preview-001",
  prompt: request.prompt,
  artifactPath: "artifacts/diagram_001.pdf",
  sourcePath: generatedFigurePath,
  accessibleSummary:
    "Transformer diagram preview with input embeddings flowing through attention and feed-forward blocks toward labeled logits.",
  repairSummary: "Standalone compile succeeded after validating the generated TikZ source. No OpenRouter call was made in this keyless environment.",
  changes: [
    `Generated ${request.stylePreset} TikZ source from the captured prompt.`,
    "Compiled the standalone figure and prepared an approval checkpoint.",
    `Targeted output route: ${formatOutputTarget(request.outputTarget)}.`
  ],
  revisionHistory: [],
  source: String.raw`\begin{tikzpicture}[node distance=1.9cm, >=stealth]
  \node[draw, rounded corners, fill=green!10] (tokens) {Token embeddings};
  \node[draw, rounded corners, right of=tokens, fill=blue!8] (attention) {Multi-head attention};
  \node[draw, rounded corners, right of=attention, fill=amber!10] (mlp) {Feed-forward block};
  \node[draw, rounded corners, right of=mlp, fill=slate!8] (logits) {Logits};
  \draw[->] (tokens) -- (attention);
  \draw[->] (attention) -- (mlp);
  \draw[->] (mlp) -- (logits);
\end{tikzpicture}`,
  status: "ready"
});

type DiagramInsertionResult = {
  files: ProjectFile[];
  mainFilePath: string;
};

const generatedFigurePath = "figures/generated/diagram_001.tex";
const diagramInsertionMarker = "% Right-click in the editor to add a generated diagram here.";

const insertApprovedDiagram = (files: ProjectFile[], preview: DiagramPreviewApproval): DiagramInsertionResult => {
  const savedFigureFiles = saveGeneratedFigureSource(files, preview.sourcePath, preview.source);
  const filesWithMainInsertion = savedFigureFiles.map((file) => {
    if (file.path !== "main.tex") {
      return file;
    }

    return {
      ...file,
      content: insertDiagramInputIntoMain(file.content, preview)
    };
  });

  return {
    files: filesWithMainInsertion,
    mainFilePath: "main.tex"
  };
};

const saveGeneratedFigureSource = (files: ProjectFile[], sourcePath: string, source: string) => {
  const normalizedSourcePath = sourcePath.startsWith("figures/generated/") ? sourcePath : generatedFigurePath;
  const savedSource = `${source.trim()}\n`;
  const hasFigureFile = files.some((file) => file.path === normalizedSourcePath);

  if (hasFigureFile) {
    return files.map((file) => (file.path === normalizedSourcePath ? { ...file, content: savedSource } : file));
  }

  return [
    ...files,
    {
      id: "generated-diagram-001",
      path: normalizedSourcePath,
      language: "latex" as const,
      content: savedSource
    }
  ];
};

const insertDiagramInputIntoMain = (mainSource: string, preview: DiagramPreviewApproval) => {
  const figureBlock = createFigureInsertionBlock(preview);

  if (mainSource.includes("\\label{fig:generated-diagram-001}")) {
    return mainSource.replace(
      /\\begin\{figure\}\[ht\][\s\S]*?\\label\{fig:generated-diagram-001\}\n\\end\{figure\}/,
      figureBlock
    );
  }

  if (mainSource.includes(diagramInsertionMarker)) {
    return mainSource.replace(diagramInsertionMarker, `${diagramInsertionMarker}\n\n${figureBlock}`);
  }

  return mainSource.replace("\\end{document}", `${figureBlock}\n\n\\end{document}`);
};

const createFigureInsertionBlock = (preview: DiagramPreviewApproval) => {
  const inputPath = (preview.sourcePath.startsWith("figures/generated/") ? preview.sourcePath : generatedFigurePath).replace(/\.tex$/, "");

  return String.raw`\begin{figure}[ht]
  \centering
  \input{${inputPath}}
  \caption{Generated diagram from the AI diagram workflow.}
  \label{fig:generated-diagram-001}
\end{figure}`;
};

const formatOutputTarget = (target: AddDiagramRequest["outputTarget"]) => {
  if (target === "figure-file") {
    return "generated figure file";
  }

  if (target === "replace-placeholder") {
    return "selected placeholder";
  }

  return "current cursor position";
};

const revisePreviewFromFeedback = (preview: DiagramPreviewApproval, feedback: string): DiagramPreviewApproval => {
  const revisionNumber = preview.revisionHistory.length + 1;
  const revisedSource = applyLocalRevisionToSource(preview.source, feedback, revisionNumber);

  return {
    ...preview,
    source: revisedSource,
    accessibleSummary: `${preview.accessibleSummary} Revision ${revisionNumber} applies: ${feedback}.`,
    repairSummary: "Revision compiled from the existing diagram source and returned to approval. OpenRouter remains pending key.",
    changes: [
      `Revision ${revisionNumber}: ${feedback}`,
      "Used the existing TikZ source as the starting point.",
      "Recompiled the revised standalone figure and returned to preview approval."
    ],
    revisionHistory: [...preview.revisionHistory, feedback],
    status: "ready"
  };
};

const applyLocalRevisionToSource = (source: string, feedback: string, revisionNumber: number) => {
  const escapedFeedback = feedback.replaceAll("\n", " ").trim();
  const annotatedSource = source.includes("% User revision")
    ? source.replace(/% User revision \d+: .*\n/, `% User revision ${revisionNumber}: ${escapedFeedback}\n`)
    : source.replace("\\begin{tikzpicture}", `% User revision ${revisionNumber}: ${escapedFeedback}\n\\begin{tikzpicture}`);

  if (/curv|bend|arc/i.test(feedback)) {
    return annotatedSource.replaceAll("\\draw[->]", "\\draw[->, bend left=12]");
  }

  if (/label|annotation|caption/i.test(feedback)) {
    return annotatedSource.replace(
      "\\node[draw, rounded corners, right of=attention, fill=amber!10] (mlp) {Feed-forward block};",
      "\\node[draw, rounded corners, right of=attention, fill=amber!10] (mlp) {Feed-forward block\\\\small revised};"
    );
  }

  return annotatedSource;
};
