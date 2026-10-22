'use strict';
/**
 * HTTP 服务入口
 *
 *   node server.js
 *
 * 请求处理顺序（顺序很关键）：
 *   1. 请求上下文（AsyncLocalStorage）——后续所有代码都依赖它取语言/路径/会话
 *   2. 安全响应头
 *   3. 会话（数据库存储 + 签名 Cookie）
 *   4. 请求体解析
 *   5. 解析部署前缀 / 语言 / 应用内路径
 *   6. 静态资源（assets、storage/uploads）
 *   7. 路由分发（后台 → 前台）
 *   8. 404 / 500
 */

require('./src/core/compat');   // 必须最先加载

/* ------------------------------------------------------------------ */
/* 启动前置检查                                                        */
/* ------------------------------------------------------------------ */

/*
 * 依赖预检。
 * pm2 反复重启时，日志里最常见的一句就是 "Cannot find module 'express'"——
 * 上传代码时忘了带 node_modules，或者根本没跑 npm install。
 * 与其让 require 抛一句干巴巴的模块名，不如直接把该怎么做写清楚。
 */
(function checkDependencies() {
    const fs = require('node:fs');
    const path = require('node:path');
    // mysql2 是可选的（只有切到 MySQL 才需要），不列入必检
    const required = ['express', 'multer', 'bcryptjs'];
    const missing = required.filter(
        (m) => !fs.existsSync(path.join(__dirname, 'node_modules', m))
    );
    if (missing.length) {
        console.error('启动失败：缺少依赖 → ' + missing.join(', '));
        console.error('请在项目目录执行：');
        console.error('');
        console.error('    npm install --omit=dev');
        console.error('');
        console.error('当前项目目录：' + __dirname);
        process.exit(1);
    }
})();

const path = require('node:path');
const express = require('express');

const { boot, assertInstalled } = require('./app/bootstrap');
const ctx = require('./src/core/ctx');
const config = require('./app/config');
const settings = require('./src/core/settings');
const session = require('./src/core/session');
const langCore = require('./src/core/lang');
const view = require('./src/core/view');
const log = require('./src/core/log');
const security = require('./src/core/security');
const routes = require('./app/routes');
const h = require('./app/helpers');

const SITE_NS = './src/controllers/';
const ADMIN_NS = './src/admin/';

/* ------------------------------------------------------------------ */
/* 路由匹配                                                            */
/* ------------------------------------------------------------------ */

function toMatcher(pattern) {
    const p = '/' + String(pattern).replace(/^\/+|\/+$/g, '');
    if (p === '/') return { re: /^\/?$/, names: [] };

    const names = [];
    const source = p.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
        names.push(name);
        return '([^/]+)';
    });
    return { re: new RegExp('^' + source + '/?$'), names };
}

const COMPILED = {
    site: routes.site.map((r) => ({ method: r[0], handler: r[2], ...toMatcher(r[1]) })),
    admin: routes.admin.map((r) => ({ method: r[0], handler: r[2], ...toMatcher(r[1]) })),
};

