/**
 * 帮助面板组件
 * 游戏帮助、常见问题、操作指南
 * 支持静态资源和后端 API 两种模式
 */
import React, { useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { helpData, searchArticles, HelpArticle } from '../../data/help-zh-CN';
import styles from '../../styles/jxMain.module.css';

const HelpPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // 使用静态数据 - 直接使用 helpData，因为类型已经包含完整结构
  const categories = helpData;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [searching, setSearching] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleSearch = () => {
    if (!searchKeyword.trim() || searchKeyword.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const results = searchArticles(searchKeyword);
    setSearchResults(results);
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getCurrentCategory = () => {
    return categories.find((c) => c.id === selectedCategory);
  };

  const getArticlesForCategory = (categoryId: string) => {
    const category = helpData.find((c) => c.id === categoryId);
    return category?.articles || [];
  };

  return (
    <div className={gufengStyles.popupOverlay}>
      <div className={gufengStyles.helpPanel}>
        {/* 头部 */}
        <div className={gufengStyles.helpHeader}>
          <h2>游戏帮助</h2>
          <button className={gufengStyles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={gufengStyles.helpContent}>
          {/* 侧边栏 - 分类列表 */}
          {!selectedCategory && (
            <div className={gufengStyles.helpSidebar}>
              <div className={gufengStyles.helpSearch}>
                <input
                  type="text"
                  placeholder="搜索帮助..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>搜索</button>
              </div>

              {searching ? (
                <div className={gufengStyles.searchResults}>
                  <h3>搜索结果</h3>
                  {searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map((article) => {
                        const category = helpData.find((c) =>
                          c.articles.some((a) => a.id === article.id)
                        );
                        return (
                          <li
                            key={`${category?.id}-${article.id}`}
                            onClick={() => handleArticleSelect(article)}
                          >
                            <span className={gufengStyles.articleTitle}>{article.title}</span>
                            <span className={gufengStyles.categoryTag}>{category?.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={gufengStyles.noResults}>未找到相关内容</p>
                  )}
                  <button
                    className={gufengStyles.backButton}
                    onClick={() => {
                      setSearching(false);
                      setSearchKeyword('');
                      setSearchResults([]);
                    }}
                  >
                    返回分类
                  </button>
                </div>
              ) : (
                <ul className={gufengStyles.categoryList}>
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <span className={gufengStyles.categoryIcon}>{category.icon}</span>
                      <span className={gufengStyles.categoryName}>{category.name}</span>
                      <span className={gufengStyles.arrow}>›</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 文章列表 */}
          {selectedCategory && !selectedArticle && (
            <div className={gufengStyles.helpMain}>
              <div className={gufengStyles.helpBreadcrumb}>
                <span onClick={handleBack}>帮助</span>
                <span> › </span>
                <span>{getCurrentCategory()?.name}</span>
              </div>
              <ul className={gufengStyles.articleList}>
                {getArticlesForCategory(selectedCategory).map((article) => (
                  <li key={article.id} onClick={() => handleArticleSelect(article)}>
                    <span className={gufengStyles.articleTitle}>{article.title}</span>
                    <span className={gufengStyles.arrow}>›</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 文章内容 */}
          {selectedArticle && (
            <div className={gufengStyles.helpMain}>
              <div className={gufengStyles.helpBreadcrumb}>
                <span onClick={handleBack}>帮助</span>
                <span> › </span>
                <span onClick={() => setSelectedArticle(null)}>
                  {getCurrentCategory()?.name}
                </span>
                <span> › </span>
                <span>{selectedArticle.title}</span>
              </div>
              <div className={gufengStyles.articleContent}>
                <h3>{selectedArticle.title}</h3>
                <div className={gufengStyles.articleBody}>
                  {selectedArticle.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className={gufengStyles.articleKeywords}>
                  <span>关键词：</span>
                  {selectedArticle.keywords.map((keyword, index) => (
                    <span key={index} className={gufengStyles.keyword}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
