/**
 * /start 新手引导落地页
 * 目标：信任建立 → 选择交易所 → 注册跳转 → 教程跟进
 */

import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import PageLayout from '@/shared/layouts/PageLayout';
import HeroSection from '../components/HeroSection';
import StepsSection from '../components/StepsSection';
import PathwaySection from '../components/PathwaySection';
import ExchangeTable from '../components/ExchangeTable';
import ChecklistSection from '../components/ChecklistSection';
import TutorialSection from '../components/TutorialSection';
import FAQSection from '../components/FAQSection';
import DisclaimerSection from '../components/DisclaimerSection';
import './styles.css';

const StartPage: React.FC = () => {
  const { language } = useLanguage();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageLayout title={language === 'zh' ? '> 新手起步' : '> GET STARTED'}>
      <div className="start-page">
        <HeroSection onScrollTo={scrollToSection} />
        <StepsSection />
        <PathwaySection />
        <div id="exchange-table">
          <ExchangeTable />
        </div>
        <div id="checklist">
          <ChecklistSection />
        </div>
        <TutorialSection />
        <FAQSection />
        <DisclaimerSection />
      </div>
    </PageLayout>
  );
};

export default StartPage;
