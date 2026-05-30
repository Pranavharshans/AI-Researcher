# PRD: Agentic LaTeX Diagram Editor

## 1. Product Summary

Build an Overleaf-like LaTeX editing application with a focused first-stage AI feature: users can generate, preview, repair, revise, and insert LaTeX/TikZ diagrams from a natural-language request.

The product is not a generic AI writing assistant in stage 1. The first product surface is an AI diagram workflow embedded directly inside a familiar LaTeX editor interface.

Core idea:

```text
User right-clicks in the editor
-> clicks "Add diagram"
-> enters a diagram request
-> AI generates standalone TikZ/LaTeX
-> system compiles it in a sandbox
-> if compilation fails, AI analyzes compiler logs and source context
-> AI applies targeted repairs
-> system recompiles and verifies output
-> user approves or requests a change
-> approved diagram is inserted into the LaTeX project
```

The critical requirement is an agentic self-healing loop. This must not be a blind fixed retry loop. The loop must observe compiler evidence, parse logs, diagnose the root cause, plan a repair, patch the LaTeX, and verify the result.

## 2. Goals

1. Provide an Overleaf-like authoring environment with editor, file tree, PDF/figure preview, and compile status.
2. Add a right-click "Add diagram" action inside the LaTeX editor.
3. Allow users to describe a desired diagram in plain language.
4. Generate a standalone compilable TikZ/LaTeX figure.
5. Compile the generated diagram before inserting it into the main document.
6. Automatically repair compile failures using an evidence-driven AI loop.
7. Ask the user whether the rendered diagram matches their intent.
8. If accepted, insert or keep the diagram in the document.
9. If rejected, ask what change should be made, then revise the existing diagram and rerun compile/repair.
10. Keep the model layer swappable, with OpenRouter as the first model gateway option.

## 3. Non-Goals For Stage 1

1. Full AI paper writing.
2. AI bibliography generation.
3. AI rewriting of arbitrary selected LaTeX.
4. Multi-user collaborative editing.
5. Full Overleaf feature parity.
6. End-to-end journal template management.
7. Image diffusion generation.
8. WYSIWYG visual diagram editing.
9. Training or fine-tuning models.
10. Autonomous edits across the whole paper without user approval.

## 4. Target Users

### Primary User

Researchers, students, and technical writers who already use LaTeX and need publication-ready diagrams.

Needs:

- Create diagrams quickly without remembering TikZ syntax.
- Avoid compiler errors.
- Preserve control over the final diagram.
- Keep diagrams in source-controlled LaTeX, not opaque image assets.

### Secondary User

Graduate students and paper authors who understand what a diagram should communicate but are not strong TikZ users.

Needs:

- Describe visual intent in normal language.
- Preview before committing changes.
- Request iterative adjustments.

## 5. User Experience Requirements

### 5.1 Layout

The application should use a familiar LaTeX editor layout:

```text
+------------------------------------------------------------------+
| Top bar: project name, compile button, AI status, account/menu    |
+----------------+-------------------------------+-----------------+
| File tree      | LaTeX editor                  | PDF/preview     |
|                |                               |                 |
| main.tex       | \section{Method}              | Rendered PDF    |
| figures/       |                               | or figure       |
| refs.bib       | right-click -> Add diagram    | preview         |
+----------------+-------------------------------+-----------------+
| Bottom status: compile state, AI agent events, latest error        |
+------------------------------------------------------------------+
```

This should feel like a production editor, not a marketing page.

### 5.2 Right-Click Diagram Flow

Trigger:

1. User right-clicks in the editor.
2. A compact context menu opens near the cursor.
3. The menu includes "Add diagram".
4. Other future AI actions may be visible but disabled or hidden in stage 1.

Context menu requirements:

- Keyboard accessible.
- Closes on Escape, outside click, or selection.
- Uses fixed z-index scale, not arbitrary large z-index values.
- Does not obscure the current text cursor more than necessary.
- Works on touch devices through long-press or editor command palette fallback.

### 5.3 Add Diagram Prompt

When the user selects "Add diagram", show a small modal or popover:

