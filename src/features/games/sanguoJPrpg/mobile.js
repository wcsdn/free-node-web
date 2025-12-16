// 手机版 - 混合流布局圆形色块
class MobileGame {
    constructor() {
        this.life = 100; this.life_max = 100;
        this.act = 50; this.act_max = 50;
        this.atk = 10; this.atk_max = 10;
        this.def = 10; this.def_max = 10;
        this.exp = 0; this.exp_max = 100;
        this.lv = 1;
        this.gold = 0;
        this.rpe = 10;
        this.key = 0;
        this.key2 = 0;
        this.add_p = 0;
        this.combo = 0;
        this.combo_time = 0;
        
        this.items = [];
        this.m_comp = 0;
        this.e_comp = 0;
        this.i_comp = 0;
        this.nekoList = [0,0,0,0,0,0,0,0,0];
        
        this.generateItems();
        this.init();
    }
    
    generateItems() {
        // 任务 57个
        for (let i = 0; i < 57; i++) {
            const hp = 30 + Math.floor(Math.random() * 70);
            this.items.push({
                type: 'mission', id: `m${i}`,
                life: 0, life_max: 100,
                hp, // 用于计算大小
                complete: false,
                locked: hp > 80,
                cost: Math.max(1, Math.floor(hp * 0.08)),
                gold: Math.floor(hp * 0.5),
                exp: Math.floor(hp * 0.8)
            });
        }
        
        // 敌人 29个
        for (let i = 0; i < 29; i++) {
            const hp = 40 + Math.floor(Math.random() * 160);
            this.items.push({
                type: 'enemy', id: `e${i}`,
                life: hp, life_max: hp,
                hp,
                dead: false,
                locked: hp > 150,
                damage: 10 + hp / 5,
                gold: Math.floor(hp * 0.8),
                exp: Math.floor(hp * 0.6),
                keys: Math.floor(hp / 60) + 1
            });
        }
        
        // 商店 9个
        const shops = [
            { type: 'shop-atk', name: '+5', price: 80, add: 5, hp: 30 },
            { type: 'shop-atk', name: '+15', price: 250, add: 15, hp: 45 },
            { type: 'shop-atk', name: '+30', price: 600, add: 30, hp: 55, locked: true },
            { type: 'shop-atk', name: '+60', price: 1500, add: 60, hp: 70, locked: true },
            { type: 'shop-def', name: '+5', price: 80, add: 5, hp: 30 },
            { type: 'shop-def', name: '+15', price: 250, add: 15, hp: 45 },
            { type: 'shop-def', name: '+30', price: 600, add: 30, hp: 55, locked: true },
            { type: 'shop-def', name: '+60', price: 1500, add: 60, hp: 70, locked: true },
            { type: 'shop-key', name: '🗝️', price: 400, add: 1, hp: 40 }
        ];
        shops.forEach((s, i) => {
            this.items.push({ ...s, id: `s${i}`, cnt: 0 });
        });
        
        // 特殊功能 4个
        const specials = [
            { id: 'sp0', name: '❤️回复', price: 100, hp: 50, action: 'repairLife' },
            { id: 'sp1', name: 'ACT+', price: 100, hp: 45, action: 'repairAct' },
            { id: 'sp2', name: 'LIFE+', price: 100, hp: 45, action: 'repairLifeMax' },
            { id: 'sp3', name: '属性点', price: 200, hp: 50, action: 'repairPoint' }
        ];
        specials.forEach(s => {
            this.items.push({ type: 'special', ...s, locked: true });
        });
        
        // 宝箱 5个
        const treasures = [
            { id: 't0', name: '全任务', reward: '❤️+20', hp: 40 },
            { id: 't1', name: '全敌人', reward: '💫x2', hp: 40 },
            { id: 't2', name: '全商店', reward: '⚡+20', hp: 40 },
            { id: 't3', name: '连击MAX', reward: '💰xLv', hp: 40 },
            { id: 't4', name: 'NEKO', reward: '⚔️x2', hp: 40 }
        ];
        treasures.forEach(t => {
            this.items.push({ type: 'treasure', ...t, active: false, used: false });
        });
        
        // 老虎机
        this.items.push({ type: 'special', id: 'slot', name: '🎰', price: 10, hp: 55, action: 'slot', visible: false });
        
        // Boss
        this.items.push({ type: 'boss', id: 'boss', name: 'BOSS', hp: 80, life: 300, life_max: 300, visible: false });
        
        // 打乱顺序
        this.items = this.shuffle(this.items);
    }
    
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    init() {
        this.setupAddPoints();
        this.render();
        this.startLoop();
        this.updateUI();
    }
    
