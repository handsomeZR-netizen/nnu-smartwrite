"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Target, BarChart3, BookOpen, Sparkles } from "lucide-react";
import { MagneticButton } from "@/components/nnu/magnetic-button";

export default function Home() {
  return (
    <main className="min-h-screen bg-nnu-paper pt-16">
      {/* Hero Section */}
      <section className="relative hero-gradient noise-texture text-white pt-16 pb-20 md:pt-24 md:pb-28 px-4 overflow-hidden">
        {/* 背景装饰 - 径向渐变光晕 */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-nnu-jade/20 rounded-full translate-x-1/2 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-nnu-gold/15 rounded-full -translate-x-1/2 translate-y-1/2 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[80px]" />

        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 bg-white/10 backdrop-blur-sm border border-white/20">
            <Sparkles className="w-4 h-4 text-nnu-gold" />
            <span className="text-white/90">Powered by DeepSeek V3 API</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="block">DeepSeek 赋能的</span>
            <span className="block text-nnu-gold">上下文语义评价</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-white/80 text-base md:text-lg mb-10 leading-relaxed">
            区别于传统语法检查，我们理解语境。同义替换？逻辑连贯？文体风格？
            <br className="hidden md:block" />
            NNU SmartWrite 都能像真人导师一样为您精准判分。
          </p>

          {/* CTA Button */}
          <Link href="/evaluate">
            <MagneticButton aria-label="开始英语写作评估">
              开始智能评估
            </MagneticButton>
          </Link>
        </div>
      </section>


      {/* Feature Cards Section */}
      <section className="container mx-auto px-4 -mt-12 relative z-20 pb-16">
        <h2 className="sr-only">平台特色功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Card 1 */}
          <Card className="feature-card bg-white rounded-2xl shadow-lg" role="article">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="icon-wrapper w-14 h-14 bg-nnu-green/10 rounded-xl flex items-center justify-center mb-5">
                <Target className="w-7 h-7 text-nnu-green" />
              </div>
              <h3 className="text-xl font-semibold text-nnu-green mb-3">
                语义级评估
              </h3>
              <p className="text-gray-600 leading-relaxed">
                基于 DeepSeek AI，深度理解上下文语境，智能接受同义词和等价表达
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="feature-card bg-white rounded-2xl shadow-lg" role="article">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="icon-wrapper w-14 h-14 bg-nnu-green/10 rounded-xl flex items-center justify-center mb-5">
                <BarChart3 className="w-7 h-7 text-nnu-green" />
              </div>
              <h3 className="text-xl font-semibold text-nnu-green mb-3">
                多维度反馈
              </h3>
              <p className="text-gray-600 leading-relaxed">
                提供等级评分、详细分析、润色建议和雷达图可视化，全方位提升写作能力
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="feature-card bg-white rounded-2xl shadow-lg" role="article">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="icon-wrapper w-14 h-14 bg-nnu-green/10 rounded-xl flex items-center justify-center mb-5">
                <BookOpen className="w-7 h-7 text-nnu-green" />
              </div>
              <h3 className="text-xl font-semibold text-nnu-green mb-3">
                真题练习
              </h3>
              <p className="text-gray-600 leading-relaxed">
                精选考研英语真题，配合智能评估系统，帮助你高效备考
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Secondary CTA Section */}
      <section className="bg-gradient-to-b from-nnu-paper to-white py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-nnu-green mb-4">
            准备好提升你的英语写作了吗？
          </h2>
          <p className="text-gray-600 mb-8">
            立即体验 AI 驱动的智能评估，获取专业级写作反馈
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/evaluate">
              <MagneticButton>立即开始</MagneticButton>
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-nnu-green text-nnu-green font-semibold hover:bg-nnu-green hover:text-white transition-all duration-300"
            >
              浏览真题
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