Fields:

- Diagram description: required text area.
- Optional style preset: Academic, Minimal, Detailed, Paper Figure.
- Optional output target: Inline at cursor, create in figures folder, replace selected placeholder.

Primary action:

- Generate Diagram

Secondary action:

- Cancel

Validation:

- Empty prompt cannot submit.
- Prompt length should have a sensible max, for example 4,000 characters.
- The app should show prompt-preserving errors if submission fails.

### 5.4 Generation Status

The user must see progress in human-readable stages:

```text
Generating TikZ...
Compiling standalone figure...
Compile failed: missing TikZ library.
Diagnosing compiler log...
Applied fix: added positioning library.
Recompiling...
Preview ready.
```

Do not expose raw chain-of-thought. Expose concise operational status, root cause summaries, and applied changes.

### 5.5 Preview And Approval

After the diagram compiles, show a preview panel:

- Rendered image/PDF/SVG preview.
- Collapsible source view.
- Compile status.
- Summary of changes made by the repair agent.

Ask:

```text
Does this match what you wanted?
```

Actions:

- Keep Diagram
- Request Changes
- Discard

If "Keep Diagram":

- Insert the approved figure at the cursor or selected target location.
- Save the diagram source under a generated figure path.
- Add required packages/libraries to the document preamble through a controlled patch, if needed.

If "Request Changes":

- Ask what should change.
- Use the existing diagram source as the starting point.
- Generate a targeted revision.
- Recompile and rerun the same self-healing loop.

## 6. Agentic Self-Healing Loop

### 6.1 Principle

The loop is not:

```text
try again up to 5 times
```

The loop is:

```text
observe -> parse -> diagnose -> plan -> patch -> verify -> decide next action
```

There may be a maximum compute/time/attempt budget, but that budget is only a safety limit. The core behavior must be evidence-driven.

### 6.2 Agent Responsibilities

The diagram agent has these internal roles:

1. Generator: creates initial standalone TikZ/LaTeX from the user request.
2. Compiler Tool: runs LaTeX in a sandbox and returns structured result data.
3. Log Parser: extracts useful errors, warnings, line numbers, file names, and package hints.
4. Diagnoser: uses source plus parsed logs to identify the most likely root cause.
5. Patch Planner: proposes a minimal repair strategy.
6. Patch Applier: applies structured edits to files.
7. Verifier: recompiles and checks that expected output artifacts exist.
8. Escalator: changes strategy when the same failure repeats or progress stalls.

### 6.3 State Machine

```text
IDLE
  -> PROMPT_OPEN
  -> GENERATING_SOURCE
  -> COMPILING_STANDALONE
  -> ANALYZING_COMPILE_RESULT
  -> DIAGNOSING_FAILURE
  -> PLANNING_PATCH
  -> APPLYING_PATCH
  -> RECOMPILING
  -> PREVIEW_READY
  -> AWAITING_USER_APPROVAL
  -> ACCEPTED
  -> INSERTING_IN_DOCUMENT
  -> COMPILING_MAIN_DOCUMENT
  -> DONE
```

Failure branches:

```text
DIAGNOSING_FAILURE -> NEEDS_ESCALATION
NEEDS_ESCALATION -> STRATEGY_SWITCH
STRATEGY_SWITCH -> APPLYING_PATCH
NEEDS_ESCALATION -> FAILED_WITH_EXPLANATION
```

User revision branch:

```text
AWAITING_USER_APPROVAL
  -> USER_REQUESTED_CHANGE
  -> REVISING_EXISTING_DIAGRAM
  -> COMPILING_STANDALONE
```

### 6.4 Loop Inputs

Each repair step receives:

- Original user request.
- Current `.tex` source.
- Compiler engine and flags.
- Parsed error objects.
- Relevant raw log excerpts.
- Surrounding source lines for reported line numbers.
- Previous attempts and outcomes.
- Current repair hypothesis.
- Previously applied patches.

### 6.5 Structured Error Object

Example:

