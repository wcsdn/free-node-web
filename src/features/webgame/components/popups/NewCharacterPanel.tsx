/**
 * 创建角色面板
 * 替代原来的 Enter.aspx (角色创建页面)
 */
import React, { useState } from 'react';
import styles from '../../styles/jxMain.module.css';

interface NewCharacterPanelProps {
  onCreate: (data: {
    username: string;
    cityName: string;
    gender: 'male' | 'female';
  }) => void;
  onBack?: () => void;
}

const NewCharacterPanel: React.FC<NewCharacterPanelProps> = ({ onCreate, onBack }) => {
  const [username, setUsername] = useState('');
  const [cityName, setCityName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 验证用户名
  const validateUsername = (name: string): string | null => {
    if (!name.trim()) return '请输入角色名';
    if (name.length < 2) return '角色名至少2个字符';
    if (name.length > 14) return '角色名最多14个字符';
    // 只能包含汉字、字母、数字
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) {
      return '角色名只能包含汉字、字母和数字';
    }
    return null;
  };

  // 验证城市名
  const validateCityName = (name: string): string | null => {
    if (!name.trim()) return '请输入城镇名';
    if (name.length < 2) return '城镇名至少2个字符';
    if (name.length > 18) return '城镇名最多18个字符';
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) {
      return '城镇名只能包含汉字、字母和数字';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const cityNameError = validateCityName(cityName);
    if (cityNameError) {
      setError(cityNameError);
      return;
    }

    setLoading(true);

    try {
      // 模拟创建
      await new Promise(resolve => setTimeout(resolve, 1500));
      onCreate({ username, cityName, gender });
    } catch (err: any) {
      setError('创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.newCharacterPanel}>
        {/* 头部 */}
        <div className={styles.newCharacterHeader}>
          <h2>创建角色</h2>
          {onBack && (
            <button className={styles.backButton} onClick={onBack}>
              返回
            </button>
          )}
        </div>

        {/* 创建表单 */}
        <div className={styles.newCharacterContent}>
          <form onSubmit={handleSubmit}>
            {/* 角色名 */}
            <div className={styles.formGroup}>
              <label>角色名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2-14个字符"
                maxLength={14}
              />
              <p className={styles.formHint}>
                由汉字、字母 a～z（不区分大小写）、数字 0～9 组成
              </p>
            </div>

            {/* 城镇名 */}
            <div className={styles.formGroup}>
              <label>城镇名</label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="2-18个字符"
                maxLength={18}
              />
              <p className={styles.formHint}>
                您的城市将以此命名
              </p>
            </div>

            {/* 性别选择 */}
            <div className={styles.formGroup}>
              <label>选择性别</label>
              <div className={styles.genderSelector}>
                <label className={`${styles.genderOption} ${gender === 'female' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                  />
                  <span className={styles.genderIcon}>👩</span>
                  <span>女</span>
                </label>
                <label className={`${styles.genderOption} ${gender === 'male' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                  />
                  <span className={styles.genderIcon}>👨</span>
                  <span>男</span>
                </label>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              className={styles.createButton}
              disabled={loading}
            >
              {loading ? '创建中...' : '进入游戏'}
            </button>
          </form>
        </div>

        {/* 底部提示 */}
        <div className={styles.newCharacterFooter}>
          <p>💡 提示：角色创建后无法更改，请谨慎选择</p>
        </div>
      </div>
    </div>
  );
};

export default NewCharacterPanel;
