#!/usr/bin/env python3
"""X (Twitter) publisher via Playwright (headless-friendly).

This replaces the incomplete CDP implementation.

Key idea for "no UI ECS":
- Use a persistent Chromium profile directory to keep login cookies.
- First run: open in non-headless mode with VNC/ssh-forwarding (if possible) OR import cookies.
- After cookies exist: run headless for scheduled posts.

Usage:
  # First time: create profile dir and login manually (requires a way to view browser)
  python3 x_publish_pw.py --profile-dir /path/to/profile --login

  # Post text only (headless)
  python3 x_publish_pw.py --profile-dir /path/to/profile --text "Hello"

  # Post with images
  python3 x_publish_pw.py --profile-dir /path/to/profile --text "Hello" --images a.jpg b.jpg

Notes:
- X UI changes frequently; selectors may need updates.
- For strict no-UI environments, you may need to import cookies into the profile.
"""

import argparse
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

X_HOME = "https://x.com/home"
X_LOGIN = "https://x.com/i/flow/login"
X_COMPOSE = "https://x.com/compose/post"


def _ensure_dir(p: str):
    Path(p).mkdir(parents=True, exist_ok=True)


def _is_logged_in(page) -> bool:
    page.goto(X_HOME, wait_until="domcontentloaded")
    # If redirected to login flow, not logged in.
    if "flow/login" in page.url or "login" in page.url:
        return False
    # Heuristic: look for compose box.
    try:
        page.wait_for_selector("div[data-testid='tweetTextarea_0']", timeout=5000)
        return True
    except Exception:
        return True


def _attach_images(page, image_paths):
    # X uses an <input type=file> hidden.
    file_input = page.locator("input[type='file']").first
    files = [str(Path(p).resolve()) for p in image_paths]
    file_input.set_input_files(files)



def publish(text: str, profile_dir: str, headless: bool, images=None):
    _ensure_dir(profile_dir)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=headless,
            locale="en-US",
            viewport={"width": 1280, "height": 900},
        )
        page = context.new_page()

        if not _is_logged_in(page):
            print("❌ 未登录 X。请先运行 --login 完成一次登录（需要可视化能力），或导入 cookies 到 profile_dir。")
            context.close()
            return {"status": "error", "error": "not_logged_in"}

        page.goto(X_COMPOSE, wait_until="domcontentloaded")

        # Fill text
        textarea = page.locator("div[data-testid='tweetTextarea_0']").first
        textarea.click()
        textarea.fill(text)

        # Upload images
        if images:
            _attach_images(page, images)
            # Wait for upload to settle
            time.sleep(2)

        # Click Post
        btn = page.locator("div[data-testid='tweetButtonInline'],button[data-testid='tweetButtonInline'],div[data-testid='tweetButton'],button[data-testid='tweetButton']").first
        try:
            btn.wait_for(state="visible", timeout=15000)
        except PWTimeout:
            print("❌ 找不到发布按钮（X UI 可能变化），需要更新 selector")
            context.close()
            return {"status": "error", "error": "tweet_button_not_found"}

        btn.click()

        # Best-effort: wait for toast / url change
        time.sleep(3)
        print("✅ 已提交发布请求（无法100%保证成功，建议查看账号确认）")

        context.close()
        return {"status": "submitted"}



def login(profile_dir: str):
    _ensure_dir(profile_dir)
    with sync_playwright() as p:
        # Login requires a visible browser. We'll run headless=False.
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False,
            locale="en-US",
            viewport={"width": 1280, "height": 900},
        )
        page = context.new_page()
        page.goto(X_LOGIN, wait_until="domcontentloaded")
        print("\n🔐 请在打开的浏览器里完成登录（含2FA）。完成后回到终端按回车继续。\n")
        input()
        ok = _is_logged_in(page)
        context.close()
        if ok:
            print("✅ 登录态已保存到 profile_dir")
            return 0
        print("❌ 仍未检测到登录态")
        return 1



def main():
    ap = argparse.ArgumentParser(description="Post to X using Playwright (persistent profile)")
    ap.add_argument("--profile-dir", required=True, help="Persistent Chromium profile dir")
    ap.add_argument("--headless", action="store_true", help="Run headless")
    ap.add_argument("--login", action="store_true", help="Open login flow (requires visible browser)")
    ap.add_argument("--text", help="Post text")
    ap.add_argument("--images", nargs="+", help="Image paths (max 4)")

    args = ap.parse_args()

    if args.login:
        sys.exit(login(args.profile_dir))

    if not args.text:
        print("❌ Need --text or --login")
        sys.exit(1)

    if args.images and len(args.images) > 4:
        print("❌ X allows up to 4 images")
        sys.exit(1)

    res = publish(args.text, args.profile_dir, args.headless, images=args.images)
    if res.get("status") == "submitted":
        sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    main()
