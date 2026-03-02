#!/usr/bin/env python3
"""
Instagram 自动发布脚本

使用 instagrapi 库实现自动化发布
支持：图片、视频、Stories、Reels

Installation:
    pip install instagrapi

Usage:
    # 发布图片
    python instagram_publish.py --username myaccount --password mypass \
        --caption "Hello Instagram" --image photo.jpg

    # 发布多张图片（Carousel）
    python instagram_publish.py -u myaccount -p mypass \
        -c "My photos" --images photo1.jpg photo2.jpg photo3.jpg

    # 发布视频
    python instagram_publish.py -u myaccount -p mypass \
        -c "My video" --video video.mp4

    # 发布 Story
    python instagram_publish.py -u myaccount -p mypass \
        --story --image story.jpg

    # 使用 session 文件（避免重复登录）
    python instagram_publish.py -u myaccount -p mypass \
        --session-file ~/.ig_session.json --caption "Hello" --image photo.jpg

    # 使用代理（解决 SSL/连接问题）
    python instagram_publish.py -u myaccount -p mypass \
        --proxy "http://127.0.0.1:7890" \
        --caption "Hello" --image photo.jpg

故障排除:
    SSL 错误 (SSLEOFError):
    - 升级 instagrapi: pip install --upgrade instagrapi
    - 关闭 VPN 再试
    - 使用 --proxy 参数指定代理
    - 检查网络是否能访问 Instagram: curl -I https://i.instagram.com
"""

import argparse
import json
import os
import sys
import ssl
import urllib3
from pathlib import Path

# Disable SSL warnings for compatibility
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Fix SSL issues on some systems
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except:
    pass

# Check if instagrapi is installed
try:
    from instagrapi import Client
    from instagrapi.exceptions import (
        LoginRequired, ChallengeRequired, 
        CheckpointRequired, BadPassword
    )
except ImportError:
    print("❌ 请先安装 instagrapi:")
    print("   pip install instagrapi")
    print("\n更多依赖:")
    print("   pip install instagrapi pillow moviepy")
    sys.exit(1)


