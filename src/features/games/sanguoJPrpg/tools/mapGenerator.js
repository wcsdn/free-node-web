/**
 * 色块RPG地图生成器
 * 目标屏幕: 750 × 1334
 * 游戏区域: 80% = 750 × 1067
 * 属性栏: 20% = 750 × 267
 */

class MapGenerator {
    constructor() {
        // 屏幕尺寸
        this.screenWidth = 750;
        this.screenHeight = 1334;
        
        // 游戏区域 (80%)
        this.gameWidth = 750;
        this.gameHeight = Math.floor(1334 * 0.8); // 1067
        
        // 属性栏区域 (20%)
        this.uiHeight = Math.floor(1334 * 0.2); // 267
        
        // 色块尺寸限制
        this.minSize = 80;  // 最小边长
        this.maxSize = 200; // 最大边长
        
        // 间距
        this.padding = 10;
        this.gap = 4;
    }

    /**
     * 数值平衡规则总结:
     * 
     * 【任务 Mission】
     * - 面积 > 1000 需要钥匙解锁
     * - ACT消耗 = 面积 × 0.01
     * - 金币奖励 = 面积 × 0.03 × 随机(2-4)
     * - 经验奖励 = 面积 × 0.1 × 随机(2-4)
     * - 建议: 前期任务面积 200-800, 中期 800-2000, 后期 2000+
     * 
     * 【敌人 Enemy】
     * - 面积 > 1500 需要钥匙解锁
     * - 生命值 = 宽度
     * - 伤害 = 20 + (高+宽)/2
     * - 钥匙掉落 = 面积/1000 % 4 + 1
     * - 建议: 前期敌人面积 300-1000, 中期 1000-3000, 后期 3000+
     * 
     * 【商店 Shop】
     * - 面积 > 1000 需要钥匙解锁
     * - ATK价格 = 面积/10 + (高-30)² + (高-30)×45
     * - DEF价格 = 面积/10 + (宽-30)² - (高-30)×10
     * - 加成 = 面积/100 × 0.45~0.5
     */

    // 检查两个矩形是否重叠
    isOverlap(rect1, rect2) {
        return !(rect1.x + rect1.w + this.gap < rect2.x ||
                 rect2.x + rect2.w + this.gap < rect1.x ||
                 rect1.y + rect1.h + this.gap < rect2.y ||
                 rect2.y + rect2.h + this.gap < rect1.y);
    }

    // 检查新矩形是否与已有矩形重叠
    hasCollision(newRect, existingRects) {
        for (const rect of existingRects) {
            if (this.isOverlap(newRect, rect)) return true;
        }
        return false;
    }

