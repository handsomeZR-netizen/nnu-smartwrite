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

export interface RadarChartProps {
  scores: {
    vocabulary: number;
    grammar: number;
    coherence: number;
    structure: number;
  };
  size?: 'sm' | 'md' | 'lg';
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

export const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 'md' }) => {
  const data = [
    { subject: '语义准确', A: scores.vocabulary, fullMark: 100 },
    { subject: '逻辑连贯', A: scores.grammar, fullMark: 100 },
    { subject: '词汇丰富', A: scores.coherence, fullMark: 100 },
    { subject: '句式多样', A: scores.structure, fullMark: 100 },
    { subject: '语境契合', A: Math.round((scores.vocabulary + scores.coherence) / 2), fullMark: 100 },
  ];

  const height = getSizeHeight(size);

  return (
    <div className="w-full" data-testid="radar-chart">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius={size === 'sm' ? '70%' : '80%'} data={data}>
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
          <Radar
            name="Ability"
            dataKey="A"
            stroke="#1F6A52"
            fill="#5DB090"
            fillOpacity={0.6}
          />
          <RechartsTooltip />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
