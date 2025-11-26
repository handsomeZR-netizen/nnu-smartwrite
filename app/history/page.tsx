'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getHistory, clearHistory, deleteHistoryRecord } from '@/lib/storage';
import type { HistoryRecord } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadarChartSkeleton, HistoryListItemSkeleton } from '@/components/nnu/skeletons';

// Dynamic import for RadarChart (only loaded when needed)
const RadarChart = dynamic(
  () => import('@/components/nnu/radar-chart').then(mod => mod.RadarChart),
  {
    loading: () => <RadarChartSkeleton />,
    ssr: false,
  }
);

/**
 * 格式化时间戳为可读日期
 */
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 获取评分等级对应的颜色类名
 */
const getScoreColor = (score: string): string => {
  switch (score) {
    case 'S':
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 'A':
      return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
    case 'B':
      return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    case 'C':
      return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    default:
      return 'bg-gray-300 text-gray-700';
  }
};

/**
 * 历史记录详情组件
 */
const HistoryDetail = ({
  record,
  onClose,
}: {
  record: HistoryRecord;
  onClose: () => void;
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <Card className="bg-white w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <div className="flex justify-between items-start mb-6 gap-2">
          <div className="flex-1 min-w-0">
            <h2 id="history-detail-title" className="text-xl md:text-2xl font-bold text-nnu-green mb-2">评估详情</h2>
            <p className="text-sm text-gray-500">
              <time dateTime={new Date(record.createdAt).toISOString()}>
                {formatDate(record.createdAt)}
              </time>
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="text-gray-600 hover:text-gray-900 touch-manipulation shrink-0"
            aria-label="关闭详情对话框"
          >
            关闭
          </Button>
        </div>

        {/* 评估结果概览 */}
        <section aria-labelledby="result-summary" className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <Badge 
            className={`text-2xl font-bold px-4 py-2 ${getScoreColor(record.result.score)}`}
            role="status"
            aria-label={`评分等级 ${record.result.score}`}
          >
            {record.result.score}
          </Badge>
          <div className="flex-1">
            <h3 id="result-summary" className="text-lg font-semibold">评估结果</h3>
            <p className="text-sm text-gray-600">
              {record.result.isSemanticallyCorrect ? '✓ 语义正确' : '✗ 需要改进'}
            </p>
          </div>
        </section>

        {/* 原始输入 */}
        <section aria-labelledby="original-input" className="space-y-4 mb-6">
          <h3 id="original-input" className="sr-only">原始输入</h3>
          <div>
            <h4 className="font-medium text-nnu-green mb-2">题目要求</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{record.input.directions}</p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">文章语境</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
              {record.input.essayContext}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">你的答案</h4>
            <p className="text-gray-700 bg-blue-50 p-3 rounded font-medium">
              {record.input.studentSentence}
            </p>
          </div>
        </section>

        {/* 评估反馈 */}
        <section aria-labelledby="feedback-section" className="space-y-4 mb-6">
          <h3 id="feedback-section" className="sr-only">评估反馈</h3>
          <div>
            <h4 className="font-medium text-nnu-green mb-2">详细分析</h4>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded">
              {record.result.analysis}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">润色建议</h4>
            <p className="text-gray-700 italic bg-nnu-paper p-3 rounded">
              {record.result.polishedVersion}
            </p>
          </div>
        </section>

        {/* 雷达图（如果有） */}
        {record.result.radarScores && (
          <section aria-labelledby="radar-section">
            <h4 id="radar-section" className="font-medium text-nnu-green mb-4">多维度评分</h4>
            <div className="flex justify-center">
              <RadarChart scores={record.result.radarScores} size="lg" />
            </div>
          </section>
        )}
      </Card>
    </div>
  );
};

/**
 * 历史记录列表项组件
 */
const HistoryListItem = ({
  record,
  onView,
  onDelete,
}: {
  record: HistoryRecord;
  onView: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card 
      className="bg-white p-4 hover:shadow-lg transition-shadow"
      role="article"
      aria-label={`历史记录，评分${record.result.score}，${formatDate(record.createdAt)}`}
    >
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge 
              className={`${getScoreColor(record.result.score)} px-3 py-1 text-lg font-bold`}
              aria-label={`评分等级 ${record.result.score}`}
            >
              {record.result.score}
            </Badge>
            <time className="text-sm text-gray-500" dateTime={new Date(record.createdAt).toISOString()}>
              {formatDate(record.createdAt)}
            </time>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">题目：</span>
              <p className="text-sm text-gray-700 truncate">{record.input.directions}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">答案：</span>
              <p className="text-sm text-gray-900 font-medium truncate">
                {record.input.studentSentence}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
          <Button 
            onClick={onView} 
            size="sm" 
            className="bg-nnu-green hover:bg-nnu-green/90 flex-1 md:flex-none touch-manipulation"
            aria-label="查看详情"
          >
            查看详情
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 md:flex-none touch-manipulation"
            aria-label="删除此记录"
          >
            删除
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * 空状态组件
 */
const EmptyState = () => {
  return (
    <div className="text-center py-16" role="status" aria-live="polite">
      <div className="text-6xl mb-4" role="img" aria-label="笔记图标">📝</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无历史记录</h3>
      <p className="text-gray-500 mb-6">完成评估后，记录会自动保存在这里</p>
      <Button
        onClick={() => (window.location.href = '/evaluate')}
        className="bg-nnu-coral hover:bg-nnu-coral/90"
        aria-label="开始评估"
      >
        开始评估
      </Button>
    </div>
  );
};

/**
 * 历史记录页面
 */
export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = getHistory();
        setRecords(history.records);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // 清空所有历史记录
  const handleClearAll = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      const success = clearHistory();
      if (success) {
        setRecords([]);
      } else {
        alert('清空历史记录失败，请重试');
      }
    }
  };

  // 删除单条记录
  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      const success = deleteHistoryRecord(id);
      if (success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('删除记录失败，请重试');
      }
    }
  };

  // 查看记录详情
  const handleView = (record: HistoryRecord) => {
    setSelectedRecord(record);
  };

  // 关闭详情视图
  const handleCloseDetail = () => {
    setSelectedRecord(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="space-y-4">
          <HistoryListItemSkeleton />
          <HistoryListItemSkeleton />
          <HistoryListItemSkeleton />
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 pt-24 pb-8">
      {/* 页面标题 */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nnu-green mb-2">历史记录</h1>
          <p className="text-gray-600" role="status" aria-live="polite">
            {records.length > 0 ? `共 ${records.length} 条记录` : '暂无记录'}
          </p>
        </div>
        {records.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label="清空所有历史记录"
          >
            清空所有记录
          </Button>
        )}
      </header>

      {/* 历史记录列表或空状态 */}
      {records.length === 0 ? (
        <EmptyState />
      ) : (
        <section aria-label="历史记录列表">
          <div className="space-y-4" role="list">
            {records.map((record) => (
              <HistoryListItem
                key={record.id}
                record={record}
                onView={() => handleView(record)}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 详情弹窗 */}
      {selectedRecord && (
        <HistoryDetail record={selectedRecord} onClose={handleCloseDetail} />
      )}
    </main>
  );
}
