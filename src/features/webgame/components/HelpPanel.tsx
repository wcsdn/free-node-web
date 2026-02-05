/**
 * 帮助面板组件
 * 游戏帮助、常见问题、操作指南
 */
import React, { useState, useEffect } from 'react';
import { apiGet } from '../utils/api';
import styles from '../styles/jxMain.module.css';

interface HelpCategory {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
}

interface HelpArticle {
  id: number;
  category_id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  views: number;
}

const HelpPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; data: HelpCategory[] }>('/api/help/categories');
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (categoryId: number) => {
    setArticleLoading(true);
    try {
      const res = await apiGet<{ success: boolean; data: HelpArticle[] }>(`/api/help/articles?category_id=${categoryId}`);
      if (res.success) {
        setArticles(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setArticleLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    fetchArticles(categoryId);
  };

  const handleArticleSelect = async (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim() || searchKeyword.length < 2) return;
    
    setSearching(true);
    try {
      const res = await apiGet<{ success: boolean; data: HelpArticle[] }>(`/api/help/search?keyword=${encodeURIComponent(searchKeyword)}`);
      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setArticles([]);
    }
  };

  return (
    <div style={{ color: '#000', minWidth: '450px', maxWidth: '600px' }}>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedCategory && (
            <button 
              onClick={handleBack}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px'
              }}
            >
              ←
            </button>
          )}
          <h3 style={{ margin: 0 }}>
            {selectedArticle ? '帮助详情' : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || '文章列表' : '帮助中心'}
          </h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
      </div>

      {/* 搜索栏 */}
      {!selectedCategory && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索问题..."
              style={{ 
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
            <button 
              onClick={handleSearch}
              disabled={searching}
              style={{ 
                padding: '8px 16px',
                background: searching ? '#ccc' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: searching ? 'not-allowed' : 'pointer'
              }}
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>搜索结果：</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {searchResults.map(article => (
              <div
                key={article.id}
                onClick={() => { setSelectedArticle(article); setSearchResults([]); }}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: '#f9f9f9'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{article.title}</div>
                <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {article.content.replace(/[#*`]/g, '').slice(0, 80)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : selectedArticle ? (
        // 文章详情
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>{selectedArticle.title}</h2>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
            浏览: {selectedArticle.views} | 作者: {selectedArticle.author}
          </div>
          <div 
            style={{ 
              lineHeight: '1.8',
              fontSize: '14px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {selectedArticle.content}
          </div>
        </div>
      ) : selectedCategory ? (
        // 文章列表
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {articleLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>该分类下暂无文章</div>
          ) : (
            articles.map(article => (
              <div
                key={article.id}
                onClick={() => handleArticleSelect(article)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: '#f9f9f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{article.title}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>→</span>
              </div>
            ))
          )}
        </div>
      ) : (
        // 分类列表
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#f9f9f9',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{category.icon}</div>
              <div style={{ fontWeight: 'bold', color: '#333' }}>{category.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: '#f5f5f5', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        如有更多问题，请联系客服
      </div>
    </div>
  );
};

export default HelpPanel;
