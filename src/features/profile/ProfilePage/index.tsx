import React from 'react';
import ProjectArchives from '../../../features/profile/components/ProjectArchives';
import SkillRadar from '../../../features/profile/components/SkillRadar';
import ExecutionLog from '../../../features/profile/components/ExecutionLog';
import { useLanguage } from '../../../shared/contexts/LanguageContext';
import { useSoundEffect } from '../../../shared/hooks/useSoundEffect';
import Backdrop from '../../../shared/components/Backdrop';
import './styles.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { playClick } = useSoundEffect();

  // 禁止页面滚动 - 简化版
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // ESC 键关闭
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <>
      <Backdrop onClick={handleClose} zIndex={9998} />
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">
            {language === 'en' ? '> PROFILE DATA' : '> 个人档案'}
          </h2>
          <button className="profile-modal-close" onClick={handleClose}>
            [ X ]
          </button>
        </div>
        
        <div className="profile-modal-content">
          <ProjectArchives />
          <SkillRadar />
          <ExecutionLog />
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
