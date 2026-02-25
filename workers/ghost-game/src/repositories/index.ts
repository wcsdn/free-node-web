/**
 * Repositories Index - 数据访问层统一导出
 */

// 基础类
export { BaseRepository, type BaseEntity } from './base.repo';

// 用户模块
export { UserRepository, type User } from './user.repo';
export { UserDataRepository, type UserData } from './userdata.repo';

// 武将模块
export { HeroRepository, type Hero, type HeroConfig, heroRepo } from './hero.repo';

// 物品模块
export { ItemRepository, type Item, type ItemConfig, itemRepo } from './item.repo';

// 城市模块
export { CityRepository, type City, type Building, type BuildingConfig, cityRepo } from './city.repo';
export { BuildingRepository } from './city.repo';

// 战斗模块
export { BattleRepository, type Battle, type BattleConfig } from './battle.repo';

// 军团模块
export { OrganizeRepository, type Organize, type OrganizeConfig, type OrganizeMember } from './organize.repo';
export { OrganizeMemberRepository } from './organize.repo';

// 事件模块
export { EventRepository, type UserEvent, type EventConfig } from './event.repo';

// 邮件模块
export { MailRepository, type Mail, mailRepo } from './mail.repo';

// 效果模块
export { PersistEffectRepository, type PersistEffect, type EffectConfig } from './persist-effect.repo';

// 任务模块
export { MissionRepository, type Mission, type MissionConfig } from './mission.repo';

// 工具类
export { QueryBuilder } from './query-builder';

// 其他模块 - 使用对象导出
export { defenceRepo } from './defence.repo';
export { skillRepo } from './skill.repo';
export { corpsRepo } from './corps.repo';
export { arenaRepo } from './arena.repo';
export { serverRepo } from './server.repo';
export { npcFloorRepo } from './npc-floor.repo';
export { taskRepo } from './task.repo';
export { buildingRepo } from './building.repo';
export { TechnicRepository, type Technic, type TechnicConfig, technicRepo } from './technic.repo';
