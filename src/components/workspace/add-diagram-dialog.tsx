"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Bot, Check, FileInput, FolderPlus, Target, X } from "lucide-react";

export type DiagramStylePreset = "academic" | "minimal" | "detailed" | "paper-figure";
export type DiagramOutputTarget = "inline" | "figure-file" | "replace-placeholder";

export type AddDiagramRequest = {
  prompt: string;
  stylePreset: DiagramStylePreset;
  outputTarget: DiagramOutputTarget;
};

type AddDiagramDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: AddDiagramRequest) => void;
};

type Option<T extends string> = {
  value: T;
  label: string;
  detail: string;
};

const promptMaxLength = 4000;

const styleOptions: Option<DiagramStylePreset>[] = [
  {
    value: "academic",
    label: "Academic",
    detail: "Clear labels, restrained geometry"
  },
  {
    value: "minimal",
    label: "Minimal",
    detail: "Few marks, tight visual hierarchy"
  },
  {
    value: "detailed",
    label: "Detailed",
    detail: "More annotations and structure"
  },
  {
    value: "paper-figure",
    label: "Paper Figure",
    detail: "Caption-ready publication layout"
  }
];

const targetOptions: Option<DiagramOutputTarget>[] = [
  {
    value: "inline",
    label: "Inline at cursor",
    detail: "Insert into the current source location"
  },
  {
    value: "figure-file",
    label: "Create figure file",
    detail: "Save under figures/generated"
  },
  {
    value: "replace-placeholder",
    label: "Replace placeholder",
    detail: "Use the selected marker when available"
  }
];

export const AddDiagramDialog = ({ isOpen, onClose, onSubmit }: AddDiagramDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const promptId = useId();
  const errorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState<DiagramStylePreset>("academic");
  const [outputTarget, setOutputTarget] = useState<DiagramOutputTarget>("inline");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const promptLength = prompt.length;
  const hasPromptOverflow = promptLength > promptMaxLength;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Describe the diagram before generating it.");
      textareaRef.current?.focus();
      return;
    }

    if (hasPromptOverflow) {
      setError("Keep the diagram description under 4,000 characters.");
      textareaRef.current?.focus();
      return;
    }

    setError("");
    onSubmit({
      prompt: trimmedPrompt,
      stylePreset,
      outputTarget
    });
  };

  return (
    <div className="dialog-backdrop" data-testid="add-diagram-backdrop" role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="add-diagram-dialog"
        data-testid="add-diagram-dialog"
        role="dialog"
      >
        <header className="dialog-header">
          <div className="dialog-title-lockup">
            <span className="dialog-icon">
              <Bot aria-hidden="true" />
            </span>
            <div>
              <p>AI diagram workflow</p>
              <h2 id={titleId}>Add diagram</h2>
            </div>
          </div>
          <button
            aria-label="Close Add diagram"
            className="icon-button dialog-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <p className="dialog-description" id={descriptionId}>
          Describe the TikZ figure you want. The next stage will generate and compile it before insertion.
        </p>

        <form className="diagram-form" onSubmit={submit}>
          <label className="field-label" htmlFor={promptId}>
            Diagram description
          </label>
          <textarea
            aria-describedby={`${descriptionId} ${error ? errorId : ""}`.trim()}
            aria-invalid={Boolean(error)}
            className="diagram-prompt"
            id={promptId}
            maxLength={promptMaxLength + 250}
            onChange={(event) => {
              setPrompt(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="Example: Create a left-to-right transformer block diagram with token embeddings, multi-head attention, feed-forward layers, residual connections, and labeled outputs."
            ref={textareaRef}
            value={prompt}
          />
          <div className="field-meta">
            <span id={errorId} aria-live="polite" className="field-error">
              {error}
            </span>
            <span className={hasPromptOverflow ? "character-count danger" : "character-count"}>
              {promptLength}/{promptMaxLength}
            </span>
          </div>

          <fieldset className="option-fieldset">
            <legend>Style preset</legend>
            <div className="segmented-grid">
              {styleOptions.map((option) => (
                <button
                  aria-pressed={stylePreset === option.value}
                  className="option-segment"
                  data-selected={stylePreset === option.value}
                  key={option.value}
                  onClick={() => setStylePreset(option.value)}
                  type="button"
                >
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                  {stylePreset === option.value ? <Check aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="option-fieldset">
            <legend>Output target</legend>
            <div className="target-list">
              {targetOptions.map((option) => (
                <button
                  aria-pressed={outputTarget === option.value}
                  className="target-option"
                  data-selected={outputTarget === option.value}
                  key={option.value}
                  onClick={() => setOutputTarget(option.value)}
                  type="button"
                >
                  {option.value === "inline" ? <Target aria-hidden="true" /> : null}
                  {option.value === "figure-file" ? <FolderPlus aria-hidden="true" /> : null}
                  {option.value === "replace-placeholder" ? <FileInput aria-hidden="true" /> : null}
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" type="submit">
              <Bot aria-hidden="true" />
              Generate Diagram
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
