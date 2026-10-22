# 天学网英语教学 APP · 生产镜像
# 多阶段：build 阶段装依赖，runtime 阶段只留运行必需的东西。
FROM node:22-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production \
    npm_config_update_notifier=false \
    npm_config_fund=false
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app

# tzdata 用于日志与发布时间按东八区显示；dumb-init 保证收到 SIGTERM 能优雅退出
RUN apk add --no-cache tzdata dumb-init \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

ENV NODE_ENV=production \
    HZ_PORT=3000 \
    TZ=Asia/Shanghai

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 运行期目录（会被 compose 的 volume 覆盖，这里保证没有 volume 时也能跑）
RUN mkdir -p data storage/uploads storage/logs storage/cache storage/static \
    && chown -R node:node /app

USER node
EXPOSE 3000

# 有装 curl 吗？没有，所以用 node 自己的 fetch 做健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.HZ_PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "sh", "/app/docker-entrypoint.sh"]
CMD ["node", "--no-warnings", "server.js"]
