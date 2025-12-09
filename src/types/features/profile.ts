/**
 * 个人档案功能类型定义
 */

export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  github: string;
  demo: string;
  status: 'active' | 'wip' | 'archived';
}

export interface SkillData {
  frontend: number;
  backend: number;
  blockchain: number;
  devops: number;
  design: number;
  security: number;
}

export interface TimelineItem {
  year: number;
  title: string;
  description: string;
  type: 'milestone' | 'upgrade' | 'current';
}

export interface ProfileConfig {
  projects: Project[];
  skills: SkillData;
  timeline: TimelineItem[];
}
