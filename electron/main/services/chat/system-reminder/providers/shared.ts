import logger from "@main/infra/logger";
import type { SystemReminderContext } from "../types";

const VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;
const ALLOWED_VARIABLES = new Set(["changeId", "stageIndex", "runId", "projectPath"]);

function sanitizeValue(
  ctx: SystemReminderContext,
  field: string,
  value: string | number | undefined
): string | null {
  if (value === undefined) return "";

  const text = String(value);
  if (!text.includes("<") && !text.includes(">")) {
    return text;
  }

  logger.warn("[system-reminder] rejected reminder variable", {
    owner: ctx.owner,
    field,
    fylloSessionId: ctx.fylloSessionId,
  });
  return null;
}

function getVariableValue(
  ctx: SystemReminderContext,
  field: string
): string | number | undefined | null {
  switch (field) {
    case "changeId":
      return ctx.changeId;
    case "stageIndex":
      return ctx.stageIndex;
    case "runId":
      return ctx.runId;
    case "projectPath":
      return ctx.projectPath;
    default:
      return undefined;
  }
}

export function renderSystemReminderTemplate(
  template: string,
  ctx: SystemReminderContext
): string | null {
  let rejected = false;

  const rendered = template.replace(VARIABLE_PATTERN, (match, field: string) => {
    if (!ALLOWED_VARIABLES.has(field)) {
      return match;
    }

    const sanitized = sanitizeValue(
      ctx,
      field,
      getVariableValue(ctx, field) as string | number | undefined
    );
    if (sanitized === null) {
      rejected = true;
      return match;
    }
    return sanitized;
  });

  return rejected ? null : rendered;
}
