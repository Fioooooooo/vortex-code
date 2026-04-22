import { app } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

/**
 * 获取应用数据存储根目录
 *
 * - 开发环境：项目根目录的 data/ 目录，方便排查问题
 * - 生产环境：遵循 Electron 规范，使用 userData 目录
 */
export function getDataPath(): string {
  if (is.dev) {
    return join(process.cwd(), "data");
  }
  return app.getPath("userData");
}

/**
 * 获取指定子目录的数据路径
 * @param subPath 子目录名，如 "projects", "settings", "sessions"
 */
export function getDataSubPath(subPath: string): string {
  return join(getDataPath(), subPath);
}
