// ========== 弹框系统 ==========
let currentModalTarget = null;

function showModal(type, title, infoTop, infoBottom, progress, buttons) {
    const overlay = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    const titleEl = document.getElementById('modalTitle');
    const infoTopEl = document.getElementById('modalInfoTop');
    const infoBottomEl = document.getElementById('modalInfoBottom');
    const progressEl = document.getElementById('modalProgress');
    const buttonsEl = document.getElementById('modalButtons');
    
    // 设置类型样式
    box.className = `modal-type-${type}`;
    titleEl.textContent = title;
    
    // 设置上半部分信息（怪物头像上方）
    infoTopEl.innerHTML = infoTop.map(row => 
        `<div class="modal-info-row">
            <span class="modal-info-label">${row.label}</span>
            <span class="modal-info-value" style="color:${row.color || '#fff'}">${row.value}</span>
        </div>`
    ).join('');
    
    // 设置下半部分信息（怪物头像下方）
    infoBottomEl.innerHTML = (infoBottom || []).map(row => 
        `<div class="modal-info-row">
            <span class="modal-info-label">${row.label}</span>
            <span class="modal-info-value" style="color:${row.color || '#fff'}">${row.value}</span>
        </div>`
    ).join('');
    
    // 设置进度条
    if (progress) {
        progressEl.style.display = 'block';
        document.getElementById('modalProgressFill').style.width = progress.percent + '%';
        document.getElementById('modalProgressFill').style.background = progress.color || '#4CAF50';
        document.getElementById('modalProgressText').textContent = progress.text;
    } else {
        progressEl.style.display = 'none';
    }
    
    // 设置按钮
    buttonsEl.innerHTML = buttons.map(btn => 
        `<button class="modal-btn ${btn.class}" ${btn.disabled ? 'disabled' : ''} onclick="${btn.action}">${btn.text}</button>`
    ).join('');
    
    overlay.classList.add('show');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    currentModalTarget = null;
    // 关闭弹框时清除掉落物品
    clearDrops();
}

function closeModalOnOverlay(event) {
    if (event.target.id === 'modalOverlay') {
        closeModal();
    }
}

function updateModalProgress(percent, text, color) {
    document.getElementById('modalProgressFill').style.width = percent + '%';
    if (text) document.getElementById('modalProgressText').textContent = text;
    if (color) document.getElementById('modalProgressFill').style.background = color;
}

