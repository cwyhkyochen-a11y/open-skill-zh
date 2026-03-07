#!/usr/bin/env python3
"""
Unified publishing dispatcher.

Supports two modes:
1. Config mode (legacy): build commands from accounts.local.json
2. Task mode: load publish task from DB and dispatch to platform-specific publisher
"""

import argparse
import json
import os
import shlex
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = ROOT / "content-ops-workspace" / "config" / "accounts.local.json"
SCRIPTS_DIR = ROOT / "skills" / "content-ops" / "scripts"
DB_PATH = Path(os.environ.get("CONTENT_OPS_DB", str(ROOT / "content-ops-workspace" / "data" / "content-ops.db")))


class ConfigError(Exception):
    pass


def load_config():
    if not CONFIG_PATH.exists():
        raise ConfigError(f"Missing config: {CONFIG_PATH}")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_account(cfg, platform: str, account: str):
    try:
        return cfg["platforms"][platform]["accounts"][account]
    except KeyError:
        raise ConfigError(f"Account not configured: platform={platform} account={account}")


def q(x: str) -> str:
    return shlex.quote(str(x))


def load_publish_task(task_id: str):
    if not DB_PATH.exists():
        raise ConfigError(f"DB not found: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        """
        select pt.id, pt.task_name, pt.target_account_id, pt.status, pt.content, pt.generated_images,
               ta.platform, ta.account_name, ta.account_id, ta.api_config, ta.platform_config
        from publish_tasks pt
        join target_accounts ta on ta.id = pt.target_account_id
        where pt.id = ?
        """,
        (task_id,),
    ).fetchone()
    conn.close()
    if not row:
        raise ConfigError(f"Publish task not found: {task_id}")
    data = dict(row)
    for k in ("content", "generated_images", "api_config", "platform_config"):
        if data.get(k):
            try:
                data[k] = json.loads(data[k])
            except Exception:
                pass
    return data


def update_publish_task_result(task_id: str, result: dict):
    if not DB_PATH.exists():
        raise ConfigError(f"DB not found: {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    row = conn.execute("select content from publish_tasks where id = ?", (task_id,)).fetchone()
    if not row:
        conn.close()
        raise ConfigError(f"Publish task not found when updating result: {task_id}")

    content = row[0]
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except Exception:
            content = {}
    elif content is None:
        content = {}

    history = content.get("publish_results") if isinstance(content.get("publish_results"), list) else []
    result = dict(result)
    result.setdefault("publishedAt", __import__('datetime').datetime.utcnow().replace(microsecond=0).isoformat() + 'Z')
    content["publish_results"] = history + [result]

    conn.execute(
        """
        update publish_tasks
        set content = ?, status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        where id = ?
        """,
        (json.dumps(content, ensure_ascii=False), task_id),
    )
    conn.commit()
    conn.close()


def derive_job_from_task(task):
    content = task.get("content") or {}
    generated_images = task.get("generated_images") or {}
    platform = task["platform"]
    text = content.get("body") or content.get("text") or content.get("caption") or ""
    title = content.get("title") or task.get("task_name")
    images = []
    if isinstance(content.get("media"), list):
        images.extend(content.get("media"))
    if isinstance(generated_images.get("images"), list):
        images.extend(generated_images.get("images"))
    platform_specific = content.get("platform_specific") or {}
    return {
        "platform": platform,
        "account": task.get("account_name"),
        "account_id": task.get("target_account_id"),
        "task_id": task.get("id"),
        "title": title,
        "text": text,
        "images": images,
        "video": content.get("video") or content.get("video_url"),
        "link": content.get("link"),
        "board_id": platform_specific.get("pinterest", {}).get("board") or None,
        "platform_specific": platform_specific,
    }


def build_instagram(job, acct):
    script = SCRIPTS_DIR / "instagram_publish.py"
    cmd = ["python3", str(script), "--username", acct.get("username", "")]
    password = acct.get("password")
    password_file = acct.get("password_file")
    if password_file:
        cmd += ["--password-file", password_file]
    elif password:
        cmd += ["--password", password]
    session_file = acct.get("session_file")
    if session_file:
        cmd += ["--session-file", session_file]
    proxy = acct.get("proxy")
    if proxy:
        cmd += ["--proxy", proxy]
    text = job.get("text") or ""
    if text:
        cmd += ["--caption", text]
    images = job.get("images") or []
    video = job.get("video")
    if video:
        cmd += ["--video", video]
    elif len(images) == 1:
        cmd += ["--image", images[0]]
    elif len(images) > 1:
        cmd += ["--images", *images]
    else:
        raise ConfigError("Instagram requires --image/--images or --video")
    return cmd


def build_pinterest(job, acct):
    script = SCRIPTS_DIR / "pinterest_publish.py"
    token = acct.get("access_token")
    token_file = acct.get("access_token_file") or acct.get("token_file")
    if not token and not token_file:
        raise ConfigError("Pinterest access_token/token_file missing in config")
    board_id = job.get("board_id") or acct.get("default_board_id")
    if not board_id:
        raise ConfigError("Pinterest requires board_id or default_board_id")
    title = job.get("title")
    if not title:
        raise ConfigError("Pinterest requires title")
    cmd = ["python3", str(script), "--board-id", board_id, "--title", title, "--json"]
    if token_file:
        cmd += ["--token-file", token_file]
    else:
        cmd += ["--token", token]
    text = job.get("text")
    if text:
        cmd += ["--description", text]
    link = job.get("link")
    if link:
        cmd += ["--link", link]
    images = job.get("images") or []
    if len(images) != 1:
        raise ConfigError("Pinterest expects exactly one image/url")
    image = images[0]
    if isinstance(image, str) and (image.startswith("http://") or image.startswith("https://")):
        cmd += ["--image-url", image]
    else:
        cmd += ["--image-file", image]
    return cmd


def build_x_legacy(job, acct):
    script = SCRIPTS_DIR / "x_publish_pw.py"
    profile_dir = acct.get("profile_dir")
    if not profile_dir:
        raise ConfigError("X profile_dir missing in config")
    text = job.get("text")
    if not text:
        raise ConfigError("X requires text")
    cmd = ["python3", str(script), "--profile-dir", profile_dir, "--text", text]
    images = job.get("images") or []
    if images:
        cmd += ["--images", *images]
    return cmd


def build_x_api(job, acct):
    script = SCRIPTS_DIR / "x_post_api.sh"
    account_id = job.get("account_id") or acct.get("target_account_id") or acct.get("account_id")
    if not account_id:
        raise ConfigError("X API requires target account id")
    text = job.get("text")
    if not text:
        raise ConfigError("X requires text")
    cmd = [str(script), "--account-id", account_id, "--text", text]
    if job.get("task_id"):
        cmd += ["--task-id", job["task_id"]]
    images = job.get("images") or []
    if images:
        cmd += ["--images", *images]
    if job.get("video"):
        cmd += ["--video", job["video"]]
    if len(text) > 260:
        cmd += ["--thread"]
    return cmd


def build_facebook(job, acct):
    script = SCRIPTS_DIR / "facebook_publish.py"
    token = acct.get("access_token")
    token_file = acct.get("access_token_file") or acct.get("token_file")
    if not token and not token_file:
        raise ConfigError("Facebook access_token/token_file missing in config")
    text = job.get("text")
    if not text and not (job.get("images") or []):
        raise ConfigError("Facebook requires text or images")
    cmd = ["python3", str(script), "--json"]
    if token_file:
        cmd += ["--token-file", token_file]
    else:
        cmd += ["--token", token]
    if text:
        cmd += ["--message", text]
    page_id = acct.get("page_id")
    if acct.get("is_page") and page_id:
        cmd += ["--page-id", page_id]
    images = job.get("images") or []
    if len(images) == 1:
        cmd += ["--photo", images[0]]
    elif len(images) > 1:
        cmd += ["--photos", *images]
    link = job.get("link")
    if link:
        cmd += ["--link", link]
    return cmd


def build_threads(job, acct):
    script = SCRIPTS_DIR / "threads_publish.py"
    token = acct.get("access_token")
    token_file = acct.get("access_token_file") or acct.get("token_file")
    if not token and not token_file:
        raise ConfigError("Threads access_token/token_file missing in config")
    text = job.get("text")
    if not text:
        raise ConfigError("Threads requires text")
    cmd = ["python3", str(script), "--text", text, "--json"]
    if token_file:
        cmd += ["--token-file", token_file]
    else:
        cmd += ["--token", token]
    images = job.get("images") or []
    video = job.get("video")
    if video:
        cmd += ["--video-url", video]
    elif len(images) > 1:
        cmd += ["--carousel-images", *images]
    elif len(images) == 1:
        cmd += ["--image-url", images[0]]
    return cmd


def normalize_publish_result(platform, task, job, parsed_output):
    if not isinstance(parsed_output, dict):
        raise ConfigError(f"{platform} publisher did not return JSON object")

    url = parsed_output.get("url") or parsed_output.get("permalink")
    platform_post_id = parsed_output.get("platformPostId") or parsed_output.get("platform_post_id") or parsed_output.get("id")
    text_preview = parsed_output.get("textPreview") or parsed_output.get("text_preview") or (job.get("text") or "")[:140]
    media_items = []
    for item in (job.get("images") or []):
        media_items.append({
            "type": "image",
            "url": item if isinstance(item, str) and item.startswith(("http://", "https://")) else None,
            "localPath": item if isinstance(item, str) and not item.startswith(("http://", "https://")) else None,
        })
    if job.get("video"):
        video = job["video"]
        media_items.append({
            "type": "video",
            "url": video if isinstance(video, str) and video.startswith(("http://", "https://")) else None,
            "localPath": video if isinstance(video, str) and not video.startswith(("http://", "https://")) else None,
        })

    if job.get("video"):
        media_type = "video"
    elif len(job.get("images") or []) > 1:
        media_type = "mixed"
    elif len(job.get("images") or []) == 1:
        media_type = "image"
    else:
        media_type = "text"

    return {
        "platform": platform,
        "accountId": task.get("target_account_id") or job.get("account_id"),
        "platformPostId": platform_post_id,
        "url": url,
        "textPreview": text_preview,
        "raw": parsed_output,
        "media": {
            "type": media_type,
            "count": len(media_items),
            "items": media_items,
        },
    }


def run_and_parse_json(cmd, platform):
    result = subprocess.run(cmd, text=True, capture_output=True)
    if result.returncode != 0:
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        raise SystemExit(result.returncode)

    stdout = (result.stdout or "").strip()
    if not stdout:
        raise ConfigError(f"{platform} publisher returned empty output")

    try:
        return json.loads(stdout)
    except json.JSONDecodeError as e:
        print(stdout)
        raise ConfigError(f"{platform} publisher did not return valid JSON: {e}")


def main():
    ap = argparse.ArgumentParser(description="Unified publishing dispatcher")
    ap.add_argument("--platform", choices=["instagram", "pinterest", "x", "facebook", "threads"])
    ap.add_argument("--account")
    ap.add_argument("--task-id")
    ap.add_argument("--title")
    ap.add_argument("--text")
    ap.add_argument("--image", action="append", default=[])
    ap.add_argument("--video")
    ap.add_argument("--link")
    ap.add_argument("--board-id")
    ap.add_argument("--x-mode", choices=["api", "browser"], default="api")
    ap.add_argument("--execute", action="store_true", help="Actually execute the built command")
    args = ap.parse_args()

    task = None
    if args.task_id:
        task = load_publish_task(args.task_id)
        job = derive_job_from_task(task)
        platform = job["platform"]
        acct = {
            "account_id": task.get("target_account_id"),
            **(task.get("api_config") or {}),
            **(task.get("platform_config") or {}),
        }
    else:
        if not args.platform or not args.account:
            raise ConfigError("Config mode requires --platform and --account, or use --task-id")
        job = {
            "platform": args.platform,
            "account": args.account,
            "title": args.title,
            "text": args.text,
            "images": args.image,
            "video": args.video,
            "link": args.link,
            "board_id": args.board_id,
            "platform_specific": {},
        }
        cfg = load_config()
        acct = get_account(cfg, args.platform, args.account)
        platform = args.platform

    builders = {
        "instagram": build_instagram,
        "pinterest": build_pinterest,
        "facebook": build_facebook,
        "threads": build_threads,
    }

    if platform == 'x':
        cmd = build_x_api(job, acct) if args.x_mode == 'api' else build_x_legacy(job, acct)
    else:
        cmd = builders[platform](job, acct)

    print("# Dry-run command")
    print(" ".join(q(x) for x in cmd))

    if not args.execute:
        print("\nNot executed. Add --execute only after manual review.")
        return 0

    if platform == 'x' or not task:
        result = subprocess.run(cmd, text=True)
        raise SystemExit(result.returncode)

    parsed_output = run_and_parse_json(cmd, platform)
    normalized = normalize_publish_result(platform, task, job, parsed_output)
    update_publish_task_result(task["id"], normalized)
    print(json.dumps({
        "status": "published",
        "taskId": task["id"],
        "result": normalized,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ConfigError as e:
        print(f"CONFIG ERROR: {e}", file=sys.stderr)
        raise SystemExit(2)
