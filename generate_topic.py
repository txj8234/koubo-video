#!/usr/bin/env python3
"""
每日口播选题自动生成脚本
- 搜索当日 AI/科技 热点
- 生成口播文案（标题 + 副标题 + 分段字幕）
- 输出 props_latest.json（Remotion 渲染参数）
- 输出 voiceover.txt（TTS 语音文本）
"""

import json
import os
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError
import re

# ── 配置 ────────────────────────────────────────────────
OUTPUT_PROPS = "props_latest.json"
OUTPUT_VOICEOVER = "voiceover.txt"

# ── 默认文案（网络不可用时的兜底） ──────────────────────
FALLBACK = {
    "titleText": "AI 时代，你还在手动做内容吗？",
    "subtitleText": "口播 AI 助手 · 每天一条精品视频",
    "segments": [
        {"text": "你有没有发现，刷了无数条 AI 新闻，收入却一分没变？", "duration": 8},
        {"text": "问题不在于你知道得不够多，而在于你没有把 AI 变成生产力", "duration": 8},
        {"text": "口播 AI 助手，从选题到文案到视频渲染，全自动一条龙", "duration": 8},
        {"text": "每天早上 6 点，一条精品口播视频准时出现在你的钉钉群里", "duration": 7},
        {"text": "不用写稿、不用剪辑、不用盯发布，你只需要确认内容方向", "duration": 8},
        {"text": "从观众到选手，只差一个工具的距离", "duration": 6},
        {"text": "口播 AI 助手，让你的内容生产效率提升 10 倍", "duration": 7},
        {"text": "关注我，带你用 AI 真正赚到钱", "duration": 5},
    ],
    "backgroundTheme": "gradient-blue-purple",
    "voiceover": "",
}


def search_hot_topics():
    """搜索 AI/科技 热点，返回标题列表"""
    try:
        # 尝试从百度热搜获取
        req = Request(
            "https://top.baidu.com/board?tab=realtime",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # 提取热搜标题
        titles = re.findall(r'<div class="c-single-text-ellipsis">(.+?)</div>', html)
        # 过滤 AI/科技/互联网 相关
        ai_keywords = ["AI", "人工智能", "大模型", "ChatGPT", "GPT", "科技", "互联网",
                       "智能", "算法", "机器人", "自动驾驶", "芯片", "5G", "数字化"]
        ai_titles = [t.strip() for t in titles if any(kw in t for kw in ai_keywords)]

        if ai_titles:
            return ai_titles[:5]
    except Exception:
        pass

    # 兜底：固定选题
    return [
        "AI 大模型最新突破引发行业震动",
        "普通人如何用 AI 工具提升 10 倍效率",
        "2026 年 AI 创业还有哪些机会",
    ]


def generate_script(topics):
    """根据热点话题生成口播文案"""
    today = datetime.now().strftime("%Y年%m月%d日")

    # 如果搜到了热点，围绕第一个热点生成
    if topics:
        main_topic = topics[0]
        title = f"AI 圈炸了！{main_topic[:20]}"
        subtitle = f"{today} · 口播 AI 助手每日速递"

        segments = [
            {"text": f"今天 AI 圈最大的新闻：{main_topic}", "duration": 8},
            {"text": "这意味着什么？普通人会被 AI 取代吗？", "duration": 7},
            {"text": "我的答案是：不会取代你，但会用 AI 的人会取代不会用的人", "duration": 8},
            {"text": "口播 AI 助手就是帮你成为「会用 AI 的人」", "duration": 7},
            {"text": "从选题到文案到视频，全自动搞定，你只管确认方向", "duration": 8},
            {"text": "每天早上 6 点，一条精品视频准时推送", "duration": 6},
            {"text": "关注我，带你用 AI 真正赚到钱", "duration": 5},
        ]
    else:
        # 无热点时用通用文案
        title = "AI 时代，你还在手动做内容吗？"
        subtitle = f"{today} · 口播 AI 助手"

        segments = [
            {"text": "你有没有发现，刷了无数条 AI 新闻，收入却一分没变？", "duration": 8},
            {"text": "问题不在于你知道得不够多，而在于你没有把 AI 变成生产力", "duration": 8},
            {"text": "口播 AI 助手，从选题到文案到视频渲染，全自动一条龙", "duration": 8},
            {"text": "每天早上 6 点，一条精品口播视频准时出现在你的钉钉群里", "duration": 7},
            {"text": "不用写稿、不用剪辑、不用盯发布，你只需要确认内容方向", "duration": 8},
            {"text": "从观众到选手，只差一个工具的距离", "duration": 6},
            {"text": "关注我，带你用 AI 真正赚到钱", "duration": 5},
        ]

    return {
        "titleText": title,
        "subtitleText": subtitle,
        "segments": segments,
        "backgroundTheme": "gradient-blue-purple",
        "voiceover": "",
    }


def build_voiceover_text(props):
    """构建 TTS 语音文本（标题 + 所有分段连读）"""
    parts = [props["titleText"], props["subtitleText"]]
    for seg in props["segments"]:
        parts.append(seg["text"])
    return "。".join(parts)


def main():
    print("🔍 搜索当日 AI 热点...")
    topics = search_hot_topics()
    if topics:
        print(f"   找到 {len(topics)} 个相关热点")
        for t in topics:
            print(f"   · {t}")
    else:
        print("   ⚠️ 未获取到热点，使用通用文案")

    print("📝 生成口播文案...")
    props = generate_script(topics)

    # 生成 voiceover 文本
    voiceover_text = build_voiceover_text(props)
    props["voiceover"] = voiceover_text

    # 写入 props_latest.json
    with open(OUTPUT_PROPS, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    print(f"✅ props_latest.json 已生成 ({len(json.dumps(props, ensure_ascii=False))} 字符)")

    # 写入 voiceover.txt（供 edge-tts 使用）
    with open(OUTPUT_VOICEOVER, "w", encoding="utf-8") as f:
        f.write(voiceover_text)
    print(f"✅ voiceover.txt 已生成 ({len(voiceover_text)} 字符)")

    # 预览
    print(f"\n📺 预览:")
    print(f"   标题: {props['titleText']}")
    print(f"   副标题: {props['subtitleText']}")
    print(f"   分段数: {len(props['segments'])} 段")
    total_sec = sum(s["duration"] for s in props["segments"]) + 5
    print(f"   预计时长: {total_sec} 秒")

    return 0


if __name__ == "__main__":
    sys.exit(main())