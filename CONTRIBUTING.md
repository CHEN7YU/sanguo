# 协作开发说明

## 每次开始前
1. 在 GitHub Desktop 点击 **Fetch origin**；如果出现 **Pull origin**，先拉取。
2. 从 `main` 新建自己的分支。分支名建议：`fanduanyang/功能名` 或 `pandaking/功能名`。
3. 每个分支只完成一个明确任务，避免两个人同时修改同一大段代码。

## 完成任务后
1. 在 GitHub Desktop 检查 **Changes**，不要提交 `site-test`、发布压缩包、缓存或备份。
2. 写清楚 Summary，例如：`修复巨鹿关回合结束`。
3. 点击 **Commit to 当前分支**，再点 **Push origin**。
4. 在 GitHub 创建 Pull Request，由另一人检查后合并到 `main`。

## 大文件
- `assets/audio`、`assets/video` 和 `assets-master` 由 Git LFS 管理。
- 网页运行所需压缩资源保留在 `assets`；高清母版保留在 `assets-master`。
- 发布目录、历史压缩包和临时测试站不进入仓库。

## 运行
双击 `启动试玩.bat`，或运行 `node server.mjs`，然后打开 http://127.0.0.1:4173。