// ========== 矿区弹框 ==========
function showMissionModal(mission, keepDrops = false) {
    currentModalTarget = mission;
    const locked = mission.lock_flg;
    const completed = mission.complete_flg;
    const percent = mission.life_max > 0 ? Math.floor(mission.life / mission.life_max * 100) : 0;
    
    // 根据矿区大小决定名称
    const mineNames = ['小型矿洞', '铜矿区', '银矿区', '金矿区', '秘境矿脉'];
    const mineIndex = Math.min(Math.floor(mission.m / 1000), 4);
    const mineName = mineNames[mineIndex];
    
    // 怪物图标
    const monsterIcons = ['👹', '👺', '👻', '💀', '🐲'];
    const monsterIcon = locked ? '🔒' : (completed ? '⛏️' : monsterIcons[mineIndex]);
    
    // 上半部分：矿区状态
    const infoTop = [
        { label: '矿区状态', value: locked ? '🔒 妖怪封锁中' : (completed ? '⛏️ 已攻占' : '👹 妖怪占领中'), color: locked ? '#888' : (completed ? '#4CAF50' : '#F44336') }
    ];
    
    // 下半部分：消耗和产出
    const infoBottom = [
        { label: '攻占消耗', value: mission.cost.toFixed(1) + ' 行动力', color: '#03A9F4' },
        { label: '矿石产出', value: '~' + mission.gold + ' 金币', color: '#FFD700' },
        { label: '战斗经验', value: completed ? '已攻占无经验' : '~' + mission.exp, color: '#9C27B0' }
    ];
    
    // 显示怪物头像，点击可攻击
    const monsterEl = document.getElementById('modalMonster');
    const iconEl = document.getElementById('monsterIcon');
    monsterEl.style.display = 'flex';
    iconEl.textContent = monsterIcon;
    
    // 点击怪物头像执行攻占
    monsterEl.onclick = locked ? null : () => {
        if (window.game.act >= mission.cost) {
            doMissionExecute();
        }
    };
    monsterEl.style.cursor = locked ? 'not-allowed' : 'pointer';
    
    // 只在首次打开或明确要求时清除掉落物品
    if (!keepDrops) {
        // 不清除，让物品保留
        // clearDrops();
    }
    
    const progress = {
        percent: percent,
        text: completed ? '已攻占 - 可征收矿石' : `攻占进度: ${percent}%`,
        color: completed ? '#FFD700' : '#2196F3'
    };
    
    let buttons = [];
    if (locked) {
        buttons = [
            { text: `🔑 破除封印 (钥匙:${window.game.key})`, class: 'modal-btn-primary', action: 'doMissionUnlock()', disabled: window.game.key <= 0 },
            { text: '撤退', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    } else {
        buttons = [
            { text: '撤退', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    }
    
    showModal('mission', `⛏️ ${mineName}`, infoTop, infoBottom, progress, buttons);
}

function doMissionUnlock() {
    if (currentModalTarget && currentModalTarget.lock_flg) {
        if (window.game.useKey(1)) {
            currentModalTarget.lock_flg = false;
            currentModalTarget.element.classList.remove('locked');
            window.game.setMessage("M_UNLOCK");
            showMissionModal(currentModalTarget);
        }
    }
}

function doMissionExecute() {
    if (currentModalTarget) {
        console.log('doMissionExecute 被调用');
        currentModalTarget.doExecute();
        // 刷新弹框信息，但保留掉落物品
        updateMissionModalInfo(currentModalTarget);
    }
}

// 只更新弹框信息，不重新渲染整个弹框
function updateMissionModalInfo(mission) {
    const percent = mission.life_max > 0 ? Math.floor(mission.life / mission.life_max * 100) : 0;
    const completed = mission.complete_flg;
    
    // 更新状态文本
    const statusValue = document.querySelector('#modalInfoTop .modal-info-value');
    if (statusValue) {
        statusValue.textContent = completed ? '⛏️ 已攻占' : '👹 妖怪占领中';
        statusValue.style.color = completed ? '#4CAF50' : '#F44336';
    }
    
    // 更新进度条
    updateModalProgress(percent, completed ? '已攻占 - 可征收矿石' : `攻占进度: ${percent}%`, completed ? '#FFD700' : '#2196F3');
    
    // 更新怪物图标
    if (completed) {
        const iconEl = document.getElementById('monsterIcon');
        if (iconEl) iconEl.textContent = '⛏️';
    }
}

// ========== 敌人弹框 ==========
function showEnemyModal(enemy, keepDrops = false) {
    currentModalTarget = enemy;
    const locked = enemy.lock_flg;
    const dead = enemy.life <= 0;
    const percent = enemy.life_max > 0 ? Math.floor(enemy.life / enemy.life_max * 100) : 0;
    
    // 怪物图标
    const monsterIcon = locked ? '🔒' : (dead ? '💀' : '👹');
    
    // 上半部分：状态
    const infoTop = [
        { label: '状态', value: locked ? '🔒 已锁定' : (dead ? '💀 已击败' : '🔴 存活'), color: locked ? '#888' : (dead ? '#4CAF50' : '#F44336') }
    ];
    
    // 显示怪物头像，点击可攻击
    const monsterEl = document.getElementById('modalMonster');
    const iconEl = document.getElementById('monsterIcon');
    monsterEl.style.display = 'flex';
    iconEl.textContent = monsterIcon;
    
    // 点击怪物头像执行攻击
    const canAttack = !locked && !dead && window.game.life > 0;
    monsterEl.onclick = canAttack ? () => doEnemyAttack() : null;
    monsterEl.style.cursor = canAttack ? 'pointer' : 'not-allowed';
    
    // 只在首次打开或明确要求时清除掉落物品
    if (!keepDrops) {
        // 不清除，让物品保留
        // clearDrops();
    }
    
    // 下半部分：详细信息
    const infoBottom = [
        { label: '生命值', value: `${Math.floor(enemy.life)} / ${enemy.life_max}`, color: '#F44336' },
        { label: '预计伤害', value: Math.floor(20 + (enemy.data.h + enemy.data.w) / 2), color: '#FF9800' },
        { label: '掉落钥匙', value: enemy.key_cnt + '把', color: '#FFD700' }
    ];
    
    const progress = {
        percent: percent,
        text: `生命: ${Math.floor(enemy.life)}/${enemy.life_max}`,
        color: dead ? '#4CAF50' : '#F44336'
    };
    
    let buttons = [];
    if (locked) {
        buttons = [
            { text: `🔑 解锁 (需要钥匙:${window.game.key})`, class: 'modal-btn-primary', action: 'doEnemyUnlock()', disabled: window.game.key <= 0 },
            { text: '关闭', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    } else {
        buttons = [
            { text: '关闭', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    }
    
    showModal('enemy', '👹 妖怪', infoTop, infoBottom, progress, buttons);
}

function doEnemyUnlock() {
    if (currentModalTarget && currentModalTarget.lock_flg) {
        if (window.game.useKey(1)) {
            currentModalTarget.lock_flg = false;
            currentModalTarget.element.classList.remove('locked');
            window.game.setMessage("UNLOCK_ENEMY");
            showEnemyModal(currentModalTarget);
        }
    }
}

function doEnemyAttack() {
    if (currentModalTarget && currentModalTarget.life > 0) {
        currentModalTarget.doAttack();
        // 刷新弹框信息，但保留掉落物品
        setTimeout(() => {
            if (currentModalTarget) {
                updateEnemyModalInfo(currentModalTarget);
            }
        }, 100);
    }
}

// 只更新弹框信息，不重新渲染整个弹框
function updateEnemyModalInfo(enemy) {
    const dead = enemy.life <= 0;
    const percent = enemy.life_max > 0 ? Math.floor(enemy.life / enemy.life_max * 100) : 0;
    
    // 更新状态文本
    const statusValue = document.querySelector('#modalInfoTop .modal-info-value');
    if (statusValue) {
        statusValue.textContent = dead ? '💀 已击败' : '🔴 存活';
        statusValue.style.color = dead ? '#4CAF50' : '#F44336';
    }
    
    // 更新生命值
    const infoRows = document.querySelectorAll('#modalInfoBottom .modal-info-value');
    if (infoRows[0]) {
        infoRows[0].textContent = `${Math.floor(enemy.life)} / ${enemy.life_max}`;
    }
    
    // 更新进度条
    updateModalProgress(percent, `生命: ${Math.floor(enemy.life)}/${enemy.life_max}`, dead ? '#4CAF50' : '#F44336');
    
    // 更新怪物图标
    if (dead) {
        const iconEl = document.getElementById('monsterIcon');
        if (iconEl) iconEl.textContent = '💀';
        const monsterEl = document.getElementById('modalMonster');
        if (monsterEl) {
            monsterEl.onclick = null;
            monsterEl.style.cursor = 'not-allowed';
        }
    }
}

// ========== 商店弹框 ==========
function showShopModal(shop) {
    currentModalTarget = shop;
    const locked = shop.lock_flg;
    const maxed = shop.cnt >= 9;
    const isAtk = shop.type === 'atk';
    
    // 隐藏怪物头像和清除掉落物品
    document.getElementById('modalMonster').style.display = 'none';
    clearDrops();
    
    let actualAdd = Math.floor(shop.addP * (1 - shop.cnt * 0.05));
    if (actualAdd <= 0) actualAdd = 1;
    
    const infoTop = [
        { label: '类型', value: isAtk ? '⚔️ 攻击力' : '🛡️ 防御力', color: isAtk ? '#FF00FF' : '#00FFFF' },
        { label: '价格', value: shop.price + ' 金币', color: '#FFD700' }
    ];
    
    const infoBottom = [
        { label: '加成', value: '+' + actualAdd, color: isAtk ? '#FF6699' : '#33CC66' },
        { label: '已购买', value: shop.cnt + ' / 9 次', color: maxed ? '#888' : '#fff' }
    ];
    
    let buttons = [];
    if (locked) {
        buttons = [
            { text: `🔑 解锁 (需要钥匙:${window.game.key})`, class: 'modal-btn-primary', action: 'doShopUnlock()', disabled: window.game.key <= 0 },
            { text: '关闭', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    } else if (maxed) {
        buttons = [
            { text: '已达上限', class: 'modal-btn-secondary', action: 'closeModal()', disabled: true },
            { text: '关闭', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    } else {
        buttons = [
            { text: `💰 购买 (${shop.price}金币)`, class: 'modal-btn-primary', action: 'doShopBuy()', disabled: window.game.gold < shop.price },
            { text: '关闭', class: 'modal-btn-secondary', action: 'closeModal()' }
        ];
    }
    
    showModal('shop', isAtk ? '⚔️ 武器商店' : '🛡️ 防具商店', infoTop, infoBottom, null, buttons);
}

function doShopUnlock() {
    if (currentModalTarget && currentModalTarget.lock_flg) {
        if (window.game.key > 0) {
            window.game.key--;
            currentModalTarget.lock_flg = false;
            currentModalTarget.element.classList.remove('locked');
            window.game.setMessage("I_UNLOCK");
            showShopModal(currentModalTarget);
        }
    }
}

function doShopBuy() {
    if (currentModalTarget) {
        currentModalTarget.doBuy();
        showShopModal(currentModalTarget);
    }
}


// ========== 掉落物品系统（使用老逻辑） ==========
let modalDropItems = []; // 弹框内的掉落物品对象
let dropUpdateTimer = null;

// 弹框内掉落物品类 - 完全复制老逻辑
class ModalDropItem {
    constructor(box, sx, sy, kind, val, index) {
        this.box = box;
        this.px = sx;
        this.py = sy;
        this.kind = kind;
        this.val = val;
        this.index = index;
        this._state = "in";
        this.stay_cnt = 0;
        this.collected = false;
        
        // 老逻辑：随机角度和速度，向上抛出
        const angle = Math.random() * 60 + 60; // 60-120度，更分散
        const speed = 12;
        this.ax = Math.cos(angle * Math.PI / 180) * speed;
        // ay为负值，向上抛
        this.ay = -12 - Math.random() * 5;
        // 落地位置在起始位置下方100-200像素
        this.landing_y = this.py + 100 + Math.random() * 100;
        
        // 边界（游戏容器内）
        this.minX = 100;
        this.maxX = 650;
        this.maxY = 750;
        
        this.createElement();
    }
    
    createElement() {
        const icons = { GOLD: '💰', EXP: '⭐', KEY: '🗝️', KEY2: '🔐', NEKO: '🐱' };
        const icon = icons[this.kind] || '❓';
        
        this.element = document.createElement('div');
        this.element.className = 'drop-item';
        this.element.setAttribute('data-index', this.index);
        this.element.innerHTML = icon + (this.val > 1 ? '<span>'+this.val+'</span>' : '');
        this.element.style.cssText = `
            position: absolute;
            left: ${this.px}px;
            top: ${this.py}px;
            font-size: 28px;
            cursor: pointer;
            z-index: 99999;
            pointer-events: auto;
            user-select: none;
        `;
        
        // 鼠标悬停或点击触发收集
        this.element.addEventListener('mouseenter', () => this.onOver());
        this.element.addEventListener('click', () => this.onOver());
        this.element.addEventListener('touchstart', () => this.onOver());
        
        this.box.appendChild(this.element);
    }
    
    onOver() {
        if (this._state === "stay" || this._state === "stay2" || this._state === "stay3") {
            this.startMove();
        } else if (this._state === "in" && this.ay > 0) {
            this.startMove();
        }
    }
    
    startMove() {
        this._state = "move";
        // 目标位置（游戏坐标系750x1334）
        // 属性面板在底部，从y=1067开始（1334-267）
        // info-row 在属性面板内约200px位置
        switch(this.kind) {
            case "GOLD": this.tx = 120; this.ty = 1270; break;  // 💰金币位置
            case "EXP":  this.tx = 40;  this.ty = 1220; break;  // EXP经验条
            case "KEY":  this.tx = 220; this.ty = 1270; break;  // 🗝️钥匙
            case "KEY2": this.tx = 320; this.ty = 1270; break;  // 🔐高级钥匙
            case "NEKO": this.tx = 450; this.ty = 1270; break;  // 🐱猫
            default:     this.tx = 375; this.ty = 1270; break;
        }
    }
    
    update() {
        if (this.collected) return;
        
        switch(this._state) {
            case "in":
                this.px += this.ax;
                this.py += this.ay;
                
                // 落地反弹
                if (this.py > Math.min(this.landing_y, this.maxY)) {
                    this.py = Math.min(this.landing_y, this.maxY);
                    this.ay = (-this.ay) * 0.5;
                    this.ax = this.ax * 0.5;
                    if (this.ay > -1) {
                        this.stay_cnt = 50;
                        this._state = "stay";
                    }
                }
                
                // 左右边界
                if (this.px < this.minX) { this.px = this.minX; this.ax = -this.ax; }
                if (this.px > this.maxX) { this.px = this.maxX; this.ax = -this.ax; }
                
                // 重力
                this.ay += 1;
                
                this.element.style.left = this.px + 'px';
                this.element.style.top = this.py + 'px';
                break;
                
            case "stay":
                this.stay_cnt--;
                if (this.stay_cnt <= 0) {
                    // 钥匙和NEKO不会自动消失
                    this._state = (this.kind === "KEY" || this.kind === "KEY2" || this.kind === "NEKO") ? "stay3" : "stay2";
                    this.stay_cnt = 0;
                }
                break;
                
            case "stay2":
                // 闪烁效果
                this.element.style.visibility = (this.stay_cnt % 2 === 0) ? 'visible' : 'hidden';
                this.stay_cnt++;
                if (this.stay_cnt >= 30) {
                    this.remove();
                }
                break;
                
            case "stay3":
                // 钥匙和NEKO等待玩家收集，不会自动消失
                break;
                
            case "move":
                // 飞向目标位置（属性面板对应图标）
                const dx = this.tx - this.px;
                const dy = this.ty - this.py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 移动速度
                const speed = Math.max(dist / 8, 5);
                if (dist > speed) {
                    this.px += (dx / dist) * speed;
                    this.py += (dy / dist) * speed;
                } else {
                    this.px = this.tx;
                    this.py = this.ty;
                }
                
                this.element.style.left = this.px + 'px';
                this.element.style.top = this.py + 'px';
                
                // 到达目标时收集
                if (dist < 10) {
                    this.collect();
                }
                break;
        }
    }
    
    collect() {
        if (this.collected) return;
        this.collected = true;
        window.game.addParam(this.kind, this.val);
        this.remove();
    }
    
    remove() {
        this.collected = true;
        this._state = "done";
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

function showDropsInModal(drops) {
    if (!drops || drops.length === 0) return;
    
    // 放到gameContainer，使用游戏坐标系
    const container = document.getElementById('gameContainer') || document.body;
    
    // 起始位置（弹框内怪物头像位置，游戏坐标系）
    // 弹框宽600px居中，怪物头像在弹框中央
    const startX = 375;  // 屏幕中央
    const startY = 580;  // 怪物头像下方位置
    
    // 创建掉落物品
    drops.forEach((drop, idx) => {
        setTimeout(() => {
            const item = new ModalDropItem(container, startX, startY, drop.kind, drop.val, modalDropItems.length);
            modalDropItems.push(item);
            // 每次添加物品后确保更新循环在运行
            startDropUpdateLoop();
        }, idx * 50);
    });
}

function startDropUpdateLoop() {
    // 如果已经在运行，不重复启动
    if (dropUpdateTimer) return;
    
    function loop() {
        modalDropItems.forEach(item => item.update());
        // 清理已完成的物品
        modalDropItems = modalDropItems.filter(item => !item.collected);
        
        // 继续循环
        dropUpdateTimer = requestAnimationFrame(loop);
    }
    
    dropUpdateTimer = requestAnimationFrame(loop);
}

function collectDrop(index) {
    const item = modalDropItems.find(i => i.index === index);
    if (item && !item.collected) {
        item._state = "move";
    }
}

function clearDrops() {
    // 清除所有掉落物品
    modalDropItems.forEach(item => item.remove());
    modalDropItems = [];
    if (dropUpdateTimer) {
        cancelAnimationFrame(dropUpdateTimer);
        dropUpdateTimer = null;
    }
    const box = document.getElementById('modalBox');
    if (box) {
        box.querySelectorAll('.drop-item').forEach(el => el.remove());
    }
}
