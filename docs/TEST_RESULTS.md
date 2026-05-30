# Test Plan And Results: Agentic LaTeX Diagram Editor

## Purpose

This file is the running test ledger for the project. It defines the tests required for the Overleaf-like AI diagram feature and records execution results over time.

Current status: documentation-only planning artifacts have been created. Application code has not been scaffolded yet, so implementation tests are pending.

## Test Environment

Initial environment:

- Workspace: `/Users/pranavharshans/All-proj/LIT`
- Date: 2026-05-30
- Installed skills:
  - bencium marketplace skills installed globally through `npx skills add`.
  - UI UX Pro Max installed project-local under `.codex/skills/ui-ux-pro-max`.

Future implementation environment:

- Frontend: Next.js + TypeScript.
- Editor: Monaco Editor.
- Compiler: Dockerized TeX Live with `latexmk`.
- AI provider: OpenRouter behind internal `ModelClient`.
- Jobs: Redis/BullMQ or equivalent queue.
- Database: Postgres.

## Results Summary

| Test Area | Status | Notes |
|---|---:|---|
| Skill installation | Passed | bencium installed; UI UX Pro Max installed project-local because `--global` was unsupported by installed CLI. |
| PRD artifact creation | Passed | `docs/PRD_AGENTIC_LATEX_DIAGRAM_EDITOR.md` created. |
| Progress tracker creation | Passed | `docs/TASK_PROGRESS.diff` created. |
| Test ledger creation | Passed | `docs/TEST_RESULTS.md` created. |
| Application unit tests | Pending | No application code yet. |
| Compiler sandbox tests | Pending | Compiler service not implemented yet. |
| Agent repair tests | Pending | Agent state machine not implemented yet. |
| E2E UI tests | Pending | UI not implemented yet. |

## Required Unit Tests

### UT-001: LaTeX Log Parser Extracts Basic Error

Input:

- Raw LaTeX log containing a syntax error with line number.

Expected:

- Parser returns severity `error`.
- Parser returns file path when available.
- Parser returns line number.
- Parser returns concise raw message.

Status: Pending.

### UT-002: TikZ Missing Library Detection

Input:

- Log containing an error caused by missing TikZ library usage.

Expected:

- Normalized type is `missing_tikz_library` or equivalent.
- Hint suggests likely `\usetikzlibrary{...}` repair.

Status: Pending.

### UT-003: Unknown Node Detection

Input:

- Log containing `No shape named ... is known`.

Expected:

- Normalized type is `unknown_tikz_node`.
- Source context includes node definitions near the failing line.

Status: Pending.

### UT-004: Structured Patch Validation

Input:

- Model patch JSON with allowed file path and replace operation.

Expected:

- Patch validates.
- Patch applies.
- Patch result is recorded.

Status: Pending.

### UT-005: Patch Path Rejection

Input:

- Model patch JSON attempting to write outside the job workspace.

Expected:

- Patch is rejected.
- No file is modified.
- Security event is recorded.

Status: Pending.

### UT-006: Repeated Error Escalation

Input:

- Two consecutive compile attempts with the same normalized error.

Expected:

- State machine does not blindly retry.
- State moves to escalation strategy.

Status: Pending.

## Required Integration Tests

### IT-001: Simple Diagram Compiles First Try

Flow:

1. Submit prompt: "Create a simple flowchart with three boxes: Input, Model, Output."
2. Generate standalone TikZ.
3. Compile.

Expected:

- Compile succeeds.
- Preview artifact exists.
- User approval state is reached.

Status: Pending.

### IT-002: Missing Library Is Repaired

Flow:

1. Force generated source to use `right=of` without loading `positioning`.
2. Compile.
3. Parse error.
4. Diagnose and patch preamble.
5. Recompile.

Expected:

- Agent diagnoses missing TikZ library.
- Patch adds `\usetikzlibrary{positioning}`.
- Compile succeeds.

Status: Pending.

### IT-003: Unknown Node Is Repaired

Flow:

1. Force source to define `(enc)` but draw from `(encoder)`.
2. Compile.
3. Diagnose mismatch.
4. Patch draw command.
5. Recompile.

Expected:

- Agent identifies node-name mismatch.
- Patch changes reference to existing node.
- Compile succeeds.

