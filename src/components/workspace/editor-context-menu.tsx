"use client";

import { forwardRef, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Bot, FileText, Sparkles } from "lucide-react";

export type EditorContextMenuPosition = {
  x: number;
  y: number;
};

type EditorContextMenuProps = {
  isOpen: boolean;
  position: EditorContextMenuPosition;
  onAddDiagram: () => void;
  onClose: () => void;
};

type MenuAction = {
  id: string;
  label: string;
  detail: string;
  icon: "bot" | "sparkles" | "file";
  disabled?: boolean;
  onSelect?: () => void;
};

const menuWidth = 248;
const menuHeight = 178;
const viewportPadding = 12;

const clampPosition = (position: EditorContextMenuPosition) => {
  if (typeof window === "undefined") {
    return position;
  }

  return {
    x: Math.max(viewportPadding, Math.min(position.x, window.innerWidth - menuWidth - viewportPadding)),
    y: Math.max(viewportPadding, Math.min(position.y, window.innerHeight - menuHeight - viewportPadding))
  };
};

const ActionIcon = ({ icon }: { icon: MenuAction["icon"] }) => {
  if (icon === "sparkles") {
    return <Sparkles aria-hidden="true" />;
  }

  if (icon === "file") {
    return <FileText aria-hidden="true" />;
  }

  return <Bot aria-hidden="true" />;
};

export const EditorContextMenu = forwardRef<HTMLDivElement, EditorContextMenuProps>(
  ({ isOpen, position, onAddDiagram, onClose }, ref) => {
    const addDiagramRef = useRef<HTMLButtonElement>(null);

    const actions = useMemo<MenuAction[]>(
      () => [
        {
          id: "add-diagram",
          label: "Add diagram",
          detail: "Generate TikZ at the cursor",
          icon: "bot",
          onSelect: onAddDiagram
        },
        {
          id: "explain-selection",
          label: "Explain selection",
          detail: "Coming after diagram workflow",
          icon: "sparkles",
          disabled: true
        },
        {
          id: "create-figure-file",
          label: "Create figure file",
          detail: "Planned for generated assets",
          icon: "file",
          disabled: true
        }
      ],
      [onAddDiagram]
    );

    const safePosition = clampPosition(position);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const focusTimer = window.setTimeout(() => addDiagramRef.current?.focus(), 0);
      const closeOnPointerDown = (event: PointerEvent) => {
        const menuNode = typeof ref === "function" ? null : ref?.current;

        if (menuNode?.contains(event.target as Node)) {
          return;
        }

        onClose();
      };

      document.addEventListener("pointerdown", closeOnPointerDown);

      return () => {
        window.clearTimeout(focusTimer);
        document.removeEventListener("pointerdown", closeOnPointerDown);
      };
    }, [isOpen, onClose, ref]);

    const focusNextItem = (direction: 1 | -1) => {
      const enabledItems = Array.from(
        document.querySelectorAll<HTMLButtonElement>("[data-editor-menu-item='true']:not(:disabled)")
      );

      const activeIndex = enabledItems.findIndex((item) => item === document.activeElement);
      const nextIndex = activeIndex === -1 ? 0 : (activeIndex + direction + enabledItems.length) % enabledItems.length;
      enabledItems[nextIndex]?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusNextItem(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusNextItem(-1);
      }
    };

    if (!isOpen) {
      return null;
    }

    return (
      <div
        aria-label="Editor actions"
        className="editor-context-menu"
        data-testid="editor-context-menu"
        onKeyDown={handleKeyDown}
        ref={ref}
        role="menu"
        style={{ left: safePosition.x, top: safePosition.y }}
      >
        <div className="context-menu-heading">
          <span>Editor actions</span>
          <kbd>Esc</kbd>
        </div>
        {actions.map((action, index) => (
          <button
            aria-disabled={action.disabled ? "true" : undefined}
            className="context-menu-item"
            data-editor-menu-item="true"
            disabled={action.disabled}
            key={action.id}
            onClick={() => {
              action.onSelect?.();
              onClose();
            }}
            ref={index === 0 ? addDiagramRef : undefined}
            role="menuitem"
            type="button"
          >
            <ActionIcon icon={action.icon} />
            <span>
              <strong>{action.label}</strong>
              <small>{action.detail}</small>
            </span>
          </button>
        ))}
      </div>
    );
  }
);

EditorContextMenu.displayName = "EditorContextMenu";