class InstagramPublisher:
    """Instagram publisher using instagrapi."""
    
    def __init__(self, username: str, password: str, session_file: str = None, proxy: str = None):
        self.username = username
        self.password = password
        self.session_file = session_file or f"~/.ig_session_{username}.json"
        self.proxy = proxy
        self.client = Client()
        
        # Set proxy if provided
        if proxy:
            self.client.set_proxy(proxy)
        
    def login(self):
        """Login to Instagram."""
        print(f"🔐 登录 Instagram: {self.username}")
        
        # Try to load existing session
        session_path = os.path.expanduser(self.session_file)
        if os.path.exists(session_path):
            print(f"📂 尝试加载 session: {session_path}")
            try:
                self.client.load_settings(session_path)
                self.client.login(self.username, self.password)
                print("✅ 使用现有 session 登录成功")
                return True
            except Exception as e:
                print(f"⚠️  Session 失效: {e}")
                print("🔄 重新登录...")
                
        # Fresh login
        try:
            self.client.login(self.username, self.password)
            
            # Save session
            self.client.dump_settings(session_path)
            print(f"💾 Session 已保存: {session_path}")
            
            print("✅ 登录成功")
            return True
            
        except BadPassword:
            print("❌ 密码错误")
            return False
        except ChallengeRequired:
            print("⚠️  需要验证（Challenge）")
            print("   请先在手机 App 中完成验证")
            return False
        except CheckpointRequired:
            print("⚠️  需要安全检查（Checkpoint）")
            print("   请访问 Instagram 网站完成验证")
            return False
        except Exception as e:
            print(f"❌ 登录失败: {e}")
            return False
            
    def publish_photo(self, image_path: str, caption: str = ""):
        """Publish a single photo."""
        print(f"🖼️  发布图片: {os.path.basename(image_path)}")
        
        try:
            media = self.client.photo_upload(
                Path(image_path),
                caption=caption
            )
            
            print(f"✅ 发布成功!")
            print(f"   ID: {media.pk}")
            print(f"   URL: https://instagram.com/p/{media.code}/")
            
            return {
                "status": "published",
                "id": media.pk,
                "code": media.code,
                "url": f"https://instagram.com/p/{media.code}/"
            }
            
        except Exception as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def publish_album(self, image_paths: list, caption: str = ""):
        """Publish multiple photos (carousel/album)."""
        print(f"🖼️  发布相册: {len(image_paths)} 张图片")
        
        paths = [Path(p) for p in image_paths]
        
        try:
            media = self.client.album_upload(
                paths,
                caption=caption
            )
            
            print(f"✅ 发布成功!")
            print(f"   ID: {media.pk}")
            print(f"   URL: https://instagram.com/p/{media.code}/")
            
            return {
                "status": "published",
                "id": media.pk,
                "code": media.code,
                "url": f"https://instagram.com/p/{media.code}/"
            }
            
        except Exception as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def publish_video(self, video_path: str, caption: str = ""):
        """Publish a video."""
        print(f"🎥 发布视频: {os.path.basename(video_path)}")
        
        try:
            media = self.client.video_upload(
                Path(video_path),
                caption=caption
            )
            
            print(f"✅ 发布成功!")
            print(f"   ID: {media.pk}")
            print(f"   URL: https://instagram.com/p/{media.code}/")
            
            return {
                "status": "published",
                "id": media.pk,
                "code": media.code,
                "url": f"https://instagram.com/p/{media.code}/"
            }
            
        except Exception as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def publish_story(self, media_path: str, caption: str = ""):
        """Publish a story."""
        print(f"📖 发布 Story: {os.path.basename(media_path)}")
        
        try:
            path = Path(media_path)
            
            if media_path.lower().endswith(('.mp4', '.mov', '.avi')):
                # Video story
                media = self.client.video_upload_to_story(path)
            else:
                # Photo story
                media = self.client.photo_upload_to_story(path, caption=caption)
                
            print(f"✅ Story 发布成功!")
            print(f"   ID: {media.pk}")
            
            return {
                "status": "published",
                "id": media.pk,
                "type": "story"
            }
            
        except Exception as e:
            print(f"❌ 发布失败: {e}")
            return {"status": "error", "error": str(e)}
            
    def get_user_info(self):
        """Get current user info."""
        try:
            user_id = self.client.user_id
            user_info = self.client.user_info(user_id)
            
            return {
                "username": user_info.username,
                "full_name": user_info.full_name,
                "followers": user_info.follower_count,
                "following": user_info.following_count,
                "posts": user_info.media_count,
                "biography": user_info.biography
            }
        except Exception as e:
            return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Publish to Instagram")
    parser.add_argument("-u", "--username", required=True, help="Instagram username")
    parser.add_argument("-p", "--password", required=True, help="Instagram password")
    parser.add_argument("-c", "--caption", default="", help="Post caption")
    parser.add_argument("--image", help="Single image path")
    parser.add_argument("--images", nargs="+", help="Multiple image paths (album)")
    parser.add_argument("--video", help="Video path")
    parser.add_argument("--story", action="store_true", help="Post as story")
    parser.add_argument("--session-file", help="Session file path")
    parser.add_argument("--info", action="store_true", help="Show user info and exit")
    parser.add_argument("--proxy", help="Proxy URL (e.g., http://user:pass@host:port)")
    
    args = parser.parse_args()
    
    # Create publisher
    publisher = InstagramPublisher(
        username=args.username,
        password=args.password,
        session_file=args.session_file,
        proxy=args.proxy
    )
    
    try:
        # Login
        if not publisher.login():
            sys.exit(1)
            
        # Show info only
        if args.info:
            info = publisher.get_user_info()
            print("\n👤 账号信息:")
            print(json.dumps(info, indent=2, ensure_ascii=False))
            sys.exit(0)
            
        # Validate input
        media_count = sum([
            1 if args.image else 0,
            1 if args.images else 0,
            1 if args.video else 0
        ])
        
        if media_count == 0:
            print("❌ 请提供 --image, --images 或 --video")
            sys.exit(1)
            
        if media_count > 1:
            print("❌ 请只选择一种媒体类型")
            sys.exit(1)
            
        # Publish
        if args.story:
            # Story
            media_path = args.image or args.video
            if not media_path:
                print("❌ Story 需要 --image 或 --video")
                sys.exit(1)
            result = publisher.publish_story(media_path, args.caption)
            
        elif args.video:
            # Video post
            result = publisher.publish_video(args.video, args.caption)
            
        elif args.images:
            # Album
            result = publisher.publish_album(args.images, args.caption)
            
        else:
            # Single photo
            result = publisher.publish_photo(args.image, args.caption)
            
        # Output result
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
