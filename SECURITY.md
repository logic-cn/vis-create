# 安全策略 / Security Policy

VisCreate 是一个本地优先（local-first）的 AI 视觉创作桌面应用。后端 FastAPI 服务默认只监听本机，但这并不意味着可以忽略安全边界：桌面端前端、浏览器页面与本机服务之间存在跨域与密钥泄露风险。

VisCreate is a local-first AI visual creation desktop app. The FastAPI backend is meant to run on your own machine, but it still has a security boundary: any web page open in the same browser can try to reach it, and API keys must never leave the backend in plaintext.

## 支持版本 / Supported Versions

| 版本 / Version | 安全更新 / Security Updates |
| --- | --- |
| 0.1.x（当前 / current） | ✅ 支持 / Supported |
| < 0.1 | ❌ 不支持 / Not supported |

该项目仍处于 Alpha 阶段，只对最新发布版本提供安全修复。请及时升级。
The project is in Alpha; security fixes are only provided for the latest release. Please stay up to date.

## 报告漏洞 / Reporting a Vulnerability

**请不要在公开 Issue 中披露漏洞细节。**
**Please do not open a public issue for security vulnerabilities.**

推荐流程 / Recommended process:

1. 使用 GitHub 的私密漏洞报告（Repository → Security → Advisories → "Report a vulnerability"）。
   Use GitHub's private vulnerability reporting (Repository → Security → Advisories → "Report a vulnerability").
2. 若无法使用该渠道，请发邮件给维护者（见仓库提交历史中的维护者联系方式），邮件标题以 `[SECURITY]` 开头。
   If unavailable, email the maintainers (see commit history) with a subject starting with `[SECURITY]`.
3. 请提供：受影响版本、复现步骤、影响范围、可能的修复建议。可附 PoC，但请勿包含真实密钥。
   Include: affected version, reproduction steps, impact, and any suggested fix. A PoC is welcome, but never include real credentials.

我们会在 7 个工作日内确认收到，并在修复发布后致谢（如你希望署名）。
We aim to acknowledge reports within 7 business days and will credit reporters after a fix ships (if desired).

## 密钥管理 / Secret Management

- 所有密钥通过仓库根目录的 `.env` 管理，`.env` 已被 `.gitignore` 忽略，**永远不要提交**。
  All secrets live in `.env` at the repository root. `.env` is git-ignored — **never commit it**.
- 参考 `.env.example` 创建本地配置；其中的值全部是占位符。
  Copy `.env.example` to `.env` and fill in your own values; every value in the example is a placeholder.
- 提交前可运行 `git status` 与 `git diff --staged` 自查，确认没有密钥进入暂存区。
  Before committing, check `git status` and `git diff --staged` to make sure no secret is staged.
- 如果曾经误提交密钥：立即在服务商处吊销并轮换，而不是只从代码中删除（历史仍可访问）。
  If a key was ever committed by mistake, revoke and rotate it at the provider immediately — deleting it from code is not enough, since git history remains readable.
- API 返回的密钥一律脱敏（形如 `••••1a2b`）；前端把脱敏占位值回传时，后端会保留数据库中的原值。
  API responses mask secrets (e.g. `••••1a2b`). When the client submits a masked placeholder back, the backend keeps the stored value unchanged.

## 攻击面说明 / Attack Surface

- **本地服务 / Local service**：后端默认运行在 `127.0.0.1:8000`，仅本机可达。请勿将其暴露到公网；如需局域网访问，请自行加反向代理与鉴权。
  The backend runs on `127.0.0.1:8000` and is reachable from the local machine only. Never expose it to the public internet; add a reverse proxy and authentication if you need LAN access.
- **CORS**：默认仅允许本地前端来源（`http://localhost:1420`、`http://127.0.0.1:1420`、`tauri://localhost`、`http://tauri.localhost`）。可通过 `CORS_ALLOW_ORIGINS`（逗号分隔）覆盖，但不允许配置为 `*`。
  CORS only allows the local frontend origins by default. Override with `CORS_ALLOW_ORIGINS` (comma-separated); `*` is rejected.
- **桌面 WebView / Desktop WebView**：Tauri 配置了 CSP，限制脚本、连接与资源来源，降低 XSS 与数据外带风险。`img-src` / `media-src` 放行回环地址的**任意端口**（`http://localhost:*`、`http://127.0.0.1:*`），因为本地对象存储（MinIO，默认 `127.0.0.1:9000`）的端口可由用户配置；这不放行任何外网来源。**若你把 `MINIO_ENDPOINT` 指向非回环地址，必须同步把该主机加入 `gui/src-tauri/tauri.conf.json` 的 `img-src` 与 `media-src`**，否则图片会被 CSP 拦截。
  The Tauri app ships a Content Security Policy restricting scripts, connections and resource origins, reducing XSS and data-exfiltration risk. `img-src` / `media-src` allow the loopback interface on **any port** (`http://localhost:*`, `http://127.0.0.1:*`) because the local object store (MinIO, default `127.0.0.1:9000`) is user-configurable; no external origin is allowed. **If you point `MINIO_ENDPOINT` at a non-loopback host, add that host to `img-src` and `media-src` in `gui/src-tauri/tauri.conf.json`**, otherwise images will be blocked.
- **无鉴权 / No authentication**：当前本地 API 没有鉴权，任何能以你的用户身份访问本机端口的进程都可调用。请仅在可信环境下运行。
  The local API currently has no authentication. Any process that can reach the port as your user can call it — run it only in a trusted environment.
- **生成内容 / Generated content**：图片与视频输出到 `./output`，并通过 `/static/outputs` 提供访问；不要在该目录放置私人文件。
  Generated images/videos go to `./output` and are served via `/static/outputs`; do not put private files there.

## 加固建议 / Hardening Checklist

- [ ] 保持后端绑定 `127.0.0.1`，不要改成 `0.0.0.0`。
- [ ] 使用最小权限的 API Key，并定期轮换。
- [ ] 及时升级依赖（`uv pip install -e ".[dev]"` 后跑测试）。
- [ ] 生产/共享环境务必在网络层或代理层增加鉴权与 TLS。
