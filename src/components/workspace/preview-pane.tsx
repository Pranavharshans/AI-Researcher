"use client";

import { Fragment, useId, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, RotateCcw, Trash2 } from "lucide-react";
import type { CompileState, DiagramPreviewApproval } from "@/types/project";

type PreviewPaneProps = {
  compileState: CompileState;
  compiledDocument: LatexCompilePreview | null;
  diagramPreview: DiagramPreviewApproval | null;
  onDiscardDiagram: () => void;
  onKeepDiagram: () => void;
  onRequestChanges: () => void;
  onSubmitRevision: (feedback: string) => void;
};

type LatexCompilePreview = {
  compileLog: string;
  errorSummary?: string;
  exitCode: number | null;
  pdfDataUrl: string | null;
  stderr: string;
  stdout: string;
  succeeded: boolean;
  timedOut: boolean;
};

const revisionFeedbackMaxLength = 1200;

const compileCopy: Record<CompileState, { label: string; detail: string }> = {
  idle: {
    label: "Preview idle",
    detail: "Compile the document to render the current PDF preview."
  },
  queued: {
    label: "Compile queued",
    detail: "The document is waiting for the compiler worker."
  },
  running: {
    label: "Compiling document",
    detail: "pdfLaTeX is checking the source and building the PDF."
  },
  success: {
    label: "Preview ready",
    detail: "The latest compile finished without blocking errors."
  },
  error: {
    label: "Compile failed",
    detail: "Compiler diagnostics will appear in the status drawer."
  }
};

const approvalCopy: Record<DiagramPreviewApproval["status"], { label: string; detail: string }> = {
  ready: {
    label: "Approval needed",
    detail: "Review the compiled figure before it is inserted into the paper."
  },
  kept: {
    label: "Diagram kept",
    detail: "The approved figure is ready for insertion into the main document."
  },
  "changes-requested": {
    label: "Changes requested",
    detail: "The next step will revise the existing diagram source from your feedback."
  },
  discarded: {
    label: "Diagram discarded",
    detail: "The generated source was not inserted into the project."
  }
};