    // 生成随机矩形
    generateRect(minW, maxW, minH, maxH, existingRects, maxAttempts = 100) {
        for (let i = 0; i < maxAttempts; i++) {
            const w = Math.floor(Math.random() * (maxW - minW) + minW);
            const h = Math.floor(Math.random() * (maxH - minH) + minH);
            const x = Math.floor(Math.random() * (this.gameWidth - w - this.padding * 2) + this.padding);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, existingRects)) {
                return rect;
            }
        }
        return null;
    }

    // 生成网格布局的矩形
    generateGridRect(gridX, gridY, cellW, cellH, sizeVariation = 0.3) {
        const baseW = cellW * (1 - sizeVariation + Math.random() * sizeVariation * 2);
        const baseH = cellH * (1 - sizeVariation + Math.random() * sizeVariation * 2);
        const w = Math.max(this.minSize, Math.floor(baseW));
        const h = Math.max(this.minSize, Math.floor(baseH));
        const x = gridX + Math.floor((cellW - w) / 2);
        const y = gridY + Math.floor((cellH - h) / 2);
        return { x, y, w, h };
    }

    /**
     * 生成地图模板1: 经典随机布局
     * 特点: 随机分布，大小不一
     */
    generateClassicMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];
        const specials = [];

        // 生成任务 (40-50个)
        // 小型任务 (不需要钥匙)
        for (let i = 0; i < 25; i++) {
            const rect = this.generateRect(this.minSize, this.minSize + 30, this.minSize, this.minSize + 20, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        // 中型任务 (需要钥匙)
        for (let i = 0; i < 15; i++) {
            const rect = this.generateRect(this.minSize + 30, this.maxSize - 40, this.minSize + 20, this.maxSize - 60, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        // 大型任务
        for (let i = 0; i < 8; i++) {
            const rect = this.generateRect(this.maxSize - 40, this.maxSize, this.minSize + 30, this.maxSize - 40, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }

        // 生成敌人 (20-25个)
        // 小型敌人
        for (let i = 0; i < 12; i++) {
            const rect = this.generateRect(this.minSize, this.minSize + 30, this.minSize, this.minSize + 30, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        // 中型敌人
        for (let i = 0; i < 8; i++) {
            const rect = this.generateRect(this.minSize + 30, this.maxSize - 40, this.minSize + 20, this.maxSize - 60, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        // 大型敌人
        for (let i = 0; i < 5; i++) {
            const rect = this.generateRect(this.maxSize - 40, this.maxSize, this.minSize + 40, this.maxSize - 20, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }

        // 生成商店 (8-10个)
        for (let i = 0; i < 5; i++) {
            const rect = this.generateRect(this.minSize, this.minSize + 40, this.minSize, this.minSize + 40, allRects);
            if (rect) { shops.push({ ...rect, type: 'atk' }); allRects.push(rect); }
        }
        for (let i = 0; i < 5; i++) {
            const rect = this.generateRect(this.minSize, this.minSize + 40, this.minSize, this.minSize + 40, allRects);
            if (rect) { shops.push({ ...rect, type: 'def' }); allRects.push(rect); }
        }

        // 生成特殊功能
        specials.push(this.generateSpecials(allRects));

        return {
            name: "经典随机",
            missions,
            enemies,
            shops,
            specials: specials[0]
        };
    }

    /**
     * 生成地图模板2: 区域划分布局
     * 特点: 左侧任务区，右侧敌人区，中间商店
     */
    generateZoneMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const leftZone = { x: this.padding, w: this.gameWidth * 0.4 };
        const rightZone = { x: this.gameWidth * 0.6, w: this.gameWidth * 0.4 - this.padding };
        const centerZone = { x: this.gameWidth * 0.4, w: this.gameWidth * 0.2 };

        // 左侧任务区
        for (let i = 0; i < 35; i++) {
            const w = Math.floor(Math.random() * 50 + 30);
            const h = Math.floor(Math.random() * 40 + 14);
            const x = Math.floor(Math.random() * (leftZone.w - w) + leftZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) {
                missions.push(rect);
                allRects.push(rect);
            }
        }

        // 右侧敌人区
        for (let i = 0; i < 25; i++) {
            const w = Math.floor(Math.random() * 60 + 30);
            const h = Math.floor(Math.random() * 50 + 20);
            const x = Math.floor(Math.random() * (rightZone.w - w) + rightZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) {
                enemies.push(rect);
                allRects.push(rect);
            }
        }

        // 中间商店区
        for (let i = 0; i < 10; i++) {
            const size = Math.floor(Math.random() * 30 + 30);
            const x = Math.floor(Math.random() * (centerZone.w - size) + centerZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - size - this.padding * 2) + this.padding);
            const rect = { x, y, w: size, h: size };
            if (!this.hasCollision(rect, allRects)) {
                shops.push({ ...rect, type: i % 2 === 0 ? 'atk' : 'def' });
                allRects.push(rect);
            }
        }

        return {
            name: "区域划分",
            missions,
            enemies,
            shops,
            specials: this.generateSpecials(allRects)
        };
    }

    /**
     * 生成地图模板3: 螺旋进阶布局
     * 特点: 从外到内难度递增
     */
    generateSpiralMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;
        const maxRadius = Math.min(this.gameWidth, this.gameHeight) / 2 - 50;

        // 外圈 - 简单任务和敌人
        for (let angle = 0; angle < 360; angle += 15) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.9;
            const x = Math.floor(centerX + Math.cos(rad) * radius - 25);
            const y = Math.floor(centerY + Math.sin(rad) * radius - 15);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w: 50, h: 30 };
            if (rect.x + rect.w < this.gameWidth - this.padding && 
                rect.y + rect.h < this.gameHeight - this.padding &&
                !this.hasCollision(rect, allRects)) {
                if (angle % 30 === 0) {
                    enemies.push(rect);
                } else {
                    missions.push(rect);
                }
                allRects.push(rect);
            }
        }

        // 中圈 - 中等难度
        for (let angle = 0; angle < 360; angle += 20) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.6;
            const x = Math.floor(centerX + Math.cos(rad) * radius - 30);
            const y = Math.floor(centerY + Math.sin(rad) * radius - 20);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w: 60, h: 40 };
            if (rect.x + rect.w < this.gameWidth - this.padding && 
                rect.y + rect.h < this.gameHeight - this.padding &&
                !this.hasCollision(rect, allRects)) {
                if (angle % 40 === 0) {
                    enemies.push(rect);
                } else {
                    missions.push(rect);
                }
                allRects.push(rect);
            }
        }

        // 内圈 - 商店和高难度
        for (let angle = 0; angle < 360; angle += 45) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.3;
            const x = Math.floor(centerX + Math.cos(rad) * radius - 25);
            const y = Math.floor(centerY + Math.sin(rad) * radius - 25);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w: 50, h: 50 };
            if (!this.hasCollision(rect, allRects)) {
                shops.push({ ...rect, type: angle % 90 === 0 ? 'atk' : 'def' });
                allRects.push(rect);
            }
        }

        // 填充空白区域
        for (let i = 0; i < 30; i++) {
            const rect = this.generateRect(30, 60, 20, 40, allRects);
            if (rect) {
                const distToCenter = Math.sqrt(Math.pow(rect.x - centerX, 2) + Math.pow(rect.y - centerY, 2));
                if (distToCenter > maxRadius * 0.5) {
                    missions.push(rect);
                } else {
                    enemies.push(rect);
                }
                allRects.push(rect);
            }
        }

        return {
            name: "螺旋进阶",
            missions,
            enemies,
            shops,
            specials: this.generateSpecials(allRects)
        };
    }

    /**
     * 生成地图模板4: 迷宫通道布局
     * 特点: 类似迷宫的通道结构
     */
    generateMazeMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        // 创建网格
        const cols = 8;
        const rows = 12;
        const cellW = Math.floor((this.gameWidth - this.padding * 2) / cols);
        const cellH = Math.floor((this.gameHeight - this.padding * 2) / rows);

        // 随机填充网格
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // 50%概率放置色块
                if (Math.random() < 0.5) continue;

                const x = this.padding + col * cellW + Math.floor(cellW * 0.1);
                const y = this.padding + row * cellH + Math.floor(cellH * 0.1);
                const w = Math.floor(cellW * 0.8);
                const h = Math.floor(cellH * 0.8);
                const rect = { x, y, w, h };

                if (!this.hasCollision(rect, allRects)) {
                    // 根据位置决定类型
                    const rand = Math.random();
                    if (rand < 0.6) {
                        missions.push(rect);
                    } else if (rand < 0.9) {
                        enemies.push(rect);
                    } else {
                        shops.push({ ...rect, type: Math.random() < 0.5 ? 'atk' : 'def' });
                    }
                    allRects.push(rect);
                }
            }
        }

        return {
            name: "迷宫通道",
            missions,
            enemies,
            shops,
            specials: this.generateSpecials(allRects)
        };
    }

    /**
     * 生成地图模板5: 塔防路径布局
     * 特点: S形路径，敌人沿路分布
     */
    generateTowerDefenseMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        // S形路径上的敌人
        const pathPoints = [];
        const segments = 6;
        const segmentHeight = this.gameHeight / segments;
        
        for (let i = 0; i < segments; i++) {
            const y = i * segmentHeight + segmentHeight / 2;
            const startX = i % 2 === 0 ? this.padding + 50 : this.gameWidth - this.padding - 100;
            const endX = i % 2 === 0 ? this.gameWidth - this.padding - 100 : this.padding + 50;
            
            // 沿路径放置敌人
            for (let j = 0; j < 4; j++) {
                const t = j / 3;
                const x = startX + (endX - startX) * t;
                const rect = { 
                    x: Math.floor(x), 
                    y: Math.floor(y - 20), 
                    w: 50 + Math.floor(Math.random() * 30), 
                    h: 40 + Math.floor(Math.random() * 20) 
                };
                if (!this.hasCollision(rect, allRects)) {
                    enemies.push(rect);
                    allRects.push(rect);
                }
            }
        }

        // 路径两侧放置任务
        for (let i = 0; i < 40; i++) {
            const rect = this.generateRect(30, 60, 20, 35, allRects);
            if (rect) {
                missions.push(rect);
                allRects.push(rect);
            }
        }

        // 角落放置商店
        const corners = [
            { x: this.padding, y: this.padding },
            { x: this.gameWidth - 80, y: this.padding },
            { x: this.padding, y: this.gameHeight - 80 },
            { x: this.gameWidth - 80, y: this.gameHeight - 80 }
        ];
        corners.forEach((corner, i) => {
            const rect = { x: corner.x, y: corner.y, w: 60, h: 60 };
            if (!this.hasCollision(rect, allRects)) {
                shops.push({ ...rect, type: i % 2 === 0 ? 'atk' : 'def' });
                allRects.push(rect);
            }
        });

        return {
            name: "塔防路径",
            missions,
            enemies,
            shops,
            specials: this.generateSpecials(allRects)
        };
    }

    // 生成特殊功能位置
    generateSpecials(existingRects) {
        const specials = {};
        const allRects = [...existingRects];

        // 生命回复
        let rect = this.generateRect(45, 55, 45, 55, allRects);
        if (rect) { specials.repairLife = rect; allRects.push(rect); }

        // ACT上限
        rect = this.generateRect(45, 55, 35, 45, allRects);
        if (rect) { specials.repairAct = rect; allRects.push(rect); }

        // LIFE上限
        rect = this.generateRect(45, 55, 50, 60, allRects);
        if (rect) { specials.repairLifeMax = rect; allRects.push(rect); }

        // 老虎机
        rect = this.generateRect(60, 70, 60, 70, allRects);
        if (rect) { specials.slot = rect; allRects.push(rect); }

        // 钥匙商店
        rect = this.generateRect(45, 55, 45, 55, allRects);
        if (rect) { specials.keyShop = rect; allRects.push(rect); }

        // 属性点商店
        rect = this.generateRect(45, 55, 45, 55, allRects);
        if (rect) { specials.repairPoint = rect; allRects.push(rect); }

        // Boss
        rect = this.generateRect(200, 280, 45, 55, allRects);
        if (rect) { specials.boss = rect; allRects.push(rect); }

        // 宝箱 x5
        for (let i = 1; i <= 5; i++) {
            rect = this.generateRect(30, 50, 30, 50, allRects);
            if (rect) { specials[`treasure${i}`] = rect; allRects.push(rect); }
        }

        return specials;
    }

    // 导出为data.js格式
    exportToDataJS(mapData) {
        let output = `// 游戏数据文件 - 自动生成
// 地图名称: ${mapData.name}
// 屏幕尺寸: ${this.screenWidth} × ${this.screenHeight}
// 游戏区域: ${this.gameWidth} × ${this.gameHeight}

`;
        // 任务数据
        output += `// 任务数据 (${mapData.missions.length}个)\nconst MISSION_DATA = [\n`;
        mapData.missions.forEach((m, i) => {
            output += `    { x: ${m.x}, y: ${m.y}, w: ${m.w}, h: ${m.h} }${i < mapData.missions.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        // 敌人数据
        output += `// 敌人数据 (${mapData.enemies.length}个)\nconst ENEMY_DATA = [\n`;
        mapData.enemies.forEach((e, i) => {
            output += `    { x: ${e.x}, y: ${e.y}, w: ${e.w}, h: ${e.h} }${i < mapData.enemies.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        // 商店数据
        output += `// 商店物品数据 (${mapData.shops.length}个)\nconst SHOP_DATA_TEMPLATE = [\n`;
        mapData.shops.forEach((s, i) => {
            output += `    { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h}, type: '${s.type}' }${i < mapData.shops.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        // 特殊功能数据
        output += `// 特殊功能位置数据\nconst SPECIAL_DATA = {\n`;
        const specialKeys = Object.keys(mapData.specials);
        specialKeys.forEach((key, i) => {
            const s = mapData.specials[key];
            output += `    ${key}: { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h} }${i < specialKeys.length - 1 ? ',' : ''}\n`;
        });
        output += `};\n`;

        return output;
    }

    // 生成所有地图
    generateAllMaps() {
        return [
            this.generateClassicMap(),
            this.generateZoneMap(),
            this.generateSpiralMap(),
            this.generateMazeMap(),
            this.generateTowerDefenseMap()
        ];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
