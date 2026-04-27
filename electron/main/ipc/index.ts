import { registerChatHandlers } from "./chat";
import { registerProjectHandlers } from "./project";
import { registerIntegrationHandlers } from "./integration";
import { registerAgentsHandlers } from "./agents";
import { registerSettingsHandlers } from "./settings";
import { registerWindowHandlers } from "./window";
import { registerNetHandlers } from "./net";

export function registerAllHandlers(): void {
  registerChatHandlers();
  registerProjectHandlers();
  registerIntegrationHandlers();
  registerAgentsHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
  registerNetHandlers();
}
