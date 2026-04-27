import { registerChatHandlers } from "./chat";
import { registerProjectHandlers } from "./project";
import { registerIntegrationHandlers } from "./integration";
import { registerSettingsHandlers } from "./settings";
import { registerWindowHandlers } from "./window";

export function registerAllHandlers(): void {
  registerChatHandlers();
  registerProjectHandlers();
  registerIntegrationHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
}
