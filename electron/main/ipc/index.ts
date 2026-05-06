import { registerChatHandlers } from "./chat";
import { registerProjectHandlers } from "./project";
import { registerProposalHandlers } from "./proposal";
import { registerProposalApplyHandlers } from "./proposal-apply";
import { registerIntegrationHandlers } from "./integration";
import { registerAcpAgentHandlers } from "./acp-agents";
import { registerSettingsHandlers } from "./settings";
import { registerWindowHandlers } from "./window";
import { registerNetHandlers } from "./net";
import { registerWorkflowHandlers } from "./workflow";

export function registerAllHandlers(): void {
  registerChatHandlers();
  registerProjectHandlers();
  registerProposalHandlers();
  registerProposalApplyHandlers();
  registerWorkflowHandlers();
  registerIntegrationHandlers();
  registerAcpAgentHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
  registerNetHandlers();
}
