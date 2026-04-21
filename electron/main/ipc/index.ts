import { registerChatHandlers } from "./chat";
import { registerProjectHandlers } from "./project";
import { registerPipelineHandlers } from "./pipeline";
import { registerIntegrationHandlers } from "./integration";
import { registerSettingsHandlers } from "./settings";
import { registerWindowHandlers } from "./window";

export function registerAllHandlers(): void {
  registerChatHandlers();
  registerProjectHandlers();
  registerPipelineHandlers();
  registerIntegrationHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
}
