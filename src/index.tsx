import { registerRoot, Composition } from 'remotion';
import { MainComposition, myCompSchema } from './MyComposition';

// 默认值（当 props 未传入时使用）
const DEFAULT_SEGMENTS = [
  { text: '口播 AI 助手，让你的内容生产效率提升10倍', duration: 8 },
  { text: '每天1条精品视频，自动选题、自动渲染、自动推送', duration: 8 },
  { text: '从观众到选手，只差一个工具的距离', duration: 6 },
];

// 计算总帧数：标题3秒 + 副标题2秒 + 各分段
const calcDuration = (segments) => {
  const fps = 30;
  return (3 + 2) * fps + segments.reduce((sum, s) => sum + s.duration * fps, 0);
};

export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={calcDuration(DEFAULT_SEGMENTS)}
        fps={30}
        width={1080}
        height={1920}
        schema={myCompSchema}
        defaultProps={{
          titleText: '口播 AI 助手，让你的内容生产效率提升10倍！',
          subtitleText: '每天1条精品视频，自动选题、自动渲染、自动推送',
          segments: DEFAULT_SEGMENTS,
          backgroundTheme: 'gradient-blue-purple',
          voiceover: '',
        }}
      />
    </>
  );
};

registerRoot(RemotionVideo);
