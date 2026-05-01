"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pulse,
  TrendUp,
  Target,
  BookOpen,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/use-auth";
import { getHistory } from "@/lib/storage";
import {
  buildGrowthSeries,
  computeDimensionAverages,
  matchPracticeTags,
  type GrowthPoint,
  type DimensionAverage,
} from "@/lib/analytics";
import type { HistoryRecord, PracticeQuestion } from "@/lib/types";
import practiceData from "@/data/practice-questions.json";

type Tab = "growth" | "weak" | "recommend";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [tab, setTab] = React.useState<Tab>("growth");
  const [records, setRecords] = React.useState<HistoryRecord[]>([]);

  React.useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  React.useEffect(() => {
    if (!user) return;
    setRecords(getHistory().records);
  }, [user]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-nnu-paper pt-24 pb-12 px-4 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const growth = buildGrowthSeries(records);
  const dimensionAvgs = computeDimensionAverages(records);
  const weakest: DimensionAverage[] = dimensionAvgs.slice(0, 2);
  const allQuestions = (practiceData as { questions: PracticeQuestion[] }).questions;
  const recommendTags = weakest.flatMap((w) => matchPracticeTags(w.label));
  const recommended = recommendDeduplicate(allQuestions, recommendTags, 4);

  const totalCount = records.length;
  const latestGrade = records[0]?.result.score;

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <Card className="liquid-glass-dark text-white border-none mb-6 rounded-2xl">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-nnu-gold text-nnu-green flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {user.displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <p className="text-white/80 text-sm mt-1 break-all">{user.email}</p>
              {user.studentId && (
                <p className="text-white/60 text-sm mt-0.5">学号 {user.studentId}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                <span className="bg-white/15 rounded-full px-3 py-1">
                  累计评测 {totalCount} 次
                </span>
                {latestGrade && (
                  <span className="bg-nnu-gold text-nnu-green font-semibold rounded-full px-3 py-1">
                    最新评级 {latestGrade}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4" role="tablist">
          <TabButton active={tab === "growth"} onClick={() => setTab("growth")} icon={<TrendUp className="w-4 h-4" />}>
            成长曲线
          </TabButton>
          <TabButton active={tab === "weak"} onClick={() => setTab("weak")} icon={<Target className="w-4 h-4" />}>
            薄弱点分析
          </TabButton>
          <TabButton active={tab === "recommend"} onClick={() => setTab("recommend")} icon={<Sparkle className="w-4 h-4" />}>
            针对性练习
          </TabButton>
        </div>

        {/* Tab content */}
        <Card className="bg-white shadow-lg border-t-4 border-nnu-green">
          <CardContent className="p-6 sm:p-8">
            {tab === "growth" && <GrowthTab growth={growth} />}
            {tab === "weak" && <WeakTab dimensions={dimensionAvgs} weakest={weakest} />}
            {tab === "recommend" && (
              <RecommendTab
                weakest={weakest}
                questions={recommended}
                hasRecords={records.length > 0}
              />
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          本页所有数据均存储在你本地浏览器中，未上传任何服务器（Demo 版本）
        </p>
      </div>
    </div>
  );
}

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-nnu-green text-white shadow-md"
        : "bg-white text-nnu-green border border-nnu-green/20 hover:bg-nnu-green/5"
    }`}
  >
    {icon}
    {children}
  </button>
);

const GrowthTab: React.FC<{ growth: GrowthPoint[] }> = ({ growth }) => {
  if (growth.length === 0) {
    return (
      <EmptyState
        icon={<Pulse className="w-10 h-10 text-gray-300" />}
        title="还没有评测数据"
        body="提交一次评测后，这里会画出你的写作成长曲线。"
        action={
          <Button asChild variant="nnuGreen">
            <Link href="/evaluate">前往评测</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div>
      <h2 className="text-lg font-bold text-nnu-green mb-1">写作成长曲线</h2>
      <p className="text-sm text-gray-500 mb-5">基于近 {growth.length} 次评测的等级换算分</p>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={growth} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis domain={[40, 100]} stroke="#6b7280" fontSize={12} />
            <Tooltip
              formatter={(value, _name, item) => {
                const grade = (item?.payload as GrowthPoint | undefined)?.grade ?? "";
                return [`${value} (${grade})`, "得分"] as [string, string];
              }}
            />
            <Line
              type="monotone"
              dataKey="scoreValue"
              stroke="#1F6A52"
              strokeWidth={3}
              dot={{ r: 5, fill: "#FF7F50" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const WeakTab: React.FC<{
  dimensions: DimensionAverage[];
  weakest: DimensionAverage[];
}> = ({ dimensions, weakest }) => {
  if (dimensions.length === 0) {
    return (
      <EmptyState
        icon={<Target className="w-10 h-10 text-gray-300" />}
        title="暂无维度数据"
        body="完成几次评测后，这里会汇总你各维度的平均得分并标出最薄弱的两项。"
      />
    );
  }
  return (
    <div>
      <h2 className="text-lg font-bold text-nnu-green mb-1">维度平均分</h2>
      <p className="text-sm text-gray-500 mb-5">越靠下越是你的薄弱点，建议优先突破</p>
      <ul className="space-y-3">
        {dimensions.map((d) => {
          const isWeak = weakest.some((w) => w.key === d.key);
          return (
            <li key={d.key} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-700 flex-shrink-0">{d.label}</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isWeak ? "bg-nnu-coral" : "bg-nnu-green"}`}
                  style={{ width: `${Math.min(100, Math.max(5, d.average))}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm font-semibold tabular-nums">
                {d.average}
              </div>
              {isWeak && (
                <Badge className="bg-nnu-coral text-white">薄弱</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const RecommendTab: React.FC<{
  weakest: DimensionAverage[];
  questions: PracticeQuestion[];
  hasRecords: boolean;
}> = ({ weakest, questions, hasRecords }) => {
  if (!hasRecords) {
    return (
      <EmptyState
        icon={<Sparkle className="w-10 h-10 text-gray-300" />}
        title="先做一次评测吧"
        body="完成评测后，系统会基于你的薄弱维度推荐对应难度与方向的练习题。"
        action={
          <Button asChild variant="nnuGreen">
            <Link href="/evaluate">前往评测</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div>
      <h2 className="text-lg font-bold text-nnu-green mb-1">针对性练习推荐</h2>
      <p className="text-sm text-gray-500 mb-4">
        基于你最薄弱的维度
        {weakest.length > 0 && (
          <>
            {": "}
            {weakest.map((w) => (
              <span
                key={w.key}
                className="inline-block bg-nnu-coral/10 text-nnu-coral rounded px-2 py-0.5 ml-1 text-xs font-semibold"
              >
                {w.label}
              </span>
            ))}
          </>
        )}
      </p>
      {questions.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-sm text-amber-800">
          <Warning className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>暂未匹配到对应练习，可去练习大厅自由选择题目。</span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/practice?qid=${q.id}`}
              className="block border border-gray-200 hover:border-nnu-green hover:shadow-md rounded-lg p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                  {q.title}
                </h3>
                <Badge className="bg-nnu-paper text-nnu-green">{q.difficulty}</Badge>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{q.directions}</p>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href="/practice" className="inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            浏览全部练习题
          </Link>
        </Button>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}> = ({ icon, title, body, action }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{body}</p>
    {action}
  </div>
);

const recommendDeduplicate = (
  questions: PracticeQuestion[],
  tags: string[],
  limit: number,
): PracticeQuestion[] => {
  if (tags.length === 0) {
    return questions.slice(0, limit);
  }
  const tagSet = new Set(tags);
  const matched = questions.filter((q) => {
    const haystack = `${q.title} ${q.directions}`.toLowerCase();
    return [...tagSet].some((t) => haystack.includes(t.toLowerCase()));
  });
  if (matched.length >= limit) return matched.slice(0, limit);
  const matchedIds = new Set(matched.map((m) => m.id));
  const filler = questions.filter((q) => !matchedIds.has(q.id)).slice(0, limit - matched.length);
  return [...matched, ...filler];
};
