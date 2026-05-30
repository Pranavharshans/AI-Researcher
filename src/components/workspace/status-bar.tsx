import type { ReactNode } from "react";
import type { CompileState } from "@/types/project";

type StatusBarProps = {
  compileState: CompileState;
  activeFilePath: string;
  agentStatus: string;
  leftIcon: ReactNode;
  rightIcon: ReactNode;
  agentIcon: ReactNode;
};

const stateLabel: Record<CompileState, string> = {
  idle: "Ready",
  queued: "Queued",
  running: "Compiling",
  success: "Compile succeeded",
  error: "Compile failed"
};

export const StatusBar = ({ compileState, activeFilePath, agentStatus, leftIcon, rightIcon, agentIcon }: StatusBarProps) => {
  return (
    <footer className="status-bar" aria-label="Compile and editor status">
      <div className="status-cluster">
        {leftIcon}
        <span>{activeFilePath}</span>
        <span>Line 12, Column 1</span>
      </div>
      <div className="status-cluster center" aria-live="polite">
        {agentIcon}
        <span>{agentStatus}</span>
      </div>
      <div className="status-cluster">
        {rightIcon}
        <span>{stateLabel[compileState]}</span>
      </div>
    </footer>
  );
};
