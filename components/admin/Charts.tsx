"use client";

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 200, className = "" }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`flex items-end space-x-1 ${className}`} style={{ height: `${height}px` }}>
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center justify-end">
          <div
            className="w-full rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
              backgroundColor: item.color || "#F7C400"
            }}
            title={`${item.label}: ${item.value}`}
          />
        </div>
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ 
  value, 
  max, 
  color = "#552627", 
  height = "h-2",
  showLabel = true,
  label 
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="w-full">
      {showLabel && label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, subtitle, color = "#552627", trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <p className="text-gray-600 text-sm font-semibold mb-2">{title}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {trend && (
        <div className="flex items-center mt-2">
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  className?: string;
}

export function PieChart({ data, size = 200, className = "" }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) return null;

  let currentAngle = 0;
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
          const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
          const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
          const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M 100 100`,
            `L ${startX} ${startY}`,
            `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');
          
          currentAngle = endAngle;
          
          return (
            <g key={index}>
              <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              <path
                d={pathData}
                fill={item.color || "#F7C400"}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LineChartProps {
  data: Array<{ x: string; y: number }>;
  height?: number;
  color?: string;
  className?: string;
}

export function LineChart({ data, height = 200, color = "#F7C400", className = "" }: LineChartProps) {
  if (data.length === 0) return null;

  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.y - minY) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={className}>
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.y - minY) / range) * 100;
          return (
            <g key={index}>
              <title>{`${point.x}: ${point.y}`}</title>
              <circle
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="hover:r-3 transition-all"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}