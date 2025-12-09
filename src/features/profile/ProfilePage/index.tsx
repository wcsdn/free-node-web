/**
 * 个人档案页面
 */
import React from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import ProjectArchives from '../components/ProjectArchives';
import SkillRadar from '../components/SkillRadar';
import ExecutionLog from '../components/ExecutionLog';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

const ProfilePage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <PageLayout title={language === 'en' ? '> PROFILE DATA' : '> 个人档案'}>
      <div className="profile-content">
        <ProjectArchives />
        <SkillRadar />
        <ExecutionLog />
      </div>
    </PageLayout>
  );
};

export default ProfilePage;
