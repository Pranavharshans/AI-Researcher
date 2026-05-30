import { Activity, Bot, CheckCircle2, Clock3, FileText, RotateCcw, SquareCode, Trash2, TriangleAlert } from "lucide-react";
import type { AgentEvent, CompileState, DiagramPreviewApproval } from "@/types/project";

type PreviewPaneProps = {
  compileState: CompileState;
  diagramPreview: DiagramPreviewApproval | null;
  events: AgentEvent[];
  onDiscardDiagram: () => void;
  onKeepDiagram: () => void;
  onRequestChanges: () => void;
};

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

const getEventIcon = (state: AgentEvent["state"]) => {
  if (state === "complete") {
    return <CheckCircle2 aria-hidden="true" />;
  }

  if (state === "warning") {
    return <TriangleAlert aria-hidden="true" />;
  }

  if (state === "current") {
    return <Activity aria-hidden="true" />;
  }

  return <Clock3 aria-hidden="true" />;
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
  diagramPreview,
  events,
  onDiscardDiagram,
  onKeepDiagram,
  onRequestChanges
}: PreviewPaneProps) => {
  const copy = compileCopy[compileState];
  const previewCopy = diagramPreview ? approvalCopy[diagramPreview.status] : null;

  return (
    <aside className="preview-pane" aria-label="PDF and diagram preview">
      <div className="pane-toolbar">
        <div>
          <p>Preview</p>
          <h2>main.pdf</h2>
        </div>
        <span className="status-pill" data-state={diagramPreview?.status ?? compileState} aria-live="polite">
          {copy.label}
        </span>
      </div>

      <div className="pdf-preview" aria-label="Rendered PDF preview placeholder">
        <div className="paper-page">
          <div className="paper-header" />
          <h3>Learning Interpretable Transformers</h3>
          <div className="paper-rule" />
          <p>
            We model the agentic diagram workflow as a verified compiler loop with evidence-driven
            repair steps.
          </p>
          {diagramPreview ? <DiagramFigurePreview preview={diagramPreview} /> : <EmptyFigurePreview />}
          <div className="paper-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <section className="agent-rail" aria-label="AI agent status">
        <div className="agent-rail-heading">
          <Bot aria-hidden="true" />
          <div>
            <p>AI diagram workflow</p>
            <h3>{copy.detail}</h3>
          </div>
        </div>
        <ol className="event-list">
          {events.map((event) => (
            <li className="event-item" data-state={event.state} key={event.id}>
              {getEventIcon(event.state)}
              <div>
                <strong>{event.label}</strong>
                <span>{event.detail}</span>
              </div>
            </li>
          ))}
        </ol>
        {diagramPreview && previewCopy ? (
          <section className="diagram-approval" aria-label="Diagram approval checkpoint" aria-live="polite">
            <div className="diagram-approval-header">
              <span className="diagram-approval-badge" data-state={diagramPreview.status}>
                {previewCopy.label}
              </span>
              <p>{previewCopy.detail}</p>
            </div>

            <div className="diagram-change-summary">
              <strong>Repair summary</strong>
              <p>{diagramPreview.repairSummary}</p>
              <ul>
                {diagramPreview.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>

            <details className="diagram-source-preview">
              <summary>
                <SquareCode aria-hidden="true" />
                Source preview
              </summary>
              <pre>{diagramPreview.source}</pre>
            </details>

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
                  onClick={onRequestChanges}
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
          </section>
        ) : null}
      </section>
    </aside>
  );
};

const EmptyFigurePreview = () => (
  <div className="figure-placeholder">
    <FileText aria-hidden="true" />
    <span>Compiled figure preview appears here</span>
  </div>
);

const DiagramFigurePreview = ({ preview }: { preview: DiagramPreviewApproval }) => (
  <figure className="compiled-diagram-preview" aria-label={preview.accessibleSummary}>
    <figcaption>
      <span>{preview.artifactPath}</span>
      <strong>{preview.prompt}</strong>
    </figcaption>
    <div className="diagram-flow" aria-hidden="true">
      <div className="diagram-node input">Token embeddings</div>
      <div className="diagram-link" />
      <div className="diagram-node attention">Multi-head attention</div>
      <div className="diagram-link" />
      <div className="diagram-node mlp">Feed-forward block</div>
      <div className="diagram-link" />
      <div className="diagram-node output">Logits</div>
    </div>
    <p>{preview.accessibleSummary}</p>
  </figure>
);
