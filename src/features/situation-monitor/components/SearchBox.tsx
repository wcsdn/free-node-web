/**
 * 搜索框组件
 */
import React from 'react';
import './SearchBox.css';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  isZh?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, isZh = false }) => {
  return (
    <div className="search-box">
      <input
        type="text"
        className="search-input"
        placeholder={isZh ? '搜索文章...' : 'Search articles...'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span className="search-icon">🔍</span>
    </div>
  );
};

export default SearchBox;
