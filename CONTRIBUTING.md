# 贡献指南 · Contributing

感谢你愿意花时间。这个仓库的目标不是「做一个好看的官网」，而是把英语教学产品的
能力边界讲得可核查。所以贡献标准围绕两件事：**代码不破坏既有功能**，**内容不编造事实**。

English version follows the Chinese one — see [Contributing (English)](#contributing-english).

---

## 一、开始之前

```bash
git clone <repo> && cd up366
npm install
npm run site:install -- --pass=Dev123456
npm run dev
```

- 需要 **Node.js ≥ 22.5**（默认 SQLite 走内置 `node:sqlite`）。
- 不需要任何全局工具，不需要前端构建。
- 本地数据库与上传文件都在 `data/` 与 `storage/`，已被 `.gitignore` 排除。

## 二、提交前必须通过

```bash
npm test                 # 冒烟：路由可达、页面非空、关键输出存在
npm run test:security    # CSRF、蜜罐、限流、XSS 过滤
npm run test:content     # 内容完整性：双语字段、栏目、出处、占位符
npm run test:admin       # 后台登录与权限边界
```

四项全绿再提 PR。CI 会跑同一组脚本，本地过不了的 CI 也过不了。

## 三、代码规范

| 项目 | 约定 |
| --- | --- |
| 缩进 | 4 空格；模板与 CSS 同为 4 空格 |
| 引号 | 代码内一律 ASCII 直引号；中文文案里的引号用「」 |
| 命名 | 变量与函数 `camelCase`；表名与字段 `snake_case`；内容字段双列 `xxx_cn` / `xxx_en` |
| 注释 | 只解释「为什么」，不复述「做了什么」；有历史包袱的地方写清楚来龙去脉 |
| 模板 | 优先改 `views/` 与 `assets/`；不要为了一个页面去改控制器逻辑 |
| 依赖 | 新增运行时依赖需在 PR 说明里给出理由与体积影响，能用标准库就不加包 |

**不要做的事**

- 不要引入打包器、CSS 框架或前端运行时。这个项目的卖点之一就是零构建。
- 不要修改语言判定规则（只认 URL 前缀，不读 Cookie / `Accept-Language` / `?lang=`）。
- 不要在模板里拼 SQL、拼用户输入；一律走 `repo` 与 `e()`。
- 不要把 `data/`、`storage/uploads/`、`.env` 提交上来。

## 四、内容规范（重点）

这个仓库里的新闻、案例、数据都会被当成真实信息阅读，因此：

1. **必须标出处**。新闻类内容在 `source_cn` / `source_en` 写入机构与文件名（如
   「中国互联网协会 · 2026 年中国互联网创新大赛获奖名单」）。没有出处的稿子不收。
2. **数字必须有来源**。任何「提升 X 分」「覆盖 X 所」「准确率 X%」都要能在知识库或公开报道里找到，
   并在正文或脚注指明。宁可不写，也不写一个查不到的数字。
3. **中英双语同步**。新增字段时同时填 `_cn` 与 `_en`；只填一侧会让另一个语言站出现回退，测试会拦下。
4. **案例要留余地**。涉及学校成绩的表述必须附免责说明（模板已内置 `.case-note`），
   并写清「不构成对具体学校的效果承诺」。
5. **联系方式不编**。没有公开电话就留空，模板会自动隐藏；不要填 400 电话或邮箱占位。

## 五、提交流程

```bash
git checkout -b feat/your-topic
# 改代码 / 内容
npm test && npm run test:security && npm run test:content
git commit -m "feat(news): 增加区域联考阅卷案例"
git push origin feat/your-topic
```

- 分支命名：`feat/…`、`fix/…`、`docs/…`、`content/…`、`chore/…`。
- 提交信息用中文或英文均可，格式 `类型(范围): 说明`。
- PR 描述请写清：改了什么、为什么改、如何验证（截图或命令输出）。
- 一个 PR 只做一件事。混装重构与内容修改的 PR 会被要求拆分。

## 六、报告问题

- 功能缺陷用 Issue 模板「Bug report」，附复现步骤、预期与实际、Node 版本、数据库类型。
- 安全问题**不要**开公开 Issue，见 [SECURITY.md](SECURITY.md)。
- 内容纠错（数字错、出处错、表述不当）请直接开 Issue 并附权威来源链接，会优先处理。

---

## Contributing (English)

Thanks for taking the time. The goal of this repository is not "a nice-looking website" but a website whose
claims about English teaching can be checked. Contributions are judged on two things: **code that does not break
existing behaviour**, and **content that invents nothing**.

### Setup

```bash
git clone <repo> && cd up366
npm install
npm run site:install -- --pass=Dev123456
npm run dev
```

Node.js ≥ 22.5 is required (the default SQLite driver is the built-in `node:sqlite`). No global tooling and no
front-end build step. Local data lives in `data/` and `storage/`, both gitignored.

### Before you open a PR

```bash
npm test
npm run test:security
npm run test:content
npm run test:admin
```

All four must pass locally; CI runs the same scripts.

### Code conventions

- 4-space indentation, including templates and CSS.
- ASCII straight quotes in code; Chinese copy uses 「」 for quotation.
- `camelCase` for JS, `snake_case` for tables and columns; bilingual content fields are `xxx_cn` / `xxx_en`.
- Comments explain *why*, not *what*. Where there is historical baggage, say where it came from.
- Prefer changing `views/` and `assets/` over rewriting controller logic for a single page.
- New runtime dependencies need a justification (and a size impact note) in the PR. Standard library first.

**Please don't**

- Introduce a bundler, CSS framework or front-end runtime. Zero-build is a feature.
- Change the language rule (URL prefix only — no cookies, `Accept-Language` or `?lang=`).
- Concatenate SQL or user input in templates; use `repo` and `e()`.
- Commit `data/`, `storage/uploads/` or `.env`.

### Content rules

1. **Every news item carries a source** in `source_cn` / `source_en` (organisation plus document or report
   title). Unsourced submissions are declined.
2. **Every number needs provenance.** "Improved by X points", "covers X schools", "X% accuracy" must be
   traceable to the knowledge base or a public report, and cited in the body or a footnote.
3. **Keep both languages in sync.** Fill `_cn` and `_en` together; one-sided edits cause fallback and the tests
   will fail.
4. **Leave room in case studies.** Claims about school results must carry a disclaimer (the `.case-note` style
   is built in) stating that they are not a guarantee of outcomes.
5. **Do not invent contact details.** If there is no public phone number, leave it empty — the templates hide
   empty fields automatically.

### Workflow

```bash
git checkout -b feat/your-topic
npm test && npm run test:security && npm run test:content
git commit -m "feat(news): add regional joint-exam marking case"
git push origin feat/your-topic
```

Branch prefixes: `feat/`, `fix/`, `docs/`, `content/`, `chore/`. Commit format `type(scope): summary`. In the PR
describe what changed, why, and how you verified it. One concern per PR.

### Reporting

- Functional bugs: use the "Bug report" issue template with steps, expected vs actual, Node version and database.
- Security issues: **do not** open a public issue — see [SECURITY.md](SECURITY.md).
- Content corrections: open an issue with an authoritative source link. These are prioritised.
