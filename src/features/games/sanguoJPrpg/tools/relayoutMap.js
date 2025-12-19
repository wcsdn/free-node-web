// 原始地图自动布局工具
// 将800x630的原始地图元素重新布局到750x1067区域

const fs = require('fs');

// 原始区域和目标区域
const SOURCE = { w: 800, h: 630 };
const TARGET = { w: 750, h: 1067 };  // 游戏区域实际尺寸

// 原始地图数据（从data_0_原始地图.js复制）
const ORIGINAL_MISSIONS = [
    { x: 49, y: 79, w: 44, h: 14 },
    { x: 97, y: 79, w: 61, h: 14 },
    { x: 261, y: 79, w: 54, h: 40 },
    { x: 319, y: 79, w: 107, h: 14 },
    { x: 465, y: 79, w: 74, h: 32 },
    { x: 543, y: 79, w: 34, h: 66 },
    { x: 665, y: 79, w: 84, h: 30 },
    { x: 217, y: 97, w: 40, h: 22 },
    { x: 319, y: 97, w: 58, h: 49 },
    { x: 89, y: 115, w: 68, h: 14 },
    { x: 501, y: 115, w: 38, h: 30 },
    { x: 161, y: 123, w: 26, h: 92 },
    { x: 191, y: 123, w: 36, h: 42 },
    { x: 231, y: 123, w: 54, h: 22 },
    { x: 289, y: 123, w: 26, h: 22 },
    { x: 89, y: 133, w: 68, h: 14 },
    { x: 231, y: 149, w: 78, h: 16 },
    { x: 49, y: 151, w: 40, h: 82 },
    { x: 93, y: 151, w: 28, h: 82 },
    { x: 697, y: 167, w: 72, h: 44 },
    { x: 773, y: 167, w: 28, h: 44 },
    { x: 191, y: 169, w: 36, h: 16 },
    { x: 231, y: 169, w: 38, h: 46 },
    { x: 273, y: 197, w: 82, h: 18 },
    { x: 359, y: 197, w: 48, h: 30 },
    { x: 697, y: 215, w: 40, h: 62 },
    { x: 273, y: 219, w: 28, h: 162 },
    { x: 445, y: 231, w: 26, h: 78 },
    { x: 529, y: 231, w: 28, h: 50 },
    { x: 49, y: 237, w: 72, h: 24 },
    { x: 561, y: 259, w: 92, h: 22 },
    { x: 49, y: 265, w: 28, h: 136 },
    { x: 81, y: 265, w: 188, h: 20 },
    { x: 305, y: 273, w: 84, h: 36 },
    { x: 393, y: 273, w: 48, h: 36 },
    { x: 763, y: 281, w: 38, h: 20 },
    { x: 475, y: 305, w: 108, h: 24 },
    { x: 763, y: 305, w: 38, h: 108 },
    { x: 81, y: 333, w: 74, h: 30 },
    { x: 159, y: 333, w: 54, h: 69 },
    { x: 697, y: 346, w: 62, h: 18 },
    { x: 697, y: 367, w: 26, h: 74 },
    { x: 727, y: 367, w: 32, h: 74 },
    { x: 587, y: 375, w: 66, h: 46 },
    { x: 657, y: 397, w: 36, h: 24 },
    { x: 49, y: 405, w: 28, h: 82 },
    { x: 763, y: 417, w: 38, h: 56 },
    { x: 159, y: 425, w: 132, h: 16 },
    { x: 357, y: 425, w: 28, h: 104 },
    { x: 389, y: 425, w: 104, h: 28 },
    { x: 549, y: 425, w: 144, h: 16 },
    { x: 229, y: 445, w: 62, h: 42 },
    { x: 549, y: 445, w: 74, h: 28 },
    { x: 627, y: 445, w: 132, h: 28 },
    { x: 389, y: 457, w: 104, h: 16 },
    { x: 91, y: 509, w: 134, h: 20 },
    { x: 229, y: 509, w: 62, h: 20 }
];