Status: Pending.

### IT-004: User Revision Uses Existing Diagram

Flow:

1. Generate and compile a diagram.
2. User clicks "Request Changes".
3. User asks: "Make the arrows curved and label the middle block."
4. Agent revises current diagram.

Expected:

- Existing source is used as input.
- Diff is targeted, not full unrelated rewrite.
- Updated diagram compiles.

Status: Pending.

### IT-005: Accept Inserts Into Main Document

Flow:

1. Generate diagram.
2. Compile and preview.
3. User clicks "Keep Diagram".

Expected:

- Figure source is saved under `figures/generated`.
- `main.tex` receives a figure environment or `\input`.
- Main document compile is triggered or queued.

Status: Pending.

## Required E2E Tests

### E2E-001: Right-Click Add Diagram

Flow:

1. Open project.
2. Right-click editor.
3. Select "Add diagram".
4. Enter prompt.
5. Click Generate.

Expected:

- Dialog opens.
- Generation status appears.
- Preview appears after compile.

Status: Pending.

### E2E-002: Compile Failure Auto Repairs

Flow:

1. Submit prompt that triggers known TikZ failure fixture.
2. Observe status timeline.

Expected:

- UI shows compile failure summary.
- UI shows diagnosis summary.
- UI shows applied fix summary.
- Preview appears after repair.

Status: Pending.

### E2E-003: User Rejects And Requests Change

Flow:

1. Generate diagram.
2. Click "Request Changes".
3. Submit change request.

Expected:

- Feedback dialog opens.
- Updated generation job starts from previous source.
- New preview appears.

Status: Pending.

### E2E-004: Keyboard Accessibility

Flow:

1. Open editor.
2. Trigger context menu through keyboard fallback.
3. Navigate menu with arrow keys.
4. Open dialog.
5. Close with Escape.

Expected:

- Focus remains controlled.
- Screen reader labels are present.
- Escape closes menu/dialog.

Status: Pending.

## Required Visual Tests

### VT-001: Editor Layout At Common Viewports

Viewports:

- 375px
- 768px
- 1024px
- 1440px

Expected:

- No horizontal overflow.
- Editor, file tree, and preview are usable.
- Text does not overlap.

Status: Pending.

### VT-002: Context Menu Edge Placement

Cases:

- Right-click near top.
- Right-click near bottom.
- Right-click near right edge.
- Right-click near left edge.

Expected:

- Menu remains visible.
- Menu does not render off-screen.
- Menu does not hide selected text unnecessarily.

Status: Pending.

### VT-003: Long Status Message Handling

Input:

- Long LaTeX error summary.

Expected:

- Status panel wraps or truncates cleanly.
- No overlap with editor or preview.

Status: Pending.

## Required Security Tests

### ST-001: Shell Escape Disabled

Input:

- LaTeX source attempting shell escape.

Expected:

- Shell escape does not execute.
- Compile fails safely or ignores unsafe operation.

Status: Pending.

### ST-002: Path Traversal Rejected

Input:

- Model patch targeting `../../outside.tex`.

Expected:

- Patch rejected.
- Event recorded.

Status: Pending.

### ST-003: Compiler Timeout

Input:

- LaTeX source designed to hang or compile too long.

Expected:

- Job terminates at timeout.
- User sees actionable failure.

Status: Pending.

### ST-004: Network Disabled During Compile

Input:

- LaTeX source attempting external network fetch.

Expected:

- Network access fails.
- Sandbox remains isolated.

Status: Pending.

## Documentation Artifact Tests Run On 2026-05-30

| ID | Check | Result |
|---|---|---|
| DOC-001 | Requested skills install attempted | Passed |
| DOC-002 | bencium marketplace install completed | Passed |
| DOC-003 | UI UX Pro Max install completed | Passed with note |
| DOC-004 | Detailed PRD file created | Passed |
| DOC-005 | Task progress diff file created | Passed |
| DOC-006 | Test results ledger created | Passed |

Note for DOC-003:

The documented `uipro init --ai codex --global` command failed because the installed CLI reported `unknown option '--global'`. The fallback command `uipro init --ai codex` succeeded and installed the skill into the current project.

