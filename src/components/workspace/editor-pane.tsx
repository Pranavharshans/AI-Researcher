"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { Bot } from "lucide-react";
import {
  EditorContextMenu,
  type EditorContextMenuPosition
} from "@/components/workspace/editor-context-menu";
import type { ProjectFile } from "@/types/project";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading LaTeX editor...</div>
});

type EditorPaneProps = {
  file: ProjectFile;
  onAddDiagram: () => void;
};

export const EditorPane = ({ file, onAddDiagram }: EditorPaneProps) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<EditorContextMenuPosition>({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setIsMenuOpen(true);
  }, []);

  const openToolbarMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: button.left,
      y: button.bottom + 8
    });
    setIsMenuOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <section className="editor-pane" aria-label="LaTeX source editor">
      <div className="pane-toolbar">
        <div>
          <p>Source</p>
          <h2>{file.path}</h2>
        </div>
        <div className="toolbar-meta">
          <button className="toolbar-command" type="button" onClick={openToolbarMenu}>
            <Bot aria-hidden="true" />
            Add diagram
          </button>
          <span>UTF-8</span>
          <span>pdfLaTeX</span>
          <span>Auto-save</span>
        </div>
      </div>
      <div
        className="editor-frame"
        data-testid="latex-editor-frame"
        onContextMenuCapture={openContextMenu}
      >
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
            contextmenu: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 18, bottom: 18 },
            renderLineHighlight: "line",
            automaticLayout: true
          }}
        />
        <EditorContextMenu
          isOpen={isMenuOpen}
          onAddDiagram={onAddDiagram}
          onClose={closeContextMenu}
          position={menuPosition}
          ref={contextMenuRef}
        />
      </div>
    </section>
  );
};