const ORIGINAL_ENEMIES = [
    { x: 217, y: 79, w: 40, h: 14 },
    { x: 581, y: 79, w: 46, h: 66 },
    { x: 49, y: 97, w: 108, h: 14 },
    { x: 381, y: 97, w: 44, h: 14 },
    { x: 631, y: 113, w: 118, h: 14 },
    { x: 49, y: 115, w: 36, h: 32 },
    { x: 381, y: 115, w: 80, h: 30 },
    { x: 631, y: 131, w: 170, h: 14 },
    { x: 411, y: 149, w: 390, h: 14 },
    { x: 313, y: 149, w: 94, h: 44 },
    { x: 125, y: 151, w: 32, h: 31 },
    { x: 475, y: 167, w: 126, h: 60 },
    { x: 273, y: 169, w: 36, h: 24 },
    { x: 191, y: 189, w: 36, h: 26 },
    { x: 171, y: 219, w: 98, h: 42 },
    { x: 359, y: 231, w: 82, h: 38 },
    { x: 561, y: 231, w: 40, h: 24 },
    { x: 657, y: 259, w: 36, h: 134 },
    { x: 475, y: 285, w: 178, h: 16 },
    { x: 125, y: 289, w: 88, h: 40 },
    { x: 305, y: 313, w: 166, h: 16 },
    { x: 357, y: 333, w: 226, h: 68 },
    { x: 273, y: 385, w: 80, h: 16 },
    { x: 159, y: 405, w: 424, h: 16 },
    { x: 295, y: 425, w: 58, h: 104 },
    { x: 81, y: 445, w: 144, h: 42 },
    { x: 389, y: 477, w: 412, h: 52 },
    { x: 91, y: 491, w: 200, h: 14 },
    { x: 49, y: 533, w: 752, h: 72 }  // 原始尺寸
];

const ORIGINAL_SHOPS = [
    { x: 631, y: 79, w: 30, h: 30, type: 'atk' },
    { x: 465, y: 115, w: 32, h: 30, type: 'def' },
    { x: 411, y: 167, w: 60, h: 60, type: 'atk' },
    { x: 605, y: 167, w: 88, h: 88, type: 'def' },
    { x: 125, y: 219, w: 42, h: 42, type: 'atk' },
    { x: 697, y: 281, w: 62, h: 62, type: 'def' },
    { x: 81, y: 289, w: 40, h: 40, type: 'def' },
    { x: 217, y: 349, w: 52, h: 52, type: 'def' },
    { x: 81, y: 367, w: 74, h: 74, type: 'atk' }
];

const ORIGINAL_SPECIALS = {
    repairLife: { x: 305, y: 219, w: 50, h: 50 },
    repairAct: { x: 161, y: 79, w: 51, h: 40 },
    repairLifeMax: { x: 217, y: 289, w: 52, h: 57 },
    slot: { x: 587, y: 305, w: 66, h: 66 },
    boss: { x: 305, y: 333, w: 288, h: 48 },
    keyShop: { x: 497, y: 425, w: 48, h: 48 },
    treasure1: { x: 429, y: 79, w: 32, h: 32 },
    treasure2: { x: 49, y: 491, w: 38, h: 38 },
    treasure3: { x: 125, y: 185, w: 32, h: 30 },
    treasure4: { x: 753, y: 79, w: 48, h: 48 },
    treasure5: { x: 741, y: 215, w: 60, h: 62 },
    repairPoint: { x: 475, y: 231, w: 50, h: 50 }
};

// 收集所有元素并标记类型
function collectAllElements() {
    const elements = [];
    
    ORIGINAL_MISSIONS.forEach((m, i) => {
        elements.push({ ...m, type: 'mission', index: i });
    });
    
    ORIGINAL_ENEMIES.forEach((e, i) => {
        elements.push({ ...e, type: 'enemy', index: i });
    });
    
    ORIGINAL_SHOPS.forEach((s, i) => {
        elements.push({ ...s, type: 'shop', index: i, shopType: s.type });
    });
    
    Object.entries(ORIGINAL_SPECIALS).forEach(([key, s]) => {
        elements.push({ ...s, type: 'special', key });
    });
    
    return elements;
}

// 检查两个矩形是否重叠
function isOverlap(a, b, gap = 4) {
    return !(a.x + a.w + gap <= b.x || 
             b.x + b.w + gap <= a.x || 
             a.y + a.h + gap <= b.y || 
             b.y + b.h + gap <= a.y);
}

// 检查元素是否与已放置的元素重叠
function hasCollision(elem, placed, gap = 4) {
    for (const p of placed) {
        if (isOverlap(elem, p, gap)) {
            return true;
        }
    }
    return false;
}

