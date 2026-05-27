import { registerRoot, Composition } from 'remotion';
import { MainComposition, myCompSchema } from './MyComposition';

// 计算默认时长：标题3秒 + 副标题2秒 + 每段字幕
const DEFAULT_SEGMENTS = [
  { text: '口播 AI 助手，让你的内容生产效率提升10倍', duration: 8 },
  { text: '每天1条精品视频，自动选题、自动渲染、自动推送', duration: 8 },
  { text: '从观众到选手，只差一个工具的距离', duration: 6 },
];

const DEFAULT_DURATION = (3 + 2) * 30 + DEFAULT_SEGMENTS.reduce((sum, s) => sum + s.duration * 30, 0);

export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={DEFAULT_DURATION}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: '口播 AI 助手',
          subtitleText: '自动化内容生产引擎',
          segments: DEFAULT_SEGMENTS,
          backgroundTheme: 'gradient-blue-purple',
          voiceover: '',
        }}
      />
    </>
  );
};

registerRoot(RemotionVideo);