    setupAddPoints() {
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addPoint(btn.dataset.type));
        });
    }
    
    addPoint(type) {
        if (this.add_p <= 0) return;
        switch(type) {
            case 'LIFE': this.life_max++; this.life++; break;
            case 'ACT': this.act_max++; this.act++; break;
            case 'RPE': this.rpe++; break;
            case 'ATK': this.atk_max++; this.atk++; break;
            case 'DEF': this.def_max++; this.def++; break;
        }
        this.add_p--;
        this.toast(`${type} +1`);
        this.updateUI();
    }
    
    getSize(hp) {
        // 根据hp计算大小 30-80px
        return Math.max(32, Math.min(75, 25 + hp * 0.5));
    }
    
    render() {
        const grid = document.getElementById('mixGrid');
        grid.innerHTML = this.items.filter(item => item.visible !== false).map(item => {
            const size = this.getSize(item.hp);
            let cls = `orb ${item.type}`;
            let icon = '', text = '', sub = '';
            
            if (item.type === 'mission') {
                cls += item.locked ? ' locked' : '';
                cls += item.complete ? ' dead' : '';
                icon = item.complete ? '✅' : '📋';
                text = item.complete ? '完成' : `${Math.floor(item.life)}%`;
                sub = item.complete ? '' : `${item.cost}⚡`;
            } else if (item.type === 'enemy') {
                cls += item.locked ? ' locked' : '';
                cls += item.dead ? ' dead' : '';
                icon = item.dead ? '❌' : '👹';
                text = item.dead ? '击败' : `${Math.floor(item.life)}`;
                sub = item.dead ? '' : `${item.keys}🗝️`;
            } else if (item.type.startsWith('shop')) {
                cls += item.locked ? ' locked' : '';
                cls += item.cnt >= 9 ? ' dead' : '';
                icon = item.type === 'shop-atk' ? '⚔️' : item.type === 'shop-def' ? '🛡️' : '🗝️';
                text = item.name;
                sub = `💰${item.price}`;
            } else if (item.type === 'special') {
                cls += item.locked ? ' locked' : '';
                icon = item.name;
                sub = `💰${item.price}`;
            } else if (item.type === 'treasure') {
                cls += item.active ? ' active' : '';
                cls += item.used ? ' dead' : '';
                icon = '📦';
                text = item.name;
                sub = item.active ? item.reward : '???';
            } else if (item.type === 'boss') {
                icon = '👿';
                text = 'BOSS';
                sub = `${Math.floor(item.life)}/${item.life_max}`;
            }
            
            return `<div class="${cls}" data-id="${item.id}" style="width:${size}px;height:${size}px">
                <span class="orb-icon">${icon}</span>
                <span class="orb-text">${text}</span>
                <span class="orb-sub">${sub}</span>
            </div>`;
        }).join('');
        
        grid.querySelectorAll('.orb').forEach(el => {
            el.addEventListener('click', () => this.click(el.dataset.id));
        });
    }
    
    hideOrb(id) {
        const el = document.querySelector(`.orb[data-id="${id}"]`);
        if (el) {
            el.classList.add('hiding');
            setTimeout(() => this.render(), 800);
        } else {
            this.render();
        }
    }

    click(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;
        
        if (item.type === 'mission') this.clickMission(item);
        else if (item.type === 'enemy') this.clickEnemy(item);
        else if (item.type.startsWith('shop')) this.clickShop(item);
        else if (item.type === 'special') this.clickSpecial(item);
        else if (item.type === 'treasure') this.clickTreasure(item);
        else if (item.type === 'boss') this.clickBoss(item);
    }
    
    clickMission(m) {
        if (m.locked) {
            if (this.key > 0) { this.key--; m.locked = false; this.toast('解锁!'); }
            else { this.toast('需要🗝️'); return; }
        }
        if (m.complete) { this.gold += Math.floor(m.gold * 0.3); this.toast(`+${Math.floor(m.gold*0.3)}💰`); this.render(); return; }
        if (this.act < m.cost) { this.toast('⚡不足!'); return; }
        
        this.act -= m.cost;
        m.life += 12 + Math.random() * 5;
        if (m.life >= m.life_max) {
            m.life = m.life_max;
            m.complete = true;
            this.add_p++;
            this.m_comp++;
            this.gold += m.gold;
            this.addExp(m.exp);
            this.toast(`完成! +${m.gold}💰`);
            if (this.m_comp >= 57) this.unlockTreasure(0);
        } else {
            this.toast(`${Math.floor(m.life)}%`);
        }
        this.addCombo();
        this.updateUI();
        this.render();
    }
    
    clickEnemy(e) {
        if (e.dead) return;
        if (e.locked) {
            if (this.key > 0) { this.key--; e.locked = false; this.toast('解锁!'); this.render(); return; }
            else { this.toast('需要🗝️'); return; }
        }
        if (this.life <= 0) { this.toast('❤️为0!'); return; }
        
        const dmg = Math.max(1, Math.floor(this.atk * 0.5));
        e.life -= dmg;
        
        if (e.life <= 0) {
            e.life = 0; e.dead = true;
            this.e_comp++;
            this.gold += e.gold;
            this.addExp(e.exp);
            this.key += e.keys;
            this.key2++;
            this.toast(`击败! +${e.gold}💰 +${e.keys}🗝️`);
            if (Math.random() < 0.2) {
                this.nekoList[Math.floor(Math.random() * 9)] = 1;
                if (this.nekoList.filter(n => n).length === 9) this.unlockTreasure(4);
            }
            if (this.e_comp >= 29) {
                this.unlockTreasure(1);
                const boss = this.items.find(i => i.id === 'boss');
                boss.visible = true;
            }
        } else {
            let ed = Math.floor(e.damage * 0.5 * (1 - this.def / 300));
            if (ed < 3) ed = 3;
            this.life -= ed;
            if (this.life < 0) this.life = 0;
            this.toast(`-${dmg} 受伤-${ed}`);
        }
        this.addCombo();
        this.updateUI();
        this.render();
    }
    
    clickShop(s) {
        if (s.cnt >= 9) { this.toast('已满!'); return; }
        if (s.locked) {
            if (this.key > 0) { this.key--; s.locked = false; this.toast('解锁!'); this.render(); return; }
            else { this.toast('需要🗝️'); return; }
        }
        if (this.gold < s.price) { this.toast('💰不足!'); return; }
        
        this.gold -= s.price;
        s.cnt++;
        
        if (s.type === 'shop-atk') { this.atk += s.add; this.atk_max += s.add; this.toast(`ATK +${s.add}`); }
        else if (s.type === 'shop-def') { this.def += s.add; this.def_max += s.add; this.toast(`DEF +${s.add}`); }
        else if (s.type === 'shop-key') { this.key++; this.toast('获得🗝️'); }
        
        if (s.cnt === 1) { this.i_comp++; if (this.i_comp >= 9) this.unlockTreasure(2); }
        this.updateUI();
        this.render();
    }
    
    clickSpecial(s) {
        if (s.locked) {
            if (this.key2 > 0) { this.key2--; s.locked = false; this.toast('解锁!'); this.render(); return; }
            else { this.toast('需要🔐'); return; }
        }
        
        switch(s.action) {
            case 'repairLife':
                if (this.gold >= s.price && this.life < this.life_max) {
                    this.gold -= s.price;
                    this.life = Math.min(this.life + 100, this.life_max);
                    s.price = Math.min(Math.floor(s.price * 1.5), 3600);
                    this.toast('❤️恢复!');
                } else this.toast('无法使用');
                break;
            case 'repairAct':
                if (this.gold >= s.price && this.act_max < 200) {
                    this.gold -= s.price; this.act_max++;
                    s.price = Math.floor(s.price * 1.05);
                    this.toast('ACT上限+1');
                } else this.toast('无法使用');
                break;
            case 'repairLifeMax':
                if (this.gold >= s.price && this.life_max < 200) {
                    this.gold -= s.price; this.life_max++;
                    s.price = Math.floor(s.price * 1.05);
                    this.toast('LIFE上限+1');
                } else this.toast('无法使用');
                break;
            case 'repairPoint':
                if (this.gold >= s.price) {
                    this.gold -= s.price; this.add_p++;
                    this.toast('获得属性点!');
                } else this.toast('💰不足');
                break;
            case 'slot':
                if (this.gold >= 10) {
                    this.gold -= 10;
                    const symbols = ['$','$','@','7','*'];
                    const r = symbols[Math.floor(Math.random() * 5)];
                    const prizes = { '$': 500, '@': 0, '7': 7777, '*': 2000 };
                    if (prizes[r]) { this.gold += prizes[r]; this.toast(`🎰${r}${r}${r} +${prizes[r]}💰`); }
                    else { this.addExp(200); this.toast(`🎰@@@ +200⭐`); }
                } else this.toast('💰不足');
                break;
        }
        this.updateUI();
        this.render();
    }
    
    clickTreasure(t) {
        if (!t.active || t.used) { this.toast('未解锁'); return; }
        t.used = true;
        switch(t.id) {
            case 't0': this.life_max += 20; this.toast('❤️上限+20!'); break;
            case 't1': this.rpe *= 2; this.toast('💫x2!'); break;
            case 't2': this.act_max += 20; this.toast('⚡上限+20!'); break;
            case 't3': this.gold += 200 * this.lv; this.toast(`+${200*this.lv}💰!`); break;
            case 't4': this.atk_max *= 2; this.toast('⚔️上限x2!'); break;
        }
        this.updateUI();
        this.render();
    }
    
    clickBoss(b) {
        if (b.life <= 0) { this.toast('已击败'); return; }
        if (this.life <= 0) { this.toast('❤️为0!'); return; }
        
        const dmg = Math.max(1, Math.floor((this.atk - 200) * 0.2));
        b.life -= dmg;
        
        if (b.life <= 0) {
            b.life = 0;
            this.gold += 10000;
            this.addExp(6000);
            this.toast('击败Boss! +10000💰');
        } else {
            let ed = Math.floor(80 * (1 - this.def / 300));
            if (ed < 10) ed = 10;
            this.life -= ed;
            if (this.life < 0) this.life = 0;
            this.toast(`-${dmg} Boss反击-${ed}`);
        }
        this.updateUI();
        this.render();
    }
    
    unlockTreasure(idx) {
        const t = this.items.find(i => i.id === `t${idx}`);
        if (t && !t.active) {
            t.active = true;
            this.toast(`成就: ${t.name}!`);
            this.render();
        }
    }
    
    addExp(val) {
        this.exp += val;
        while (this.exp >= this.exp_max) {
            this.lv++;
            this.exp -= this.exp_max;
            this.exp_max = 100 + (this.lv - 1) * (this.lv - 1);
            this.add_p += 3;
            this.life = this.life_max;
            this.act = this.act_max;
            this.toast(`升级! Lv.${this.lv}`);
            if (this.lv === 40) {
                const slot = this.items.find(i => i.id === 'slot');
                slot.visible = true; slot.locked = false;
                this.render();
            }
        }
    }
    
    addCombo() {
        if (this.combo_time > 0) this.combo++;
        else this.combo = 0;
        this.combo_time = 45;
        if (this.combo >= 120) this.unlockTreasure(3);
    }
    
    toast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1000);
    }
    
    startLoop() {
        setInterval(() => {
            this.life = Math.min(this.life + 0.02 + this.rpe * 0.01, this.life_max);
            this.act = Math.min(this.act + 0.15 + this.rpe * 0.03, this.act_max);
            this.atk = Math.min(this.atk + 0.05, this.atk_max);
            this.def = Math.min(this.def + 0.05, this.def_max);
            
            // 敌人回血
            this.items.filter(i => i.type === 'enemy' && !i.dead).forEach(e => {
                if (e.life < e.life_max) e.life = Math.min(e.life + 0.03, e.life_max);
            });
            
            if (this.combo_time > 0) { this.combo_time--; if (this.combo_time === 0) this.combo = 0; }
            this.updateUI();
        }, 50);
    }
    
    updateUI() {
        document.getElementById('mLv').textContent = this.lv;
        document.getElementById('mGold').textContent = Math.floor(this.gold);
        document.getElementById('mKey').textContent = this.key;
        document.getElementById('mKey2').textContent = this.key2;
        document.getElementById('mRpe').textContent = this.rpe;
        
        this.updateBar('mLife', this.life, this.life_max);
        this.updateBar('mAct', this.act, this.act_max);
        this.updateBar('mExp', this.exp, this.exp_max);
        this.updateBar('mAtk', this.atk, this.atk_max);
        this.updateBar('mDef', this.def, this.def_max);
        this.updateBar('mCombo', this.combo, 120);
        
        document.getElementById('mAddP').textContent = `可分配: ${this.add_p}`;
        // 禁用/启用按钮
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.disabled = this.add_p <= 0;
            btn.style.opacity = this.add_p > 0 ? '1' : '0.4';
        });
    }
    
    updateBar(prefix, cur, max) {
        const bar = document.getElementById(prefix + 'Bar');
        const text = document.getElementById(prefix + 'Text');
        if (bar) bar.style.width = (cur / max * 100) + '%';
        if (text) text.textContent = `${Math.floor(cur)}/${max}`;
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new MobileGame(); });
