import { registerRoot, Composition } from 'remotion';
import { MainComposition, myCompSchema } from './MyComposition';

// 默认值（当 props 未传入时使用）
const DEFAULT_SEGMENTS = [
  { text: '传统行业的中年人，到底要不要学AI？我的答案是：要。但别报课。', duration: 2 },
  { text: '为什么？因为你学AI不是为了当程序员，是为了省时间、多赚钱。AI帮你写稿、做字幕、剪视频，10分钟干完你一天的事。不需要懂技术，像用手机一样简单。', duration: 10 },
  { text: '说个真实的情况。我做自媒体几年，没赚到什么大钱。但AI帮我省了很多时间——以前剪一条视频2小时，现在20分钟。省下的时间做什么？发第二条内容。量的提升才有质的变化，这个账你算得过来。', duration: 13 },
  { text: '我不卖课，也不推荐你报什么班。工具都是免费的，差的只是有人告诉你第一步怎么走。我从军12年，退役后跑过业务做过生意。AI这条路我自己走通过了，你照着走就行。', duration: 10 },
  { text: '想知道第一步做什么，评论区打一个「第一步」，我把7天的路书免费发给你。', duration: 5 },
];

// 计算总时长（标题3s + 副标题2s + 各分段）
const HEADER_DURATION = 5; // 标题3秒 + 副标题2秒
const TOTAL_SEGMENT_DURATION = DEFAULT_SEGMENTS.reduce((sum, s) => sum + s.duration, 0);
const TOTAL_DURATION = HEADER_DURATION + TOTAL_SEGMENT_DURATION;

export const Root: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={MainComposition}
      durationInFrames={Math.round(TOTAL_DURATION * 30)}
      fps={30}
      width={1080}
      height={1440}
      schema={myCompSchema}
      defaultProps={{
        titleText: '传统行业的中年人，到底要不要学AI？',
        subtitleText: '一个从军12年的人的大实话',
        segments: DEFAULT_SEGMENTS,
        backgroundTheme: 'dark-professional',
        voiceover: 'voiceover.mp3',
      }}
    />
  );
};

registerRoot(Root);