import Link from "next/link";
import {
  Sparkle,
  ChartBar,
  BookmarkSimple,
  Camera,
  ChatCircleDots,
  GraduationCap,
  TrendUp,
  ArrowRight,
  Lightning,
  WaveSine,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BentoCard, BentoCardHeader, BentoCardBody } from "@/components/nnu/bento-card";
import promptLibraryData from "@/data/prompt-library.json";

const promptCategories = (
  promptLibraryData as { categories: Array<{ id: string; label: string; templates: unknown[] }> }
).categories;

const totalTemplates = promptCategories.reduce((n, c) => n + c.templates.length, 0);
const njnuTemplateCount =
  promptCategories.find((c) => c.id === "njnu-context")?.templates.length ?? 0;

export default function Home() {
  return (
    <main className="min-h-screen bg-nnu-cream pt-16">
      {/* ============== HERO ============== */}
      <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* 校训淡水印 */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <div className="font-serif text-[20vw] md:text-[14vw] font-black text-nnu-green/[0.04] whitespace-nowrap tracking-[0.1em]">
            正德厚生 笃学敏行
          </div>
        </div>

        {/* 极淡光晕 */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-nnu-mist/60 rounded-full blur-[120px]"
        />

        <div className="container mx-auto relative z-10 text-center max-w-3xl">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs mb-7 bg-white/70 backdrop-blur-md border border-nnu-mist text-nnu-sage">
            <Sparkle weight="fill" className="w-3.5 h-3.5 text-nnu-gold" />
            <span className="font-medium">南师大 · 写作 AI · v2.0</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-6xl font-black text-nnu-ink leading-[1.15] mb-5 tracking-tight">
            把每一次英语练笔，
            <br className="md:hidden" />
            <span className="text-nnu-green">都改到 S 级</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-xl mx-auto text-base md:text-lg text-nnu-ink/65 leading-relaxed mb-9">
            DeepSeek 多维评分 · 逐句标红 · 一键润色 · 永远在线
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link href="/evaluate">
              <Button
                variant="nnu"
                size="lg"
                className="rounded-full px-7 shadow-[0_4px_18px_-6px_rgba(31,106,82,0.45)]"
              >
                立即开始评测
                <ArrowRight weight="bold" className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/njnu">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-7 border-nnu-sage/40 text-nnu-ink hover:bg-nnu-mist/60 hover:text-nnu-green"
              >
                看 {njnuTemplateCount} 个校本场景
              </Button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-nnu-sage flex-wrap">
            <span>
              <span className="font-bold text-nnu-ink">{totalTemplates}</span> 套提示词模板
            </span>
            <Separator orientation="vertical" className="h-3.5 hidden md:block" />
            <span>
              <span className="font-bold text-nnu-ink">{njnuTemplateCount}</span> 个南师场景
            </span>
            <Separator orientation="vertical" className="h-3.5 hidden md:block" />
            <span>
              <span className="font-bold text-nnu-ink">S/A/B/C + 0-100</span> 双轨评级
            </span>
          </div>
        </div>
      </section>

      {/* ============== BENTO GRID ============== */}
      <section className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 auto-rows-fr">
          {/* A. 量化打分 — large */}
          <BentoCard accent="green" className="md:col-span-7 p-6 md:p-7 flex flex-col gap-5">
            <BentoCardHeader
              icon={<ChartBar className="w-5 h-5" weight="fill" />}
              eyebrow="量化评分"
              title="92/100，不只是等级，是看得见的提升"
            />
            <BentoCardBody>
              S/A/B/C 之外，再给一个百分制总分 + 4 维雷达。每次提交都能跟自己上一次比。
            </BentoCardBody>
            {/* mock numeric ring */}
            <div className="mt-auto flex items-center justify-center gap-6 pt-4">
              <ScoreRingMock score={92} ring="green" label="本次" />
              <ScoreRingMock score={78} ring="amber" label="上次" muted />
              <div className="text-left">
                <div className="text-xs text-nnu-sage mb-1">提升</div>
                <div className="text-2xl font-bold text-nnu-green">+14</div>
              </div>
            </div>
          </BentoCard>

          {/* B. 提示词库 */}
          <BentoCard accent="mist" className="md:col-span-5 p-6 md:p-7 flex flex-col gap-5">
            <BentoCardHeader
              icon={<BookmarkSimple className="w-5 h-5" weight="fill" />}
              eyebrow="提示词库"
              title={`${totalTemplates} 套模板，覆盖六大场景`}
            />
            <BentoCardBody>
              四六级 · 考研 · 翻译 · 校本，分类一键调用。
            </BentoCardBody>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {promptCategories.map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-nnu-mist/70 text-nnu-ink/75 border border-nnu-mist"
                >
                  {c.label} · {c.templates.length}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* C. 拍照上传 */}
          <BentoCard accent="cream" className="md:col-span-4 p-6 md:p-7 flex flex-col gap-4">
            <BentoCardHeader
              icon={<Camera className="w-5 h-5" weight="fill" />}
              eyebrow="OCR 上传"
              title="拍一张手写稿，AI 自动识字"
            />
            <BentoCardBody>
              MinerU 接管 jpg / png / pdf / docx，识别完成自动灌入文本框。
            </BentoCardBody>
            <div className="mt-auto pt-2 flex items-center gap-2 text-[11px] text-nnu-sage">
              <span className="px-2 py-0.5 rounded-md bg-white/60 border border-nnu-mist">jpg</span>
              <span className="px-2 py-0.5 rounded-md bg-white/60 border border-nnu-mist">png</span>
              <span className="px-2 py-0.5 rounded-md bg-white/60 border border-nnu-mist">pdf</span>
              <span className="px-2 py-0.5 rounded-md bg-white/60 border border-nnu-mist">docx</span>
            </div>
          </BentoCard>

          {/* D. 多轮追问 */}
          <BentoCard accent="sage" className="md:col-span-8 p-6 md:p-7 flex flex-col gap-4">
            <BentoCardHeader
              icon={<ChatCircleDots className="w-5 h-5" weight="fill" />}
              eyebrow="多轮追问"
              title="每条改进建议都能继续问"
            />
            <BentoCardBody>
              基于本次评测的多轮 AI 对话，AI 会带着你的题目、答案、得分一起思考。
            </BentoCardBody>
            <div className="mt-auto pt-2 flex flex-col gap-2">
              <ChatBubbleMock side="user" text="为什么这里扣分？" />
              <ChatBubbleMock
                side="ai"
                text="因为 'wil' 应为 'will'。在严格评分下属于基础拼写错误。"
              />
            </div>
          </BentoCard>

          {/* E. 校本化 */}
          <BentoCard accent="green" className="md:col-span-7 p-6 md:p-7 flex flex-col gap-4">
            <BentoCardHeader
              icon={<GraduationCap className="w-5 h-5" weight="fill" />}
              eyebrow="校本化"
              title={`${njnuTemplateCount} 个南师独家场景`}
            />
            <BentoCardBody>
              校训反思 · 师范试讲 · 教育实习 · 国际交流 · 校史叙述 · 随园文化 —— 直接对应南师课堂任务。
            </BentoCardBody>
            <div className="mt-auto pt-2 grid grid-cols-3 gap-1.5">
              {["校训反思", "师范试讲", "教育实习", "国际交流", "校史叙述", "随园文化"].map((s) => (
                <div
                  key={s}
                  className="text-[11px] px-2 py-1.5 rounded-lg bg-nnu-mist/50 text-nnu-ink/80 text-center border border-nnu-mist"
                >
                  {s}
                </div>
              ))}
            </div>
          </BentoCard>

          {/* F. 成长追踪 */}
          <BentoCard accent="gold" className="md:col-span-5 p-6 md:p-7 flex flex-col gap-4">
            <BentoCardHeader
              icon={<TrendUp className="w-5 h-5" weight="fill" />}
              eyebrow="成长追踪"
              title="看见自己一周比一周好"
            />
            <BentoCardBody>
              历史评测 · 雷达趋势 · 薄弱点针对推送。
            </BentoCardBody>
            <div className="mt-auto pt-2">
              <TrendChartMock />
            </div>
          </BentoCard>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-nnu-sage mb-2">
            How it works
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-nnu-ink">
            三步把一次练笔变成一次复盘
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <StepCard
            n={1}
            icon={<Camera className="w-5 h-5" weight="fill" />}
            title="上传 / 粘贴"
            desc="手写稿、Word、PDF 都行，或者直接粘贴文本"
          />
          <StepCard
            n={2}
            icon={<Lightning className="w-5 h-5" weight="fill" />}
            title="AI 多维评分"
            desc="DeepSeek 给等级、具体分数、雷达图、逐句标注"
          />
          <StepCard
            n={3}
            icon={<WaveSine className="w-5 h-5" weight="fill" />}
            title="逐句润色 + 追问"
            desc="错误标红 · 高级表达替换 · 任意问题追问 AI"
          />
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl bg-gradient-to-br from-nnu-green to-[#164d3a] text-white px-8 py-12 md:px-14 md:py-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -right-10 -top-10 w-64 h-64 bg-nnu-jade/30 rounded-full blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -left-10 -bottom-10 w-64 h-64 bg-nnu-gold/15 rounded-full blur-3xl"
            />
            <h2 className="relative font-serif text-2xl md:text-3xl font-bold mb-3">
              准备好让每一篇都被认真改一遍了吗？
            </h2>
            <p className="relative text-white/75 mb-7 text-sm md:text-base">
              一次评测，看清你的等级、分数、薄弱点 —— 全部 30 秒内。
            </p>
            <div className="relative flex flex-wrap items-center justify-center gap-3">
              <Link href="/evaluate">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-white text-nnu-green hover:bg-nnu-cream"
                >
                  立即开始
                  <ArrowRight weight="bold" className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link
                href="/practice"
                className="text-sm text-white/85 hover:text-white underline-offset-4 hover:underline"
              >
                浏览所有功能 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreRingMock({
  score,
  ring,
  label,
  muted,
}: {
  score: number;
  ring: "green" | "amber";
  label: string;
  muted?: boolean;
}) {
  const C = 2 * Math.PI * 32;
  const stroke = ring === "green" ? "#1F6A52" : "#d97706";
  const offset = C * (1 - score / 100);
  return (
    <div className={`text-center ${muted ? "opacity-50" : ""}`}>
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#E8EFE9" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${
            ring === "green" ? "text-nnu-green" : "text-amber-600"
          }`}
        >
          {score}
        </div>
      </div>
      <div className="text-[11px] text-nnu-sage mt-1">{label}</div>
    </div>
  );
}

function ChatBubbleMock({ side, text }: { side: "user" | "ai"; text: string }) {
  if (side === "user") {
    return (
      <div className="flex justify-end">
        <div className="px-3 py-2 rounded-2xl rounded-br-sm bg-nnu-green text-white text-xs max-w-[75%]">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white/80 border border-nnu-mist text-nnu-ink text-xs max-w-[75%]">
        {text}
      </div>
    </div>
  );
}

function TrendChartMock() {
  const points = [55, 62, 60, 71, 78, 82, 92];
  const max = 100;
  const w = 220;
  const h = 70;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h + 4}`} className="w-full h-16">
        <path
          d={`${path} L ${w} ${h} L 0 ${h} Z`}
          fill="url(#grad)"
          opacity="0.25"
        />
        <path d={path} fill="none" stroke="#1F6A52" strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={i * step} cy={h - (p / max) * h} r="2.5" fill="#1F6A52" />
        ))}
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F6A52" />
            <stop offset="100%" stopColor="#1F6A52" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center justify-between text-[10px] text-nnu-sage mt-1">
        <span>1 周前</span>
        <span className="font-semibold text-nnu-green">+37 分</span>
        <span>本次</span>
      </div>
    </div>
  );
}

function StepCard({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-2xl bg-white/70 backdrop-blur-md border border-nnu-mist p-5 md:p-6">
      <div className="absolute top-4 right-5 text-4xl font-black font-serif text-nnu-mist select-none">
        0{n}
      </div>
      <div className="w-9 h-9 rounded-xl bg-nnu-green/10 flex items-center justify-center text-nnu-green mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-nnu-ink mb-1.5">{title}</h3>
      <p className="text-xs text-nnu-ink/60 leading-relaxed">{desc}</p>
    </div>
  );
}
