"""
每日口播视频 · 钉钉自动推送脚本
在 GitHub Actions 中运行，渲染完成后自动通知钉钉群
"""
import requests
import json
import os
import glob
from datetime import datetime

WEBHOOK_URL = "https://oapi.dingtalk.com/robot/send?access_token=50b66729c3df893730cf92ca5c0850ac843c0a85c85274c121af12983ab67fa3"

def find_latest_mp4(folder_path):
    search_pattern = os.path.join(folder_path, "*.mp4")
    files = glob.glob(search_pattern)
    if not files:
        return None
    latest_file = max(files, key=os.path.getmtime)
    return latest_file

def send_dingtalk_markdown(title, text):
    data = {
        "msgtype": "markdown",
        "markdown": {"title": title, "text": text},
        "at": {"isAtAll": False}
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(WEBHOOK_URL, headers=headers, data=json.dumps(data))
        result = response.json()
        if result.get('errcode') == 0:
            return True, "发送成功！"
        else:
            return False, f"发送失败: {result.get('errmsg')}"
    except Exception as e:
        return False, f"发生错误: {str(e)}"

if __name__ == "__main__":
    video_folder = os.environ.get("VIDEO_DIR", "./out")
    title = os.environ.get("VIDEO_TITLE", "每日口播视频")
    
    print(f"正在扫描文件夹: {video_folder} ...")
    latest_video = find_latest_mp4(video_folder)
    
    if latest_video:
        file_name = os.path.basename(latest_video)
        file_size = os.path.getsize(latest_video) / (1024 * 1024)
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        msg_title = "🎬 悟空 · 每日口播视频已就绪"
        msg_content = f"## {msg_title} \n\n" \
                      f"> **视频标题**: {title} \n\n" \
                      f"> **文件名称**: {file_name} \n\n" \
                      f"> **文件大小**: {file_size:.2f} MB \n\n" \
                      f"> **生成时间**: {current_time} \n\n" \
                      f"---\n" \
                      f"**锦哥，视频已自动渲染完成！** 请在 GitHub Actions Artifacts 中下载，或前往视频号发布。"
        
        success, info = send_dingtalk_markdown(msg_title, msg_content)
        print(info)
    else:
        print("未找到 MP4 视频文件。")