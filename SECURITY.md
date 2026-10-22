# 安全策略 · Security Policy

## 支持范围 · Supported versions

| 版本 | 安全更新 |
| --- | --- |
| 1.x（当前） | ✅ 支持 |
| < 1.0 | ❌ 不支持 |

## 报告漏洞 · Reporting a vulnerability

**请不要开公开 Issue。** 公开披露会让所有部署实例在补丁可用前暴露。

优先使用 GitHub 的私密报告通道：

1. 打开仓库 **Security** 标签页 → **Report a vulnerability**（GitHub Security Advisories）。
2. 或使用 **Private vulnerability reporting**；若未开启，请通过仓库 Issue 里提供的维护者联系方式约一个
   私密渠道，不要在 Issue 正文里写漏洞细节。

报告请包含：

- 受影响的版本 / 提交号
- 复现步骤或 PoC（可运行的最小样例）
- 影响评估（能读到什么、能改到什么、是否需要登录）
- 你希望的署名方式（或不署名）

## 响应时间 · What to expect

| 阶段 | 目标 |
| --- | --- |
| 确认收到 | 3 个工作日内 |
| 初步定级与影响面 | 7 个工作日内 |
| 修复与补丁版本 | 视严重程度，高危 30 天内 |
| 公开致谢 | 补丁发布后，经你同意 |

## 已知的设计取舍 · Known design trade-offs

这些不是漏洞，是有意为之，报告前请先确认：

1. **语言只由 URL 前缀决定**，不读 `Accept-Language`。这是为了 GEO/SEO 正确性，不是缺陷。
2. **英文站缺翻译时回退中文**。内容未翻译时会显示另一语言，属于预期行为。
3. **静态导出模式不含表单与后台**。`npm run static:export` 的产物没有服务端校验，留言功能不可用。
4. **`HZ_DEBUG=1` 会在 500 页面输出堆栈**。生产环境必须关闭，这是运维配置而非代码缺陷。

## 部署方必须做的事 · Deployment checklist

本项目默认从严，但仍需要部署方配合：

- [ ] 用 `NODE_ENV=production` 启动，确认 `HZ_DEBUG` 未开启。
- [ ] 用 `npm run passwd` 把默认管理员 `admin` 改成不易猜测的用户名与强密码。
- [ ] 配置 HTTPS，并让反向代理传递 `X-Forwarded-Proto`。
- [ ] 定期备份 `data/`（数据库）与 `storage/uploads/`（上传文件）。
- [ ] 不要把 `data/app.sqlite` 放在 Web 可直接访问的目录。
- [ ] 若启用邮件通知，为 SMTP 使用专用账号与应用密码，不要用主邮箱密码。
- [ ] 升级依赖后重跑 `npm run test:security`。

## 安全基线（代码里已实现）

- **输出转义**：模板统一走 `e()`，富文本走 `rich()` 白名单净化。
- **CSRF**：所有写操作校验 `_token`，与会话绑定。
- **表单防护**：隐藏蜜罐字段静默丢弃机器人；按 IP 时间窗限流；提交内容 `strip_tags` + 码点截断。
- **密码**：bcrypt 哈希，登录失败计入审计日志。
- **会话**：会话数据存库，Cookie 签名且 `HttpOnly` / `SameSite`。
- **上传**：扩展名白名单 + 文件头魔数校验；SVG 剥离脚本、事件属性与外部引用，并以响应级
  `Content-Security-Policy: sandbox` 输出。
- **响应头**：CSP、HSTS、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`。
- **SQL**：全部参数化绑定，模板层不拼 SQL。

---

## Security Policy (English)

### Supported versions

| Version | Security updates |
| --- | --- |
| 1.x (current) | ✅ Supported |
| < 1.0 | ❌ Not supported |

### Reporting a vulnerability

**Please do not open a public issue.** Public disclosure exposes every deployment before a patch exists.

Use GitHub's private channel: the repository **Security** tab → **Report a vulnerability**
(GitHub Security Advisories). If private reporting is unavailable, ask the maintainers listed in the repository
for a private channel first — do not put vulnerability details in an issue body.

Please include the affected version or commit, reproduction steps or a minimal PoC, an impact assessment
(what can be read or changed, whether authentication is required), and how you would like to be credited.

### What to expect

Acknowledgement within 3 working days, initial triage within 7, a fix according to severity (high severity
within 30 days), and public credit after release if you agree.

### Known design trade-offs

These are intentional, not vulnerabilities:

1. Language is determined by URL prefix only; `Accept-Language` is deliberately ignored for GEO/SEO correctness.
2. The English site falls back to Chinese when a translation is missing.
3. Static export (`npm run static:export`) contains no server-side validation and no enquiry form.
4. `HZ_DEBUG=1` prints stack traces on the 500 page. It must be off in production; that is an operations setting,
   not a code defect.

### Deployment checklist

- [ ] Run with `NODE_ENV=production` and `HZ_DEBUG` disabled.
- [ ] Change the default `admin` account to a non-obvious username and a strong password (`npm run passwd`).
- [ ] Terminate HTTPS and forward `X-Forwarded-Proto`.
- [ ] Back up `data/` and `storage/uploads/` on a schedule.
- [ ] Keep `data/app.sqlite` outside any web-served directory.
- [ ] Use a dedicated SMTP account and app password for notifications.
- [ ] Re-run `npm run test:security` after dependency upgrades.

### Baseline already implemented

Escaped output via `e()` and whitelist-sanitised rich text; CSRF tokens on every write; honeypot plus IP rate
limiting on forms; bcrypt password hashing with an audit log; database-backed sessions with signed, `HttpOnly`,
`SameSite` cookies; upload extension whitelist with magic-byte checking, SVG sanitising and a response-level
sandbox CSP; CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy` headers; fully
parameterised SQL.
