# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-10-22

天学网英语教学 APP 首个公开发布版本 / First public release.

### Added · 新增

- **完整的双语站点**：首页、产品体系、应用案例、新闻动态、品牌故事、资质与荣誉、团队、招聘、联系、
  隐私政策、服务条款、产品边界，共 16 条前台路由；英文站与中文站一一对应。
- **11 类内容的后台管理系统**：新闻资讯、应用案例、产品体系、自定义页面、招聘职位、团队与角色、
  一线反馈、首页幻灯片、合作与背书、发展历程、导航菜单；列表、筛选、编辑、排序、上下架、
  预览与删除全流程可用。
- **运营模块**：客户留言（状态与来源追踪）、媒体库（上传、复用、删除）、GEO / SEO 状态与重新生成。
- **系统模块**：站点设置六组（基础、联系、SEO、首页、社交、系统）、管理员账号与登录审计。
- **GEO 引擎**：每页单块 `@graph` JSON-LD（首个节点固定 `WebPage`，`name` 与 `<title>` 逐字一致）、
  `sitemap.xml`、`robots.txt`、`llms.txt` / `llms-full.txt`（中英各一份），运行时动态生成并落盘副本。
- **双数据库驱动**：SQLite（`node:sqlite`，零运维）与 MySQL（mysql2），SQL 语义一致，可一键迁移。
- **安全基线**：CSP / HSTS / X-Frame-Options、CSRF token、表单蜜罐、IP 限流、bcrypt 密码、
  会话存库 + 签名 Cookie、SVG 净化与响应级沙箱、上传文件魔数校验。
- **子目录部署支持**：`X-Forwarded-Prefix` 与 `HZ_BASE_PATH`，nginx 前缀无需改代码。
- **纯静态导出**：`npm run static:export`，适合无表单场景的托管。
- **种子内容**：15 篇带出处的双语新闻稿、6 个应用案例、4 类产品、7 条发展历程、6 位团队角色、
  6 条一线反馈、16 家合作与媒体、4 个招聘职位、7 个单页。
- **开源配套**：README（中英）、MIT LICENSE、CONTRIBUTING、SECURITY、DISCLAIMER、CHANGELOG、
  Dockerfile、docker-compose、GitHub Actions CI、Issue / PR 模板、`examples/` 结构化数据样例、
  `tests/` 内容完整性测试。

### Changed · 变更

- 视觉系统整体重做：深海军蓝 `#0C1B2A` + 暖纸白 `#FBF9F5` + 黄铜 `#A87B3F`，衬线字体仅用于
  数字与引文；全部页面模板按英语教学的专业调性重新排版。
- 品牌信息全面替换为天学网（up366.com），含站点设置、结构化数据、`llms.txt` 文案、页脚与备案信息。
- 后台配色与前台统一为一套色板，去掉原先的绿色主题。
- 数据指标（覆盖学校数、评测调用量、批改时长、服务师生数）改为双语字段，中英文站各自显示。
- README（中英）新增「产品体系」主干章节：三根支柱、四条产品线（听说评测、写作批改、教学平台、
  听力词汇单词批改）、八项能力、场景矩阵、教学闭环、效果与规模、合规与资质，所有数字标注口径；
  对应的部署章节压缩为「装依赖 → 跑安装 → 起进程」三步，细节移交 `docs/quickstart.md`。

### Fixed · 修复

- `Organization.foundingDate` 不再硬编码年份：后台留空即不输出，避免非法 Schema 值。
- `WebPage.datePublished` 改为按站点起始时间动态取值，不再固定为某一天。
- 文章栏目的「创始人观点」补入后台选项与结构化数据映射，此前会显示原始英文键名。
- 法务页正文里重复出现「最后更新」的问题，改为只在正文中保留一处。
- 产品列表页序号在浅色封面图上不可见的问题，改为带底色的角标。
- 深色侧栏卡片中的主按钮与背景同色导致按钮不可见，改为黄铜色。
- **HTML 实体被双重转义**：模板同时用了 `<%= %>` 自动转义与 `e()` 手动转义，导致正文里的 `&`
  在页面上显示成 `&amp;`（英文站 42 个页面受影响）。改为只由模板引擎转义，`e()` 的 305 处
  冗余包裹已全部去掉。
- **作者署名不随语言切换**：`author` 字段原为非双语，英文站文章页显示「天学网品牌中心」。
  改为 `author_cn` / `author_en` 双语字段，15 篇新闻补齐英文署名。
- `docs/en/README.md` 的相对链接全部指向错误层级，GitHub 上点开 404，已修正。
- `scripts/smoke.js` 断言线上域名却请求本机实例，本地跑会把 `www.up366.com` 的真实响应当成
  被测页面（招聘详情页一律误报）。改为请求走 `BASE`、断言仍比对线上地址。
- 后台「一线反馈」的应用产品字段示例仍写着旧行业文案，改为英语教学示例。
- `package.json` 的 `engines` 声明为 Node ≥20.10，与 `node:sqlite` 的实际要求不符，改为 ≥22.5。

### Tests · 测试

- 新增 `npm run test:content` 的双语成对检查：内容类型里所有 `bilingual` 字段，种子每一行必须
  中英都有，只填中文会被判失败（此前英文站会静默回退中文，页面不报错但内容错了）。
- 设置项的双语检查改为由 `settings_schema.json` 驱动，不再硬编码字段名。
- 新增 `.github/workflows/ci.yml`：内容检查 → 装库起服务跑全量回归 → 构建镜像验健康检查。

---

## 版本约定 · Versioning notes

- **主版本**：前台路由、内容字段或数据库结构发生不兼容变更。
- **次版本**：新增内容类型、页面板块或可选能力，旧数据无需迁移。
- **修订版本**：样式、文案、修复，不涉及数据结构。

升级前请备份 `data/` 与 `storage/uploads/`。
