import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { z } from 'zod';

// ===== Zod Schema：定义动态参数结构 =====
export const myCompSchema = z.object({
  titleText: z.string(),
  subtitleText: z.string(),
  segments: z.array(z.object({
    text: z.string(),
    duration: z.number(),
  })),
  backgroundTheme: z.string().optional().default('gradient-blue-purple'),
  voiceover: z.string().optional().default(''),
});

// ===== 渐变背景映射 =====
const themeGradients: Record<string, string> = {
  'gradient-blue-purple': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
  'gradient-dark-tech': 'linear-gradient(135deg, #020617 0%, #1e293b 50%, #0f0f23 100%)',
  'gradient-warm': 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
  'gradient-green': 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)',
};

// ===== 字幕逐字出现动画组件 =====
const TypewriterText: React.FC<{
  text: string;
  startFrame: number;
  duration: number;
  fps: number;
}> = ({ text, startFrame, duration, fps }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;
  
  // 每0.05秒显示一个字
  const charsPerFrame = 1;
  const visibleChars = Math.min(
    Math.floor(localFrame * charsPerFrame),
    text.length
  );

  // 整段淡入
  const opacity = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 200 },
  });

  // 分段处理（| 为换行符）
  const lines = text.split('|');

  return (
    <div
      style={{
        opacity,
        width: '100%',
        padding: '40px 80px',
        textAlign: 'center',
      }}
    >
      {lines.map((line, lineIndex) => {
        // 计算当前行之前的总字符数
        const charsBeforeLine = lines.slice(0, lineIndex).join('').length + lineIndex;
        const lineStart = charsBeforeLine;
        const lineEnd = lineStart + line.length;
        
        // 当前行已经显示了多少字符
        const lineVisibleChars = Math.max(0, Math.min(
          visibleChars - charsBeforeLine,
          line.length
        ));

        const isLineComplete = lineVisibleChars >= line.length;
        const isLineActive = visibleChars > charsBeforeLine;

        return (
          <div
            key={lineIndex}
            style={{
              marginBottom: lines.length > 1 ? '20px' : '0',
              minHeight: '60px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: lines.length > 1 ? '36px' : '48px',
                fontWeight: 700,
                color: isLineActive ? '#ffffff' : '#334155',
                fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                lineHeight: 1.6,
                letterSpacing: '0.05em',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {isLineComplete
                ? line
                : isLineActive
                  ? line.slice(0, lineVisibleChars)
                  : ''}
              {isLineActive && !isLineComplete && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '3px',
                    height: '1.2em',
                    backgroundColor: '#60a5fa',
                    marginLeft: '4px',
                    verticalAlign: 'text-bottom',
                    animation: 'none',
                  }}
                />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ===== 进度条组件 =====
const ProgressBar: React.FC<{
  currentSegment: number;
  totalSegments: number;
  progress: number; // 0-1
}> = ({ currentSegment, totalSegments, progress }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '80px',
        right: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          flex: 1,
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: '#60a5fa',
            borderRadius: '2px',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      <span
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          fontFamily: '"Microsoft YaHei", sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {currentSegment + 1} / {totalSegments}
      </span>
    </div>
  );
};

// ===== 主组件 =====
export const MainComposition: React.FC<z.infer<typeof myCompSchema>> = ({
  titleText,
  subtitleText,
  segments,
  backgroundTheme,
  voiceover,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalSegments = segments.length;

  // 计算时间轴
  const titleDuration = fps * 3; // 标题3秒
  const subtitleDuration = fps * 2; // 副标题2秒
  let segmentStartFrames: number[] = [];
  let currentStart = titleDuration + subtitleDuration;
  for (let i = 0; i < segments.length; i++) {
    segmentStartFrames.push(currentStart);
    currentStart += segments[i].duration * fps;
  }

  // 当前是哪个分段
  let currentSegment = -1;
  let segmentProgress = 0;
  for (let i = 0; i < segments.length; i++) {
    const segStart = segmentStartFrames[i];
    const segEnd = segStart + segments[i].duration * fps;
    if (frame >= segStart && frame < segEnd) {
      currentSegment = i;
      segmentProgress = (frame - segStart) / (segEnd - segStart);
      break;
    }
  }

  // 总进度
  const totalProgress = frame / durationInFrames;

  // 背景渐变
  const gradient = themeGradients[backgroundTheme] || themeGradients['gradient-blue-purple'];

  return (
    <AbsoluteFill>
      {/* 背景 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: gradient,
          position: 'absolute',
        }}
      />

      {/* 装饰光效 */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 标题段 */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0 80px' }}>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                lineHeight: 1.4,
                textShadow: '0 4px 20px rgba(0,0,0,0.4)',
                opacity: spring({
                  frame: frame,
                  fps,
                  config: { damping: 200, stiffness: 100 },
                }),
                transform: `translateY(${interpolate(frame, [0, fps], [30, 0])}px)`,
              }}
            >
              {titleText}
            </h1>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 副标题段 */}
      <Sequence from={titleDuration} durationInFrames={subtitleDuration}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0 80px' }}>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 400,
                color: '#94a3b8',
                fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                lineHeight: 1.6,
                opacity: spring({
                  frame: frame - titleDuration,
                  fps,
                  config: { damping: 200, stiffness: 100 },
                }),
              }}
            >
              {subtitleText}
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 分段字幕 */}
      {segments.map((segment, index) => (
        <Sequence
          key={index}
          from={segmentStartFrames[index]}
          durationInFrames={segment.duration * fps}
        >
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <TypewriterText
              text={segment.text}
              startFrame={0}
              duration={segment.duration * fps}
              fps={fps}
            />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* 进度条 */}
      <ProgressBar
        currentSegment={Math.max(0, currentSegment)}
        totalSegments={totalSegments}
        progress={totalProgress}
      />

      {/* 底部品牌标识 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
            fontFamily: '"Microsoft YaHei", sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          口播 AI 助手
        </span>
      </div>
    </AbsoluteFill>
  );
};