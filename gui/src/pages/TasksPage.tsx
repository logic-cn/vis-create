import { useState, useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { taskService } from "../services/taskService";
import TaskCard from "../components/tasks/TaskCard";

type StatusFilter = "" | "processing" | "pending" | "completed" | "failed" | "paused";
type TypeFilter = "" | "image" | "video";

export default function TasksPage() {
  const { tasks, isLoading, setTasks, setLoading } = useTaskStore();
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadTasks();
  }, [statusFilter, typeFilter, page]);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.list({
        page,
        limit,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setTasks(response.data);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载任务失败";
      setError(message);
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await taskService.delete(id);
      loadTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除任务失败";
      setError(message);
      console.error("Failed to delete task:", err);
    }
  }

  const activeTasks = tasks.filter(
    (t) => t.status === "processing" || t.status === "pending",
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const failedTasks = tasks.filter(
    (t) => t.status === "failed" || t.status === "paused",
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">任务队列</h1>
          <p className="text-text-secondary text-sm mt-1">
            共 {total} 个任务 · {activeTasks.length} 个进行中
          </p>
        </div>
        <button onClick={loadTasks} className="btn-secondary">
          刷新
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* 状态筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">状态:</span>
          <div className="flex gap-1">
            {[
              { value: "", label: "全部" },
              { value: "pending", label: "等待中" },
              { value: "processing", label: "生成中" },
              { value: "completed", label: "已完成" },
              { value: "failed", label: "失败" },
              { value: "paused", label: "已暂停" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter(option.value as StatusFilter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  statusFilter === option.value
                    ? "bg-accent-primary text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">类型:</span>
          <div className="flex gap-1">
            {[
              { value: "", label: "全部" },
              { value: "image", label: "🖼️ 图片" },
              { value: "video", label: "🎬 视频" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTypeFilter(option.value as TypeFilter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  typeFilter === option.value
                    ? "bg-accent-primary text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">加载中...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-text-secondary">
            {statusFilter || typeFilter ? "没有找到匹配的任务" : "暂无任务"}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {statusFilter || typeFilter
              ? "尝试调整筛选条件"
              : "去创作工作台创建新任务"}
          </p>
        </div>
      ) : (
        <>
          {/* 任务列表 */}
          {!statusFilter && !typeFilter ? (
            // 按状态分组显示
            <div className="space-y-6">
              {activeTasks.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 text-accent-primary">
                    进行中
                  </h2>
                  <div className="space-y-3">
                    {activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}

              {completedTasks.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 text-text-secondary">
                    已完成
                  </h2>
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}

              {failedTasks.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 text-accent-secondary">
                    失败/暂停
                  </h2>
                  <div className="space-y-3">
                    {failedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={loadTasks}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            // 筛选后平铺显示
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={loadTasks}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:text-text-primary transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-text-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:text-text-primary transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
