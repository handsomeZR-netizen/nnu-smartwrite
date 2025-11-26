import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import type { RadarDimensions } from '@/lib/types';

export interface RadarChartProps {
  scores?: {
    vocabulary: number;
    grammar: number;
    coherence: number;
    structure: number;
  };
  dimensions?: RadarDimensions; // 新增：动态维度支持
  historicalAverage?: RadarDimensions; // 新增：历史平均数据
  size?: 'sm' | 'md' | 'lg';
  onDimensionClick?: (dimension: string, index: number) => void; // 新增：点击交互
}

const getSizeHeight = (size: 'sm' | 'md' | 'lg'): number => {
  switch (size) {
    case 'sm':
      return 130;
    case 'md':
      return 300;
    case 'lg':
      return 400;
    default:
      return 300;
  }
};

export const RadarChart: React.FC<RadarChartProps> = ({ 
  scores, 
  dimensions,
  historicalAverage,
  size = 'md',
  onDimensionClick 
}) => {
  const height = getSizeHeight(size);

  // 优先使用动态维度，否则使用传统 scores
  let data: Array<{ subject: string; current: number; historical?: number; fullMark: number }>;
  
  if (dimensions) {
    // 使用动态维度
    data = [
      { subject: dimensions.labels[0], current: dimensions.dim1, historical: historicalAverage?.dim1, fullMark: 100 },
      { subject: dimensions.labels[1], current: dimensions.dim2, historical: historicalAverage?.dim2, fullMark: 100 },
      { subject: dimensions.labels[2], current: dimensions.dim3, historical: historicalAverage?.dim3, fullMark: 100 },
      { subject: dimensions.labels[3], current: dimensions.dim4, historical: historicalAverage?.dim4, fullMark: 100 },
    ];
  } else if (scores) {
    // 向后兼容：使用传统 scores
    data = [
      { subject: '语义准确', current: scores.vocabulary, fullMark: 100 },
      { subject: '逻辑连贯', current: scores.grammar, fullMark: 100 },
      { subject: '词汇丰富', current: scores.coherence, fullMark: 100 },
      { subject: '句式多样', current: scores.structure, fullMark: 100 },
      { subject: '语境契合', current: Math.round((scores.vocabulary + scores.coherence) / 2), fullMark: 100 },
    ];
  } else {
    // 默认空数据
    data = [
      { subject: '维度1', current: 0, fullMark: 100 },
      { subject: '维度2', current: 0, fullMark: 100 },
      { subject: '维度3', current: 0, fullMark: 100 },
      { subject: '维度4', current: 0, fullMark: 100 },
    ];
  }

  return (
    <div className="w-full" data-testid="radar-chart">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius={size === 'sm' ? '70%' : '80%'} 
          data={data}
          onClick={(e) => {
            if (e && e.activeLabel && onDimensionClick) {
              const index = data.findIndex(d => d.subject === e.activeLabel);
              if (index !== -1) {
                onDimensionClick(e.activeLabel, index);
              }
            }
          }}
        >
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#666', fontSize: size === 'sm' ? 9 : 10 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          
          {/* 历史平均数据（灰色虚线） */}
          {historicalAverage && (
            <Radar
              name="历史平均"
              dataKey="historical"
              stroke="#9ca3af"
              fill="#d1d5db"
              fillOpacity={0.3}
              strokeDasharray="5 5"
            />
          )}
          
          {/* 当前数据（绿色实线） */}
          <Radar
            name="当前得分"
            dataKey="current"
            stroke="#1F6A52"
            fill="#5DB090"
            fillOpacity={0.6}
          />
          
          <RechartsTooltip />
        </RechartsRadarChart>
      </ResponsiveContainer>
      
      {/* 交互提示 */}
      {onDimensionClick && (
        <p className="text-xs text-gray-500 text-center mt-2">
          点击维度查看详细分析
        </p>
      )}
    </div>
  );
};

export default RadarChart;
