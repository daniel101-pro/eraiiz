import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  trend, 
  trendUp,
  color = 'green' 
}: StatsCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color].replace('bg-', 'from-').replace(' border-', ' to-')} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate mb-1">{title}</p>
            <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {value}
            </p>
          </div>
          {icon && (
            <div className={`p-3 rounded-xl ${colorClasses[color]} flex-shrink-0 shadow-lg`}>
              {icon}
            </div>
          )}
        </div>
        
        {(change || trend) && (
          <div className="space-y-2">
            {trend && (
              <div className="flex items-center">
                {trendUp ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className={`text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {trend}
                </span>
              </div>
            )}
            
            {change && (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${trendColors[changeType]}`}>
                  {change}
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Animated border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color].replace('bg-', 'from-').replace(' border-', ' to-')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
    </div>
  );
}