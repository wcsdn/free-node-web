// 游戏配置文件

// 消息定义
const MESSAGES = {
    UNLOCK_ENEMY: ["解锁了敌人", "Unlock the enemy", "#FFFFFF"],
    M_UNLOCK: ["解锁了任务", "Unlock the mission", "#FFFFFF"],
    LOCK: ["已锁定", "Locked", "#888888"],
    UNLOCK: ["解锁", "Unlock", "#FFFFFF"],
    M_COMP: ["任务完成!", "Mission completed", "#FF00FF"],
    M_OK: ["任务执行>成功", "Run>Success", "#FFFFFF"],
    M_OK2: ["征收执行>成功", "Collect the money", "#FFFF00"],
    M_NG: ["任务执行>失败:行动不足", "Run>Attempted:Lack of ACT.", "#888888"],
    M_ALL: ["全任务完成!", "Completed all mission.", "#FF00FF"],
    E_ALL: ["全敌讨伐!", "To subdue all enemies.", "#FF00FF"],
    I_ALL: ["全物品购买!", "All items were purchased.", "#FF00FF"],
    I_UNLOCK: ["解锁了物品", "Unlock the item", "#FFFFFF"],
    BUY_KEY: ["购买钥匙", "Get key", "#66FFFF"],
    C_MAX: ["连续取得达成！", "MAXIMAM COMBO", "#FFFF00"],
    DAMAGE: ["受到了 @ 伤害！", "@damage!", "#FF0000"],
    LEVEL_UP: ["等级 @ 了！", "Level @", "#66FF00"],
    WIN: ["击败了敌人！", "You win!", "#66FFFF"],
    ATK: ["攻击>对敌人造成 @ 伤害!", "Atk.>@ damage to enemy", "#FF00FF"],
    ADD_LIFE: ["体力+1", "LIFE> +1", "#FFCC00"],
    ADD_ACT: ["行动+1", "ACT.> +1", "#FF00FF"],
    ADD_RPE: ["回复+1", "RCV.> +1", "#00FFFF"],
    ADD_STR: ["攻击+@", "STR.> +@", "#FF6699"],
    ADD_DEF: ["防御+@", "DEF.> +@", "#33cc66"],
    REP_LIFE: ["体力回复 > 成功", "REPAIR LIFE", "#66FFFF"],
    BUY_ATK: ["购买武器>攻击力+@", "BUY WEAPON > ATK. @ UP!", "#FF6699"],
    BUY_DEF: ["购买防具>防御力+@", "BUY ARMOR > DEF. @ UP!", "#33CC66"],
    LIMIT: ["已达到上限", "items have reached the limit", "#FFFFFF"],
    NEKOGAMES: ["NEKOGAMES完成!", "Complete NEKOGAMES!", "#FF00FF"]
};

// 游戏常量配置
const GAME_CONFIG = {
    // 初始属性
    INIT_LIFE: 100,
    INIT_ACT: 50,
    INIT_ATK: 10,
    INIT_DEF: 10,
    INIT_EXP_MAX: 100,
    INIT_RPE: 10,
    
    // 连击系统
    COMBO_MAX: 120,
    COMBO_W_TIME: 45,
    
    // 恢复速度系数
    LIFE_RECOVER_BASE: 0.004,
    ACT_RECOVER_BASE: 0.06,
    ATK_RECOVER_BASE: 0.03,
    DEF_RECOVER_BASE: 0.03,
    RPE_MULTIPLIER: 0.01,
    
    // 防御上限
    DEF_MAX: 300,
    
    // 最小伤害
    MIN_DAMAGE: 5,
    MAX_DAMAGE_RANDOM: 10,
    
    // 语言设置
    USE_CHINESE: true
};

