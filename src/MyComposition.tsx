import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
} from 'remotion';
import { z } from 'zod';

// ── Zod Schema ──────────────────────────────────────────
export const myCompSchema = z.object({
  titleText: z.string(),
  subtitleText: z.string(),
  segments: z.array(
    z.object({
      text: z.string(),
      duration: z.number(),
    })
  ),
  backgroundTheme: z.string().optional(),
  voiceover: z.string().optional(),
});

type Props = z.infer<typeof myCompSchema>;

// ── 莫兰迪色系主题（三分屏配色） ──────────────────────
const THEMES: {
  topBg: string;      // 顶部标题区背景
  midBg: string;      // 中部内容区背景
  botBg: string;      // 底部装饰区背景
  titleColor: string; // 标题文字颜色
  textColor: string;  // 正文文字颜色
  accent: string;     // 强调色（高亮、标签）
  dotColor: string;   // 装饰圆点颜色
  label: string;      // 主题名称
}[] = [
  {
    topBg: '#1a1a2e', midBg: '#f5f0eb', botBg: '#16213e',
    titleColor: '#ffffff', textColor: '#2d2d2d', accent: '#e8a87c',
    dotColor: '#c9b8a8', label: '暖沙棕'
  },
  {
    topBg: '#1e2a3a', midBg: '#f0ede8', botBg: '#1a2a3a',
    titleColor: '#ffffff', textColor: '#2d2d2d', accent: '#b8a89a',
    dotColor: '#c4b8a8', label: '灰蓝调'
  },
  {
    topBg: '#2a1e2e', midBg: '#f2ede6', botBg: '#1e1622',
    titleColor: '#ffffff', textColor: '#2d2d2d', accent: '#c9a9b0',
    dotColor: '#c4b0b8', label: '淡紫粉'
  },
  {
    topBg: '#1e2e2a', midBg: '#efece8', botBg: '#162a24',
    titleColor: '#ffffff', textColor: '#2d2d2d', accent: '#a8c4b0',
    dotColor: '#b0c0b4', label: '灰绿色'
  },
  {
    topBg: '#2a2a1e', midBg: '#f0ede6', botBg: '#222416',
    titleColor: '#ffffff', textColor: '#2d2d2d', accent: '#c4b89a',
    dotColor: '#c0b8a4', label: '米驼色'
  },
];

// ── 三分屏布局 ──────────────────────────────────────────

