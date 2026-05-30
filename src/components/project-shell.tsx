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
import type { CompileState } from "@/types/project";

export const ProjectShell = () => {
  const [activeFileId, setActiveFileId] = useState(sampleFiles[0]?.id ?? "");
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [agentStatus, setAgentStatus] = useState("AI status: waiting for diagram request");
  const [isAddDiagramOpen, setIsAddDiagramOpen] = useState(false);

  const activeFile = useMemo(
    () => sampleFiles.find((file) => file.id === activeFileId) ?? sampleFiles[0],
    [activeFileId]
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
    setAgentStatus(`AI status: diagram request captured (${request.stylePreset}, ${request.outputTarget}); OpenRouter pending key`);
    setIsAddDiagramOpen(false);
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

      <section className="workspace-grid" aria-label="LaTeX editing workspace">
        <aside className="file-sidebar" aria-label="Project files">
          <div className="panel-heading">
            <div>
              <p>Project</p>
              <h2>Files</h2>
            </div>
            <Folder aria-hidden="true" />
          </div>
          <FileTree files={sampleFiles} activeFileId={activeFile.id} onSelectFile={setActiveFileId} />
        </aside>

        <EditorPane file={activeFile} onAddDiagram={startAddDiagram} />

        <PreviewPane compileState={compileState} events={initialAgentEvents} />
      </section>

      <StatusBar
        compileState={compileState}
        activeFilePath={activeFile.path}
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