// 计算原始地图的边界
function calcOriginalBounds() {
    let minX = Infinity, minY = Infinity;
    let maxX = 0, maxY = 0;
    
    const allElements = [
        ...ORIGINAL_MISSIONS,
        ...ORIGINAL_ENEMIES,
        ...ORIGINAL_SHOPS,
        ...Object.values(ORIGINAL_SPECIALS)
    ];
    
    for (const e of allElements) {
        minX = Math.min(minX, e.x);
        minY = Math.min(minY, e.y);
        maxX = Math.max(maxX, e.x + e.w);
        maxY = Math.max(maxY, e.y + e.h);
    }
    
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// 等比缩放填充算法 - 填满整个750x1067区域
function relayoutElements() {
    const bounds = calcOriginalBounds();
    console.log(`\n原始内容边界: (${bounds.minX},${bounds.minY}) - (${bounds.maxX},${bounds.maxY})`);
    console.log(`原始内容尺寸: ${bounds.w} x ${bounds.h}`);
    
    // 目标区域750x1067，留一点边距
    const padding = 20;
    const targetW = TARGET.w - padding * 2;   // 710
    const targetH = TARGET.h - padding * 2;   // 1027
    
    // 缩放比例：把内容区域拉伸填满目标区域
    const scaleX = targetW / bounds.w;  // 730/752
    const scaleY = targetH / bounds.h;  // 1047/526
    
    console.log(`目标区域: ${targetW} x ${targetH}`);
    console.log(`缩放比例: X=${scaleX.toFixed(4)}, Y=${scaleY.toFixed(4)}`);
    
    const placed = [];
    
    // 缩放所有元素：相对于内容边界的位置，缩放后加上padding
    function scaleElement(e, type, extra = {}) {
        const newX = Math.round(padding + (e.x - bounds.minX) * scaleX);
        const newY = Math.round(padding + (e.y - bounds.minY) * scaleY);
        const newW = Math.round(e.w * scaleX);
        const newH = Math.round(e.h * scaleY);
        
        return { x: newX, y: newY, w: newW, h: newH, type, ...extra };
    }
    
    // Mission
    ORIGINAL_MISSIONS.forEach((m, i) => {
        placed.push(scaleElement(m, 'mission', { index: i }));
    });
    
    // Enemy
    ORIGINAL_ENEMIES.forEach((e, i) => {
        placed.push(scaleElement(e, 'enemy', { index: i }));
    });
    
    // Shop
    ORIGINAL_SHOPS.forEach((s, i) => {
        placed.push(scaleElement(s, 'shop', { index: i, shopType: s.type }));
    });
    
    // Special
    Object.entries(ORIGINAL_SPECIALS).forEach(([key, s]) => {
        placed.push(scaleElement(s, 'special', { key }));
    });
    
    return placed;
}

// 生成输出数据
function generateOutput(placed) {
    const missions = [];
    const enemies = [];
    const shops = [];
    const specials = {};
    
    for (const elem of placed) {
        const { x, y, w, h } = elem;
        
        switch (elem.type) {
            case 'mission':
                missions.push({ x, y, w, h });
                break;
            case 'enemy':
                enemies.push({ x, y, w, h });
                break;
            case 'shop':
                shops.push({ x, y, w, h, type: elem.shopType });
                break;
            case 'special':
                specials[elem.key] = { x, y, w, h };
                break;
        }
    }
    
    return { missions, enemies, shops, specials };
}

// 生成JS文件内容
function generateJSFile(data) {
    let content = `// 游戏数据文件 - 原始地图自动布局版
// 将原始地图(800x630)的元素自动布局到新区域(750x1067)
// 由 relayoutMap.js 自动生成

// 任务数据
const MISSION_DATA = [
`;
    
    data.missions.forEach((m, i) => {
        content += `    { x: ${m.x}, y: ${m.y}, w: ${m.w}, h: ${m.h} }`;
        content += i < data.missions.length - 1 ? ',\n' : '\n';
    });
    content += '];\n\n';
    
    content += `// 敌人数据
const ENEMY_DATA = [
`;
    data.enemies.forEach((e, i) => {
        content += `    { x: ${e.x}, y: ${e.y}, w: ${e.w}, h: ${e.h} }`;
        content += i < data.enemies.length - 1 ? ',\n' : '\n';
    });
    content += '];\n\n';
    
    content += `// 商店物品数据
const SHOP_DATA_TEMPLATE = [
`;
    data.shops.forEach((s, i) => {
        content += `    { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h}, type: '${s.type}' }`;
        content += i < data.shops.length - 1 ? ',\n' : '\n';
    });
    content += '];\n\n';
    
    content += `// 特殊功能位置数据
const SPECIAL_DATA = {
`;
    const specialKeys = Object.keys(data.specials);
    specialKeys.forEach((key, i) => {
        const s = data.specials[key];
        content += `    ${key}: { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h} }`;
        content += i < specialKeys.length - 1 ? ',\n' : '\n';
    });
    content += '};\n';
    
    return content;
}

// 主函数
function main() {
    console.log('开始自动布局...');
    console.log(`源区域: ${SOURCE.w}x${SOURCE.h}`);
    console.log(`目标区域: ${TARGET.w}x${TARGET.h}`);
    
    const placed = relayoutElements();
    const data = generateOutput(placed);
    
    console.log(`\n布局完成:`);
    console.log(`- 任务: ${data.missions.length}`);
    console.log(`- 敌人: ${data.enemies.length}`);
    console.log(`- 商店: ${data.shops.length}`);
    console.log(`- 特殊: ${Object.keys(data.specials).length}`);
    
    const jsContent = generateJSFile(data);
    const path = require('path');
    const outputPath = path.join(__dirname, '../maps/data_0b_原始地图2.js');
    fs.writeFileSync(outputPath, jsContent);
    console.log(`\n已保存到 ${outputPath}`);
}

main();
