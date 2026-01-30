/**
 * 分类标签组件
 */
import React from 'react';
import './CategoryTabs.css';

interface Category {
  id: string;
  label: string;
  labelCn: string;
  icon: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isZh: boolean;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  isZh,
}) => {
  return (
    <div className="category-tabs">
      {categories.map(category => (
        <button
          key={category.id}
          className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => onCategoryChange(category.id)}
        >
          <span className="category-icon">{category.icon}</span>
          <span className="category-label">
            {isZh ? category.labelCn : category.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
