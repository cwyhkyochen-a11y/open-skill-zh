#!/usr/bin/env python3
"""
Content Ops MCP Server

统一的 MCP 服务接口，包装现有的各平台发布脚本。
通过 mcporter 调用，支持 6 大平台发布。

Usage:
    mcporter call content-ops.publish_instagram caption="Hello" image="photo.jpg"
    mcporter call content-ops.list_accounts platform="instagram"
"""

import json
import subprocess
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import database
from src.db.index import db
from src.db.schema import targetAccounts
from sqlalchemy import select

class ContentOpsMCP:
    """MCP Server for Content Ops publishing."""
    
    def __init__(self):
        self.scripts_dir = Path(__file__).parent.parent / "scripts"
        
    def _run_script(self, script_name: str, args: list) -> dict:
        """Run a Python script and return result."""
        script_path = self.scripts_dir / script_name
        
        try:
            result = subprocess.run(
                ["python3", str(script_path)] + args,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Try to parse JSON output
            try:
                return json.loads(result.stdout)
            except:
                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "returncode": result.returncode
                }
                
        except subprocess.TimeoutExpired:
            return {"status": "error", "error": "Script timeout"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def _get_account(self, account_id: str) -> dict:
        """Get account from database."""
        try:
            stmt = select(targetAccounts).where(targetAccounts.c.id == account_id)
            result = db.execute(stmt).fetchone()
            
            if result:
                return {
                    "id": result.id,
                    "platform": result.platform,
                    "name": result.account_name,
                    "config": json.loads(result.api_config) if result.api_config else {}
                }
            return None
        except Exception as e:
            return {"error": str(e)}
            
    def publish_xiaohongshu(self, title: str, content: str, images: list, account_id: str = None):
        """Publish to Xiaohongshu."""
        print(f"Publishing to Xiaohongshu: {title[:50]}...", file=sys.stderr)
        
        # Get account info if provided
        if account_id:
            account = self._get_account(account_id)
            if not account or "error" in account:
                return {"status": "error", "error": "Account not found"}
                
        # Use redbookskills for publishing
        # This requires CDP session
        return {
            "status": "pending",
            "message": "Xiaohongshu publishing requires CDP session. Use scripts/publish_pipeline.py",
            "platform": "xiaohongshu",
            "title": title,
            "image_count": len(images)
        }
        
    def publish_x(self, text: str, images: list = None, account_id: str = None):
        """Publish to X (Twitter)."""
        print(f"Publishing to X: {text[:50]}...", file=sys.stderr)
        
        # Get account credentials
        if account_id:
            account = self._get_account(account_id)
            if not account:
                return {"status": "error", "error": "Account not found"}
        else:
            return {"status": "error", "error": "account_id required"}
            
        # Build command
        args = ["--text", text]
        
        if images:
            args.extend(["--images"] + images)
            
        result = self._run_script("x_publish.py", args)
        return result
        
    def publish_instagram(self, caption: str, image: str = None, images: list = None,
                          video: str = None, story: bool = False, account_id: str = None):
        """Publish to Instagram."""
        print(f"Publishing to Instagram: {caption[:50]}...", file=sys.stderr)
        
        # Get account credentials
        if account_id:
            account = self._get_account(account_id)
            if not account:
                return {"status": "error", "error": "Account not found"}
            
            username = account.get("config", {}).get("username")
            password = account.get("config", {}).get("password")
            
            if not username or not password:
                return {"status": "error", "error": "Account missing credentials"}
        else:
            return {"status": "error", "error": "account_id required"}
            
        # Build command
        args = ["-u", username, "-p", password, "-c", caption]
        
        if story:
            args.append("--story")
            
        if image:
            args.extend(["--image", image])
        elif images:
            args.extend(["--images"] + images)
        elif video:
            args.extend(["--video", video])
        else:
            return {"status": "error", "error": "Must provide image, images, or video"}
            
        result = self._run_script("instagram_publish.py", args)
        return result
        
    def publish_facebook(self, message: str, photo: str = None, photos: list = None,
                         link: str = None, page_id: str = None, account_id: str = None):
        """Publish to Facebook."""
        print(f"Publishing to Facebook: {message[:50]}...", file=sys.stderr)
        
        # Get account token
        if account_id:
            account = self._get_account(account_id)
            if not account:
                return {"status": "error", "error": "Account not found"}
            
            token = account.get("config", {}).get("access_token")
            
            if not token:
                return {"status": "error", "error": "Account missing access_token"}
        else:
            return {"status": "error", "error": "account_id required"}
            
        # Build command
        args = ["--token", token, "--message", message]
        
        if page_id:
            args.extend(["--page-id", page_id])
            
        if photo:
            args.extend(["--photo", photo])
        elif photos:
            for p in photos:
                args.extend(["--photo", p])
        elif link:
            args.extend(["--link", link])
            
        result = self._run_script("facebook_publish.py", args)
        return result
        
    def publish_pinterest(self, title: str, image_url: str, board_id: str,
                          description: str = "", link: str = None, account_id: str = None):
        """Publish Pin to Pinterest."""
        print(f"Publishing to Pinterest: {title[:50]}...", file=sys.stderr)
        
        # Get account token
        if account_id:
            account = self._get_account(account_id)
            if not account:
                return {"status": "error", "error": "Account not found"}
            
            token = account.get("config", {}).get("access_token")
            
            if not token:
                return {"status": "error", "error": "Account missing access_token"}
                
            # Use account's default board if not specified
            if not board_id:
                board_id = account.get("config", {}).get("default_board_id")
        else:
            return {"status": "error", "error": "account_id required"}
            
        # Build command
        args = [
            "--token", token,
            "--board-id", board_id,
            "--title", title,
            "--image-url", image_url
        ]
        
        if description:
            args.extend(["--description", description])
        if link:
            args.extend(["--link", link])
            
        result = self._run_script("pinterest_publish.py", args)
        return result
        
    def publish_threads(self, text: str, image_url: str = None, video_url: str = None,
                        carousel_images: list = None, account_id: str = None):
        """Publish to Threads."""
        print(f"Publishing to Threads: {text[:50]}...", file=sys.stderr)
        
        # Get account token
        if account_id:
            account = self._get_account(account_id)
            if not account:
                return {"status": "error", "error": "Account not found"}
            
            token = account.get("config", {}).get("access_token")
            
            if not token:
                return {"status": "error", "error": "Account missing access_token"}
        else:
            return {"status": "error", "error": "account_id required"}
            
        # Build command
        args = ["--token", token, "--text", text]
        
        if image_url:
            args.extend(["--image-url", image_url])
        elif video_url:
            args.extend(["--video-url", video_url])
        elif carousel_images:
            args.extend(["--carousel-images"] + carousel_images)
            
        result = self._run_script("threads_publish.py", args)
        return result
        
    def list_accounts(self, platform: str = None):
        """List all configured accounts."""
        try:
            stmt = select(targetAccounts)
            
            if platform:
                stmt = stmt.where(targetAccounts.c.platform == platform)
                
            results = db.execute(stmt).fetchall()
            
            accounts = []
            for row in results:
                accounts.append({
                    "id": row.id,
                    "platform": row.platform,
                    "name": row.account_name,
                    "status": row.status
                })
                
            return {"status": "success", "accounts": accounts, "count": len(accounts)}
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def get_account_info(self, account_id: str, platform: str = None):
        """Get account info from API."""
        account = self._get_account(account_id)
        
        if not account:
            return {"status": "error", "error": "Account not found"}
            
        if "error" in account:
            return account
            
        # For API-based platforms, fetch live info
        if platform in ["facebook", "pinterest", "threads"]:
            token = account.get("config", {}).get("access_token")
            if token:
                args = ["--token", token, "--info"]
                script_map = {
                    "facebook": "facebook_publish.py",
                    "pinterest": "pinterest_publish.py",
                    "threads": "threads_publish.py"
                }
                result = self._run_script(script_map[platform], args)
                return result
                
        return {"status": "success", "account": account}


def main():
    """MCP stdio entry point."""
    mcp = ContentOpsMCP()
    
    # Read input from stdin
    try:
        input_data = json.loads(sys.stdin.read())
    except:
        input_data = {}
        
    method = input_data.get("method")
    params = input_data.get("params", {})
    
    # Route to appropriate method
    if method == "publish_xiaohongshu":
        result = mcp.publish_xiaohongshu(**params)
    elif method == "publish_x":
        result = mcp.publish_x(**params)
    elif method == "publish_instagram":
        result = mcp.publish_instagram(**params)
    elif method == "publish_facebook":
        result = mcp.publish_facebook(**params)
    elif method == "publish_pinterest":
        result = mcp.publish_pinterest(**params)
    elif method == "publish_threads":
        result = mcp.publish_threads(**params)
    elif method == "list_accounts":
        result = mcp.list_accounts(**params)
    elif method == "get_account_info":
        result = mcp.get_account_info(**params)
    else:
        result = {"status": "error", "error": f"Unknown method: {method}"}
        
    # Output result
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