/** 顶部标题区域 */
const TopTitle: React.FC<{
  titleText: string;
  subtitleText: string;
  themeIndex: number;
  startFrame: number;
}> = ({ titleText, subtitleText, themeIndex, startFrame }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const { fps } = useVideoConfig();
  const theme = THEMES[themeIndex % THEMES.length];

  // 标题从上方滑入
  const titleSpring = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 70 } });
  const titleY = interpolate(titleSpring, [0, 1], [-60, 0]);
  const titleOpacity = interpolate(localFrame, [0, 15], [0, 1]);

  // 副标题延迟出现
  const subSpring = spring({ frame: Math.max(0, localFrame - 20), fps, config: { damping: 12, stiffness: 60 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOpacity = interpolate(Math.max(0, localFrame - 20), [0, 15], [0, 1]);

  // 顶部装饰线
  const lineWidth = interpolate(localFrame, [0, 30], [0, 200]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '38%',
        background: `linear-gradient(135deg, ${theme.topBg}, ${theme.topBg}dd)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 60px',
        overflow: 'hidden',
      }}
    >
      {/* 顶部装饰线 */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: lineWidth,
          height: 3,
          borderRadius: 2,
          background: theme.accent,
          opacity: titleOpacity,
        }}
      />

      {/* 主标题 */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: theme.titleColor,
          textAlign: 'center',
          lineHeight: 1.3,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          maxWidth: 900,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          letterSpacing: 2,
          textShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}
      >
        {titleText}
      </div>

      {/* 副标题 */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: theme.accent,
          textAlign: 'center',
          marginTop: 16,
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          letterSpacing: 4,
        }}
      >
        {subtitleText}
      </div>
    </div>
  );
};

/** 中部内容区域 - 分段正文 */
const MidContent: React.FC<{
  text: string;
  startFrame: number;
  durationFrames: number;
  themeIndex: number;
  segmentIndex: number;
  totalSegments: number;
}> = ({ text, startFrame, durationFrames, themeIndex, segmentIndex, totalSegments }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const { fps } = useVideoConfig();
  const theme = THEMES[themeIndex % THEMES.length];

  // 内容区滑入
  const slideIn = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 80 } });
  const translateY = interpolate(slideIn, [0, 1], [50, 0]);
  const opacity = interpolate(localFrame, [0, 12], [0, 1]);

  // 打字机效果
  const charsPerFrame = 0.5;
  const charCount = Math.min(Math.floor(localFrame * charsPerFrame), text.length);
  const displayedText = text.slice(0, charCount);

  // 淡出
  const fadeOutStart = durationFrames - 20;
  const fadeOpacity = localFrame > fadeOutStart
    ? interpolate(localFrame, [fadeOutStart, durationFrames], [1, 0])
    : 1;

  // 分段标签
  const tagOpacity = interpolate(localFrame, [0, 8], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        height: '50%',
        background: theme.midBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '30px 60px',
        overflow: 'hidden',
      }}
    >
      {/* 分段标签 - 莫兰迪色胶囊 */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 40,
          opacity: tagOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            padding: '4px 14px',
            borderRadius: 20,
            background: theme.accent + '33',
            border: `1px solid ${theme.accent}66`,
            fontSize: 13,
            fontWeight: 600,
            color: theme.textColor + 'cc',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          第{segmentIndex + 1}段 · 共{totalSegments}段
        </div>
      </div>

      {/* 装饰圆点 - 莫兰迪色系 */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 40,
          display: 'flex',
          gap: 6,
          opacity: tagOpacity,
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i === segmentIndex ? theme.accent : theme.dotColor,
              opacity: i === segmentIndex ? 1 : 0.4,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* 正文内容 */}
      <div
        style={{
          fontSize: 34,
          fontWeight: 500,
          color: theme.textColor,
          textAlign: 'left',
          lineHeight: 1.6,
          transform: `translateY(${translateY}px)`,
          opacity: opacity * fadeOpacity,
          maxWidth: 900,
          width: '100%',
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          letterSpacing: 1,
        }}
      >
        {displayedText}
        {charCount < text.length && (
          <span style={{ opacity: interpolate(localFrame % 30, [0, 15, 30], [1, 0, 1]), fontWeight: 300 }}>
            |
          </span>
        )}
      </div>

      {/* 底部虚线装饰 */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 40,
          right: 40,
          height: 1,
          borderTop: `1px dashed ${theme.dotColor}66`,
          opacity: tagOpacity,
        }}
      />
    </div>
  );
};

/** 底部区域 - 进度条 + 标签 */
const BottomBar: React.FC<{
  progress: number;
  themeIndex: number;
  currentSegment: number;
  totalSegments: number;
}> = ({ progress, themeIndex, currentSegment, totalSegments }) => {
  const theme = THEMES[themeIndex % THEMES.length];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '12%',
        background: theme.botBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 40px',
      }}
    >
      {/* 进度条 */}
      <div
        style={{
          width: '100%',
          height: 4,
          background: '#ffffff22',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}cc)`,
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* 底部信息 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: '#ffffff88',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          口播 AI 助手 · 十二载军旅
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: i <= currentSegment ? theme.accent + '44' : 'transparent',
                color: i <= currentSegment ? theme.accent : '#ffffff44',
                border: `1px solid ${i <= currentSegment ? theme.accent + '88' : '#ffffff22'}`,
                fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** 场景切换动画 - 背景色调过渡 */
const SceneTransition: React.FC<{
  themeIndex: number;
  children: React.ReactNode;
}> = ({ themeIndex, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prevTheme = THEMES[Math.max(0, themeIndex - 1) % THEMES.length];
  const currTheme = THEMES[themeIndex % THEMES.length];

  // 过渡进度（每段前1秒）
  const transitionProgress = interpolate(frame % fps, [0, fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // 背景色从上一段色调过渡到当前段
        background: `linear-gradient(135deg, ${prevTheme.botBg}, ${currTheme.botBg})`,
        opacity: interpolate(transitionProgress, [0, 1], [0, 0.15]),
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

// ── 主组件 ──────────────────────────────────────────────
export const MainComposition: React.FC<Props> = ({
  titleText,
  subtitleText,
  segments,
  backgroundTheme,
  voiceover,
}) => {
  const { fps } = useVideoConfig();

  const titleDuration = 3 * fps;     // 3秒标题
  const subtitleDuration = 2 * fps;  // 2秒副标题
  const headerDuration = titleDuration + subtitleDuration; // 5秒头部

  // 每段开始帧
  const segmentStartFrames = segments.reduce((acc: number[], _, i) => {
    if (i === 0) {
      acc.push(headerDuration);
    } else {
      acc.push(acc[i - 1] + segments[i - 1].duration * fps);
    }
    return acc;
  }, []);

  // 总时长
  const totalSegmentFrames = segments.reduce((sum, s) => sum + s.duration * fps, 0);
  const totalDuration = headerDuration + totalSegmentFrames;

  const audioSrc = voiceover ? staticFile('voiceover.mp3') : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      {/* 音频 */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* 标题区域 */}
      <TopTitle
        titleText={titleText}
        subtitleText={subtitleText}
        themeIndex={0}
        startFrame={0}
      />

      {/* 分段内容 */}
      {segments.map((seg, i) => {
        const themeIndex = i % THEMES.length;
        return (
          <Sequence
            key={i}
            from={segmentStartFrames[i]}
            durationInFrames={seg.duration * fps}
          >
            <MidContent
              text={seg.text}
              startFrame={0}
              durationFrames={seg.duration * fps}
              themeIndex={themeIndex}
              segmentIndex={i}
              totalSegments={segments.length}
            />
          </Sequence>
        );
      })}

      {/* 底部进度条 */}
      <BottomBar
        progress={0}
        themeIndex={0}
        currentSegment={0}
        totalSegments={segments.length}
      />
    </AbsoluteFill>
  );
};