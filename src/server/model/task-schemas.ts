import type { ModelJsonSchema, ModelTask } from "@/server/model/types";

export const modelTaskDescriptions: Record<ModelTask, string> = {
  generate_diagram_source: "Generate standalone TikZ/LaTeX source from a user diagram request.",
  diagnose_latex_error: "Diagnose a LaTeX compile failure using parsed compiler evidence.",
  plan_latex_patch: "Plan a minimal structured patch for a known LaTeX failure.",
  revise_diagram_from_user_feedback: "Revise an existing diagram from targeted user feedback.",
  summarize_agent_activity: "Summarize the visible agent timeline without exposing hidden reasoning."
};

export const modelTaskSchemas: Record<ModelTask, ModelJsonSchema> = {
  generate_diagram_source: {
    name: "generate_diagram_source",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["tex", "summary", "requiredPackages", "requiredTikzLibraries"],
      properties: {
        tex: { type: "string" },
        summary: { type: "string" },
        requiredPackages: { type: "array", items: { type: "string" } },
        requiredTikzLibraries: { type: "array", items: { type: "string" } }
      }
    }
  },
  diagnose_latex_error: {
    name: "diagnose_latex_error",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["rootCause", "confidence", "evidence", "nextAction"],
      properties: {
        rootCause: { type: "string" },
        confidence: { type: "number" },
        evidence: { type: "array", items: { type: "string" } },
        nextAction: { type: "string" }
      }
    }
  },
  plan_latex_patch: {
    name: "plan_latex_patch",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["rootCause", "confidence", "repairType", "edits", "expectedOutcome"],
      properties: {
        rootCause: { type: "string" },
        confidence: { type: "number" },
        repairType: { type: "string" },
        edits: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["file", "operation"],
            properties: {
              file: { type: "string" },
              operation: { enum: ["replace", "insert_before", "insert_after", "append"] },
              find: { type: "string" },
              replace: { type: "string" }
            }
          }
        },
        expectedOutcome: { type: "string" }
      }
    }
  },
  revise_diagram_from_user_feedback: {
    name: "revise_diagram_from_user_feedback",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["tex", "changeSummary"],
      properties: {
        tex: { type: "string" },
        changeSummary: { type: "string" }
      }
    }
  },
  summarize_agent_activity: {
    name: "summarize_agent_activity",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "events"],
      properties: {
        status: { type: "string" },
        events: { type: "array", items: { type: "string" } }
      }
    }
  }
};
