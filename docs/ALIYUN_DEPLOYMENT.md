# 阿里云独立部署：Node.js + SQLite

## 当前范围

此方案面向一台 Linux ECS 或轻量服务器：Nginx 提供 HTTPS 和 `dist` 静态文件，Node.js 提供同源 `/api/*`，SQLite 保存账号、会话、云存档、历史和统计。不需要 Cloudflare 网络、Workers 或 D1；服务端复用 `worker/` 中的业务代码，该目录名不代表运行时依赖 Cloudflare。

这是可本地验证的服务器适配和部署模板，**不是已经创建或发布到阿里云**。需要准备服务器、SSH 部署权限、域名及 HTTPS 证书；中国大陆节点还需确认备案及适用的游戏合规要求。原独立排行榜未包含在迁移范围内，不能据此宣称全服排行榜已恢复。

使用官方 Node.js 24 LTS（24.0.0及以上，含 `node:sqlite`），单实例运行。初期不做多台服务器共享 SQLite，也不将数据库放在 NFS、GitHub 或网页目录中。Node 的 SQLite 接口在部分版本仍有实验性提示，升级运行时前须执行回归。`server.mjs` 仍只是旧的本地静态试玩入口；生产账号服务用 `server/app.mjs`。

## 文件与配置

| 路径 | 用途 |
|---|---|
| `/opt/sanguo/releases/<版本>/` | 各版源码和构建出的 `dist`，不含生产数据或密钥 |
| `/opt/sanguo/current` | 指向当前版本的软链接 |
| `/var/lib/sanguo/accounts.sqlite` | 独立持久数据库；同目录 WAL、SHM 文件由 SQLite 管理 |
| `/var/backups/sanguo/` | 本机一致性备份；仍需加密复制到异机或私有 OSS |
| `/etc/sanguo/server.env` | 服务端配置，权限600；密钥不得放 GitHub、聊天或浏览器 |

由管理员创建专用、无登录权限的 `sanguo` 用户；数据及备份目录属于该用户，目录权限700。源码和程序目录由部署管理员管理，服务用户仅可读。安装 Nginx、官方 Node 24 LTS 和 Git LFS，安全组仅开放必要的 SSH、80及443端口，**不开放4180**。

`server.env` 内容示意（占位符必须替换；此文件不提交）：

```text
AUTH_ORIGIN=https://game.example.com
AUTH_PASSWORD_PEPPER=<至少32字符的独立随机密钥>
DATABASE_PATH=/var/lib/sanguo/accounts.sqlite
ANALYTICS_ENABLED=true
PORT=4180
```

`AUTH_ORIGIN` 必须是浏览器实际使用的完整 HTTPS 源站，不带结尾 `/`。它是配置，不硬编码在账号业务里；更换正式域名时同步修改配置，不能取消来源校验。Node 只监听 `127.0.0.1`，仅接受正确 Host、HTTPS 转发标识及有效客户端 IP；由同机 Nginx 覆盖这些头，客户端不能用伪造 Cloudflare IP 绕过限流。若未来增加 CDN/负载均衡，必须另行配置可信代理来源，不直接信任任意转发头。

全新环境可在服务器上首次生成随机密钥并直接写入受保护的配置文件，之后始终保留。**如果需要迁移旧账号，必须使用原 Pepper，不得生成新值**；否则原密码无法登录。数据库与 Pepper 均须独立备份。用户表示目前尚无人注册，本实现仍未删除旧 D1 或自动重置任何密钥。

## 首次部署

以下命令在 Linux 服务器执行，不是在 Windows PowerShell 中执行：

1. 将批准版本部署到一个新的 `releases/<版本>` 目录；`git lfs pull` 获取真实素材，不能发布 LFS 指针。
2. 在该版本目录运行 `npm ci`，再 `node tools/build-cloudflare.mjs`。沿用经过验证的发布收集器，只生成 `dist`，不调用 Cloudflare API；25 MiB单文件检查继续保留。
3. 确认目录和环境配置后，以服务用户执行明确的建库/迁移命令：

   ```sh
   sudo -u sanguo /usr/bin/node --env-file=/etc/sanguo/server.env server/manage.mjs migrate
   ```

   迁移按编号执行并记录校验值，重复执行不会重建表或清空数据；修改已执行的迁移会报错。已有 D1 SQL 导出不能直接当作全新数据库重复建表，迁移旧库需另做导入核对。
