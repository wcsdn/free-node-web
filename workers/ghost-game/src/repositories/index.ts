/**
 * Repositories Index - 数据访问层统一导出
 */

// 已删除未使用的repo:
// arena.repo, battle.repo, corps.repo, event.repo, festival.repo
// log.repo, mail.repo, map-unit.repo, mission.repo, organize.repo
// persist-effect.repo, query-builder, task.repo, user.repo, userdata.repo

// 基础类
export { BaseRepository, type BaseEntity } from './base.repo';

// 武将模块
export { HeroRepository, type Hero, type HeroConfig, heroRepo } from './hero.repo';

// 物品模块
export { ItemRepository, type Item, type ItemConfig, itemRepo } from './item.repo';

// 城市模块
export { CityRepository, type City, type Building, type BuildingConfig, cityRepo } from './city.repo';
export { BuildingRepository, buildingRepo } from './city.repo';

// 防御模块
export { defenceRepo } from './defence.repo';

// 技能模块
export { skillRepo } from './skill.repo';

// 科技模块
export { TechnicRepository, type Technic, type TechnicConfig, technicRepo } from './technic.repo';

// NPC模块
export { npcFloorRepo } from './npc-floor.repo';
export { AppendantNPCRepository, type AppendantNPC } from './appendant-npc.repo';

// 服务器模块
export { serverRepo } from './server.repo';
