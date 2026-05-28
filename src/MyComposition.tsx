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

// ── 分段主题色（每段切换不同色调） ──────────────────────
const THEMES: { colors: string[]; accent: string; label: string }[] = [
  { colors: ['#0f0c29', '#302b63', '#24243e'], accent: '#7c5cfc', label: '深邃蓝紫' },
  { colors: ['#1a0a00', '#5c2a00', '#8b4500'], accent: '#ff8c42', label: '暖阳橙' },
  { colors: ['#0d2818', '#044a2b', '#006d3b'], accent: '#00d68f', label: '森林绿' },
  { colors: ['#1a0011', '#4a0028', '#7a003e'], accent: '#ff4d94', label: '玫红' },
  { colors: ['#001a2e', '#003d66', '#006699'], accent: '#4dc9f6', label: '深海蓝' },
  { colors: ['#1a1a00', '#3d3d00', '#666600'], accent: '#f6e05e', label: '琥珀金' },
  { colors: ['#0c0c1a', '#1a1a3d', '#2d2d66'], accent: '#a78bfa', label: '星空紫' },
  { colors: ['#1a0d00', '#3d1f00', '#663300'], accent: '#fb923c', label: '焦糖棕' },
];

// ── 打字机逐字效果 ──────────────────────────────────────
const TypewriterText: React.FC<{
  text: string;
  startFrame: number;
  charsPerFrame?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center';
  maxWidth?: number;
  textShadow?: string;
}> = ({
  text,
  startFrame,
  charsPerFrame = 0.35,
  fontSize = 52,
  color = '#ffffff',
  fontWeight = 700,
  textAlign = 'center',
  maxWidth = 900,
  textShadow = '0 2px 20px rgba(0,0,0,0.3)',
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const charCount = Math.floor(localFrame * charsPerFrame);
  const displayedText = text.slice(0, charCount);
  const opacity = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <div
      style={{
        fontSize,
        color,
        fontWeight,
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        textAlign,
        maxWidth,
        width: '100%',
        textShadow,
        lineHeight: 1.4,
        opacity,
        position: 'relative',
      }}
    >
      {displayedText}
      {charCount < text.length && (
        <span
          style={{
            opacity: Math.sin(localFrame * 0.15) > 0 ? 1 : 0,
            color,
            fontWeight: 300,
            fontSize: fontSize * 0.9,
          }}
        >
          |
        </span>
      )}
    </div>
  );
};

// ── 背景渐变（带缓慢流动） ────────────────────────────
const Background: React.FC<{ themeIndex: number }> = ({ themeIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = THEMES[themeIndex % THEMES.length];
  const hueShift = interpolate(frame % (fps * 20), [0, fps * 20], [0, 30]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})`,
        filter: `hue-rotate(${hueShift}deg)`,
      }}
    />
  );
};

// ── 粒子背景动画 ────────────────────────────────────────
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      x: (i * 137 + 50) % 100,
      y: (i * 73 + 30) % 100,
      size: 1.5 + (i % 5),
      speed: 0.2 + (i % 6) * 0.12,
      opacity: 0.08 + (i % 4) * 0.06,
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      {particles.map((p, i) => {
        const y = (p.y + frame * p.speed) % 110 - 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.1)`,
            }}
          />
        );
      })}
    </div>
  );
};

// ── 装饰圆环（动态旋转） ──────────────────────────────
const DecorativeRing: React.FC<{ themeIndex: number }> = ({ themeIndex }) => {
  const frame = useCurrentFrame();
  const theme = THEMES[themeIndex % THEMES.length];
  const rotation = interpolate(frame, [0, 120], [0, 360]);
  const scale = 1 + Math.sin(frame * 0.02) * 0.1;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 600,
        height: 600,
        marginLeft: -300,
        marginTop: -300,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        border: `1px solid ${theme.accent}22`,
        borderRadius: '50%',
        pointerEvents: 'none',
      }}
    />
  );
};

// ── 分段背景装饰（大号数字水印） ──────────────────────
const SegmentNumber: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        right: 40,
        fontSize: 120,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.04)',
        fontFamily: 'Arial, sans-serif',
        lineHeight: 1,
        letterSpacing: -4,
        pointerEvents: 'none',
      }}
    >
      {String(index + 1).padStart(2, '0')}
      <span style={{ fontSize: 48, opacity: 0.5 }}>/{String(total).padStart(2, '0')}</span>
    </div>
  );
};