```json
{
  "engine": "pdflatex",
  "file": "figures/generated/diagram_001.tex",
  "line": 42,
  "severity": "error",
  "rawMessage": "! Package pgf Error: No shape named `encoder' is known.",
  "normalizedType": "unknown_tikz_node",
  "sourceContext": {
    "before": ["\\node[block] (enc) {Encoder};"],
    "line": "\\draw[->] (encoder.east) -- (decoder.west);",
    "after": ["\\node[block, right=of enc] (decoder) {Decoder};"]
  },
  "hints": ["Possible node-name mismatch: enc vs encoder"]
}
```

### 6.6 Structured Patch Plan

The model must return structured repair instructions, not arbitrary full-file rewrites by default.

Example:

```json
{
  "rootCause": "The draw command references a TikZ node named `encoder`, but the defined node is named `enc`.",
  "confidence": 0.93,
  "repairType": "minimal_source_patch",
  "edits": [
    {
      "file": "figures/generated/diagram_001.tex",
      "operation": "replace",
      "find": "(encoder.east)",
      "replace": "(enc.east)"
    }
  ],
  "expectedOutcome": "The unknown node error should be resolved."
}
```

### 6.7 Progress Evaluation

After each compile:

- If compile succeeds and output exists, move to preview.
- If the previous error disappeared and a new error appears, continue with the new diagnosis.
- If the same error repeats, do not blindly retry. Escalate.
- If a patch introduces more severe failures, roll back that patch and choose another strategy.
- If the compiler succeeds but output is empty or visually invalid, run output validation and ask for a visual/semantic revision.

### 6.8 Escalation Strategies

When the repair loop stalls:

1. Reparse logs with a different extraction strategy.
2. Ask the model for alternate root-cause hypotheses.
3. Reduce diagram complexity while preserving intent.
4. Switch to a safer TikZ pattern.
5. Replace fragile library usage with simpler primitives.
6. Ask user for permission if the requested diagram needs a major simplification.
7. Fail with a concise explanation and preserve the broken artifact for inspection.

### 6.9 Safety Budget

Use configurable limits:

- Maximum wall-clock time per diagram generation.
- Maximum compile invocations.
- Maximum model tokens/cost.
- Maximum patch size.
- Maximum file scope.

These are guardrails, not the definition of the loop.

## 7. LaTeX And Compilation Strategy

### 7.1 Standalone First

Generated diagrams should compile as standalone figure files first.

Example generated file:

```text
figures/generated/diagram_001.tex
```

Example standalone wrapper:

```latex
\documentclass[tikz,border=4pt]{standalone}
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\begin{document}
% generated diagram body
\end{document}
```

### 7.2 Main Document Insertion

After user approval, insert into the main document:

```latex
\begin{figure}[ht]
  \centering
  \input{figures/generated/diagram_001}
  \caption{Generated diagram.}
  \label{fig:generated-diagram-001}
