import { BrowserWindow, ipcMain } from "electron";
import { AcpAgentChannels } from "@shared/types/channels";
import type { AcpInstallProgress, AcpRegistry } from "@shared/types/acp-agent";
import { createAgentError, detectAgentStatuses } from "@main/acp/detector";
import { getAgentIcons } from "@main/acp/iconCache";
import { installAgent } from "@main/acp/installer";
import { getRegistry, refreshRegistry } from "@main/acp/registryCache";
import { wrapHandler } from "./utils";

function broadcastRegistryUpdated(registry: AcpRegistry): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AcpAgentChannels.registryUpdated, registry);
  }
}

function broadcastInstallProgress(progress: AcpInstallProgress): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AcpAgentChannels.installProgress, progress);
  }
}

export function registerAcpAgentHandlers(): void {
  ipcMain.handle(AcpAgentChannels.getRegistry, () =>
    wrapHandler(async () =>
      getRegistry({
        onUpdated: broadcastRegistryUpdated,
      })
    )
  );

  ipcMain.handle(AcpAgentChannels.refreshRegistry, () =>
    wrapHandler(async () =>
      refreshRegistry({
        onUpdated: broadcastRegistryUpdated,
      })
    )
  );

  ipcMain.handle(AcpAgentChannels.getIcons, () =>
    wrapHandler(async () => {
      const registry = await getRegistry({
        onUpdated: broadcastRegistryUpdated,
      });
      return getAgentIcons(registry);
    })
  );

  ipcMain.handle(AcpAgentChannels.detectStatus, () =>
    wrapHandler(async () => {
      const registry = await getRegistry({
        onUpdated: broadcastRegistryUpdated,
      });
      return detectAgentStatuses(registry);
    })
  );

  ipcMain.handle(AcpAgentChannels.install, (_event, agentId: string) =>
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
