"""每日口播视频 · 自动生成当日文案
在 GitHub Actions 中运行，每天自动搜索热点并生成口播文案参数"""

import requests
import json
import random
from datetime import datetime

# === 热点话题池（备用，API 失败时使用）===
FALLBACK_TOPICS = [
    {
        "title": "AI时代，普通人如何不被淘汰？",
        "subtitle": "不是AI淘汰你，是会用AI的人淘汰你",
        "segments": [
            "AI时代，普通人如何不被淘汰？",
            "不是AI淘汰你，是会用AI的人淘汰你",
            "每天花10分钟，用AI工具提升工作效率",
            "口播AI助手，帮你自动生成视频内容",
            "从选题到发布，全程自动化",
            "每天1条精品视频，轻松打造个人IP",
            "别再手动剪辑了，AI帮你搞定一切",
            "关注我，每天分享一个AI实用技巧"
        ]
    },
    {
        "title": "副业赚钱，为什么你总是坚持不下去？",
        "subtitle": "不是你不够努力，是你的方法不对",
        "segments": [
            "副业赚钱，为什么你总是坚持不下去？",
            "不是你不够努力，是你的方法不对",
            "每天花30分钟，做一件能产生复利的事",
            "口播AI助手，帮你把内容生产自动化",
            "每天1条视频，持续输出你的专业价值",
            "3个月后，你会发现不一样的自己",
            "坚持才是最大的捷径",
            "关注我，一起做个长期主义者"
        ]
    },
    {
        "title": "短视频带货，90%的人都做错了",
        "subtitle": "正确的做法其实很简单",
        "segments": [
            "短视频带货，90%的人都做错了",
            "正确的做法其实很简单",
            "不是你有多少粉丝，而是你的内容有没有价值",
            "口播AI助手，帮你批量生产优质内容",
            "自动选题、自动渲染、自动推送",
            "让你的账号每天都有新内容",
            "持续输出，才是带货的核心秘诀",
            "关注我，教你用AI做短视频带货"
        ]
    }
]

def search_hot_topics():
    """搜索当日热点话题"""
    try:
        url = "https://top.baidu.com/api/board?tab=realtime"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            topics = []
            if "data" in data and "cards" in data["data"]:
                for card in data["data"]["cards"]:
                    for item in card.get("content", []):
                        if "word" in item:
                            topics.append(item["word"])
            return topics[:10]
    except:
        pass
    return []

def generate_props(topic_title=None, topic_subtitle=None):
    """生成 Remotion 参数 JSON"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    if not topic_title:
        topic = random.choice(FALLBACK_TOPICS)
        topic_title = topic["title"]
        topic_subtitle = topic["subtitle"]
        segments = topic["segments"]
    else:
        if not topic_subtitle:
            topic_subtitle = "今天聊聊这个话题"
        segments = [
            topic_title,
            topic_subtitle,
            "每天花10分钟，用AI工具提升工作效率",
            "口播AI助手，帮你自动生成视频内容",
            "从选题到发布，全程自动化",
            "每天1条精品视频，轻松打造个人IP",
            "别再手动剪辑了，AI帮你搞定一切",
            "关注我，每天分享一个AI实用技巧"
        ]
    
    props = {
        "titleText": topic_title,
        "subtitleText": topic_subtitle,
        "segments": [
            {"text": seg, "duration": 8} for seg in segments
        ],
        "generated_at": today
    }
    
    return props

if __name__ == "__main__":
    print("=== 每日口播视频 · 自动生成文案 ===")
    print(f"日期: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    hot_topics = search_hot_topics()
    if hot_topics:
        print(f"获取到 {len(hot_topics)} 个热点话题")
        for i, t in enumerate(hot_topics[:5], 1):
            print(f"  {i}. {t}")
    
    props = generate_props()
    
    with open("props_latest.json", "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 文案已生成并写入 props_latest.json")
    print(f"标题: {props['titleText']}")
    print(f"副标题: {props['subtitleText']}")
    print(f"分段数: {len(props['segments'])}")
