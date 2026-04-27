import { BrowserWindow, ipcMain } from "electron";
import { AgentsChannels } from "@shared/types/channels";
import type { AgentRegistry, InstallProgress } from "@shared/types/agents";
import { createAgentError, detectAgentStatuses } from "@main/agents/detector";
import { getAgentIcons } from "@main/agents/iconCache";
import { installAgent } from "@main/agents/installer";
import { getRegistry, refreshRegistry } from "@main/agents/registryCache";
import { wrapHandler } from "./utils";

function broadcastRegistryUpdated(registry: AgentRegistry): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AgentsChannels.registryUpdated, registry);
  }
}

function broadcastInstallProgress(progress: InstallProgress): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AgentsChannels.installProgress, progress);
  }
}

export function registerAgentsHandlers(): void {
  ipcMain.handle(AgentsChannels.getRegistry, () =>
    wrapHandler(async () =>
      getRegistry({
        onUpdated: broadcastRegistryUpdated,
      })
    )
  );

  ipcMain.handle(AgentsChannels.refreshRegistry, () =>
    wrapHandler(async () =>
      refreshRegistry({
        onUpdated: broadcastRegistryUpdated,
      })
    )
  );

  ipcMain.handle(AgentsChannels.getIcons, () =>
    wrapHandler(async () => {
      const registry = await getRegistry({
        onUpdated: broadcastRegistryUpdated,
      });
      return getAgentIcons(registry);
    })
  );

  ipcMain.handle(AgentsChannels.detectStatus, () =>
    wrapHandler(async () => {
      const registry = await getRegistry({
        onUpdated: broadcastRegistryUpdated,
      });
      return detectAgentStatuses(registry);
    })
  );

  ipcMain.handle(AgentsChannels.install, (_event, agentId: string) =>
    wrapHandler(async () => {
      const registry = await getRegistry({
        onUpdated: broadcastRegistryUpdated,
      });
      const agent = registry.agents.find((item) => item.id === agentId);
      if (!agent) {
        throw createAgentError("AGENT_NOT_FOUND", `未知 Agent: ${agentId}`);
      }

      return installAgent(agent, broadcastInstallProgress);
    })
  );
}
