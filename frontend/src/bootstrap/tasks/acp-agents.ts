import { useAcpAgentsStore } from "@renderer/stores/acp-agents";
import { onFylloBootstrap } from "../core";

export function registerAcpAgentsTask(): void {
  onFylloBootstrap({
    name: "acp-agents",
    async run({ pinia }) {
      await useAcpAgentsStore(pinia).ensureInitialized();
    },
  });
}
