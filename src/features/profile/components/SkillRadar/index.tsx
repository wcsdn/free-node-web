import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { profileConfig } from '../../config';
import { useLanguage } from '../../../../shared/contexts/LanguageContext';
import './styles.css';

const SkillRadar: React.FC = () => {
  const { language } = useLanguage();

  const skillLabels = {
    en: {
      frontend: 'Frontend',
      backend: 'Backend',
      blockchain: 'Blockchain',
      devops: 'DevOps',
      design: 'Design',
      security: 'Security',
    },
    zh: {
      frontend: '前端',
      backend: '后端',
      blockchain: '区块链',
      devops: '运维',
      design: '设计',
      security: '安全',
    },
  };

  const data = Object.entries(profileConfig.skills).map(([key, value]) => ({
    skill: skillLabels[language][key as keyof typeof skillLabels.en],
    value,
    fullMark: 100,
  }));

  return (
    <div className="skill-radar-container">
      <div className="skill-header">
        <span className="skill-title">
          {language === 'en' ? '> SKILL TREE' : '> 技能树'}
        </span>
        <span className="skill-subtitle">
          {language === 'en' ? '[ NEURAL NETWORK ]' : '[ 神经网络 ]'}
        </span>
      </div>

      <div className="radar-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid stroke="#00ff00" strokeOpacity={0.3} />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: '#00ff00', fontSize: 12, fontFamily: 'Courier New' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#00ff00', fontSize: 10 }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#00ff00"
              fill="#00ff00"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="skill-legend">
        {Object.entries(profileConfig.skills).map(([key, value]) => (
          <div key={key} className="skill-item">
            <span className="skill-name">
              {skillLabels[language][key as keyof typeof skillLabels.en]}
            </span>
            <div className="skill-bar">
              <div className="skill-fill" style={{ width: `${value}%` }}>
                <span className="skill-value">{value}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillRadar;
