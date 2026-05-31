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
  onChangeFileContent: (fileId: string, content: string) => void;
  onCursorChange: (fileId: string, offset: number) => void;
};

type EditorCursorPosition = {
  column: number;
  lineNumber: number;
};

type MonacoEditorInstance = {
  focus: () => void;
  getModel: () => {
    getOffsetAt: (position: EditorCursorPosition) => number;
  } | null;
  getPosition: () => EditorCursorPosition | null;
  getTargetAtClientPoint?: (clientX: number, clientY: number) => { position?: EditorCursorPosition | null } | null;
  onDidChangeCursorPosition: (listener: (event: { position: EditorCursorPosition }) => void) => { dispose: () => void };
  setPosition: (position: EditorCursorPosition) => void;
};

export const EditorPane = ({ file, onAddDiagram, onChangeFileContent, onCursorChange }: EditorPaneProps) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const cursorListenerRef = useRef<{ dispose: () => void } | null>(null);
  const [menuPosition, setMenuPosition] = useState<EditorContextMenuPosition>({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const reportCursorOffset = useCallback(
    (position: EditorCursorPosition | null) => {
      const model = editorRef.current?.getModel();

      if (!model || !position) {
        return;
      }

      onCursorChange(file.id, model.getOffsetAt(position));
    },
    [file.id, onCursorChange]
  );

  const handleEditorMount = useCallback(
    (editor: MonacoEditorInstance) => {
      cursorListenerRef.current?.dispose();
      editorRef.current = editor;
      reportCursorOffset(editor.getPosition());
      cursorListenerRef.current = editor.onDidChangeCursorPosition((event) => reportCursorOffset(event.position));
    },
    [reportCursorOffset]
  );

  const openContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const targetPosition = editorRef.current?.getTargetAtClientPoint?.(event.clientX, event.clientY)?.position ?? null;

    if (targetPosition) {
      editorRef.current?.setPosition(targetPosition);
      editorRef.current?.focus();
      reportCursorOffset(targetPosition);
    }

    setMenuPosition({ x: event.clientX, y: event.clientY });
    setIsMenuOpen(true);
  }, [reportCursorOffset]);

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
          onMount={handleEditorMount}
          onChange={(value) => onChangeFileContent(file.id, value ?? "")}
          theme="vs-dark"
          value={file.content}
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
