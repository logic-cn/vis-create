import { useState } from "react";

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [videoKey, setVideoKey] = useState("");
  const [outputDir, setOutputDir] = useState("./output");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      // TODO: 调用设置API保存配置
      console.log("Saving settings...");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">API配置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Video API Key</label>
              <input
                type="password"
                value={videoKey}
                onChange={(e) => setVideoKey(e.target.value)}
                placeholder="输入视频生成API密钥"
                className="input w-full"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold mb-4">通用设置</h2>
          <div>
            <label className="block text-sm font-medium mb-2">输出目录</label>
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              className="input w-full"
            />
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary w-full"
        >
          {isSaving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}