// ── 进度条 ──────────────────────────────────────────────
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: `${Math.min(progress * 100, 100)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #7c5cfc, #ff8c42)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

// ── 分段文字（带滑入动画） ──────────────────────────────
const SegmentText: React.FC<{
  text: string;
  startFrame: number;
  durationFrames: number;
  index: number;
  themeIndex: number;
}> = ({ text, startFrame, durationFrames, index, themeIndex }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const theme = THEMES[themeIndex % THEMES.length];

  // 滑入动画：从下方 40px 滑入 + 淡入
  const slideIn = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 15, stiffness: 80 },
  });
  const translateY = interpolate(slideIn, [0, 1], [40, 0]);
  const opacity = interpolate(slideIn, [0, 0.5, 1], [0, 0.8, 1]);

  // 打字机效果
  const charsPerFrame = 0.4;
  const charCount = Math.floor(localFrame * charsPerFrame);
  const displayedText = text.slice(0, charCount);

  // 淡出（接近结束时）
  const fadeOutStart = durationFrames - 20;
  const fadeOutOpacity = localFrame > fadeOutStart
    ? interpolate(localFrame, [fadeOutStart, durationFrames], [1, 0])
    : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: '42%',
        left: '50%',
        transform: `translate(-50%, -50%) translateY(${translateY}px)`,
        width: '85%',
        maxWidth: 900,
        opacity: opacity * fadeOutOpacity,
        textAlign: 'center',
      }}
    >
      {/* 分段序号标签 */}
      <div
        style={{
          display: 'inline-block',
          padding: '4px 16px',
          borderRadius: 20,
          backgroundColor: theme.accent + '33',
          color: theme.accent,
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 16,
          letterSpacing: 2,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        第 {index + 1} 点
      </div>
      <div
        style={{
          fontSize: 42,
          color: '#ffffff',
          fontWeight: 700,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          lineHeight: 1.5,
          textShadow: '0 2px 30px rgba(0,0,0,0.4)',
          minHeight: 60,
        }}
      >
        {displayedText}
        {charCount < text.length && (
          <span style={{ opacity: Math.sin(localFrame * 0.15) > 0 ? 1 : 0, color: theme.accent, fontWeight: 300 }}>
            |
          </span>
        )}
      </div>
    </div>
  );
};

// ── 底部装饰线 ──────────────────────────────────────────
const BottomDecoration: React.FC<{ themeIndex: number }> = ({ themeIndex }) => {
  const frame = useCurrentFrame();
  const theme = THEMES[themeIndex % THEMES.length];
  const width = interpolate(frame % 60, [0, 60], [0, 200]);
  return (
    <div style={{ position: 'absolute', bottom: 40, left: '50%', marginLeft: -100, textAlign: 'center' }}>
      <div
        style={{
          width,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${theme.accent}66, transparent)`,
          margin: '0 auto',
        }}
      />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8, letterSpacing: 3 }}>
        口播 AI 助手 · 每日速递
      </div>
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
  const titleDuration = 3 * fps; // 3秒
  const subtitleDuration = 2 * fps; // 2秒

  const segmentStartFrames = segments.reduce((acc: number[], _, i) => {
    if (i === 0) {
      acc.push(titleDuration + subtitleDuration);
    } else {
      acc.push(acc[i - 1] + segments[i - 1].duration * fps);
    }
    return acc;
  }, []);

  const totalSegmentFrames = segments.reduce((sum, s) => sum + s.duration * fps, 0);
  const totalDuration = titleDuration + subtitleDuration + totalSegmentFrames;
  const audioSrc = voiceover ? staticFile('voiceover.mp3') : undefined;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* 背景 */}
      <Sequence from={0} durationInFrames={totalDuration}>
        <Background themeIndex={0} />
        <Particles />
        <DecorativeRing themeIndex={0} />
      </Sequence>

      {/* 音频 */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* 标题区域：前 3 秒 */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            textAlign: 'center',
          }}
        >
          <TypewriterText
            text={titleText}
            startFrame={0}
            fontSize={56}
            fontWeight={800}
            textShadow="0 4px 40px rgba(0,0,0,0.5)"
          />
        </div>
      </Sequence>

      {/* 副标题：第 3-5 秒 */}
      <Sequence from={titleDuration} durationInFrames={subtitleDuration}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            textAlign: 'center',
          }}
        >
          <TypewriterText
            text={subtitleText}
            startFrame={0}
            fontSize={32}
            fontWeight={400}
            color="#c0c0c0"
            textShadow="0 2px 20px rgba(0,0,0,0.3)"
          />
        </div>
      </Sequence>

      {/* 分段字幕 */}
      {segments.map((seg, i) => (
        <Sequence
          key={i}
          from={segmentStartFrames[i]}
          durationInFrames={seg.duration * fps}
        >
          <SegmentText
            text={seg.text}
            startFrame={0}
            durationFrames={seg.duration * fps}
            index={i}
            themeIndex={i}
          />
          <SegmentNumber index={i} total={segments.length} />
          <BottomDecoration themeIndex={i} />
        </Sequence>
      ))}

      {/* 进度条 */}
      <ProgressBar
        progress={
          (useCurrentFrame() + 1) / totalDuration
        }
      />
    </AbsoluteFill>
  );
};