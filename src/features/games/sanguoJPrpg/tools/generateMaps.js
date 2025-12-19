/**
 * 地图生成脚本
 * 运行: node generateMaps.js
 */

const fs = require('fs');

// 内联MapGenerator（因为浏览器环境）
class MapGenerator {
    constructor() {
        this.screenWidth = 750;
        this.screenHeight = 1334;
        this.gameWidth = 750;
        this.gameHeight = Math.floor(1334 * 0.8);
        this.uiHeight = Math.floor(1334 * 0.2);
        this.minSize = 40;
        this.maxSize = 150;
        this.padding = 10;
        this.gap = 4;
    }

    isOverlap(rect1, rect2) {
        return !(rect1.x + rect1.w + this.gap < rect2.x ||
                 rect2.x + rect2.w + this.gap < rect1.x ||
                 rect1.y + rect1.h + this.gap < rect2.y ||
                 rect2.y + rect2.h + this.gap < rect1.y);
    }

    hasCollision(newRect, existingRects) {
        for (const rect of existingRects) {
            if (this.isOverlap(newRect, rect)) return true;
        }
        return false;
    }

    generateRect(minW, maxW, minH, maxH, existingRects, maxAttempts = 100) {
        for (let i = 0; i < maxAttempts; i++) {
            const w = Math.floor(Math.random() * (maxW - minW) + minW);
            const h = Math.floor(Math.random() * (maxH - minH) + minH);
            const x = Math.floor(Math.random() * (this.gameWidth - w - this.padding * 2) + this.padding);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, existingRects)) return rect;
        }
        return null;
    }

    generateClassicMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        // 小型任务 (不需要钥匙，面积<1000)
        for (let i = 0; i < 20; i++) {
            const rect = this.generateRect(25, 35, 20, 30, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        // 中型任务
        for (let i = 0; i < 12; i++) {
            const rect = this.generateRect(45, 70, 35, 55, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        // 大型任务 (需要钥匙)
        for (let i = 0; i < 6; i++) {
            const rect = this.generateRect(80, 130, 60, 100, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        // 小型敌人
        for (let i = 0; i < 10; i++) {
            const rect = this.generateRect(30, 40, 25, 35, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        // 中型敌人
        for (let i = 0; i < 8; i++) {
            const rect = this.generateRect(50, 75, 40, 60, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        // 大型敌人 (需要钥匙)
        for (let i = 0; i < 4; i++) {
            const rect = this.generateRect(90, 140, 70, 110, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        // 小商店
        for (let i = 0; i < 4; i++) {
            const rect = this.generateRect(30, 45, 30, 45, allRects);
            if (rect) { shops.push({ ...rect, type: 'atk' }); allRects.push(rect); }
        }
        // 大商店
        for (let i = 0; i < 4; i++) {
            const rect = this.generateRect(55, 80, 55, 80, allRects);
            if (rect) { shops.push({ ...rect, type: 'def' }); allRects.push(rect); }
        }

        return { name: "经典随机", missions, enemies, shops, specials: this.generateSpecials(allRects) };
    }

    generateZoneMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const leftZone = { x: this.padding, w: this.gameWidth * 0.4 };
        const rightZone = { x: this.gameWidth * 0.6, w: this.gameWidth * 0.4 - this.padding };
        const centerZone = { x: this.gameWidth * 0.4, w: this.gameWidth * 0.2 };

        // 左侧任务区 - 小中大混合
        for (let i = 0; i < 15; i++) {
            const w = Math.floor(Math.random() * 15 + 25);
            const h = Math.floor(Math.random() * 12 + 20);
            const x = Math.floor(Math.random() * (leftZone.w - w) + leftZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { missions.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 10; i++) {
            const w = Math.floor(Math.random() * 30 + 50);
            const h = Math.floor(Math.random() * 25 + 40);
            const x = Math.floor(Math.random() * (leftZone.w - w) + leftZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { missions.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 5; i++) {
            const w = Math.floor(Math.random() * 50 + 90);
            const h = Math.floor(Math.random() * 40 + 70);
            const x = Math.floor(Math.random() * (leftZone.w - w) + leftZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { missions.push(rect); allRects.push(rect); }
        }

        // 右侧敌人区 - 小中大混合
        for (let i = 0; i < 10; i++) {
            const w = Math.floor(Math.random() * 15 + 30);
            const h = Math.floor(Math.random() * 12 + 25);
            const x = Math.floor(Math.random() * (rightZone.w - w) + rightZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { enemies.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 8; i++) {
            const w = Math.floor(Math.random() * 30 + 55);
            const h = Math.floor(Math.random() * 25 + 45);
            const x = Math.floor(Math.random() * (rightZone.w - w) + rightZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { enemies.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 4; i++) {
            const w = Math.floor(Math.random() * 50 + 100);
            const h = Math.floor(Math.random() * 40 + 80);
            const x = Math.floor(Math.random() * (rightZone.w - w) + rightZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - h - this.padding * 2) + this.padding);
            const rect = { x, y, w, h };
            if (!this.hasCollision(rect, allRects)) { enemies.push(rect); allRects.push(rect); }
        }

        // 中间商店区
        for (let i = 0; i < 5; i++) {
            const size = Math.floor(Math.random() * 20 + 35);
            const x = Math.floor(Math.random() * (centerZone.w - size) + centerZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - size - this.padding * 2) + this.padding);
            const rect = { x, y, w: size, h: size };
            if (!this.hasCollision(rect, allRects)) { shops.push({ ...rect, type: 'atk' }); allRects.push(rect); }
        }
        for (let i = 0; i < 5; i++) {
            const size = Math.floor(Math.random() * 30 + 55);
            const x = Math.floor(Math.random() * (centerZone.w - size) + centerZone.x);
            const y = Math.floor(Math.random() * (this.gameHeight - size - this.padding * 2) + this.padding);
            const rect = { x, y, w: size, h: size };
            if (!this.hasCollision(rect, allRects)) { shops.push({ ...rect, type: 'def' }); allRects.push(rect); }
        }

        return { name: "区域划分", missions, enemies, shops, specials: this.generateSpecials(allRects) };
    }

    generateSpiralMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;
        const maxRadius = Math.min(this.gameWidth, this.gameHeight) / 2 - 50;

        // 外圈 - 小型方块
        for (let angle = 0; angle < 360; angle += 18) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.92;
            const w = 25 + Math.floor(Math.random() * 15);
            const h = 20 + Math.floor(Math.random() * 12);
            const x = Math.floor(centerX + Math.cos(rad) * radius - w/2);
            const y = Math.floor(centerY + Math.sin(rad) * radius - h/2);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w, h };
            if (rect.x + rect.w < this.gameWidth - this.padding && rect.y + rect.h < this.gameHeight - this.padding && !this.hasCollision(rect, allRects)) {
                if (angle % 36 === 0) enemies.push(rect); else missions.push(rect);
                allRects.push(rect);
            }
        }

        // 中圈 - 中型方块
        for (let angle = 0; angle < 360; angle += 25) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.65;
            const w = 50 + Math.floor(Math.random() * 25);
            const h = 40 + Math.floor(Math.random() * 20);
            const x = Math.floor(centerX + Math.cos(rad) * radius - w/2);
            const y = Math.floor(centerY + Math.sin(rad) * radius - h/2);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w, h };
            if (rect.x + rect.w < this.gameWidth - this.padding && rect.y + rect.h < this.gameHeight - this.padding && !this.hasCollision(rect, allRects)) {
                if (angle % 50 === 0) enemies.push(rect); else missions.push(rect);
                allRects.push(rect);
            }
        }

        // 内圈 - 大型方块和商店
        for (let angle = 0; angle < 360; angle += 45) {
            const rad = angle * Math.PI / 180;
            const radius = maxRadius * 0.35;
            const size = 60 + Math.floor(Math.random() * 30);
            const x = Math.floor(centerX + Math.cos(rad) * radius - size/2);
            const y = Math.floor(centerY + Math.sin(rad) * radius - size/2);
            const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w: size, h: size };
            if (!this.hasCollision(rect, allRects)) { 
                shops.push({ ...rect, type: angle % 90 === 0 ? 'atk' : 'def' }); 
                allRects.push(rect); 
            }
        }

        // 随机填充 - 混合大小
        for (let i = 0; i < 15; i++) {
            const rect = this.generateRect(25, 40, 20, 35, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 10; i++) {
            const rect = this.generateRect(55, 90, 45, 75, allRects);
            if (rect) { enemies.push(rect); allRects.push(rect); }
        }
        for (let i = 0; i < 5; i++) {
            const rect = this.generateRect(100, 140, 80, 110, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }

        return { name: "螺旋进阶", missions, enemies, shops, specials: this.generateSpecials(allRects) };
    }

    generateMazeMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const cols = 6;
        const rows = 8;
        const cellW = Math.floor((this.gameWidth - this.padding * 2) / cols);
        const cellH = Math.floor((this.gameHeight - this.padding * 2) / rows);

        // 网格布局，但大小随机变化
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() < 0.3) continue;
                const sizeVar = Math.random();
                let w, h;
                if (sizeVar < 0.4) {
                    // 小型
                    w = 25 + Math.floor(Math.random() * 15);
                    h = 20 + Math.floor(Math.random() * 12);
                } else if (sizeVar < 0.75) {
                    // 中型
                    w = 50 + Math.floor(Math.random() * 25);
                    h = 40 + Math.floor(Math.random() * 20);
                } else {
                    // 大型
                    w = 85 + Math.floor(Math.random() * 35);
                    h = 70 + Math.floor(Math.random() * 30);
                }
                const x = this.padding + col * cellW + Math.floor((cellW - w) / 2);
                const y = this.padding + row * cellH + Math.floor((cellH - h) / 2);
                const rect = { x: Math.max(this.padding, x), y: Math.max(this.padding, y), w, h };
                if (!this.hasCollision(rect, allRects)) {
                    const rand = Math.random();
                    if (rand < 0.55) missions.push(rect);
                    else if (rand < 0.85) enemies.push(rect);
                    else shops.push({ ...rect, type: Math.random() < 0.5 ? 'atk' : 'def' });
                    allRects.push(rect);
                }
            }
        }

        // 确保至少有8个商店
        while (shops.length < 8) {
            const rect = this.generateRect(35, 55, 35, 55, allRects);
            if (rect) { shops.push({ ...rect, type: shops.length % 2 === 0 ? 'atk' : 'def' }); allRects.push(rect); }
        }

        return { name: "迷宫通道", missions, enemies, shops, specials: this.generateSpecials(allRects) };
    }

    generateTowerDefenseMap() {
        const allRects = [];
        const missions = [];
        const enemies = [];
        const shops = [];

        const segments = 6;
        const segmentHeight = this.gameHeight / segments;
        
        for (let i = 0; i < segments; i++) {
            const y = i * segmentHeight + segmentHeight / 2;
            const startX = i % 2 === 0 ? this.padding + 50 : this.gameWidth - this.padding - 100;
            const endX = i % 2 === 0 ? this.gameWidth - this.padding - 100 : this.padding + 50;
            
            for (let j = 0; j < 4; j++) {
                const t = j / 3;
                const x = startX + (endX - startX) * t;
                const rect = { x: Math.floor(x), y: Math.floor(y - 20), w: 50 + Math.floor(Math.random() * 30), h: 40 + Math.floor(Math.random() * 20) };
                if (!this.hasCollision(rect, allRects)) { enemies.push(rect); allRects.push(rect); }
            }
        }

        for (let i = 0; i < 40; i++) {
            const rect = this.generateRect(30, 60, 20, 35, allRects);
            if (rect) { missions.push(rect); allRects.push(rect); }
        }

        // 四角和边缘放置商店
        const shopPositions = [
            { x: this.padding, y: this.padding },
            { x: this.gameWidth - 70, y: this.padding },
            { x: this.padding, y: this.gameHeight - 70 },
            { x: this.gameWidth - 70, y: this.gameHeight - 70 },
            { x: this.gameWidth / 2 - 30, y: this.padding },
            { x: this.gameWidth / 2 - 30, y: this.gameHeight - 70 },
            { x: this.padding, y: this.gameHeight / 2 - 30 },
            { x: this.gameWidth - 70, y: this.gameHeight / 2 - 30 },
            { x: this.gameWidth / 3, y: this.gameHeight / 3 },
            { x: this.gameWidth * 2 / 3 - 50, y: this.gameHeight * 2 / 3 }
        ];
        shopPositions.forEach((pos, i) => {
            const rect = { x: Math.floor(pos.x), y: Math.floor(pos.y), w: 50, h: 50 };
            if (!this.hasCollision(rect, allRects)) { shops.push({ ...rect, type: i % 2 === 0 ? 'atk' : 'def' }); allRects.push(rect); }
        });

        // 确保至少有8个商店
        while (shops.length < 8) {
            const rect = this.generateRect(35, 55, 35, 55, allRects);
            if (rect) { shops.push({ ...rect, type: shops.length % 2 === 0 ? 'atk' : 'def' }); allRects.push(rect); }
        }

        return { name: "塔防路径", missions, enemies, shops, specials: this.generateSpecials(allRects) };
    }

    generateSpecials(existingRects) {
        const specials = {};
        const allRects = [...existingRects];

        // 辅助函数：确保生成成功，增加尝试次数
        const mustGenerate = (minW, maxW, minH, maxH, attempts = 200) => {
            let rect = this.generateRect(minW, maxW, minH, maxH, allRects, attempts);
            if (!rect) {
                // 如果失败，缩小尺寸再试
                rect = this.generateRect(Math.floor(minW * 0.8), Math.floor(maxW * 0.8), Math.floor(minH * 0.8), Math.floor(maxH * 0.8), allRects, attempts);
            }
            if (!rect) {
                // 最后手段：强制放置在随机位置
                rect = {
                    x: Math.floor(Math.random() * (this.gameWidth - maxW - 20) + 10),
                    y: Math.floor(Math.random() * (this.gameHeight - maxH - 20) + 10),
                    w: Math.floor((minW + maxW) / 2),
                    h: Math.floor((minH + maxH) / 2)
                };
            }
            allRects.push(rect);
            return rect;
        };

        specials.repairLife = mustGenerate(45, 55, 45, 55);
        specials.repairAct = mustGenerate(45, 55, 35, 45);
        specials.repairLifeMax = mustGenerate(45, 55, 50, 60);
        specials.slot = mustGenerate(60, 70, 60, 70);
        specials.keyShop = mustGenerate(45, 55, 45, 55);
        specials.repairPoint = mustGenerate(45, 55, 45, 55);
        
        // Boss需要较大空间，先尝试大尺寸，失败则缩小
        let bossRect = this.generateRect(180, 250, 45, 55, allRects, 300);
        if (!bossRect) bossRect = this.generateRect(120, 180, 40, 50, allRects, 300);
        if (!bossRect) bossRect = { x: 200, y: this.gameHeight - 100, w: 150, h: 50 };
        specials.boss = bossRect;
        allRects.push(bossRect);

        for (let i = 1; i <= 5; i++) {
            const treasureRect = mustGenerate(30, 50, 30, 50);
            specials[`treasure${i}`] = treasureRect;
        }

        return specials;
    }

    exportToDataJS(mapData) {
        let output = `// 游戏数据文件 - 自动生成
// 地图名称: ${mapData.name}
// 屏幕尺寸: ${this.screenWidth} × ${this.screenHeight}
// 游戏区域: ${this.gameWidth} × ${this.gameHeight}

`;
        output += `// 任务数据 (${mapData.missions.length}个)\nconst MISSION_DATA = [\n`;
        mapData.missions.forEach((m, i) => {
            output += `    { x: ${m.x}, y: ${m.y}, w: ${m.w}, h: ${m.h} }${i < mapData.missions.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        output += `// 敌人数据 (${mapData.enemies.length}个)\nconst ENEMY_DATA = [\n`;
        mapData.enemies.forEach((e, i) => {
            output += `    { x: ${e.x}, y: ${e.y}, w: ${e.w}, h: ${e.h} }${i < mapData.enemies.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        output += `// 商店物品数据 (${mapData.shops.length}个)\nconst SHOP_DATA_TEMPLATE = [\n`;
        mapData.shops.forEach((s, i) => {
            output += `    { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h}, type: '${s.type}' }${i < mapData.shops.length - 1 ? ',' : ''}\n`;
        });
        output += `];\n\n`;

        output += `// 特殊功能位置数据\nconst SPECIAL_DATA = {\n`;
        const specialKeys = Object.keys(mapData.specials);
        specialKeys.forEach((key, i) => {
            const s = mapData.specials[key];
            output += `    ${key}: { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h} }${i < specialKeys.length - 1 ? ',' : ''}\n`;
        });
        output += `};\n`;

        return output;
    }
}

// 生成地图
const generator = new MapGenerator();
const maps = [
    generator.generateClassicMap(),
    generator.generateZoneMap(),
    generator.generateSpiralMap(),
    generator.generateMazeMap(),
    generator.generateTowerDefenseMap()
];

// 创建maps目录（相对于项目根目录）
const path = require('path');
const mapsDir = path.join(__dirname, '..', 'maps');
if (!fs.existsSync(mapsDir)) {
    fs.mkdirSync(mapsDir);
}

// 导出每张地图
maps.forEach((map, index) => {
    const filename = path.join(mapsDir, `data_${index + 1}_${map.name.replace(/\s/g, '_')}.js`);
    const content = generator.exportToDataJS(map);
    fs.writeFileSync(filename, content);
    console.log(`生成地图: ${filename}`);
    console.log(`  - 任务: ${map.missions.length}个`);
    console.log(`  - 敌人: ${map.enemies.length}个`);
    console.log(`  - 商店: ${map.shops.length}个`);
    console.log(`  - 特殊: ${Object.keys(map.specials).length}个`);
    console.log('');
});

// 生成汇总JSON
const summary = {
    screenSize: { width: 750, height: 1334 },
    gameArea: { width: 750, height: Math.floor(1334 * 0.8) },
    uiArea: { height: Math.floor(1334 * 0.2) },
    maps: maps.map((m, i) => ({
        id: i + 1,
        name: m.name,
        file: `data_${i + 1}_${m.name.replace(/\s/g, '_')}.js`,
        stats: {
            missions: m.missions.length,
            enemies: m.enemies.length,
            shops: m.shops.length,
            specials: Object.keys(m.specials).length
        }
    }))
};

fs.writeFileSync(path.join(mapsDir, 'maps_summary.json'), JSON.stringify(summary, null, 2));
console.log(`生成汇总文件: ${mapsDir}/maps_summary.json`);
