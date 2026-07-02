# AI-Researcher

Agentic LaTeX diagram editor — an Overleaf-like workspace with AI-powered diagram generation. Write LaTeX, request diagrams via natural language, and iterate with AI-assisted revision.

## Features

- **LaTeX Editor** — Monaco-based code editor with syntax highlighting and file tree
- **AI Diagram Generation** — Describe a diagram in natural language and the agent generates TikZ/diagram code
- **Compiler Sandbox** — Server-side LaTeX compilation with log parsing and error extraction
- **Repair State Machine** — Automatic compilation error detection and repair retry loop
- **Patch Applier** — AI-generated code diffs applied with user preview and approval
- **Multi-Provider** — OpenRouter integration for model selection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, TypeScript, Monaco Editor |
| Compilation | Server-side LaTeX sandbox |
| AI | OpenRouter API with configurable model providers |

## Setup

```bash
npm install
npm run dev
```

Create `.env.local` with your OpenRouter API key:
```
OPENROUTER_API_KEY=sk-or-...
```

## Usage

1. Open `http://localhost:3000`
2. Create or open a LaTeX project
3. Use the **Add Diagram** dialog to describe what you want
4. The AI agent generates TikZ code, applies it as a patch, and lets you preview the compiled result
5. If compilation fails, the repair state machine retries with error context

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Lint with ESLint
npm test           # Run all test suites
npm run typecheck  # TypeScript type checking
```

## Project Structure

```
AI-Researcher/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main editor workspace
│   │   └── api/
│   │       ├── diagram/generate/route.ts  # Diagram generation API
│   │       └── latex/compile/route.ts     # LaTeX compilation API
│   ├── components/
│   │   ├── project-shell.tsx           # Main workspace shell
│   │   └── workspace/                  # Editor, file tree, preview, dialogs
│   ├── server/
│   │   ├── agent/                      # AI agent: repair SM, patch applier
│   │   ├── compiler/                   # LaTeX sandbox, log parser
│   │   └── model/                      # Task schemas, config, providers
│   ├── lib/
│   └── types/
├── tests/                              # Test suites (task-007 through task-018)
├── docs/                               # PRD, task progress, test results
└── package.json
```

## Documentation

- [PRD](docs/PRD_AGENTIC_LATEX_DIAGRAM_EDITOR.md) — Product requirements document
- [Task Progress](docs/TASK_PROGRESS.diff) — Implementation task tracker
- [Test Results](docs/TEST_RESULTS.md) — Test suite results
