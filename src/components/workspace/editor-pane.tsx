"use client";

import dynamic from "next/dynamic";
import type { ProjectFile } from "@/types/project";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading LaTeX editor...</div>
});

type EditorPaneProps = {
  file: ProjectFile;
};

export const EditorPane = ({ file }: EditorPaneProps) => {
  return (
    <section className="editor-pane" aria-label="LaTeX source editor">
      <div className="pane-toolbar">
        <div>
          <p>Source</p>
          <h2>{file.path}</h2>
        </div>
        <div className="toolbar-meta">
          <span>UTF-8</span>
          <span>pdfLaTeX</span>
          <span>Auto-save</span>
        </div>
      </div>
      <div className="editor-frame" data-testid="latex-editor-frame">
        <MonacoEditor
          key={file.id}
          defaultLanguage={file.language === "bibtex" ? "bibtex" : "latex"}
          defaultValue={file.content}
          theme="vs-dark"
          options={{
            fontFamily: "'Fira Code', 'SFMono-Regular', Consolas, monospace",
            fontLigatures: false,
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 18, bottom: 18 },
            renderLineHighlight: "line",
            automaticLayout: true
          }}
        />
      </div>
    </section>
  );
};
