import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvaluationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RadarChart } from './radar-chart';
import { BarChart3, CheckCircle, BookOpen, AlertCircle, ChevronRight } from 'lucide-react';

export interface ResultCardProps {
  result: EvaluationResult;
  showRadarChart?: boolean;
}

const getScoreColor = (score: 'S' | 'A' | 'B' | 'C'): string => {
  switch (score) {
    case 'S':
      return 'text-green-600';
    case 'A':
      return 'text-blue-600';
    case 'B':
      return 'text-yellow-600';
    case 'C':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getScoreDescription = (score: 'S' | 'A' | 'B' | 'C'): string => {
  const descriptions = {
    S: '优秀',
    A: '良好',
    B: '中等',
    C: '需要改进',
  };
  return descriptions[score];
};


export const ResultCard: React.FC<ResultCardProps> = ({ result, showRadarChart = false }) => {
  const { score, isSemanticallyCorrect, analysis, polishedVersion } = result;

  // 解析分析内容为详细项
  const analysisDetails = [
    {
      type: isSemanticallyCorrect ? 'success' : 'warning',
      title: '语义等价判定 (Semantic Equivalence)',
      content: isSemanticallyCorrect 
        ? '你的表达在语义上与标准答案等价，DeepSeek 判定为正确。'
        : '你的表达与标准答案存在语义差异，建议参考润色建议进行改进。',
    },
    {
      type: 'info',
      title: '语境契合度 (Context Awareness)',
      content: analysis,
    },
    {
      type: 'suggestion',
      title: 'AI 润色建议 (Polishing)',
      content: polishedVersion,
    },
  ];

  return (
    <Card 
      className="bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="article"
      aria-label="评估结果卡片"
    >
      {/* Header */}
      <CardHeader className="bg-nnu-green p-4 text-white flex flex-row justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          评测报告
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          ID: {new Date(result.timestamp).toISOString().slice(0, 10).replace(/-/g, '')}-{String(result.timestamp).slice(-3)}
        </span>
      </CardHeader>

      <CardContent className="p-6">
        {/* Score and Radar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">综合评级</div>
            <div 
              className={cn("text-6xl font-black font-serif drop-shadow-sm", getScoreColor(score))}
              role="status"
              aria-label={`评分等级 ${score}，${getScoreDescription(score)}`}
            >
              {score}
            </div>
          </div>
          
          {showRadarChart && result.radarScores && (
            <>
              <div className="h-12 w-[1px] bg-gray-200" />
              <div className="w-48 h-32">
                <RadarChart scores={result.radarScores} size="sm" />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="bg-nnu-paper p-4 rounded-lg border border-nnu-gold/30 mb-4">
          <p className="text-nnu-green text-sm font-medium leading-relaxed italic">
            "{isSemanticallyCorrect ? 'Excellent work! Your translation demonstrates a deep understanding of the context.' : 'Good effort! There are some areas that could be improved.'}"
          </p>
        </div>

        {/* Detail Analysis */}
        <div className="space-y-3">
          {analysisDetails.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition bg-white">
              <div className="flex items-start gap-3">
                {item.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />}
                {item.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />}
                {item.type === 'info' && <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />}
                {item.type === 'suggestion' && <AlertCircle className="w-5 h-5 text-nnu-coral mt-0.5 shrink-0" />}
                
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                  <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Powered by NNU SmartWrite Engine</span>
          <button type="button" className="text-xs text-nnu-green font-bold hover:underline flex items-center">
            查看完整报告 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