\end{figure}
```

The exact insertion can be adjusted based on the user-selected target.

### 7.3 Compiler Sandbox

Compilation must run in an isolated sandbox:

- Dockerized TeX Live image.
- `latexmk` preferred.
- Shell escape disabled by default.
- Network disabled during compilation.
- Per-job temporary workspace.
- CPU, memory, and time limits.
- All output artifacts captured.

### 7.4 Supported Output Previews

Stage 1 should support:

- PDF preview.
- PNG or SVG preview generated from the compiled figure.
- Source preview for advanced users.

## 8. Model And Provider Architecture

### 8.1 Provider Neutrality

The app must not be coupled to one model provider or one agent framework.

Use an internal model interface:

```ts
interface ModelClient {
  complete(request: ModelRequest): Promise<ModelResponse>;
  stream?(request: ModelRequest): AsyncIterable<ModelEvent>;
}
```

First providers:

- OpenRouterProvider.
- DirectOpenAIProvider, optional later.
- DirectAnthropicProvider, optional later.
- DirectGeminiProvider, optional later.
- LocalModelProvider, optional later.

### 8.2 OpenRouter Role

OpenRouter should be used as the first model gateway because it allows switching among many models without changing the product architecture.

OpenRouter must still sit behind the internal `ModelClient` interface. It should not become the product abstraction.

### 8.3 Model Tasks

Separate prompts by task:

- `generate_diagram_source`
- `diagnose_latex_error`
- `plan_latex_patch`
- `revise_diagram_from_user_feedback`
- `summarize_agent_activity`

Each task should have explicit input/output schemas.

## 9. Data Model

### Project

- `id`
- `name`
- `ownerId`
- `createdAt`
- `updatedAt`

### File

- `id`
- `projectId`
- `path`
- `content`
- `version`
- `updatedAt`

### DiagramJob

- `id`
- `projectId`
- `sourceFilePath`
- `status`
- `userPrompt`
- `stylePreset`
- `modelProvider`
- `modelName`
- `createdAt`
- `updatedAt`

### DiagramAttempt

- `id`
- `diagramJobId`
- `attemptNumber`
- `phase`
- `texBefore`
- `compileLog`
- `parsedErrors`
- `diagnosis`
- `patchPlan`
- `texAfter`
- `compileSucceeded`
- `artifactPaths`
- `createdAt`

### UserFeedback

- `id`
- `diagramJobId`
- `type`
- `message`
- `createdAt`

## 10. Backend APIs

### Create Diagram Job

```http
POST /api/projects/:projectId/diagram-jobs
```

Body:

```json
{
  "prompt": "Create a TikZ diagram of a transformer encoder block.",
  "cursorLocation": {
    "file": "main.tex",
    "line": 88,
    "column": 1
  },
  "stylePreset": "academic"
}
```

### Get Diagram Job Status

```http
GET /api/diagram-jobs/:jobId
```

Returns:

- Current phase.
- Timeline events.
- Preview artifact URL if available.
- Latest diagnosis summary.
- User action required, if any.

### Submit User Feedback

```http
POST /api/diagram-jobs/:jobId/feedback
```

Body:

```json
{
  "type": "request_changes",
  "message": "Make the data flow left-to-right and label the attention heads."
}
```

### Accept Diagram

```http
POST /api/diagram-jobs/:jobId/accept
```

This inserts the diagram into the target document location and optionally compiles the main document.

## 11. Frontend Components

1. `ProjectShell`
2. `FileTree`
3. `LatexEditor`
4. `EditorContextMenu`
5. `AddDiagramDialog`
6. `DiagramJobStatus`
7. `DiagramPreviewPanel`
8. `DiagramFeedbackDialog`
9. `PdfPreview`
10. `CompileLogDrawer`

## 12. Design Requirements From Installed Skills

Applied skills:

- `bencium-controlled-ux-designer`: controlled production UX, accessibility, mathematical spacing, direct user approval for design decisions.
- `ui-ux-pro-max`: developer-tool/IDE design guidance, accessibility checks, z-index discipline, typography, and stack-aware frontend guidance.
- `human-architect-mindset`: AI-aware decomposition, bounded AI tasks, verifiable results, failure isolation, and explicit tradeoffs.

Design direction:

- The app should feel like a dense professional editor, not a landing page.
- Use restrained neutral surfaces with strong contrast.
- Use one meaningful action accent for AI actions and status.
- Use SVG icons, preferably Lucide, not emoji icons.
- Keep cards for discrete repeated items, modals, and framed tool panels only.
- Avoid decorative gradients, oversized hero sections, and generic AI-purple styling.
- Maintain a predictable z-index scale for context menus, dialogs, drawers, and tooltips.
- Use visible focus states and keyboard paths for all interactive UI.
- Keep motion subtle, 150-300ms, and respect `prefers-reduced-motion`.

Typography:

- Editor text: monospace optimized for code.
- UI text: highly legible sans-serif.
- PRD recommendation from UI UX Pro Max for academic/developer fit: Atkinson Hyperlegible for UI/body, with optional Crimson Pro only for document-like marketing or onboarding surfaces.
- Main product surfaces should prioritize utility over display typography.

Accessibility requirements:

- WCAG 2.1 AA contrast.
- Keyboard accessible context menu and modal.
- `aria-live` status announcements for generation, compile failure, and preview readiness.
- Error messages must not be color-only.
- Diagram preview must have descriptive alt text or accessible summary.

## 13. Testing Requirements

### Unit Tests

- LaTeX log parser.
- Structured patch parser.
- Patch application and rollback.
- State-machine transitions.
- Provider adapter request normalization.
- Prompt schema validation.

### Integration Tests

- Generate a simple diagram and compile successfully.
- Generate a diagram with a missing TikZ library and repair it.
- Generate a diagram with an undefined node and repair it.
- Generate a diagram with malformed braces and repair it.
- Request a user change and verify source is revised from existing diagram.
- Accept a diagram and verify insertion into `main.tex`.

### End-to-End Tests

- Right-click editor, select "Add diagram", submit prompt, preview appears.
- Failed compile shows diagnosis and then succeeds after repair.
- User clicks "Request Changes", submits feedback, updated preview appears.
- User clicks "Keep Diagram", diagram is inserted and main document compiles.

### Visual Tests

- Context menu placement at editor edges.
- Modal responsiveness at 375px, 768px, 1024px, 1440px.
- Preview panel layout with long file names and long status messages.
- No overlap between editor, context menu, and modal.

### Security Tests

- Compilation disables shell escape.
- Compiler job cannot read outside job workspace.
- Compiler job times out.
- Generated LaTeX cannot trigger network access.
- Model output cannot write arbitrary paths.

## 14. Success Metrics

Product metrics:

- Diagram generation acceptance rate.
- Number of user-requested revisions per accepted diagram.
- Time from prompt submission to preview.
- Compile repair success rate.
- Percentage of jobs requiring manual user intervention.

Engineering metrics:

- Median compile time.
- P95 compile time.
- Model cost per accepted diagram.
- Number of repeated-error stalls.
- Patch rollback rate.

Quality metrics:

- Main document compile success after insertion.
- User discards after preview.
- User edits generated TikZ manually after acceptance.

## 15. MVP Milestones

### Milestone 1: Editor Shell

- File tree.
- Monaco editor.
- PDF/preview panel.
- Basic project file persistence.

### Milestone 2: Right-Click AI Entry Point

- Editor context menu.
- Add Diagram dialog.
- Diagram job status UI.

### Milestone 3: Compiler Sandbox

- Dockerized LaTeX compiler.
- Standalone figure compile.
- Artifact capture.
- Log capture.

### Milestone 4: Evidence-Driven Repair Agent

- Log parser.
- Diagnosis prompt.
- Structured patch planner.
- Patch applier.
- Recompile verification.
- Repair history timeline.

### Milestone 5: User Approval Loop

- Preview.
- Keep Diagram.
- Request Changes.
- Discard.
- Insert into main document.

### Milestone 6: Provider Abstraction

- Internal `ModelClient`.
- OpenRouter adapter.
- Provider/model selection config.
- Usage and cost logging.

## 16. Risks And Mitigations

### Risk: Agent loops forever or wastes cost

Mitigation:

- Time, compile, and token budgets.
- Repeated-error detection.
- Patch size limits.
- Escalation states.

### Risk: Model rewrites too much source

Mitigation:

- Structured patch plans.
- Patch size caps.
- File scope restrictions.
- Rollback support.

### Risk: Generated LaTeX is unsafe

Mitigation:

- Sandbox compilation.
- Shell escape disabled.
- Network disabled.
- Path allowlist.

### Risk: UI feels like a chat app, not an editor

Mitigation:

- Keep AI as contextual editor action.
- Use compact status panels.
- Avoid full-screen chat as primary UX.

### Risk: Vendor lock-in

Mitigation:

- Internal model interface.
- OpenRouter behind provider adapter.
- Provider-neutral task schemas.

## 17. Open Questions

1. Should the first preview render as PDF, SVG, PNG, or all three?
2. Should accepted diagrams be inserted as `\input{...}` or pasted inline by default?
3. Should generated preamble dependencies be centralized in `main.tex` or local to standalone figures?
4. Should users be allowed to select compiler engine per project?
5. Should diagram requests support image references in stage 1?
6. Should model selection be user-facing or admin-only in the MVP?