function match(list, method, p) {
    for (const route of list) {
        const m = route.re.exec(p);
        if (!m) continue;
        if (route.method !== method && route.method !== '*') continue;
        const params = {};
        route.names.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
        return { handler: route.handler, params };
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* 安全响应头                                                          */
/* ------------------------------------------------------------------ */

function securityHeaders() {
    const sec = config.security || {};
    return function (req, res, next) {
        res.removeHeader('X-Powered-By');
        res.set('X-Content-Type-Options', 'nosniff');
        if (sec.frameGuard) res.set('X-Frame-Options', 'SAMEORIGIN');
        res.set('Referrer-Policy', sec.referrerPolicy || 'strict-origin-when-cross-origin');
        res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.set('Cross-Origin-Opener-Policy', 'same-origin');

        if (sec.hsts && (req.secure || req.get('x-forwarded-proto') === 'https')) {
            res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (sec.csp) {
            // 统计脚本、地图 iframe 需要额外放行；后台填了统计 ID 会自动用到这些域
            const script = ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://hm.baidu.com']
                .concat(sec.cspExtraScript || []);
            const connect = ["'self'", 'https://www.google-analytics.com', 'https://hm.baidu.com']
                .concat(sec.cspExtraConnect || []);
            const frame = ["'self'"]
                .concat(sec.cspExtraFrame || ['https://www.google.com', 'https://map.baidu.com', 'https://api.map.baidu.com']);
            const csp = [
                "default-src 'self'",
                'script-src ' + script.join(' '),
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                'connect-src ' + connect.join(' '),
                'frame-src ' + frame.join(' '),
                "media-src 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
            ].join('; ');
            res.set('Content-Security-Policy', csp);
        }
        next();
    };
}

/* ------------------------------------------------------------------ */
/* 请求上下文                                                          */
/* ------------------------------------------------------------------ */

function requestContext() {
    return function (req, res, next) {
        const store = ctx.blank({ req, res });
        ctx.run(store, () => {
            const proto = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
            store.proto = proto;
            store.host = req.get('host') || '';
            store.basePath = settings.resolveBaseForRequest(req);

            // 还原「应用内路径」：剥部署前缀 → 剥入口文件
            let p = String(req.originalUrl || '/').split('?')[0];
            p = settings.stripBase(p);
            p = p.replace(/^\/index\.php(?=\/|$)/, '');
            p = '/' + p.replace(/^\/+/, '');
            if (p === '') p = '/';
            store.rawPath = p;

            next();
        });
    };
}

/* ------------------------------------------------------------------ */
/* 应用构建                                                            */
/* ------------------------------------------------------------------ */

async function createApp() {
    await boot();

    const app = express();
    app.disable('x-powered-by');
    if (config.trustProxy) app.set('trust proxy', true);
    app.set('etag', 'weak');

    // 站点设置：必须在 requestContext 之前完成。
    // 原因有两个：
    //   1) resolveBaseForRequest() 要读「站点完整域名」来推断部署前缀；
    //   2) settings.get() 是同步函数（模板里要用），只能读模块级缓存。
    //      后台保存设置时会 clear() 把缓存置空，如果不在这里重新 load()，
    //      整个进程的设置就会一直停留在「空缓存 = 全部默认值」，直到重启。
    //      ensure() 自带 15 秒 TTL，正常情况下不会每次都查库。
    app.use(async (req, res, next) => {
        try {
            await settings.ensure();
            next();
        } catch (e) {
            next(e);
        }
    });

    app.use(requestContext());
    app.use(securityHeaders());
    app.use(session.middleware());

    // 请求体解析：表单与 JSON；文件上传由具体路由上的 multer 处理
    app.use(express.urlencoded({ extended: false, limit: '1mb' }));
    app.use(express.json({ limit: '256kb' }));

    /* ---------- 静态资源 ---------- */
    /*
     * 部署前缀剥离。
     *
     * 子目录部署有两种接线方式，这里要保证两种都能用：
     *   a) nginx proxy_pass http://127.0.0.1:8097/;   （结尾带 / 会把 /up366 剥掉）
     *   b) nginx 同时下发 X-Forwarded-Prefix: /up366 但不剥路径
     * 方式 b 下 Node 看到的是 /up366/assets/x.css，而 express.static 挂在 /assets 上，
     * 不剥离就命中不了。所以这里先剥一次前缀再交给后面的静态与后台中间件。
     *
     * 注意：剥的是 req.url，不影响路由 —— 页面分发用的是 requestContext 里
     * 按 originalUrl 算好的 ctx.get().rawPath，那条路径已经独立处理过前缀了。
     */
    app.use((req, res, next) => {
        const bp = ctx.get().basePath || '';
        const url = req.url || '';
        if (bp && (url === bp || url.indexOf(bp + '/') === 0)) {
            req.url = url.slice(bp.length) || '/';
        }
        next();
    });

    const staticOpts = { index: false, dotfiles: 'ignore', fallthrough: true, maxAge: '7d' };
    app.use('/assets', express.static(path.join(config.root, 'assets'), staticOpts));

    // 上传目录单独加一层防护。原因：SVG 本质上是可以携带 <script> 的「图片」，
    // 虽然是用户自己上传的，但一旦有人拿到上传权限（或后台被撞库），
    // 直接访问 SVG 就能在本站源下执行脚本、读取后台会话。
    // 上传时已做净化，这里再加一道响应级沙箱，双保险。
    app.use('/storage/uploads', (req, res, next) => {
        res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Cross-Origin-Resource-Policy', 'same-origin');
        next();
    });
    app.use('/storage/uploads', express.static(config.uploadsDir, { index: false, dotfiles: 'ignore', fallthrough: true, maxAge: '30d' }));

    /* ---------- 后台 ---------- */
    const adminSeg = '/' + String(config.adminPath || 'admin').replace(/^\/+|\/+$/g, '');
    app.use(adminSeg, (req, res, next) => {
        const sub = req.path === '' ? '/' : req.path;
        dispatch('admin', req, res, sub).catch(next);
    });

    /* ---------- 前台 ---------- */
    app.use((req, res, next) => {
        dispatch('site', req, res, ctx.get().rawPath).catch(next);
    });

    /* ---------- 兜底 ---------- */
    app.use((req, res) => {
        res.status(404).type('html').send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title></head><body style="font-family:system-ui;text-align:center;padding:80px">404 Not Found</body></html>');
    });

    app.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
        log.error('未捕获异常 ' + (req && req.originalUrl) + ' → ' + (err && err.stack ? err.stack : err));
        if (res.headersSent) return;
        try {
            const ErrorController = require('./src/controllers/error');
            ErrorController.serverError(req, res, err);
        } catch (_) {
            res.status(500).type('html').send('500 Internal Server Error');
        }
    });

    return app;
}

/* ------------------------------------------------------------------ */
/* 分发                                                                */
/* ------------------------------------------------------------------ */

async function dispatch(scope, req, res, p) {
    const store = ctx.get();
    const method = (req.method || 'GET').toUpperCase();

    let target = p;
    if (scope === 'site') {
        // 语言只由 URL 前缀决定
        const parsed = langCore.parsePath(p, config.langs, config.defaultLang);
        store.lang = parsed.lang;
        target = parsed.path;
        store.path = target;

        // 维护模式（后台与生成型文件不受影响）
        if (Number(settings.get('maintenance', 0)) === 1 && !isSystemPath(target)) {
            return maintenancePage(req, res);
        }
    } else {
        store.lang = config.defaultLang;
        store.path = target;
    }

    const hit = match(COMPILED[scope], method, target);
    if (!hit) {
        if (scope === 'admin') {
            return res.status(404).type('html').send('后台页面不存在');
        }
        return frontNotFound(req, res);
    }

    const [mod, fn] = hit.handler.split('@');
    const base = scope === 'admin' ? ADMIN_NS : SITE_NS;
    let controller;
    try {
        controller = require(base + mod);
    } catch (e) {
        throw new Error('控制器加载失败：' + base + mod + ' → ' + e.message);
    }
    if (!controller || typeof controller[fn] !== 'function') {
        throw new Error('控制器方法不存在：' + mod + '@' + fn);
    }

    store.route = mod + '@' + fn;
    await controller[fn](req, res, hit.params || {});
}

const SYSTEM_PATH = /^\/(sitemap\.xml|robots\.txt|llms(-full)?(-en)?\.txt)$/;
function isSystemPath(p) {
    return SYSTEM_PATH.test(p);
}

async function frontNotFound(req, res) {
    const p = ctx.get().path || '/';
    const slug = p.replace(/^\/+|\/+$/g, '');
    // 前台兜底：支持后台新增的任意单页
    if (slug !== '' && slug.indexOf('/') === -1 && !isSystemPath(p)) {
        try {
            const PageController = require('./src/controllers/page');
            return await PageController.show(req, res, slug);
        } catch (_) {}
    }
    const ErrorController = require('./src/controllers/error');
    return ErrorController.notFound(req, res);
}

function maintenancePage(req, res) {
    const en = langCore.current() === 'en';
    let text = String(settings.get('maintenance_text', '') || '');
    if (text === '') text = en ? 'The site is under maintenance. Please come back later.' : '网站正在维护升级，请稍后访问。';
    const title = en ? 'Under Maintenance' : '网站维护中';
    const html =
        '<!DOCTYPE html><html lang="' + (en ? 'en' : 'zh-CN') + '"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<meta name="robots" content="noindex,follow"><title>' + h.e(title) + '</title>' +
        '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14161a;' +
        'color:#e8e5df;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;padding:24px}' +
        'h1{font-size:22px;font-weight:600;letter-spacing:.06em;margin:0 0 14px}' +
        'p{margin:0;color:#a9a49c;line-height:1.9;max-width:460px}</style></head><body><div><h1>' +
        h.e(title) + '</h1><p>' + h.e(text) + '</p></div></body></html>';
    res.status(503).set('Retry-After', '3600').set('X-Robots-Tag', 'noindex').type('html').send(html);
}

/* ------------------------------------------------------------------ */
/* 启动                                                                */
/* ------------------------------------------------------------------ */

async function main() {
    const app = await createApp();

    // 表没建好时不要装作没事——那样站点会"能启动但满屏 500"，比直接报错难查得多
    await assertInstalled();

    const server = app.listen(config.port, config.host, () => {
        const info = ctx.shared.db.info();
        log.info('==============================================');
        log.info(' 天学网英语教学 APP · Node.js 版已启动');
        log.info(` 地址：http://${config.host === '0.0.0.0' ? '127.0.0.1' : config.host}:${config.port}`);
        log.info(` 后台：/${config.adminPath}`);
        log.info(` 数据库：${info.driver} → ${info.target}`);
        log.info(` 运行环境：${process.version}，${config.debug ? '调试模式' : '生产模式'}`);
        log.info('==============================================');
    });

    /*
     * listen 失败是异步的（以 'error' 事件抛出），不会进 main() 的 catch。
     * 不监听它就会变成「unhandled 'error' event」直接把进程干掉，
     * pm2 只看到反复重启，看不到原因。这里把最常见的两种失败讲清楚。
     */
    server.on('error', (e) => {
        if (e && e.code === 'EADDRINUSE') {
            const alt = config.port === 8097 ? 8096 : 8097;
            console.error(`启动失败：端口 ${config.port} 已被其它程序占用。`);
            console.error('');
            console.error('  查看占用进程：ss -nltp | grep :' + config.port);
            console.error(`  换个端口重启：HZ_PORT=${alt} pm2 restart up366 --update-env`);
            console.error('');
            console.error('提示：' + (config.port === 3000
                ? '3000 端口经常被 Docker 容器占用，生产环境建议改用 8097 等不常用端口。'
                : '确认端口不被其它服务占用，或换一个空闲端口。'));
        } else if (e && e.code === 'EACCES') {
            console.error(`启动失败：没有权限绑定端口 ${config.port}。`);
            console.error('  1024 以下的端口需要 root，或执行：setcap cap_net_bind_service=+ep $(which node)');
        } else {
            console.error('启动失败：', e);
        }
        process.exit(1);
    });

    const shutdown = (sig) => {
        log.info('收到 ' + sig + '，正在关闭……');
        server.close(async () => {
            try { await ctx.shared.db.close(); } catch (_) {}
            process.exit(0);
        });
        setTimeout(() => process.exit(0), 5000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
}

if (require.main === module) {
    main().catch((e) => {
        // 「未安装」是我们自己抛的可操作提示，不需要堆栈，堆栈反而把关键信息淹没
        if (e && e.code === 'HZ_NOT_INSTALLED') {
            console.error('启动失败：数据库尚未初始化。');
            console.error('');
            console.error(e.message);
        } else {
            console.error('启动失败：', e);
        }
        process.exit(1);
    });
}

module.exports = { createApp, main, match, COMPILED, dispatch };
