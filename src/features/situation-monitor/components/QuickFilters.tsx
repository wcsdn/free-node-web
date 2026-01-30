/**
 * 快速筛选组件
 */
import React from 'react';
import './QuickFilters.css';

interface QuickFiltersProps {
  keywords: string[];
  onFilter: (keyword: string) => void;
  isZh?: boolean;
}

// 关键词中文映射
const KEYWORD_ZH_MAP: Record<string, string> = {
  trump: '特朗普',
  biden: '拜登',
  china: '中国',
  russia: '俄罗斯',
  ukraine: '乌克兰',
  taiwan: '台湾',
  iran: '伊朗',
  israel: '以色列',
  india: '印度',
  nato: '北约',
  war: '战争',
  conflict: '冲突',
  military: '军事',
  economy: '经济',
  market: '市场',
};

const QuickFilters: React.FC<QuickFiltersProps> = ({ keywords, onFilter, isZh = false }) => {
  const getDisplayName = (keyword: string) => {
    if (isZh && KEYWORD_ZH_MAP[keyword.toLowerCase()]) {
      return KEYWORD_ZH_MAP[keyword.toLowerCase()];
    }
    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
  };

  return (
    <div className="quick-filters">
      {keywords.map(keyword => (
        <button
          key={keyword}
          className="quick-filter-btn"
          onClick={() => onFilter(keyword)}
          title={keyword}
        >
          {getDisplayName(keyword)}
        </button>
      ))}
    </div>
  );
};

export default QuickFilters;
