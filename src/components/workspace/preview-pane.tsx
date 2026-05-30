import { Activity, Bot, CheckCircle2, Clock3, FileText, TriangleAlert } from "lucide-react";
import type { AgentEvent, CompileState } from "@/types/project";

type PreviewPaneProps = {
  compileState: CompileState;
  events: AgentEvent[];
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

export const PreviewPane = ({ compileState, events }: PreviewPaneProps) => {
  const copy = compileCopy[compileState];

  return (
    <aside className="preview-pane" aria-label="PDF and diagram preview">
      <div className="pane-toolbar">
        <div>
          <p>Preview</p>
          <h2>main.pdf</h2>
        </div>
        <span className="status-pill" data-state={compileState} aria-live="polite">
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
          <div className="figure-placeholder">
            <FileText aria-hidden="true" />
            <span>Compiled figure preview appears here</span>
          </div>
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
      </section>
    </aside>
  );
};