export const PreviewPane = ({
  compileState,
  compiledDocument,
  diagramPreview,
  onDiscardDiagram,
  onKeepDiagram,
  onRequestChanges,
  onSubmitRevision
}: PreviewPaneProps) => {
  const copy = compileCopy[compileState];
  const previewCopy = diagramPreview ? approvalCopy[diagramPreview.status] : null;
  const revisionFeedbackId = useId();
  const revisionErrorId = useId();
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const hasRevisionOverflow = revisionFeedback.length > revisionFeedbackMaxLength;

  const openRevisionForm = () => {
    setRevisionFeedback("");
    setRevisionError("");
    onRequestChanges();
  };

  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFeedback = revisionFeedback.trim();

    if (!trimmedFeedback) {
      setRevisionError("Describe what should change before revising the diagram.");
      return;
    }

    if (hasRevisionOverflow) {
      setRevisionError("Keep revision feedback under 1,200 characters.");
      return;
    }

    setRevisionFeedback("");
    setRevisionError("");
    onSubmitRevision(trimmedFeedback);
  };

  return (
    <aside className="preview-pane" aria-label="PDF and diagram preview">
      <div className="pane-toolbar">
        <div>
          <p>Preview</p>
          <h2>main.pdf</h2>
        </div>
        <span className="status-pill" data-state={diagramPreview?.status ?? compileState} aria-live="polite">
          {previewCopy?.label ?? copy.label}
        </span>
      </div>

      <div className="pdf-preview" aria-label="Rendered PDF preview">
        <CompiledDocumentPreview compileState={compileState} document={compiledDocument} />
      </div>

      {diagramPreview && previewCopy ? (
        <section className="diagram-approval" aria-label="Diagram approval checkpoint" aria-live="polite">
          <div className="diagram-approval-header">
            <span className="diagram-approval-badge" data-state={diagramPreview.status}>
              {previewCopy.label}
            </span>
            <p>{previewCopy.detail}</p>
          </div>

          <div className="diagram-approval-preview">
            <strong>Preview to approve</strong>
            <DiagramFigurePreview preview={diagramPreview} />
          </div>

          <div className="diagram-approval-question">
            <strong>Does this match what you wanted?</strong>
            <div className="diagram-approval-actions">
              <button className="primary-button" disabled={diagramPreview.status !== "ready"} onClick={onKeepDiagram} type="button">
                <CheckCircle2 aria-hidden="true" />
                Keep Diagram
              </button>
              <button
                className="secondary-button"
                disabled={diagramPreview.status !== "ready"}
                onClick={openRevisionForm}
                type="button"
              >
                <RotateCcw aria-hidden="true" />
                Request Changes
              </button>
              <button
                className="danger-button"
                disabled={diagramPreview.status !== "ready"}
                onClick={onDiscardDiagram}
                type="button"
              >
                <Trash2 aria-hidden="true" />
                Discard
              </button>
            </div>
          </div>
          {diagramPreview.status === "changes-requested" ? (
            <form className="diagram-revision-form" onSubmit={submitRevision}>
              <label htmlFor={revisionFeedbackId}>What should change?</label>
              <textarea
                aria-describedby={revisionError ? revisionErrorId : undefined}
                aria-invalid={Boolean(revisionError)}
                id={revisionFeedbackId}
                maxLength={revisionFeedbackMaxLength + 120}
                onChange={(event) => {
                  setRevisionFeedback(event.target.value);
                  if (revisionError) {
                    setRevisionError("");
                  }
                }}
                placeholder="Example: Make the arrows curved and label the middle block as Layer update."
                value={revisionFeedback}
              />
              <div className="field-meta">
                <span id={revisionErrorId} aria-live="polite" className="field-error">
                  {revisionError}
                </span>
                <span className={hasRevisionOverflow ? "character-count danger" : "character-count"}>
                  {revisionFeedback.length}/{revisionFeedbackMaxLength}
                </span>
              </div>
              <div className="diagram-revision-actions">
                <button className="primary-button" disabled={compileState === "running"} type="submit">
                  <RotateCcw aria-hidden="true" />
                  Revise Diagram
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}
    </aside>
  );
};

const CompiledDocumentPreview = ({
  compileState,
  document
}: {
  compileState: CompileState;
  document: LatexCompilePreview | null;
}) => {
  if (document?.succeeded && document.pdfDataUrl) {
    return <iframe className="pdf-frame" src={document.pdfDataUrl} title="Compiled LaTeX PDF preview" />;
  }

  if (compileState === "error" && document) {
    return (
      <section className="compile-error-panel" aria-label="LaTeX compile errors">
        <strong>{document.timedOut ? "Compile timed out" : "Compile failed"}</strong>
        <pre>{getCompileFailureText(document)}</pre>
      </section>
    );
  }

  return (
    <div className="figure-placeholder">
      <FileText aria-hidden="true" />
      <span>Press Compile to render the current LaTeX document.</span>
    </div>
  );
};

const getCompileFailureText = (document: LatexCompilePreview) => {
  const log = document.errorSummary || document.compileLog || document.stderr || document.stdout || "No compiler output was captured.";

  return log.slice(0, 5000);
};

const normalizeLatexText = (text: string) =>
  text
    .replace(/%.*$/gm, " ")
    .replace(/\[([^\]]+)\]\(mailto:([^)]+)\)/g, "$1")
    .replace(/\\LaTeX\{\}/g, "LaTeX")
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\texttt\{([^{}]*)\}/g, "$1")
    .replace(/\\emph\{([^{}]*)\}/g, "$1")
    .replace(/\\vspace\{[^{}]*\}/g, " ")
    .replace(/\\(?:quad|qquad|,|;|:|!)/g, " ")
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+\*?/g, "")
    .replace(/\\+/g, " ")
    .replace(/\$\$?[^$]*\$\$?/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/(^|\s)\[[^\]]+\](?=\s|$)/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const DiagramFigurePreview = ({ preview }: { preview: DiagramPreviewApproval }) => (
  <figure className="compiled-diagram-preview" aria-label={preview.accessibleSummary}>
    <div className="diagram-flow" aria-hidden="true">
      {extractTikzNodeLabels(preview.source).map((label, index, labels) => (
        <Fragment key={`${label}-${index}`}>
          <div className={`diagram-node ${diagramNodeClassNames[index % diagramNodeClassNames.length]}`}>{label}</div>
          {index < labels.length - 1 ? <div className="diagram-link" /> : null}
        </Fragment>
      ))}
    </div>
  </figure>
);

const diagramNodeClassNames = ["input", "attention", "mlp", "output", "input"];
const fallbackDiagramLabels = ["Generated source", "Compile checkpoint", "Approval"];

const extractTikzNodeLabels = (source: string) => {
  const labels = Array.from(source.matchAll(/\\node(?:\[[^\]]*\])?(?:\s*\([^)]*\))?\s*\{([^{}]+)\}/g))
    .map((match) => normalizeLatexText(match[1] ?? ""))
    .filter(Boolean)
    .slice(0, 5);

  return labels.length ? labels : fallbackDiagramLabels;
};
