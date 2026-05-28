import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../services/taskService";
import { useTaskStore } from "../stores/taskStore";

export default function CreatorPage() {
  const navigate = useNavigate();
  const { addTask } = useTaskStore();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [style, setStyle] = useState("realistic");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!prompt.trim()) return;

    setIsCreating(true);
    try {
      const task = await taskService.create({
        type,
        prompt: prompt.trim(),
        parameters: { style },
      });
      addTask(task);
      setPrompt("");
      navigate("/tasks");
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">创作工作台</h1>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">类型</label>
          <div className="flex gap-4">
            <button
              onClick={() => setType("image")}
              className={`flex-1 py-3 rounded-lg border transition-colors ${
                type === "image"
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-white/10 text-text-secondary hover:border-white/20"
              }`}
            >
              🖼️ 图片
            </button>
            <button
              onClick={() => setType("video")}
              className={`flex-1 py-3 rounded-lg border transition-colors ${
                type === "video"
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-white/10 text-text-secondary hover:border-white/20"
              }`}
            >
              🎬 视频
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">提示词</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要创作的内容..."
            className="input w-full h-32 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">风格</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="input w-full"
          >
            <option value="realistic">写实</option>
            <option value="anime">动漫</option>
            <option value="cartoon">卡通</option>
            <option value="artistic">艺术</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={!prompt.trim() || isCreating}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "创建中..." : "开始创作"}
        </button>
      </div>
    </div>
  );
}
