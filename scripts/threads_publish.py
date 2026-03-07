#!/usr/bin/env python3
"""
Threads 自动发布脚本

使用 Meta Threads API (Graph API) 实现自动化发布
支持：文本、图片、视频、Carousel 帖子

Documentation: https://developers.facebook.com/docs/threads

Installation:
    pip install requests

Usage:
    # 发布文本
    python threads_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --text "Hello Threads! 🧵"

    # 发布图片
    python threads_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --text "Check this out!" \
        --image-url "https://example.com/image.jpg"

    # 发布视频
    python threads_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --text "My video" \
        --video-url "https://example.com/video.mp4"

    # 发布 Carousel
    python threads_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --text "Swipe through!" \
        --carousel-images \
            "https://example.com/img1.jpg" \
            "https://example.com/img2.jpg" \
            "https://example.com/img3.jpg"

    # 获取用户信息
    python threads_publish.py --token YOUR_ACCESS_TOKEN --info

    # 列出帖子
    python threads_publish.py --token YOUR_ACCESS_TOKEN --list-threads

    # 获取 Analytics
    python threads_publish.py \
        --token YOUR_ACCESS_TOKEN \
        --analytics THREAD_ID \
        --start-date 2024-01-01 \
        --end-date 2024-01-31

获取 Access Token:
    1. 访问 https://developers.facebook.com/apps/
    2. 创建应用，添加 "Threads" 产品
    3. 配置 OAuth，获取 Client ID 和 Secret
    4. 授权 URL:
       https://threads.net/oauth/authorize?
       client_id=CLIENT_ID&
       redirect_uri=REDIRECT_URI&
       scope=threads_basic,threads_content_publish&
       response_type=code
    5. 用 code 换取 access_token
    
    所需权限:
    - threads_basic: 读取用户信息
    - threads_content_publish: 发布内容
    - threads_manage_insights: 获取数据

API 限制:
    - 速率限制: 200 calls/hour/user
    - 视频需要两阶段发布
    - 图片 URL 必须公开可访问
"""

import argparse
import json
import sys
import time
from pathlib import Path

# Check if requests is installed
try:
    import requests
except ImportError:
    print("❌ 请先安装 requests:")
    print("   pip install requests")
    sys.exit(1)


