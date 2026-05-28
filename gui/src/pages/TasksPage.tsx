import { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { taskService } from "../services/taskService";
import TaskCard from "../components/tasks/TaskCard";

export default function TasksPage() {
  const { tasks, isLoading, setTasks, setLoading } = useTaskStore();

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await taskService.list();
      setTasks(response.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeTasks = tasks.filter(
    (t) => t.status === "processing" || t.status === "pending"
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const failedTasks = tasks.filter(
    (t) => t.status === "failed" || t.status === "paused"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">任务队列</h1>
          <p className="text-text-secondary text-sm mt-1">
            {activeTasks.length} 个进行中 · {completedTasks.length} 个已完成
          </p>
        </div>
        <button onClick={loadTasks} className="btn-secondary">
          刷新
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">加载中...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-text-secondary">暂无任务</p>
          <p className="text-text-muted text-sm mt-1">去创作工作台创建新任务</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTasks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-accent-primary">
                进行中
              </h2>
              <div className="space-y-3">
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
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
                  <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
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
                  <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
