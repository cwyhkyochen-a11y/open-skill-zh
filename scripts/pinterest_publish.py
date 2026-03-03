#!/usr/bin/env python3
"""
Pinterest 自动发布脚本

使用 Pinterest API v5 实现自动化发布
支持：创建 Pin、管理 Boards、获取 Analytics

Documentation: https://developers.pinterest.com/docs/api/v5/

Installation:
    pip install requests

Usage:
    # 发布图片到指定 Board
    python pinterest_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --board-id BOARD_ID \
        --title "Pin Title" \
        --image-url "https://example.com/image.jpg"

    # 带描述和链接
    python pinterest_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --board-id BOARD_ID \
        --title "Pin Title" \
        --description "Pin description" \
        --link "https://example.com/article" \
        --image-url "https://example.com/image.jpg"

    # 使用本地图片
    python pinterest_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --board-id BOARD_ID \
        --title "Pin Title" \
        --image-file "path/to/image.jpg"

    # 列出用户的 Boards
    python pinterest_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --list-boards

    # 创建新 Board
    python pinterest_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --create-board "My New Board" \
        --privacy PUBLIC

获取 Access Token:
    1. 访问 https://developers.pinterest.com/apps/
    2. 创建应用获取 Client ID 和 Client Secret
    3. OAuth 授权获取 Access Token
    4. 需要权限: boards:read, boards:write, pins:read, pins:write
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

# Check if requests is installed
try:
    import requests
except ImportError:
    print("❌ 请先安装 requests:")
    print("   pip install requests")
    sys.exit(1)


class PinterestPublisher:
    """Pinterest API v5 publisher."""
    
    API_BASE_URL = "https://api.pinterest.com/v5"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        })
        
    def _request(self, method: str, endpoint: str, **kwargs):
        """Make API request with error handling."""
        url = f"{self.API_BASE_URL}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            
            # Check rate limits
            rate_limit = response.headers.get('X-RateLimit-Limit')
            rate_remaining = response.headers.get('X-RateLimit-Remaining')
            if rate_limit and rate_remaining:
                print(f"   📊 Rate Limit: {rate_remaining}/{rate_limit}")
            
            response.raise_for_status()
            return response.json() if response.content else None
            
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response.content else {}
            error_code = error_data.get('code', 'unknown')
            error_msg = error_data.get('message', str(e))
            
            print(f"❌ API Error {error_code}: {error_msg}")
            
            if error_code == 8:
                print("   💡 Access Token 无效或已过期，请重新获取")
            elif error_code == 4:
                print("   💡 权限不足，请检查 OAuth Scope")
            elif error_code == 2:
                print("   💡 超出速率限制，请稍后再试")
                
            raise Exception(f"Pinterest API Error {error_code}: {error_msg}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            raise
            
    def get_user_info(self):
        """Get current user account information."""
        print("👤 获取用户信息...")
        
        try:
            data = self._request("GET", "/user_account")
            
            return {
                "id": data.get("account_type"),
                "username": data.get("username"),
                "account_type": data.get("account_type"),
                "website": data.get("website_url"),
                "followers": data.get("follower_count"),
                "following": data.get("following_count"),
                "boards": data.get("board_count"),
                "pins": data.get("pin_count"),
                "profile_image": data.get("profile_image")
            }
            
        except Exception as e:
            return {"error": str(e)}
            
    def list_boards(self, page_size: int = 25):
        """List user's boards."""
        print("📋 获取 Boards 列表...")
        
        try:
            data = self._request("GET", "/boards", params={"page_size": page_size})
            
            boards = []
            for board in data.get("items", []):
                boards.append({
                    "id": board.get("id"),
                    "name": board.get("name"),
                    "description": board.get("description"),
                    "privacy": board.get("privacy"),
                    "url": f"https://pinterest.com{board.get('url', '')}",
                    "pin_count": board.get("pin_count", 0),
                    "owner": board.get("owner", {}).get("username")
                })
                
            return {
                "status": "success",
                "boards": boards,
                "bookmark": data.get("bookmark")
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def create_board(self, name: str, description: str = "", privacy: str = "PUBLIC"):
        """
        Create a new board.
        
        Args:
            name: Board name
            description: Board description
            privacy: PUBLIC, PROTECTED, or SECRET
        """
        print(f"📁 创建 Board: {name}")
        
        try:
            data = {
                "name": name,
                "description": description,
                "privacy": privacy
            }
            
            result = self._request("POST", "/boards", json=data)
            
            board_id = result.get("id")
            print(f"✅ Board 创建成功!")
            print(f"   ID: {board_id}")
            print(f"   URL: https://pinterest.com{result.get('url', '')}")
            
            return {
                "status": "created",
                "id": board_id,
                "name": result.get("name"),
                "url": f"https://pinterest.com{result.get('url', '')}"
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def create_pin(self, board_id: str, title: str, description: str = "",
                   link: str = "", image_url: str = None, image_file: str = None):
        """
        Create a new pin.
        
        Args:
            board_id: Target board ID
            title: Pin title
            description: Pin description
            link: Destination link
            image_url: URL to image (for remote images)
            image_file: Local image file path
        """
        print(f"📌 创建 Pin: {title[:50]}...")
        
        try:
            # Prepare media source
            if image_file:
                # Upload local file
                if not os.path.exists(image_file):
                    return {"status": "error", "error": f"File not found: {image_file}"}
                    
                print(f"   📤 上传本地图片: {os.path.basename(image_file)}")
                
                # For local files, we need to upload first
                # Pinterest v5 API supports direct URL or base64 for small images
                # For simplicity, we'll use a different approach
                with open(image_file, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
                    
                # Note: Pinterest API primarily supports URL-based images
                # For local files, you may need to upload to a temporary hosting
                # or use the media upload endpoints
                print("   ⚠️  Pinterest API v5 主要支持 URL 图片")
                print("   💡 建议先上传图片到图床，然后使用 --image-url")
                return {"status": "error", "error": "Local file upload not directly supported. Use image_url."}
                
            elif image_url:
                # Use remote URL
                media_source = {
                    "source_type": "image_url",
                    "url": image_url
                }
            else:
                return {"status": "error", "error": "Please provide --image-url or --image-file"}
                
            # Build pin data
            data = {
                "board_id": board_id,
                "title": title,
                "description": description,
                "link": link,
                "media_source": media_source
            }
            
            result = self._request("POST", "/pins", json=data)
            
            pin_id = result.get("id")
            print(f"✅ Pin 创建成功!")
            print(f"   ID: {pin_id}")
            print(f"   URL: https://pinterest.com/pin/{pin_id}/")
            
            return {
                "status": "published",
                "id": pin_id,
                "title": result.get("title"),
                "url": f"https://pinterest.com/pin/{pin_id}/",
                "board_id": board_id
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def get_pin(self, pin_id: str):
        """Get pin details."""
        print(f"📌 获取 Pin 详情: {pin_id}")
        
        try:
            result = self._request("GET", f"/pins/{pin_id}")
            
            return {
                "status": "success",
                "id": result.get("id"),
                "title": result.get("title"),
                "description": result.get("description"),
                "link": result.get("link"),
                "url": f"https://pinterest.com/pin/{pin_id}/",
                "board_id": result.get("board_id"),
                "created_at": result.get("created_at"),
                "media": result.get("media", {})
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def delete_pin(self, pin_id: str):
        """Delete a pin."""
        print(f"🗑️  删除 Pin: {pin_id}")
        
        try:
            self._request("DELETE", f"/pins/{pin_id}")
            
            print("✅ Pin 已删除")
            return {"status": "deleted", "id": pin_id}
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def get_pin_analytics(self, pin_id: str, start_date: str, end_date: str):
        """
        Get pin analytics.
        
        Args:
            pin_id: Pin ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
        """
        print(f"📊 获取 Pin Analytics: {pin_id}")
        
        try:
            params = {
                "start_date": start_date,
                "end_date": end_date,
                "metric_types": "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK"
            }
            
            result = self._request("GET", f"/pins/{pin_id}/analytics", params=params)
            
            metrics = result.get("all", {}).get("daily_metrics", [])
            
            # Aggregate metrics
            total = {
                "impressions": 0,
                "saves": 0,
                "clicks": 0,
                "outbound_clicks": 0
            }
            
            for day in metrics:
                m = day.get("metrics", {})
                total["impressions"] += m.get("IMPRESSION", 0)
                total["saves"] += m.get("SAVE", 0)
                total["clicks"] += m.get("PIN_CLICK", 0)
                total["outbound_clicks"] += m.get("OUTBOUND_CLICK", 0)
                
            print(f"   📈 Impressions: {total['impressions']}")
            print(f"   💾 Saves: {total['saves']}")
            print(f"   👆 Clicks: {total['clicks']}")
            
            return {
                "status": "success",
                "pin_id": pin_id,
                "total": total,
                "daily": metrics
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Publish to Pinterest")
    parser.add_argument("--token", "-t", required=False, help="Pinterest Access Token")
    parser.add_argument("--token-file", required=False, help="Path to file containing Pinterest access token")
    
    # Pin creation args
    parser.add_argument("--board-id", "-b", help="Target Board ID")
    parser.add_argument("--title", help="Pin title")
    parser.add_argument("--description", "-d", default="", help="Pin description")
    parser.add_argument("--link", "-l", help="Destination link")
    parser.add_argument("--image-url", "-u", help="Image URL")
    parser.add_argument("--image-file", "-f", help="Local image file path")
    
    # Board management
    parser.add_argument("--list-boards", action="store_true", help="List user's boards")
    parser.add_argument("--create-board", help="Create new board with this name")
    parser.add_argument("--board-description", default="", help="New board description")
    parser.add_argument("--privacy", default="PUBLIC", choices=["PUBLIC", "PROTECTED", "SECRET"],
                        help="Board privacy setting")
    
    # Pin management
    parser.add_argument("--get-pin", help="Get pin details by ID")
    parser.add_argument("--delete-pin", help="Delete pin by ID")
    parser.add_argument("--analytics", help="Get analytics for pin ID")
    parser.add_argument("--start-date", help="Analytics start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="Analytics end date (YYYY-MM-DD)")
    
    # User info
    parser.add_argument("--info", action="store_true", help="Show user info")
    
    args = parser.parse_args()
    
    # Resolve token
    if not args.token and not args.token_file:
        print("❌ 需要提供 --token 或 --token-file")
        sys.exit(1)

    if args.token_file:
        from _secrets import read_secret_file
        token = read_secret_file(args.token_file)
    else:
        token = args.token

    # Create publisher
    publisher = PinterestPublisher(access_token=token)
    
    try:
        # Show user info
        if args.info:
            info = publisher.get_user_info()
            print("\n👤 账号信息:")
            print(json.dumps(info, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # List boards
        if args.list_boards:
            result = publisher.list_boards()
            print("\n📋 Boards:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "success" else 1)
            
        # Create board
        if args.create_board:
            result = publisher.create_board(
                name=args.create_board,
                description=args.board_description,
                privacy=args.privacy
            )
            print("\n📁 结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "created" else 1)
            
        # Get pin
        if args.get_pin:
            result = publisher.get_pin(args.get_pin)
            print("\n📌 Pin 详情:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Delete pin
        if args.delete_pin:
            result = publisher.delete_pin(args.delete_pin)
            print("\n🗑️  结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "deleted" else 1)
            
        # Get analytics
        if args.analytics:
            if not args.start_date or not args.end_date:
                print("❌ 请提供 --start-date 和 --end-date")
                sys.exit(1)
            result = publisher.get_pin_analytics(args.analytics, args.start_date, args.end_date)
            print("\n📊 Analytics:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Create pin
        if args.title:
            if not args.board_id:
                print("❌ 请提供 --board-id")
                sys.exit(1)
                
            result = publisher.create_pin(
                board_id=args.board_id,
                title=args.title,
                description=args.description,
                link=args.link,
                image_url=args.image_url,
                image_file=args.image_file
            )
            
            print("\n📌 结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "published" else 1)
            
        # No action specified
        print("❌ 请指定操作:")
        print("   --info                  查看用户信息")
        print("   --list-boards           列出 Boards")
        print("   --create-board <name>   创建 Board")
        print("   --title <title>         创建 Pin")
        print("   --get-pin <id>          获取 Pin 详情")
        print("   --analytics <id>        获取 Pin Analytics")
        sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
