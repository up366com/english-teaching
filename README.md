# 天学网英语教学 APP

**up366 · English Teaching & Assessment Platform**

一个完整可运行的双语（中文 / English）英语教学官网与内容管理系统，面向学校、教研组与区域教育主管部门，
用来讲清楚「AI 如何进入英语课堂」这件事：口语怎么评、作文怎么批、学情怎么读、教研怎么改。

[![License: MIT](https://img.shields.io/badge/License-MIT-A87B3F.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522.5-0C1B2A.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/DB-SQLite%20%7C%20MySQL-0C1B2A.svg)](#数据库)
[![Build](https://img.shields.io/badge/build-zero--build-2F6B4F.svg)](#技术选型)

> English README: [README.en.md](README.en.md)

---

## 目录

- [这是什么](#这是什么)
- [它能做什么](#它能做什么)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [后台怎么用](#后台怎么用)
- [双语是怎么实现的](#双语是怎么实现的)
- [GEO / SEO：让大模型读懂你的站点](#geo--seo让大模型读懂你的站点)
- [内容模型：11 类内容，一套代码](#内容模型11-类内容一套代码)
- [技术选型](#技术选型)
- [数据库](#数据库)
- [部署](#部署)
- [测试](#测试)
- [参与贡献](#参与贡献)
- [许可与品牌](#许可与品牌)

---

## 这是什么

天学网（up366.com）做的是英语教学的数字化：口语评测、作文批改、教学平台、听力与词汇训练。
这个仓库把「怎么把这些事讲清楚」变成了可以跑、可以改、可以部署的代码：

- **一套完整的前台**：首页、产品体系、应用案例、新闻动态、品牌故事、资质与荣誉、团队、招聘、联系。
- **一套完整的后台**：11 类内容的增删改查、站点设置、媒体库、留言管理、管理员与审计。
- **一套完整的 GEO 能力**：每页单块 `@graph` JSON-LD、`llms.txt`、`sitemap.xml`、`hreflang`，让搜索引擎和
  生成式引擎（豆包、DeepSeek、千问、Kimi 等）能准确抓取、准确引用。
- **中英文同构**：两种语言不是两份站点，而是同一套数据、同一套模板，字段级双列存储。

代码是干净的：无构建步骤、无前端框架、无 ORM 魔法。下载、安装、启动，三分钟看到完整站点。

## 它能做什么

| 板块 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 首屏轮播、数据指标、三大支柱、四类产品、八项能力矩阵、工作闭环、应用案例、一线反馈等 |
| 产品体系 | `/services` | 四类产品列表 + 每类详情页，含能力清单、适用边界与免责说明 |
| 应用案例 | `/cases` | 分页案例库 + 详情页（应用类型 / 区域 / 覆盖范围 / 上线年份 / 涉及产品 / 图集） |
| 新闻动态 | `/news` | 七类栏目筛选、分页、详情页（出处标注、标签、上下篇、相关阅读） |
| 关于天学网 | `/about` `/brand` `/trust` `/team` | 公司介绍、品牌故事与时间轴、资质与荣誉、团队结构 |
| 加入我们 | `/careers` | 职位列表 + 详情（`JobPosting` 结构化数据） |
| 联系我们 | `/contact` | 联系信息 + 咨询表单（CSRF、蜜罐、限流、入库 + 邮件通知） |
| 条款与政策 | `/privacy` `/terms` `/services-overview` | 隐私政策、服务条款、产品体系与适用边界 |
| 管理后台 | `/admin` | 内容 CRUD、站点设置、媒体库、留言、GEO 状态、管理员 |
| 英文站点 | `/en` 及 `/en/*` | 与中文一一对应的完整英文版本 |

## 快速开始

### 环境要求

- **Node.js ≥ 22.5**（需要内置的 `node:sqlite`；用 MySQL 时可放宽到 18+）
- 无需构建工具、无需 npm 之外的全局依赖

### 三步启动

```bash
# 1. 安装依赖
npm install

# 2. 建库 + 灌入中英双语初始内容 + 创建管理员 + 生成 GEO 文件
npm run site:install -- --domain=https://www.up366.com --admin=admin --pass=你的密码

# 3. 启动
npm start          # 默认 http://localhost:3000
```

打开 `http://localhost:3000` 看中文站，`http://localhost:3000/en` 看英文站，
`http://localhost:3000/admin` 进后台。

> 安装时不给 `--pass` 会自动生成一个 16 位随机密码并打印在终端，请立刻保存。
> 忘记密码用 `npm run passwd` 重置。

### 常用命令

```bash
npm start                 # 生产模式启动
npm run dev               # 开发模式（--watch 自动重启）
npm run site:install      # 安装 / 重新灌种子（--fresh 可清空重建）
npm run site:check        # 环境与目录自检
npm run passwd            # 重置管理员密码
npm run static:export     # 导出纯静态站点到 storage/static
npm run migrate:mysql     # SQLite → MySQL 数据迁移
npm test                  # 冒烟测试（路由 / 页面 / 关键输出）
npm run test:admin        # 后台登录与权限
npm run test:crud         # 内容 CRUD
npm run test:security     # CSRF / 蜜罐 / 限流 / XSS
npm run test:deploy       # 子目录部署前缀
npm run test:content      # 内容完整性（双语字段、栏目、出处、占位符）
```

### Docker 一键跑

```bash
docker compose up -d --build
# 首次启动会自动安装；默认 http://localhost:8080
```

## 目录结构

```text
up366/
├── app/                        # 应用装配层
│   ├── config.js               # 端口 / 数据库 / 语言 / 分页 / 安全参数
│   ├── routes.js               # 前台 22 条（16 页 + 6 个生成型文件）+ 后台 29 条路由表
│   ├── helpers.js              # e / url / ml / setting / asset / csrf_field …
│   └── bootstrap.js            # 启动时的一次性装配
├── config/                     # 站点内容与结构定义（可直接改）
│   ├── content_types.json      # 11 类内容的字段、栏目、列表列
│   ├── settings_schema.json    # 后台设置表单结构
│   ├── seed_data.json          # 设置 / 导航 / 轮播 / 产品 / 案例种子
│   └── seed_content.json       # 新闻 / 团队 / 反馈 / 合作 / 历程 / 职位 / 单页种子
├── docs/                       # 文档（中文）
│   ├── README.md               # 文档索引：四条阅读主线
│   ├── quickstart.md           # 从零到跑起来
│   ├── usage.md                # 后台操作与内容维护
│   ├── api.md                  # 路由 / 输出 / 结构化数据接口
│   ├── faq.md                  # 采购、试点、合规、技术常见问题
│   └── en/                     # 文档（英文，与中文一一对应）
├── examples/                   # 可直接抄的 JSON-LD 与 GEO 样例（含说明）
├── install/                    # 安装、建表、种子、GEO 生成、自检
├── scripts/                    # 测试、迁移、导出、改密
├── src/
│   ├── core/                   # ctx / db / lang / settings / seo / repo / view / security …
│   ├── controllers/            # 前台控制器
│   └── admin/                  # 后台控制器与通用 CRUD
├── tests/                      # 内容与结构测试（不启服务也能跑）
├── views/
│   ├── site/                   # 前台模板（layout / partials / 各页面）
│   └── admin/                  # 后台模板
├── assets/                     # css / js / img（无构建，直接引用）
├── .github/
│   ├── workflows/ci.yml        # 内容检查 → 站点回归 → 镜像构建
│   ├── ISSUE_TEMPLATE/         # Bug / 功能建议 / 联系入口
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml          # 依赖每月巡检
│   └── FUNDING.yml             # 赞助入口
├── llms.txt  llms-full.txt     # 生成型 GEO 文件（中英各一份）
├── README.md  README.en.md
├── LICENSE  CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  DISCLAIMER.md
├── Dockerfile  docker-compose.yml  package.json
└── server.js                   # 入口
```

## 后台怎么用

登录 `/admin` 后，左侧是能力清单，从上到下就是日常维护的顺序：

1. **控制台** —— 内容总量、最近发布、最新留言、GEO 状态。
2. **内容管理** —— 新闻资讯、应用案例、产品体系、自定义页面、招聘职位、团队与角色、一线反馈、
   首页幻灯片、合作与背书、发展历程、导航菜单。11 类内容共用一套列表 / 编辑界面，
   字段由 `config/content_types.json` 决定，加字段不用改代码。
3. **运营** —— 客户留言（含状态与来源页）、媒体库（上传、复用、删除）、GEO / SEO（结构化数据与
   `llms.txt` 预览、重新生成）。
4. **系统** —— 站点设置（分基础、联系、SEO、首页、社交、系统六组）、管理员账号与登录审计。

几个约定：

- 每个内容都有 **中文 / 英文两列**，只填中文时英文站自动回退显示中文，不会出现空白页。
- 排序字段 `sort` 越小越前；`status` 关闭即从列表与站点地图中消失。
- 图片走媒体库上传，编辑器里直接选，不用手写路径。
- 保存即生效，无需重启；`sitemap.xml`、`llms.txt` 由运行时按最新数据动态输出。

详见 [docs/usage.md](docs/usage.md)。

## 双语是怎么实现的

三条规则，和多数「按浏览器语言自动跳转」的做法相反：

1. **语言只由 URL 前缀决定**：中文在根目录，英文在 `/en` 下。不读 Cookie、不读
   `Accept-Language`、不认 `?lang=`。
2. **切换语言的链接直接指向目标语言的同一页**，与 `<link rel="alternate" hreflang>` 完全一致，
   不做 302 中转。
3. **内容字段双列存储**：`title_cn` / `title_en`。取值时优先当前语言，缺了回退另一种语言。

为什么这么做：Googlebot、GPTBot 等抓取器默认发 `Accept-Language: en-US`。一旦按访客切语言，
中文首页会被当成英文抓取，`canonical` 与 `hreflang` 全部失准。URL 决定语言，爬虫和人都看到同一份东西。

## GEO / SEO：让大模型读懂你的站点

这个项目把「生成式引擎优化」当成一等公民，而不是上线前补的 meta：

- **每页一块 `@graph` JSON-LD**，第一个节点必须是 `WebPage`，且 `name` 与页面 `<title>` 逐字一致；
  其后按页面类型挂 `Organization` / `Service` / `Article` / `FAQPage` / `BreadcrumbList` / `JobPosting` / `ItemList`，
  用 `@id` 互相引用，不重复描述同一实体。
- **`llms.txt` / `llms-full.txt`**：前者是站点结构与关键页面的导航式摘要，后者是可供模型直接读取的
  全量内容索引，中英各一份，运行时动态生成。
- **`sitemap.xml` / `robots.txt`**：自动包含全部有效页面，排除草稿与法律要求的 noindex 页面。
- **`hreflang` 与 `canonical`**：两种语言互为 alternate，避免重复内容互抢排名。

结构化数据样例见 [examples/](examples/)，字段约定见 [docs/api.md](docs/api.md)。

## 内容模型：11 类内容，一套代码

| 类型 | 用途 | 关键字段 |
| --- | --- | --- |
| `articles` | 新闻 / 观点 | 栏目、标题、摘要、封面、正文、标签、作者、出处、发布时间、置顶 |
| `cases` | 应用案例 | 应用类型、区域、覆盖范围、上线年份、涉及产品、亮点、图集 |
| `services` | 产品体系 | 副标题、摘要、能力清单、正文 |
| `pages` | 单页 | 模板（standard / legal / internal）、标题、副标题、正文 |
| `team` | 团队 | 姓名、职务、照片、简介 |
| `testimonials` | 一线反馈 | 署名、场景、正文 |
| `partners` | 合作与背书 | 名称、分组（标准组织 / 学校 / 媒体） |
| `milestones` | 发展历程 | 年份、标题、说明 |
| `jobs` | 招聘 | 部门、地点、性质、薪资、人数、正文 |
| `slides` | 首页轮播 | 标题、副标题、摘要、图片、按钮、链接 |
| `navs` | 导航 | 标签、链接、排序 |

加一类新内容：在 `config/content_types.json` 里加一段定义，后台列表、编辑表单、前台数据读取都会自动就位。

## 技术选型

| 决策 | 选择 | 原因 |
| --- | --- | --- |
| 运行时 | Node.js + Express 4 | 生态成熟，部署路径最短 |
| 模板 | 自研零构建 EJS（`#` 注释、`include`、布局继承） | 改一行 HTML 就能看效果，不引入打包器 |
| 数据库 | SQLite（默认）/ MySQL | 单机零运维起步，规模化可平滑迁移，SQL 完全一致 |
| 语言 | 原生 JS + CSS 变量 | 无框架、无 polyfill，首屏不需要 hydration |
| 安全 | CSP / CSRF / bcrypt / 蜜罐 / 限流 / SVG 净化 | 教育场景涉及未成年人，默认从严 |

## 数据库

默认 SQLite，文件在 `data/app.sqlite`，无需额外服务：

```bash
npm run site:install      # 建表 + 灌种子
```

切到 MySQL 只需环境变量，代码不用改：

```bash
HZ_DB_DRIVER=mysql \
HZ_DB_HOST=127.0.0.1 HZ_DB_PORT=3306 \
HZ_DB_NAME=up366 HZ_DB_USER=root HZ_DB_PASS=****** \
npm run site:install

npm run migrate:mysql     # 已有 SQLite 数据迁移到 MySQL
```

## 部署

**直接跑**

```bash
npm ci --omit=dev
npm run site:install
HZ_PORT=3000 NODE_ENV=production node server.js
```

**PM2**（仓库自带 `ecosystem.config.js`）

```bash
pm2 start ecosystem.config.js && pm2 save
```

**子目录部署**（如 `https://example.com/up366`）无需改代码：

```nginx
location /up366/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Prefix /up366;
}
```

**纯静态导出**（无表单、无后台时）

```bash
npm run static:export     # 输出到 storage/static
```

## 测试

五套测试，职责不重叠。前两套不需要起服务，后三套自己起独立实例、跑完自动关，可以反复跑。

| 命令 | 验的是什么 | 要不要先起服务 |
| --- | --- | --- |
| `npm run test:content` | 内容规则：新闻必有出处、案例必有免责、双语字段成对、无占位符与旧品牌残留 | 不要 |
| `npm test` | 全站回归：从 sitemap 抓全部页面，逐页校验 canonical / hreflang / JSON-LD / OG | 要（默认 `127.0.0.1:8099`） |
| `npm run test:security` | 安全基线：响应头、CSRF、限流、上传沙箱、路径穿越、Cookie 属性 | 不要 |
| `npm run test:admin` | 后台登录与各列表页可用性 | 不要 |
| `npm run test:crud` | 11 类内容的增删改查闭环 | 不要 |
| `npm run test:deploy` | 三种部署模式（根目录 / 子目录 / `X-Forwarded-Prefix`）的站内地址是否自洽 | 不要 |
| `npm run test:migrate` | SQLite → MySQL 迁移脚本自检 | 不要 |

`npm test` 默认连本机 8099 端口，换地址直接传：`node scripts/smoke.js https://www.up366.com`。

CI 跑的就是这一套，配置在 [.github/workflows/ci.yml](.github/workflows/ci.yml)：内容检查 → 装库起服务跑全量回归 → 构建镜像并验健康检查。三关全绿才算能合。

## 参与贡献

- 提交前请跑 `npm test`、`npm run test:security`、`npm run test:content`；动了后台再加 `npm run test:admin` 与 `npm run test:crud`。
- 内容类改动请保持中英双语同步，不允许单边缺失。
- 涉及事实、数据、报道的文案必须标出处，不接受编造。
- 详细流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，安全问题见 [SECURITY.md](SECURITY.md)，
  提 Issue 前先看 [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) 里的说明。

## 许可与品牌

- 代码以 [MIT](LICENSE) 许可发布，可自由商用、修改、再分发。
- **「天学网」「up366」名称、标识、页面文案与图片素材不在 MIT 授权范围内**。二次部署请替换为自己的
  品牌与内容，详见 [DISCLAIMER.md](DISCLAIMER.md)。
- 站内涉及的教学效果描述均为能力说明与已公开案例，不构成对具体学校、具体班级效果的承诺。
