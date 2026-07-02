# CLAUDE.md — AI-Researcher

Agentic LaTeX diagram editor: Overleaf-like workspace with AI diagram generation via OpenRouter.

## Architecture

- **Frontend**: Next.js App Router, React, TypeScript, Monaco Editor
- **AI**: OpenRouter API with configurable models
- **Compilation**: Server-side LaTeX sandbox with process isolation
- **Agent**: Repair state machine + patch applier for AI-generated code

## Key files

- `src/app/page.tsx` — main editor workspace
- `src/app/api/diagram/generate/route.ts` — AI diagram generation endpoint
- `src/app/api/latex/compile/route.ts` — LaTeX compilation endpoint
- `src/server/agent/index.ts` — agent orchestrator
- `src/server/agent/repair-state-machine.ts` — compilation error → retry loop
- `src/server/agent/patch-applier.ts` — AI diff → user preview → apply
- `src/server/compiler/latex-sandbox.ts` — sandboxed compilation
- `src/server/compiler/log-parser.ts` — LaTeX log analysis
- `src/server/model/providers/openrouter.ts` — OpenRouter provider

## Running

```bash
npm install && npm run dev
```

Requires `OPENROUTER_API_KEY` in `.env.local`.

## Testing

```bash
npm test       # All 12 test suites
npm run lint   # ESLint
```
