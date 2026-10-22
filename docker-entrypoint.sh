#!/bin/sh
# 容器入口：首次启动自动安装，之后直接启动。
# 幂等：只要数据库已存在就跳过安装，不会覆盖已有内容。
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

DB_DRIVER="${HZ_DB_DRIVER:-sqlite}"
DOMAIN="${HZ_DOMAIN:-}"
ADMIN="${HZ_ADMIN_USER:-admin}"
PASS="${HZ_ADMIN_PASS:-}"

need_install=0

if [ "$DB_DRIVER" = "mysql" ]; then
    # MySQL 场景无法靠文件判断，交给 HZ_AUTO_INSTALL=0 关闭自动安装
    if [ "${HZ_AUTO_INSTALL:-1}" = "1" ]; then
        need_install=1
    fi
else
    if [ ! -f "data/app.sqlite" ]; then
        need_install=1
    fi
fi

if [ "$need_install" = "1" ]; then
    echo "▶ 首次启动：开始安装（建表 / 种子内容 / 管理员 / GEO 文件）"
    if [ -n "$DOMAIN" ] && [ -n "$PASS" ]; then
        node --no-warnings install/install.js --domain="$DOMAIN" --admin="$ADMIN" --pass="$PASS"
    elif [ -n "$DOMAIN" ]; then
        node --no-warnings install/install.js --domain="$DOMAIN" --admin="$ADMIN"
    else
        node --no-warnings install/install.js --admin="$ADMIN"
    fi
    echo "✔ 安装完成"
else
    echo "✔ 检测到已有数据，跳过安装"
fi

exec "$@"
