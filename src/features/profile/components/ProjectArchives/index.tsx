import React, { useState } from 'react';
import { profileConfig } from '../../config';
import { useLanguage } from '../../../../shared/contexts/LanguageContext';
import { useSoundEffect } from '../../../../shared/hooks/useSoundEffect';
import './styles.css';

const ProjectArchives: React.FC = () => {
  const { language } = useLanguage();
  const { playHover, playClick } = useSoundEffect();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleExpand = (id: number) => {
    playClick();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="archives-container">
      <div className="archives-header">
        <span className="archives-title">
          {language === 'en' ? '> MISSION ARCHIVES' : '> 任务档案'}
        </span>
        <span className="archives-subtitle">
          {language === 'en' ? '[ CLASSIFIED ]' : '[ 机密 ]'}
        </span>
      </div>

      <div className="archives-grid">
        {profileConfig.projects.map((project) => (
          <div
            key={project.id}
            className={`archive-file ${expandedId === project.id ? 'expanded' : ''}`}
            onClick={() => handleExpand(project.id)}
            onMouseEnter={playHover}
          >
            <div className="file-header">
              <span className="file-status">[{project.status.toUpperCase()}]</span>
              <span className="file-title">{project.title}</span>
            </div>

            <div className="file-content">
              <p className="file-description">{project.description}</p>
              
              <div className="file-tags">
                {project.tags.map((tag, index) => (
                  <span key={index} className="file-tag">
                    {tag}
                  </span>
                ))}
              </div>

              {expandedId === project.id && (
                <div className="file-links">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      [ GitHub ]
                    </a>
                  )}
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      [ Demo ]
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="file-stamp">
              {language === 'en' ? 'TOP SECRET' : '绝密'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectArchives;
