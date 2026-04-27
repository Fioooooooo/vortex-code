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

export const NetChannels = {
  fetch: "net:fetch",
  fetchImage: "net:fetchImage",
} as const;

export const IntegrationChannels = {
  listTools: "integration:listTools",
  getConnections: "integration:getConnections",
  getConnection: "integration:getConnection",
  connect: "integration:connect",
  disconnect: "integration:disconnect",
  listProjectConfigs: "integration:listProjectConfigs",
  setProjectConfig: "integration:setProjectConfig",
  listCustom: "integration:listCustom",
  createCustom: "integration:createCustom",
  removeCustom: "integration:removeCustom",
  yunxiaoSetToken: "integration:yunxiao:setToken",
  yunxiaoSetOrganization: "integration:yunxiao:setOrganization",
} as const;

export const SettingsChannels = {
  get: "settings:get",
  update: "settings:update",
} as const;

export const AgentsChannels = {
  getRegistry: "settings:agents:getRegistry",
  refreshRegistry: "settings:agents:refreshRegistry",
  getIcons: "settings:agents:getIcons",
  detectStatus: "settings:agents:detectStatus",
  install: "settings:agents:install",
  registryUpdated: "settings:agents:registryUpdated",
  installProgress: "settings:agents:installProgress",
} as const;

export const WindowChannels = {
  minimize: "window:minimize",
  maximize: "window:maximize",
  close: "window:close",
  toggleDevTools: "window:toggleDevTools",
  isMaximized: "window:isMaximized",
} as const;
