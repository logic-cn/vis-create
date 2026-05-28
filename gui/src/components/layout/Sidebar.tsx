import { NavLink } from "react-router-dom";
import { useArtworkStore } from "../../stores/artworkStore";

const navItems = [
  { path: "/", label: "作品画廊", icon: "🖼️" },
  { path: "/create", label: "创作工作台", icon: "✨" },
  { path: "/tasks", label: "任务队列", icon: "📋" },
  { path: "/settings", label: "设置", icon: "⚙️" },
];

export default function Sidebar() {
  const { favorites } = useArtworkStore();

  return (
    <aside className="w-60 bg-bg-secondary border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-accent-primary">VisCreate</h1>
        <p className="text-xs text-text-muted mt-1">AI视觉创作Agent</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">
          收藏库
        </h3>
        <p className="text-sm text-text-secondary">
          {favorites.length} 个收藏作品
        </p>
      </div>
    </aside>
  );
}
