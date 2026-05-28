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

// ── 打字机逐字效果 ──────────────────────────────────────
const TypewriterText: React.FC<{
  text: string;
  startFrame: number;
  charsPerFrame?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
}> = ({ text, startFrame, charsPerFrame = 0.35, fontSize = 52, color = '#ffffff', fontWeight = 700 }) => {
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
        fontWeight,
        color,
        textAlign: 'center',
        lineHeight: 1.5,
        textShadow: '0 4px 20px rgba(0,0,0,0.6)',
        opacity,
        padding: '0 80px',
        maxWidth: 1600,
      }}
    >
      {displayedText}
      {charCount < text.length && (
        <span style={{ opacity: 0.5, animation: 'blink 0.6s infinite' }}>|</span>
      )}
    </div>
  );
};

// ── 背景渐变 ────────────────────────────────────────────
const Background: React.FC<{ theme?: string }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 缓慢流动的渐变
  const hueShift = interpolate(frame, [0, fps * 20], [0, 30]);

  const gradientMap: Record<string, string[]> = {
    'gradient-blue-purple': ['#0f0c29', '#302b63', '#24243e'],
    'gradient-dark': ['#1a1a2e', '#16213e', '#0f3460'],
    'gradient-warm': ['#2d1b00', '#5c2a00', '#8b3a00'],
    'gradient-green': ['#0d2818', '#044a2b', '#006d3b'],
  };

  const colors = gradientMap[theme || 'gradient-blue-purple'] || gradientMap['gradient-blue-purple'];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 50%, ${colors[2]})`,
        filter: `hue-rotate(${hueShift}deg)`,
      }}
    />
  );
};

// ── 粒子背景动画 ────────────────────────────────────────
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      x: (i * 137 + 50) % 100,
      y: (i * 73 + 30) % 100,
      size: 2 + (i % 4),
      speed: 0.3 + (i % 5) * 0.15,
      opacity: 0.15 + (i % 3) * 0.1,
    }));
  }, []);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
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
              backgroundColor: 'rgba(255,255,255,0.5)',
              opacity: p.opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
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

  const titleDuration = 3 * fps;        // 3秒
  const subtitleDuration = 2 * fps;     // 2秒

  const segmentStartFrames = segments.reduce<number[]>((acc, _, i) => {
    if (i === 0) {
      acc.push(titleDuration + subtitleDuration);
    } else {
      acc.push(acc[i - 1] + segments[i - 1].duration * fps);
    }
    return acc;
  }, []);

  // 视频总时长
  const totalSegmentFrames = segments.reduce((sum, s) => sum + s.duration * fps, 0);
  const totalDuration = titleDuration + subtitleDuration + totalSegmentFrames;

  // 音频文件路径
  const audioSrc = voiceover ? staticFile('voiceover.mp3') : undefined;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      {/* 背景 */}
      <Background theme={backgroundTheme} />
      <Particles />

      {/* 音频 */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* 标题 */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TypewriterText
            text={titleText}
            startFrame={0}
            fontSize={80}
            color="#ffffff"
            fontWeight={800}
            charsPerFrame={0.4}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 副标题 */}
      <Sequence from={titleDuration} durationInFrames={subtitleDuration}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TypewriterText
            text={subtitleText}
            startFrame={0}
            fontSize={48}
            color="rgba(255,255,255,0.85)"
            fontWeight={500}
            charsPerFrame={0.3}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 分段字幕 */}
      {segments.map((seg, i) => (
        <Sequence
          key={i}
          from={segmentStartFrames[i]}
          durationInFrames={seg.duration * fps}
        >
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* 分段序号 */}
            <div
              style={{
                position: 'absolute',
                top: 180,
                fontSize: 24,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: 4,
              }}
            >
              {String(i + 1).padStart(2, '0')} / {String(segments.length).padStart(2, '0')}
            </div>

            <TypewriterText
              text={seg.text}
              startFrame={0}
              fontSize={52}
              color="#ffffff"
              fontWeight={700}
              charsPerFrame={0.35}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};