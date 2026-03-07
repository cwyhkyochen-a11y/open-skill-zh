#!/usr/bin/env python3
"""
Facebook 自动发布脚本

使用 facebook-sdk 库实现自动化发布
支持：个人主页动态、页面帖子、照片

Installation:
    pip install facebook-sdk

Usage:
    # 发布纯文本到个人主页
    python facebook_publish.py --token YOUR_ACCESS_TOKEN --message "Hello Facebook"

    # 发布带图片
    python facebook_publish.py --token YOUR_ACCESS_TOKEN \
        --message "Hello with photo" --photo photo.jpg

    # 发布到页面 (需要 page token)
    python facebook_publish.py --token PAGE_TOKEN \
        --page-id PAGE_ID --message "Hello Page"

    # 获取账号信息
    python facebook_publish.py --token YOUR_ACCESS_TOKEN --info

获取 Access Token:
    1. 访问 https://developers.facebook.com/tools/explorer/
    2. 创建应用并获取 User Access Token
    3. 需要权限: publish_posts, pages_manage_posts (发布到页面)
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Check if facebook-sdk is installed
try:
    import facebook
except ImportError:
    print("❌ 请先安装 facebook-sdk:")
    print("   pip install facebook-sdk")
    sys.exit(1)


class FacebookPublisher:
    """Facebook publisher using facebook-sdk."""
    
    # API Version
    API_VERSION = "18.0"
    
    def __init__(self, access_token: str, page_id: str = None):
        self.access_token = access_token
        self.page_id = page_id
        self.graph = facebook.GraphAPI(access_token=access_token, version=self.API_VERSION)
        
    def get_user_info(self):
        """Get current user/page info."""
        try:
            if self.page_id:
                # Get page info
                page = self.graph.get_object(
                    self.page_id,
                    fields="id,name,fan_count,link,category"
                )
                return {
                    "type": "page",
                    "id": page.get("id"),
                    "name": page.get("name"),
                    "followers": page.get("fan_count"),
                    "link": page.get("link"),
                    "category": page.get("category")
                }
            else:
                # Get user info
                user = self.graph.get_object(
                    "me",
                    fields="id,name,email,link"
                )
                return {
                    "type": "user",
                    "id": user.get("id"),
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "link": user.get("link")
                }
        except facebook.GraphAPIError as e:
            return {"error": str(e)}
            
    def publish_text(self, message: str, link: str = None):
        """
        Publish text post.
        
        Args:
            message: Post text content
            link: Optional link to share
        """
        print(f"📝 发布文本: {message[:50]}...")
        
        try:
            # Determine target (page or user)
            target = self.page_id if self.page_id else "me"
            
            # Prepare data
            data = {"message": message}
            if link:
                data["link"] = link
                
            # Publish
            post = self.graph.put_object(target, "feed", **data)
            
            post_id = post.get("id")
            print(f"✅ 发布成功!")
            print(f"   Post ID: {post_id}")
            
            # Build post URL
            if self.page_id:
                url = f"https://facebook.com/{post_id.replace('_', '/posts/')}"
            else:
                url = f"https://facebook.com/{post_id.replace('_', '/posts/')}"
                
            print(f"   URL: {url}")
            
            return {
                "status": "published",
                "id": post_id,
                "url": url
            }
            
        except facebook.GraphAPIError as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def publish_photo(self, photo_path: str, message: str = ""):
        """
        Publish photo with optional caption.
        
        Args:
            photo_path: Path to photo file
            message: Caption text
        """
        print(f"🖼️  发布图片: {os.path.basename(photo_path)}")
        
        if not os.path.exists(photo_path):
            return {"status": "error", "error": f"File not found: {photo_path}"}
            
        try:
            # Determine target
            target = self.page_id if self.page_id else "me"
            
            # Publish photo
            with open(photo_path, "rb") as image_file:
                post = self.graph.put_photo(
                    image=image_file,
                    message=message,
                    album_path=f"{target}/photos"
                )
                
            post_id = post.get("id")
            print(f"✅ 发布成功!")
            print(f"   Photo ID: {post_id}")
            
            # Build URL
            if self.page_id:
                url = f"https://facebook.com/{self.page_id}/photos/{post_id}"
            else:
                url = f"https://facebook.com/photo.php?fbid={post_id}"
                
            print(f"   URL: {url}")
            
            return {
                "status": "published",
                "id": post_id,
                "url": url
            }
            
        except facebook.GraphAPIError as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def publish_photos(self, photo_paths: list, message: str = ""):
        """
        Publish multiple photos as an album/post.
        
        Args:
            photo_paths: List of photo file paths (max 10 recommended)
            message: Caption text
        """
        print(f"🖼️  发布多图: {len(photo_paths)} 张")
        
        if len(photo_paths) > 10:
            print("⚠️  建议最多 10 张图片，将只上传前 10 张")
            photo_paths = photo_paths[:10]
            
        try:
            target = self.page_id if self.page_id else "me"
            
            # For multiple photos, we need to upload each and create a post
            # First, upload photos to get their IDs
            photo_ids = []
            for i, photo_path in enumerate(photo_paths):
                if not os.path.exists(photo_path):
                    print(f"   ⚠️  跳过不存在的文件: {photo_path}")
                    continue
                    
                print(f"   📤 上传第 {i+1}/{len(photo_paths)} 张...")
                
                with open(photo_path, "rb") as image_file:
                    photo = self.graph.put_photo(
                        image=image_file,
                        published=False  # Don't publish yet, just upload
                    )
                    photo_ids.append({"media_fbid": photo.get("id")})
                    
            if not photo_ids:
                return {"status": "error", "error": "No valid photos to upload"}
                
            # Create post with attached photos
            post = self.graph.put_object(
                target,
                "feed",
                message=message,
                attached_media=json.dumps(photo_ids)
            )
            
            post_id = post.get("id")
            print(f"✅ 发布成功!")
            print(f"   Post ID: {post_id}")
            
            url = f"https://facebook.com/{post_id.replace('_', '/posts/')}"
            print(f"   URL: {url}")
            
            return {
                "status": "published",
                "id": post_id,
                "url": url
            }
            
        except facebook.GraphAPIError as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def get_pages(self):
        """Get list of pages managed by user."""
        try:
            pages = self.graph.get_object(
                "me/accounts",
                fields="id,name,access_token,category,fan_count"
            )
            
            page_list = []
            for page in pages.get("data", []):
                page_list.append({
                    "id": page.get("id"),
                    "name": page.get("name"),
                    "category": page.get("category"),
                    "followers": page.get("fan_count"),
                    "access_token": page.get("access_token")
                })
                
            return page_list
            
        except facebook.GraphAPIError as e:
            return [{"error": str(e)}]


def main():
    parser = argparse.ArgumentParser(description="Publish to Facebook")
    parser.add_argument("--token", "-t", required=False, help="Facebook Access Token")
    parser.add_argument("--token-file", required=False, help="Path to file containing Facebook access token")
    parser.add_argument("--page-id", help="Page ID (for publishing to page)")
    parser.add_argument("--message", "-m", help="Post message/text")
    parser.add_argument("--photo", help="Single photo path")
    parser.add_argument("--photos", nargs="+", help="Multiple photo paths")
    parser.add_argument("--link", help="Link to share")
    parser.add_argument("--info", action="store_true", help="Show user/page info")
    parser.add_argument("--list-pages", action="store_true", help="List managed pages")
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
    publisher = FacebookPublisher(
        access_token=token,
        page_id=args.page_id
    )
    
    try:
        # Show info only
        if args.info:
            info = publisher.get_user_info()
            print("\n👤 账号信息:")
            print(json.dumps(info, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # List pages
        if args.list_pages:
            pages = publisher.get_pages()
            print("\n📄 管理的页面:")
            print(json.dumps(pages, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Validate input
        if not args.message and not args.photo and not args.photos:
            print("❌ 请提供 --message, --photo 或 --photos")
            sys.exit(1)
            
        # Publish
        if args.photos:
            # Multiple photos
            result = publisher.publish_photos(args.photos, args.message or "")
        elif args.photo:
            # Single photo
            result = publisher.publish_photo(args.photo, args.message or "")
        else:
            # Text only
            result = publisher.publish_text(args.message, args.link)
            
        # Output result
        if args.json:
            print(json.dumps(result, ensure_ascii=False))
        else:
            print("\n📊 结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if result.get("status") == "published":
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
