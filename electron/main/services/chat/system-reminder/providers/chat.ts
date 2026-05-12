import template from "../templates/chat.md?raw";
import { renderSystemReminderTemplate } from "./shared";
import type { SystemReminderContext } from "../types";

export async function resolveChatSystemReminder(
  ctx: SystemReminderContext
): Promise<string | null> {
  return renderSystemReminderTemplate(template, ctx);
}
