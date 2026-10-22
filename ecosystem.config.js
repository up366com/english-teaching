/**
 * PM2 进程配置 —— 生产环境推荐用这个文件启动，而不是在命令行拼环境变量。
 *
 *   pm2 start ecosystem.config.js
 *   pm2 restart up366 --update-env
 *   pm2 logs up366
 *
 * 为什么用文件而不是 `HZ_PORT=8099 pm2 start ...`：
 *   命令行那种写法，环境变量只存在于「第一次启动」那一次；
 *   之后 `pm2 restart` 不会带上它，pm2 还会提示 "Divergent env variables"。
 *   写成文件后，每次重启都读同一份配置，不会漂。
 */

module.exports = {
    apps: [
        {
            name: 'up366',
            script: 'server.js',
            cwd: __dirname,

            // SQLite 是单文件库，必须单进程，多实例会写出损坏的 WAL。
            // 将来迁到 MySQL 后，可以改成 instances: 'max' + exec_mode: 'cluster'。
            instances: 1,
            exec_mode: 'fork',

            // 生产环境变量（具体含义见 app/config.js 顶部注释）
            env: {
                NODE_ENV: 'production',

                // 监听端口。默认 3000 经常被 Docker 占用，这里显式指定。
                // 注意：如果 nginx 里写的是 proxy_pass http://127.0.0.1:8097，
                // 这个值必须和 nginx 保持一致。
                HZ_PORT: 8097,
                HZ_HOST: '0.0.0.0',

                // 跑在 nginx 反代之后，必须为 1，否则拿不到真实访客 IP，
                // 限流会把所有请求都算到 nginx 头上。
                HZ_TRUST_PROXY: '1',

                HZ_TZ: 'Asia/Shanghai',

                // 生产环境不要开调试（调试模式会把错误堆栈输出到页面）
                HZ_DEBUG: '0',
            },

            autorestart: true,
            max_memory_restart: '300M',
            merge_logs: true,
            time: true,            // 日志带时间戳

            // 崩溃重启的退避策略：避免配置写错时 1 秒重启几十次，把日志刷爆
            restart_delay: 2000,
            max_restarts: 10,
            min_uptime: '10s',
        },
    ],
};
