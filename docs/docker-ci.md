# Docker 自动构建与发布

工作流：`.github/workflows/docker-publish.yml`（Actions 页面名称为 **Docker build and publish**）。使用现有 `Dockerfile`，在 GitHub 托管的 Ubuntu runner 上构建 `linux/amd64` 镜像，不会在生产服务器安装依赖、构建镜像或重启服务。

## 触发与发布规则

| 事件 | 行为 |
| --- | --- |
| 推送到 `ci/docker-publish` | 仅构建验证，绝不推送镜像 |
| 面向 `master` 的 Pull Request | 仅构建验证，绝不登录 Docker Hub 或推送镜像 |
| 推送到 `master`（当前默认分支） | 构建；存在非空 `DOCKERHUB_TOKEN` 时才登录并发布 |
| Actions 页面手动运行 | 构建；仅选择仓库默认分支且存在非空 Token 时发布 |

发布目标固定为 Docker Hub 的 **`1596944197/2fa-app`**，登录用户名固定为 **`1596944197`**。成功发布时更新以下两个标签：

- `1596944197/2fa-app:latest`
- `1596944197/2fa-app:sha-<完整提交 SHA>`

不发布 PR 标签、功能分支标签或版本标签。功能分支与 PR 即使有凭据，也只构建；构建日志中生成的标签不代表已推送。PR 的构建提交可能是 GitHub 生成的合并提交，与分支头 SHA 不同。

未配置或配置为空的 `DOCKERHUB_TOKEN` 会产生明确的 `warning`，跳过登录和推送，但仍完整执行 Docker 构建。只要代码及镜像构建成功，工作流仍可成功结束。**这只能证明构建通过，不能证明镜像已发布。** Token 非空但无效或没有写权限时，登录或发布会失败，不会将真实发布错误隐藏成成功。

## 合并后启用发布（凭据可以稍后配置）

1. 先检查本 PR 的实际 Actions 构建结果，再由维护者决定合并到 `master`。工作流不会自动合并 PR。
2. 登录 Docker Hub 的 `1596944197` 账户，确认拥有 `1596944197/2fa-app` 仓库写入权限，创建具有 **Read & Write** 权限的 Access Token。不要使用只有读取权限的 Token。
3. 打开 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret**。
4. Secret 名称必须为 **`DOCKERHUB_TOKEN`**，值为上述 Docker Hub Token。不需要额外配置用户名 Secret。不要将 Token 写进源码、工作流、Issue 或聊天记录。
5. 合并后，向 `master` 推送新提交即可自动构建并发布。若先合并、次日再配置凭据，之前的运行不会自动重新执行；配置后在 **Actions → Docker build and publish → Run workflow** 中选择 `master` 手动触发即可，也可以等待下一次 `master` 推送。手动入口通常需工作流已经存在于默认分支才会显示。
6. 查看运行详情：登录和构建步骤应成功，最后的摘要应为 **Docker build and push succeeded**；再到 Docker Hub 核对 `latest` 和本次提交的 `sha-...` 标签及摘要。仅有绿色的 build-only 运行不足以确认发布。

本次功能分支验证不需要也不会创建或修改 Secret；在未合并且未提供凭据之前，不能声称已经验证真实 Docker Hub 推送。

## 缓存、安全与排查

- 使用 Buildx 和 GitHub Actions `gha` 缓存，缓存范围为 `2fa-next-amd64`。PR 的缓存受到 GitHub 的分支访问限制，缓存未命中时会正常重新构建。
- 第三方 Action 均固定到已核验的完整提交 SHA；工作流仅声明 `contents: read` 权限，不使用 `pull_request_target`。
- 每次运行最长 30 分钟；相同工作流、事件和 ref 的新运行会取消旧运行，push 与 PR 验证互不取消。
- 缺少凭据：确认日志有警告、登录被跳过、构建仍然执行。
- 构建失败：查看 **Build image (push only when allowed)** 日志，定位 `bun install --frozen-lockfile`、Next.js 编译或 Docker 阶段错误。不要用跳过编译或忽略真实错误的方式获得绿色状态。
- 发布失败：核对 Secret 名称、Token 有效期、Docker Hub 账户和镜像仓库写入权限；不要将凭据打印到日志。
- 该工作流不自动部署、不修改 Compose、不拉取镜像或重启线上容器。镜像发布后的服务更新仍由维护者另行安排。
