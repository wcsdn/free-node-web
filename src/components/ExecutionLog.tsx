import React from 'react';
import { profileConfig } from '../config/profile';
import { useLanguage } from '../contexts/LanguageContext';
import './ExecutionLog.css';

const ExecutionLog: React.FC = () => {
  const { language } = useLanguage();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return '◆';
      case 'upgrade':
        return '▲';
      case 'current':
        return '●';
      default:
        return '■';
    }
  };

  return (
    <div className="execution-log-container">
      <div className="log-header">
        <span className="log-title">
          {language === 'en' ? '> EXECUTION LOG' : '> 执行日志'}
        </span>
        <span className="log-subtitle">
          {language === 'en' ? '[ TIMELINE ]' : '[ 时间轴 ]'}
        </span>
      </div>

      <div className="timeline">
        {profileConfig.timeline.map((event, index) => (
          <div
            key={index}
            className={`timeline-item ${event.type}`}
          >
            <div className="timeline-marker">
              <span className="marker-icon">{getTypeIcon(event.type)}</span>
              <div className="marker-line"></div>
            </div>

            <div className="timeline-content">
              <div className="timeline-year">[{event.year}]</div>
              <div className="timeline-title">{event.title}</div>
              <div className="timeline-description">{event.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionLog;
