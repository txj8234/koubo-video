#!/usr/bin/env python3
"""
每日口播选题自动生成脚本 - 固定文案版
直接输出指定文案，不搜索热点
- 生成口播文案（标题 + 副标题 + 分段字幕）
- 输出 props_latest.json（Remotion 渲染参数）
- 输出 voiceover.mp3（TTS 语音文件）
"""
import json
import os
import sys
import asyncio
from datetime import datetime

OUTPUT_PROPS = "props_latest.json"
OUTPUT_AUDIO = "voiceover.mp3"

# === 指定文案：如何赚点小钱 - 四环生产线 ===
TITLE = "如何赚点小钱？我的四环生产线"
SUBTITLE = "从半天压缩到两小时，一个人跑通副业的最小系统"

SEGMENTS = [
    {"text": "我花了两周做一件事：把我每天做副业的流程，从半天压缩到了两小时。不需要学会所有AI工具，我只需要四个环节串成一条线。", "duration": 8},
    {"text": "如果你也收藏了一堆AI教程，却不知道从哪开始——今天这条，就是你的第一步。我不跟你讲大道理，我把我的那四个环节拆开给你看。", "duration": 10},
    {"text": "第一环：存。把你脑子里最值钱的东西存下来——是你自己的经验，不是你刷到的信息。过去一年别人找你帮忙最多的事是什么，写下来。我用Obsidian，没有就用手机备忘录。关键在于——别让经验烂在脑子里。", "duration": 14},
    {"text": "第二环：出。把存的素材变成口播稿。你不是从零写作文，是把你存的几个观点选出来搭成一条线。我用WorkBuddy，十五到二十分钟出一篇初稿。目的不是写得漂亮，是能说出口。", "duration": 12},
    {"text": "第三环：发。内容写好录完，别卡在发布上。我以前发一篇公众号要排版半小时，现在一条命令五秒钟搞定。你不需要学我，就找那个最花你时间的发布步骤，想办法简单化。", "duration": 12},
    {"text": "第四环：看。发完不管等于白做。我每周看后台数据——哪条分享最多、哪个标题点进来的人最多。数据不骗人，它告诉你下一步该往哪走。", "duration": 10},
    {"text": "这四个字——存、出、发、看——串起来，就是你一个人跑通副业的最小系统。我拿自己示范：早上跟镜子聊选题→从Obsidian翻笔记→二十分钟出稿→录视频→一键发公众号→第二天看数据。整个过程两小时搞定，以前没六小时拿不下来。", "duration": 16},
    {"text": "今天你回去只试一件事：打开手机备忘录，写下你过去一年帮别人最多的一件事。不是等你准备好了再写，现在就写。写下来，你就完成了「存」这一步。明天我告诉你——存下来的这件事，怎么变成一条口播稿。", "duration": 14},
    {"text": "我是锦哥。觉得有用，点个赞，转发给身边也在学副业的朋友。明天继续拆第二步——存的素材，怎么变成口播稿。", "duration": 8},
]

PROPS = {
    "titleText": TITLE,
    "subtitleText": SUBTITLE,
    "segments": SEGMENTS,
    "backgroundTheme": "dark-professional",
    "voiceover": "",
}


def build_voiceover_text(props):
    """构建 TTS 语音文本"""
    parts = [props["titleText"], props["subtitleText"]]
    for seg in props["segments"]:
        parts.append(seg["text"])
    return "。".join(parts)


async def generate_audio(text, output_path):
    """使用 edge-tts 生成语音 MP3"""
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice="zh-CN-XiaoxiaoNeural")
        await communicate.save(output_path)
        size = os.path.getsize(output_path)
        print(f"✔ voiceover.mp3 已生成 ({size / 1024:.1f} KB)")
        return True
    except ImportError:
        print("⚠️ edge-tts 未安装，尝试 pip install...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "edge-tts"], check=True)
        import edge_tts
        communicate = edge_tts.Communicate(text, voice="zh-CN-XiaoxiaoNeural")
        await communicate.save(output_path)
        size = os.path.getsize(output_path)
        print(f"✔ voiceover.mp3 已生成 ({size / 1024:.1f} KB)")
        return True
    except Exception as e:
        print(f"⚠️ 语音生成失败: {e}")
        return False


def main():
    today = datetime.now().strftime("%Y年%m月%d日")
    print(f"📝 生成固定文案：如何赚点小钱")
    print(f"  日期：{today}")
    print(f"  标题：{TITLE}")
    print(f"  分段数：{len(SEGMENTS)} 段")

    props = PROPS.copy()
    voiceover_text = build_voiceover_text(props)
    props["voiceover"] = voiceover_text

    # 写入 props_latest.json
    with open(OUTPUT_PROPS, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    print(f"✔ props_latest.json 已生成")

    # 生成语音
    print(f"🎧 生成语音...")
    success = asyncio.run(generate_audio(voiceover_text, OUTPUT_AUDIO))
    if not success:
        print("⚠️ 语音生成失败，视频渲染将无声")

    # 统计
    total_sec = sum(s["duration"] for s in SEGMENTS) + 5
    print(f"\n📊 统计：")
    print(f"  标题：{props['titleText']}")
    print(f"  副标题：{props['subtitleText']}")
    print(f"  分段数：{len(SEGMENTS)} 段")
    print(f"  预计时长：{total_sec} 秒")
    print(f"  语音：{'✔ 已生成' if success else '⚠️ 失败'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())