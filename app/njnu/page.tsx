"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Books,
  Sparkle,
  Heart,
  ArrowRight,
  Compass,
  Buildings,
  Quotes,
} from "@phosphor-icons/react";
import promptLibraryData from "@/data/prompt-library.json";

interface PromptTemplate {
  id: string;
  title: string;
  summary: string;
  evaluationFocus: string[];
  scoreWeights: Record<string, number>;
  directionsTemplate: string;
  rubric: string;
  polishHints: string[];
  tags?: string[];
}

interface PromptCategory {
  id: string;
  label: string;
  description: string;
  templates: PromptTemplate[];
}

interface PromptLibraryFile {
  version: string;
  categories: PromptCategory[];
}

const library = promptLibraryData as unknown as PromptLibraryFile;

// 维度英文 key -> 中文显示
const WEIGHT_LABELS: Record<string, string> = {
  relevance: "切题",
  structure: "结构",
  grammar: "语法",
  vocabulary: "词汇",
  expression: "表达",
  cultural_awareness: "文化意识",
  teaching_competence: "师范素养",
  motto_interpretation: "校训理解",
  authenticity: "情感真挚",
  context_match: "语境契合",
  cultural_terms: "文化负载词",
  syntax_variety: "句式多样",
  voice: "感染力",
  motivation: "动机清晰",
};

function topTwoWeights(weights: Record<string, number>) {
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => ({
      label: WEIGHT_LABELS[k] ?? k,
      value: v,
    }));
}

// 给每张卡片配一个图标，让视觉更有层次
const CARD_ICON_BY_ID: Record<string, React.ElementType> = {
  "njnu-classroom-motto-reflection": Quotes,
  "njnu-suiyuan-cultural-narrative": Buildings,
  "njnu-teacher-trial-lesson-reflection": GraduationCap,
  "njnu-teaching-practicum-summary": Books,
  "njnu-international-exchange-statement": Compass,
  "njnu-history-narrative": Heart,
};

export default function NjnuLandingPage() {
  const njnuCategory = library.categories.find((c) => c.id === "njnu-context");
  const templates = njnuCategory?.templates ?? [];

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-6xl space-y-10">
        {/* Hero */}
        <section
          className="relative overflow-hidden liquid-glass rounded-3xl p-6 md:p-10"
          aria-labelledby="njnu-hero-title"
        >
          {/* 背景光晕 */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full bg-nnu-jade/25 blur-[120px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-nnu-gold/20 blur-[120px]"
            aria-hidden
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
            {/* 校徽 */}
            <div className="flex justify-center md:justify-start">
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/70 border border-white/60 shadow-[0_8px_32px_-8px_rgba(31,106,82,0.25)] flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="南京师范大学校徽"
                  width={120}
                  height={120}
                  className="w-20 h-20 md:w-28 md:h-28 object-contain"
                  priority
                />
              </div>
            </div>

            {/* 文案 */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nnu-green/10 text-nnu-green text-xs font-medium mb-3">
                <Sparkle weight="fill" className="w-3.5 h-3.5" />
                南师专属 · NJNU SmartWrite
              </div>
              <h1
                id="njnu-hero-title"
                className="text-3xl md:text-5xl font-bold text-nnu-green mb-3 leading-tight"
              >
                南师专属 · NJNU SmartWrite
              </h1>
              <p className="font-motto text-nnu-coral text-lg md:text-2xl tracking-[0.2em] mb-3">
                正德厚生 · 笃学敏行
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl">
                为南师大学子专门定制的英语写作训练场景。从校训反思、随园叙事到教育实习总结、
                海外交流申请，这里收纳的每一条模板都来自真实的南师课堂与师生场景。
              </p>
            </div>
          </div>
        </section>

        {/* Quick-apply 卡片 */}
        <section aria-labelledby="njnu-templates-title">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2
                id="njnu-templates-title"
                className="text-2xl md:text-3xl font-bold text-nnu-green"
              >
                六张写作场景卡 · 一键体验
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                选择最贴合你当下任务的场景，进入评测页即可自动填好任务说明
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-nnu-green/70 bg-white/60 border border-white/50 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Books className="w-3.5 h-3.5" />
              {templates.length} 个场景
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => {
              const Icon = CARD_ICON_BY_ID[t.id] ?? GraduationCap;
              const top2 = topTwoWeights(t.scoreWeights);
              return (
                <article
                  key={t.id}
                  className="group relative bg-white/55 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_-8px_rgba(31,106,82,0.18)] rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_44px_-12px_rgba(31,106,82,0.28)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-nnu-green/10 text-nnu-green flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" weight="duotone" />
                    </div>
                    {t.tags?.[0] && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-nnu-gold/15 text-nnu-green border border-nnu-gold/30">
                        {t.tags[0]}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-nnu-green text-base md:text-lg mb-2 leading-snug">
                    {t.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                    {t.summary}
                  </p>

                  {/* 高亮 top-2 维度 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {top2.map((d) => (
                      <span
                        key={d.label}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-nnu-jade/15 text-nnu-green border border-nnu-jade/30"
                      >
                        <span className="font-semibold">{d.label}</span>
                        <span className="text-nnu-green/70">{d.value}%</span>
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/evaluate?template=${t.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-nnu-green text-white text-sm font-medium shadow-sm hover:bg-nnu-green/90 transition-colors focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-offset-2"
                    aria-label={`立即体验 ${t.title}`}
                  >
                    立即体验
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" weight="bold" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* 随园彩蛋区 */}
        <section
          aria-labelledby="suiyuan-easter-egg"
          className="relative overflow-hidden liquid-glass rounded-3xl p-6 md:p-10"
        >
          <div
            className="pointer-events-none absolute top-0 right-0 w-[360px] h-[360px] rounded-full bg-nnu-coral/15 blur-[100px]"
            aria-hidden
          />

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="md:col-span-1">
              <h2
                id="suiyuan-easter-egg"
                className="text-xl md:text-2xl font-bold text-nnu-green mb-3 flex items-center gap-2"
              >
                <Heart className="w-6 h-6 text-nnu-coral" weight="fill" />
                随园·彩蛋
              </h2>
              <p className="font-motto text-nnu-coral text-base md:text-lg italic leading-relaxed">
                &ldquo;静坐随园听雨，看那石桥下的水波，
                <br />
                也仿佛是百年前先生们的诵书声。&rdquo;
              </p>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/65 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-nnu-green font-semibold mb-2">
                  <Buildings className="w-5 h-5" weight="duotone" />
                  随园校区
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  位于宁海路 122 号，民国建筑群与百年梧桐共生，被誉为东方最美校园之一。
                  晨光穿过老墙，是无数南师学子最熟悉的画面。
                </p>
              </div>
              <div className="bg-white/65 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-nnu-green font-semibold mb-2">
                  <GraduationCap className="w-5 h-5" weight="duotone" />
                  仙林校区
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  现代教学与科研主阵地，敬文图书馆灯火通宵，仙林湖畔是南师人晨读的诗意起点。
                </p>
              </div>
              <div className="bg-white/65 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-nnu-green font-semibold mb-2">
                  <Books className="w-5 h-5" weight="duotone" />
                  附属学校
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  南师附中、二附中等附属学校，是南师师范生最常前往实习与试讲的&ldquo;第二课堂&rdquo;。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
