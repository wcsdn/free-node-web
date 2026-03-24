/**
 * Services - 业务逻辑层导出
 */
export { cityService, CITY_CONFIG, PROSPERITY_LEVELS } from './city.svc';
export { CityInteriorServiceExtension, PROSPERITY_CONFIG, RESOURCE_OUTPUT_CONFIG, POPULATION_CONFIG, BUILDING_QUEUE_CONFIG, TAX_CONFIG, BUILDING_FUNCTION_CONFIG } from './city-ext.svc';
export { heroService, HERO_QUALITY, HERO_STATES, HERO_CONFIG, QUALITY_BONUS } from './hero.svc';
export { HeroServiceExtension, HERO_FATE_CONFIG, HERO_AWAKE_CONFIG, HERO_QUALITY突破_CONFIG, HERO_UNIT_ADAPT, HERO_RECOVER_CONFIG, HERO_SKILL_CONFIG } from './hero-ext.svc';
export { corpsService, CORPS_STATES, CORPS_CONFIG } from './corps.svc';
export { organizeService, ORGANIZE_ROLES } from './organize.svc';
export { OrganizeServiceExtension, ORGANIZE_LEVEL_CONFIG, CONTRIBUTE_CONFIG, ORGANIZE_SHOP_CONFIG, ORGANIZE_SKILLS } from './organize-ext.svc';
export { buildingService, BUILDING_TYPES, BUILDING_STATES, BUILDING_CONFIG, INTERIOR_BUILDINGS } from './building.svc';
export { skillService } from './skill.svc';
export { itemService, ITEM_TYPES, ITEM_QUALITY, ITEM_CONFIG, ITEM_EFFECTS } from './item.svc';
export { ItemServiceExtension, ITEM_TYPES_EXT, COMPOSE_RECIPES, ENHANCE_CONFIG, GEM_SLOTS, DURABILITY_CONFIG, DISMANTLE_CONFIG } from './item-ext.svc';
export { mailService, MAIL_TYPES, MAIL_STATUS, MAIL_CONFIG } from './mail.svc';
export { MailServiceExtension, MAIL_SYSTEM_CONFIG } from './mail-ext.svc';
export { technicService, TECHNIC_CONFIG } from './technic.svc';
export { defenceService } from './defence.svc';
export { npcFloorService } from './npc-floor.svc';
export { userService } from './user.svc';
export { UserServiceExtension, SIGNIN_CONFIG, VIP_CONFIG, LEVEL_CONFIG } from './user-ext.svc';
export {
  fightService,
  BATTLE_TYPES,
  BATTLE_STATUS,
  BATTLE_CONFIG,
  UNIT_COUNTER,
  calculateDamage,
  getChessboardByPos,
  encodeBattleSummary,
  decodeBattleSummary,
  type BattleSummaryServerInfo,
  type BattleSummaryCityInfo,
  type BattleSummaryHero,
  type DamageParams,
  type ChessboardData,
} from './fight.svc';
export { persistEffectService, EFFECT_TYPES, EFFECT_CATEGORIES, EFFECT_SOURCES } from './persist-effect.svc';
export { PersistEffectServiceExtension } from './persist-effect-ext.svc';
export { eventService } from './event.svc';
export { EventServiceExtension, EVENT_TYPES, EVENT_STATES, EVENT_CONFIG, RANDOM_EVENT_POOL, STORY_EVENT_CONFIG } from './event-ext.svc';
export { arenaService } from './arena.svc';
export { taskService } from './task.service';
export { TaskServiceExtension, TASK_TYPES, TASK_STATES, TASK_PROGRESS_TYPES, TASK_REWARD_CONFIG, DAILY_RESET_CONFIG, TASK_CHAIN_CONFIG } from './task-ext.svc';
export { guildService } from './guild.svc';
// export { dungeonService } from './dungeon.svc'; // TODO: 待实现
export { AppendantNPCService } from './appendant-npc.svc';
