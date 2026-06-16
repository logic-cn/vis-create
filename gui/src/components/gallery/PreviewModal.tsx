import { useEffect, useRef, useMemo } from "react";
import type { Artwork } from "../../types/artwork";
import {
  STYLE_OPTIONS,
  PHOTOGRAPHY_GROUPS,
  POST_PRODUCTION_GROUPS,
  DIRECTOR_GROUPS,
  SUBJECT_GROUPS,
  ENVIRONMENT_GROUPS,
} from "../../constants/creation-options";

// 构建全局 label 查找表：{ "group.option": "中文标签" }
const ALL_GROUPS = [
  ...PHOTOGRAPHY_GROUPS,
  ...POST_PRODUCTION_GROUPS,
  ...DIRECTOR_GROUPS,
  ...SUBJECT_GROUPS,
  ...ENVIRONMENT_GROUPS,
];

const PARAM_LABELS: Record<string, string> = {};
for (const group of ALL_GROUPS) {
  for (const opt of group.options) {
    PARAM_LABELS[`${group.id}.${opt.id}`] = `${group.label}：${opt.label}`;
  }
}

const STYLE_MAP = Object.fromEntries(
  STYLE_OPTIONS.map((o) => [o.id, `${o.emoji} ${o.label}`]),
);

const SIZE_LABELS: Record<string, string> = {
  "1:1": "正方形 1:1",
  "4:3": "标准横屏 4:3",
  "3:4": "标准竖屏 3:4",
  "16:9": "宽屏横屏 16:9",
  "9:16": "竖屏 9:16",
  "3:2": "摄影横屏 3:2",
  "2:3": "摄影竖屏 2:3",
  "21:9": "超宽电影 21:9",
};

const PARAM_CATEGORY_LABELS: Record<string, string> = {
  photography: "摄影师",
  postProduction: "后期",
  director: "导演",
  subject: "主体",
  environment: "环境",
};

interface PreviewModalProps {
  artwork: Artwork | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function PreviewModal({
  artwork,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: PreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!artwork) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext && onNext) onNext();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [artwork, onClose, onPrev, onNext, hasPrev, hasNext]);

  const paramTags = useMemo(() => {
    if (!artwork?.parameters) return [];
    const params = artwork.parameters as Record<string, unknown>;
    const tags: { emoji: string; label: string }[] = [];

    // 遍历参数分类
    for (const [catKey, catLabel] of Object.entries(PARAM_CATEGORY_LABELS)) {
      const group = params[catKey] as Record<string, string> | undefined;
      if (!group || typeof group !== "object") continue;
      for (const [groupId, optionId] of Object.entries(group)) {
        if (!optionId) continue;
        const key = `${groupId}.${optionId}`;
        const fullLabel = PARAM_LABELS[key];
        if (fullLabel) {
          const opt = ALL_GROUPS.find((g) => g.id === groupId)?.options.find(
            (o) => o.id === optionId,
          );
          tags.push({
            emoji: opt?.emoji ?? "",
            label: fullLabel,
          });
        }
      }
    }

    return tags;
  }, [artwork]);

  if (!artwork) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const styleLabel = STYLE_MAP[artwork.style ?? ""] ?? artwork.style ?? "";
  const params = (artwork.parameters ?? {}) as Record<string, unknown>;
  const sizeLabel =
    SIZE_LABELS[params.size as string] ?? (params.size as string) ?? "";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {hasPrev && onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div
        className="relative z-10 flex flex-col lg:flex-row items-center gap-8 max-w-[90vw] max-h-[90vh]"
        style={{ animation: "previewEnter 0.3s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Media */}
        <div className="relative flex-shrink-0 max-w-[70vw] max-h-[80vh]">
          {artwork.type === "video" ? (
            <video
              src={artwork.file_path}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl shadow-black/50"
            />
          ) : (
            <img
              src={artwork.file_path}
              alt={artwork.title}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl shadow-black/50 object-contain"
            />
          )}
        </div>

        {/* Info panel */}
        <div className="flex-shrink-0 w-full lg:w-80 max-h-[80vh] overflow-y-auto space-y-5">
          {/* 标题 + 风格 */}
          <div>
            <h2 className="text-lg font-semibold text-white leading-snug">
              {artwork.title}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {styleLabel && (
                <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium border border-accent-primary/20">
                  {styleLabel}
                </span>
              )}
              {sizeLabel && (
                <span className="px-2.5 py-1 rounded-full bg-accent-tertiary/10 text-accent-tertiary text-xs font-medium border border-accent-tertiary/20">
                  {sizeLabel}
                </span>
              )}
            </div>
          </div>

          {/* 提示词 */}
          <div>
            <div className="text-text-muted text-xs mb-1">提示词</div>
            <div className="text-text-secondary text-sm leading-relaxed">
              {artwork.prompt}
            </div>
          </div>

          {/* 创作参数标签 */}
          {paramTags.length > 0 && (
            <div>
              <div className="text-text-muted text-xs mb-2">创作参数</div>
              <div className="flex flex-wrap gap-1.5">
                {paramTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-white/[0.04] text-text-secondary text-xs border border-white/[0.06] flex items-center gap-1"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 元信息 */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <InfoRow
              label="类型"
              value={artwork.type === "video" ? "视频" : "图片"}
            />
            <InfoRow
              label="创建时间"
              value={new Date(artwork.created_at).toLocaleString("zh-CN")}
            />
          </div>

          {/* 标签 */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {artwork.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-white/5 text-text-muted text-xs border border-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-text-muted text-xs flex-shrink-0 w-14 text-right">
        {label}
      </span>
      <span className="text-text-secondary text-sm">{value}</span>
    </div>
  );
}