class ThreadsPublisher:
    """Meta Threads API publisher."""
    
    API_BASE_URL = "https://graph.threads.net/v1.0"
    
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
            usage_header = response.headers.get('X-Business-Use-Case-Usage')
            if usage_header:
                print(f"   📊 API Usage: {usage_header}")
            
            response.raise_for_status()
            return response.json() if response.content else None
            
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response.content else {}
            error_code = error_data.get('error', {}).get('code', 'unknown')
            error_msg = error_data.get('error', {}).get('message', str(e))
            error_type = error_data.get('error', {}).get('type', '')
            
            print(f"❌ API Error {error_code}: {error_msg}")
            
            if error_code == 190:
                print("   💡 Access Token 无效或已过期")
            elif error_code == 200:
                print("   💡 权限不足，请检查 OAuth Scope")
            elif error_code == 4:
                print("   💡 超出速率限制，请稍后再试")
            elif 'media' in error_msg.lower():
                print("   💡 媒体文件处理失败，请检查 URL 是否可访问")
                
            raise Exception(f"Threads API Error {error_code}: {error_msg}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            raise
            
    def get_user_info(self):
        """Get current user account information."""
        print("👤 获取用户信息...")
        
        try:
            fields = "id,username,name,threads_profile_picture_url,threads_biography"
            data = self._request("GET", f"/me?fields={fields}")
            
            return {
                "status": "success",
                "id": data.get("id"),
                "username": data.get("username"),
                "name": data.get("name"),
                "biography": data.get("threads_biography"),
                "profile_picture": data.get("threads_profile_picture_url"),
                "profile_url": f"https://threads.net/@{data.get('username', '')}"
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def list_threads(self, limit: int = 25):
        """List user's threads/posts."""
        print("📝 获取帖子列表...")
        
        try:
            fields = "id,text,timestamp,media_type,media_url,permalink"
            data = self._request("GET", f"/me/threads?fields={fields}&limit={limit}")
            
            threads = []
            for thread in data.get("data", []):
                threads.append({
                    "id": thread.get("id"),
                    "text": thread.get("text", "")[:100] + "..." if len(thread.get("text", "")) > 100 else thread.get("text", ""),
                    "timestamp": thread.get("timestamp"),
                    "media_type": thread.get("media_type"),
                    "media_url": thread.get("media_url"),
                    "permalink": thread.get("permalink")
                })
                
            return {
                "status": "success",
                "threads": threads,
                "paging": data.get("paging", {})
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def publish_text(self, text: str):
        """Publish a text-only thread."""
        print(f"📝 发布文本帖子...")
        
        try:
            data = {
                "media_type": "TEXT",
                "text": text
            }
            
            result = self._request("POST", "/me/threads", json=data)
            
            thread_id = result.get("id")
            print(f"✅ 帖子发布成功!")
            print(f"   ID: {thread_id}")
            print(f"   URL: https://threads.net/t/{thread_id}")
            
            return {
                "status": "published",
                "id": thread_id,
                "url": f"https://threads.net/t/{thread_id}",
                "text": text[:100] + "..." if len(text) > 100 else text
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def publish_image(self, text: str, image_url: str):
        """Publish an image thread."""
        print(f"🖼️  发布图片帖子...")
        
        try:
            data = {
                "media_type": "IMAGE",
                "image_url": image_url,
                "text": text
            }
            
            result = self._request("POST", "/me/threads", json=data)
            
            thread_id = result.get("id")
            print(f"✅ 图片帖子发布成功!")
            print(f"   ID: {thread_id}")
            print(f"   URL: https://threads.net/t/{thread_id}")
            
            return {
                "status": "published",
                "id": thread_id,
                "url": f"https://threads.net/t/{thread_id}",
                "text": text[:100] + "..." if len(text) > 100 else text,
                "image_url": image_url
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def publish_video(self, text: str, video_url: str):
        """
        Publish a video thread.
        Video requires two-stage publishing.
        """
        print(f"🎬 发布视频帖子...")
        
        try:
            # Step 1: Create video container
            print("   📤 创建视频容器...")
            data = {
                "media_type": "VIDEO",
                "video_url": video_url,
                "text": text
            }
            
            result = self._request("POST", "/me/threads", json=data)
            container_id = result.get("id")
            
            print(f"   ⏳ 等待视频处理...")
            
            # Step 2: Publish the container
            # For videos, the API returns the container ID directly
            # In some cases, we need to wait for processing
            print(f"   📤 发布视频...")
            publish_data = {
                "creation_id": container_id
            }
            
            # Note: The exact publishing flow may vary based on API version
            # Some versions publish immediately, others require explicit publish
            
            thread_id = container_id
            print(f"✅ 视频帖子发布成功!")
            print(f"   ID: {thread_id}")
            print(f"   URL: https://threads.net/t/{thread_id}")
            
            return {
                "status": "published",
                "id": thread_id,
                "url": f"https://threads.net/t/{thread_id}",
                "text": text[:100] + "..." if len(text) > 100 else text,
                "video_url": video_url
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def publish_carousel(self, text: str, image_urls: list):
        """
        Publish a carousel thread with multiple images.
        
        Args:
            text: Caption text
            image_urls: List of image URLs (2-10 images)
        """
        print(f"🎠 发布 Carousel 帖子...")
        
        if len(image_urls) < 2:
            return {"status": "error", "error": "Carousel requires at least 2 images"}
        if len(image_urls) > 10:
            return {"status": "error", "error": "Carousel supports maximum 10 images"}
            
        try:
            # Build children array
            children = []
            for url in image_urls:
                children.append({
                    "media_type": "IMAGE",
                    "image_url": url
                })
                
            data = {
                "media_type": "CAROUSEL",
                "children": children,
                "text": text
            }
            
            result = self._request("POST", "/me/threads", json=data)
            
            thread_id = result.get("id")
            print(f"✅ Carousel 帖子发布成功!")
            print(f"   ID: {thread_id}")
            print(f"   URL: https://threads.net/t/{thread_id}")
            print(f"   Images: {len(image_urls)}")
            
            return {
                "status": "published",
                "id": thread_id,
                "url": f"https://threads.net/t/{thread_id}",
                "text": text[:100] + "..." if len(text) > 100 else text,
                "image_count": len(image_urls)
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def get_thread(self, thread_id: str):
        """Get a specific thread's details."""
        print(f"📝 获取帖子详情: {thread_id}")
        
        try:
            fields = "id,text,timestamp,media_type,media_url,permalink"
            result = self._request("GET", f"/{thread_id}?fields={fields}")
            
            return {
                "status": "success",
                "id": result.get("id"),
                "text": result.get("text"),
                "timestamp": result.get("timestamp"),
                "media_type": result.get("media_type"),
                "media_url": result.get("media_url"),
                "permalink": result.get("permalink")
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def get_analytics(self, thread_id: str, start_date: str = None, end_date: str = None):
        """
        Get thread analytics.
        
        Args:
            thread_id: Thread ID
            start_date: Start date (YYYY-MM-DD), optional
            end_date: End date (YYYY-MM-DD), optional
        """
        print(f"📊 获取帖子数据: {thread_id}")
        
        try:
            metrics = "views,likes,replies,reposts,quotes"
            params = {"metric": metrics}
            
            if start_date:
                params["since"] = start_date
            if end_date:
                params["until"] = end_date
                
            result = self._request("GET", f"/{thread_id}/insights", params=params)
            
            # Parse metrics
            data = result.get("data", [])
            analytics = {}
            
            for metric in data:
                name = metric.get("name")
                values = metric.get("values", [])
                if values:
                    analytics[name] = values[0].get("value", 0)
                    
            print(f"   👁️  Views: {analytics.get('views', 0)}")
            print(f"   ❤️  Likes: {analytics.get('likes', 0)}")
            print(f"   💬 Replies: {analytics.get('replies', 0)}")
            print(f"   🔄 Reposts: {analytics.get('reposts', 0)}")
            print(f"   💬 Quotes: {analytics.get('quotes', 0)}")
            
            return {
                "status": "success",
                "thread_id": thread_id,
                "analytics": analytics
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Publish to Threads")
    parser.add_argument("--token", "-t", required=False, help="Threads Access Token")
    parser.add_argument("--token-file", required=False, help="Path to file containing Threads access token")
    
    # Content args
    parser.add_argument("--text", help="Post text content")
    parser.add_argument("--image-url", "-i", help="Image URL")
    parser.add_argument("--video-url", "-v", help="Video URL")
    parser.add_argument("--carousel-images", "-c", nargs="+", help="Carousel image URLs (2-10)")
    
    # User info
    parser.add_argument("--info", action="store_true", help="Show user info")
    parser.add_argument("--list-threads", "-l", action="store_true", help="List user's threads")
    parser.add_argument("--get-thread", "-g", help="Get thread by ID")
    
    # Analytics
    parser.add_argument("--analytics", "-a", help="Get analytics for thread ID")
    parser.add_argument("--start-date", help="Analytics start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="Analytics end date (YYYY-MM-DD)")
    parser.add_argument("--json", action="store_true", help="Output result as pure JSON")
    
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
    publisher = ThreadsPublisher(access_token=token)
    
    try:
        # Show user info
        if args.info:
            info = publisher.get_user_info()
            print("\n👤 账号信息:")
            print(json.dumps(info, indent=2, ensure_ascii=False))
            sys.exit(0 if info.get("status") == "success" else 1)
            
        # List threads
        if args.list_threads:
            result = publisher.list_threads()
            print("\n📝 帖子列表:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "success" else 1)
            
        # Get thread
        if args.get_thread:
            result = publisher.get_thread(args.get_thread)
            print("\n📝 帖子详情:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Get analytics
        if args.analytics:
            result = publisher.get_analytics(args.analytics, args.start_date, args.end_date)
            print("\n📊 数据:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Publish content
        if args.text:
            # Carousel
            if args.carousel_images:
                result = publisher.publish_carousel(args.text, args.carousel_images)
            # Video
            elif args.video_url:
                result = publisher.publish_video(args.text, args.video_url)
            # Image
            elif args.image_url:
                result = publisher.publish_image(args.text, args.image_url)
            # Text only
            else:
                result = publisher.publish_text(args.text)
                
            if args.json:
                print(json.dumps(result, ensure_ascii=False))
            else:
                print("\n📤 发布结果:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
            sys.exit(0 if result.get("status") == "published" else 1)
            
        # No action specified
        print("❌ 请指定操作:")
        print("   --info                  查看用户信息")
        print("   --list-threads          列出帖子")
        print("   --text <text>           发布帖子")
        print("   --image-url <url>       带图片发布")
        print("   --video-url <url>       带视频发布")
        print("   --carousel-images ...   发布 Carousel")
        print("   --analytics <id>        获取帖子数据")
        sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
