# X 登录态续航（noVNC + Playwright persistent profile）

目标：在 ECS 上完成一次 **可视化登录**，将登录态落到 `chrome_profile_dir`，之后用 `--headless` 发帖。

## 1) 启动/停止 noVNC 桌面（两种方式）

### 方式 A：systemd（推荐）

```bash
# 启动
systemctl start x-ui

# 查看状态
systemctl status x-ui --no-pager

# 停止
systemctl stop x-ui
```

可选：开机自启（默认不启用）
```bash
systemctl enable x-ui
```

### 方式 B：脚本（无需 systemd）

```bash
~/.openclaw/workspace/bin/x-ui-start.sh
~/.openclaw/workspace/bin/x-ui-stop.sh
```

默认监听（仅本机回环）：
- noVNC: `127.0.0.1:6080`
- x11vnc: `127.0.0.1:5901`

## 2) 在你的电脑上建立 SSH 隧道

```bash
ssh -i /path/to/tencent.pem -L 6080:127.0.0.1:6080 root@<ECS_IP>
```

然后浏览器打开：
- http://127.0.0.1:6080/vnc.html

## 3) 一键在 noVNC 桌面里打开“绑定 profile 的登录浏览器”

在 ECS 上执行：

```bash
~/.openclaw/workspace/bin/x-browser-open.sh
```

它会：
- 默认使用 `DISPLAY=:99`
- 自动从 `content-ops-workspace/accounts/x.md` 的 front matter 读取 `chrome_profile_dir`
- 打开 `x.com/i/flow/login`，你在 noVNC 里完成登录后，回到终端按回车

如需手动指定 profile：
```bash
PROFILE_DIR=/root/.openclaw/workspace/content-ops-workspace/secrets/x/chrome-profile-knitnerdmeow \
  ~/.openclaw/workspace/bin/x-browser-open.sh
```

## 4) 登录完成后：headless 发帖验证

```bash
cd ~/.openclaw/workspace/skills/content-ops
python3 scripts/x_publish_pw.py \
  --profile-dir /root/.openclaw/workspace/content-ops-workspace/secrets/x/chrome-profile-knitnerdmeow \
  --headless \
  --text "X headless post test"
```

> 如遇到 selector 变化导致发帖按钮找不到，需要更新 `x_publish_pw.py` 的 selector。
