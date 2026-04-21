// Request-response channels: domain:action
export const ChatChannels = {
  listSessions: "chat:listSessions",
  getSession: "chat:getSession",
  createSession: "chat:createSession",
  updateSession: "chat:updateSession",
  removeSession: "chat:removeSession",
  sendMessage: "chat:sendMessage",
} as const;

export const ChatStreamChannels = {
  streamMessage: "chat:stream:message",
  streamPort: "chat:stream:port",
  streamCancel: "chat:stream:cancel",
} as const;

export const ProjectChannels = {
  list: "project:list",
  getById: "project:getById",
  create: "project:create",
  update: "project:update",
  remove: "project:remove",
  setActive: "project:setActive",
} as const;

export const PipelineChannels = {
  listTemplates: "pipeline:listTemplates",
  getTemplate: "pipeline:getTemplate",
  createTemplate: "pipeline:createTemplate",
  updateTemplate: "pipeline:updateTemplate",
  removeTemplate: "pipeline:removeTemplate",
  listRuns: "pipeline:listRuns",
  getRun: "pipeline:getRun",
  createRun: "pipeline:createRun",
  abortRun: "pipeline:abortRun",
  approveStage: "pipeline:approveStage",
} as const;

export const PipelineEventChannels = {
  stageChanged: "pipeline:event:stageChanged",
  runCompleted: "pipeline:event:runCompleted",
} as const;

export const IntegrationChannels = {
  listTools: "integration:listTools",
  getConnection: "integration:getConnection",
  connect: "integration:connect",
  disconnect: "integration:disconnect",
  listProjectConfigs: "integration:listProjectConfigs",
  setProjectConfig: "integration:setProjectConfig",
  listCustom: "integration:listCustom",
  createCustom: "integration:createCustom",
  removeCustom: "integration:removeCustom",
} as const;

export const SettingsChannels = {
  get: "settings:get",
  update: "settings:update",
  listAgents: "settings:listAgents",
} as const;

export const WindowChannels = {
  minimize: "window:minimize",
  maximize: "window:maximize",
  close: "window:close",
  toggleDevTools: "window:toggleDevTools",
  isMaximized: "window:isMaximized",
} as const;