4. 令 `/opt/sanguo/current` 指向该版本。复制 `deploy/aliyun/sanguo.service` 到 `/etc/systemd/system/`，核对 Node 可执行路径。
5. 将 `deploy/aliyun/nginx.conf` 作为站点模板，替换其中所有域名与证书路径。Nginx 的 `root` 只能指向 `dist`，不能指向源码根目录。须配置默认虚拟主机拒绝未知域名。执行 `nginx -t` 成功后再加载。
6. 执行 `systemctl daemon-reload`、`systemctl enable --now sanguo`。启动只验证迁移并清理过期统计去重记录，不自动修改表结构。
7. 核对 `https://实际域名/api/auth/session` 返回200、`providers.password: true`；匿名 `/api/saves` 应返回401。浏览器实测注册、上传、退出、登录、恢复及重启后读档，再开放正式流量。首次访问新域名需要重新登录。

服务故障查看 `journalctl -u sanguo`。不要将密码、Cookie、数据库导出或密钥粘贴到公开日志中。后台汇总 SQL 沿用 `tools/analytics-report.sql`，管理员可通过服务器本地 SQLite 工具只读执行，不新增公共后台查询接口。

## 更新、备份与恢复

**发布程序和更换数据库是两回事。** 每次发布都沿用相同 `DATABASE_PATH` 和 Pepper；`dist` 构建和版本软链接切换不触碰 `/var/lib/sanguo`。

发布前先做在线一致性备份：

```sh
sudo -u sanguo /usr/bin/node --env-file=/etc/sanguo/server.env \
  server/manage.mjs backup /var/backups/sanguo/before-release-唯一版本号.sqlite
```

命令使用 SQLite backup API，不直接复制正在写入的主文件；目标必须为新的绝对路径，已有文件拒绝覆盖。完成后检查完整性和外键，失败会报错，不能把失败命令留下的文件当作有效备份。

每日备份模板是 `sanguo-backup.service` 和 `sanguo-backup.timer`。创建备份目录并安装三个 unit 后，执行 `systemctl daemon-reload`、先 `systemctl start sanguo-backup.service` 确认备份成功，再 `systemctl enable --now sanguo-backup.timer`。定时点为 UTC 03:15；监控任务失败、磁盘空间及备份增长。模板不自动删除历史，不等于已有异地灾备；将成功验证的备份加密复制到限制访问的异机/私有 OSS，并为 Pepper 单独安排安全备份。

更新流程为：备份成功 -> 在新目录构建与回归 -> 若有新迁移，停账号服务、执行显式迁移 -> 切换版本 -> 重启 -> 验证旧账号和云档。迁移失败时不继续发布。不得用“重新建库”排错。旧程序未必兼容新结构，数据库回滚需先保留故障时的数据，再按恢复流程处理。

恢复须停止账号服务，保留当前库及其 WAL/SHM，将**已验证备份恢复到全新数据目录/文件路径**，配置指向恢复文件并保留匹配 Pepper。不要把备份直接覆盖到一个仍有旧 WAL 的文件名。启动前检查迁移兼容性；恢复后核对账号、最新档位、版本和历史，再放流量。恢复旧备份可能丢失备份之后的写入，必须明确说明。

## 切换 Cloudflare

阿里云测试完成前不删除 Cloudflare、D1 或其密钥。真正切流时暂停旧站写入，核对实际是否有账号；若已有数据，先导出和验证迁移，不能仅凭此前“暂无账号”推断仍为空。若正式决定新库起步，应先保留旧库备份。

更换域名后浏览器本地存储不会迁移：游客档、未同步账号进度需从旧站导出，再到新站导入。只复制云数据库不等于已迁移全部游客进度。通过自有域名上线后，未来换云只更换 DNS 和后端配置；别再将供应商临时域名当长期玩家入口。

## 本地验证与未验收项

```powershell
node tools\verify_node_server.mjs
node tools\verify_password_login.mjs
node tools\verify_cloud_saves.mjs
node tools\verify_analytics.mjs
```

Node 服务测试使用临时 SQLite 与真实本机 HTTP，模拟 Nginx 头，覆盖账号、存档/历史、统计、事务回滚、伪造IP限流、重启持久性和备份恢复核对，不接触线上账号。它不替代 Linux Nginx/systemd、阿里云网络、HTTPS证书、真机、完整旧库导入、异机恢复演练或负载验收。SQLite单进程同步访问会阻塞事件循环，不承诺1000人并发。
