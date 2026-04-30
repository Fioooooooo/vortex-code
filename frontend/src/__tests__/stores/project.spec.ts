import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useProjectStore } from "@renderer/stores/project";
import { projectApi } from "@renderer/api/project";

vi.mock("@renderer/api/project", () => ({
  projectApi: {
    list: vi.fn(),
    getById: vi.fn(),
    getDefaultPath: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    openFolder: vi.fn(),
  },
}));

const mockToastAdd = vi.fn();

vi.mock("@nuxt/ui/composables", async () => {
  const actual = await vi.importActual<object>("@nuxt/ui/composables");
  return {
    ...actual,
    useToast: vi.fn(() => ({ add: mockToastAdd })),
  };
});

describe("useProjectStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("loads persisted projects and derives recent projects by lastOpenedAt", async () => {
    vi.mocked(projectApi.list).mockResolvedValue({
      ok: true,
      data: [
        {
          id: "b",
          name: "Project B",
          path: "/tmp/b",
          createdAt: "2026-04-20T08:00:00.000Z" as unknown as Date,
          lastOpenedAt: "2026-04-29T08:00:00.000Z" as unknown as Date,
        },
        {
          id: "a",
          name: "Project A",
          path: "/tmp/a",
          createdAt: "2026-04-19T08:00:00.000Z" as unknown as Date,
          lastOpenedAt: "2026-04-30T08:00:00.000Z" as unknown as Date,
        },
      ],
    });

    const store = useProjectStore();
    await store.loadProjects();

    expect(store.projects.map((project) => project.id)).toEqual(["a", "b"]);
    expect(store.recentProjects.map((project) => project.id)).toEqual(["a", "b"]);
    expect(store.projects[0]?.name).toBe("Project A");
    expect(store.isLoaded).toBe(true);
  });

  it("deduplicates concurrent ensureLoaded calls", async () => {
    vi.mocked(projectApi.list).mockResolvedValue({
      ok: true,
      data: [
        {
          id: "a",
          name: "Project A",
          path: "/tmp/a",
          createdAt: "2026-04-19T08:00:00.000Z" as unknown as Date,
          lastOpenedAt: "2026-04-30T08:00:00.000Z" as unknown as Date,
        },
      ],
    });

    const store = useProjectStore();
    await Promise.all([store.ensureLoaded(), store.ensureLoaded()]);

    expect(projectApi.list).toHaveBeenCalledTimes(1);
    expect(store.isLoaded).toBe(true);
    expect(store.projects).toHaveLength(1);
  });

  it("does not activate a recent project when the project path is missing", async () => {
    vi.mocked(projectApi.getById).mockResolvedValue({
      ok: true,
      data: {
        id: "missing",
        name: "Missing Project",
        path: "/tmp/missing",
        createdAt: "2026-04-20T08:00:00.000Z" as unknown as Date,
        lastOpenedAt: "2026-04-30T08:00:00.000Z" as unknown as Date,
        pathMissing: true,
      },
    });

    const store = useProjectStore();
    const result = await store.openRecentProject({
      id: "missing",
      name: "Missing Project",
      path: "/tmp/missing",
      createdAt: new Date("2026-04-20T08:00:00.000Z"),
      lastOpenedAt: new Date("2026-04-30T08:00:00.000Z"),
    });

    expect(result).toBeNull();
    expect(store.currentProject).toBeNull();
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "项目目录不存在",
      })
    );
    expect(projectApi.update).not.toHaveBeenCalled();
  });

  it("removes a recent project through the IPC API", async () => {
    vi.mocked(projectApi.list).mockResolvedValue({
      ok: true,
      data: [
        {
          id: "a",
          name: "Project A",
          path: "/tmp/a",
          createdAt: "2026-04-19T08:00:00.000Z" as unknown as Date,
          lastOpenedAt: "2026-04-30T08:00:00.000Z" as unknown as Date,
        },
      ],
    });
    vi.mocked(projectApi.remove).mockResolvedValue({
      ok: true,
      data: undefined,
    });

    const store = useProjectStore();
    await store.loadProjects();
    await store.removeRecentProject("a");

    expect(projectApi.remove).toHaveBeenCalledWith("a");
    expect(store.projects).toHaveLength(0);
    expect(store.recentProjects).toHaveLength(0);
  });
});
