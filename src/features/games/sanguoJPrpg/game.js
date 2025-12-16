// 游戏主控制器
class GameMain {
    constructor() {
        // 游戏属性
        this.life = 100; this.life_max = 100;
        this.act = 50; this.act_max = 50;
        this.atk = 10; this.atk_max = 10;
        this.def = 10; this.def_max = 10;
        this.exp = 0; this.exp_max = 100;
        this.exp_total = 0; this.exp_total_max = 100;
        this.lv = 1;
        this.gold = 0;
        this.rpe = 10;
        this.key = 0;
        this.key2 = 0;
        this.add_p = 0;
        
        // 游戏状态
        this.combo = 0;
        this.combo_time = 0;
        this.COMBO_MAX = 120;
        this.COMBO_W_TIME = 45;
        this._state = "standby";
        this.first_click_flg = true;
        this.start_time = 0;
        
        // 统计
        this.total_e_num = 0;
        this.total_m_num = 0;
        this.m_comp_cnt = 0;
        this.e_comp_cnt = 0;
        this.i_comp_cnt = 0;
        this.lock1_cnt = 0;
        
        // 列表
        this.missions = [];
        this.enemies = [];
        this.items = [];
        this.shopItems = [];
        this.mes_list = [];
        this.secret_list = [0, 0, 0, 0, 0, 0, 0, 0];
        this.t_list = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        // UI元素
        this.gameArea = document.getElementById('gameArea');
        this.messageArea = document.getElementById('messageArea');
        
        this.jp = true; // 使用中文
        this.init();
    }
    
    init() {
        // 创建游戏元素
        MISSION_DATA.forEach((data, i) => this.missions.push(new Mission(this, data, i)));
        ENEMY_DATA.forEach((data, i) => this.enemies.push(new Enemy(this, data, i)));
        SHOP_DATA_TEMPLATE.forEach((data, i) => this.shopItems.push(new ShopItem(this, data, i)));
        
        // 特殊功能 (使用SPECIAL_DATA中的位置)
        const sd = SPECIAL_DATA;
        this.repairLife = new RepairLife(this, sd.repairLife.x, sd.repairLife.y, sd.repairLife.w, sd.repairLife.h);
        this.repairAct = new RepairStat(this, sd.repairAct.x, sd.repairAct.y, sd.repairAct.w, sd.repairAct.h, 'ACT');
        this.repairLifeMax = new RepairStat(this, sd.repairLifeMax.x, sd.repairLifeMax.y, sd.repairLifeMax.w, sd.repairLifeMax.h, 'LIFE');
        this.slot = new Slot(this, sd.slot.x, sd.slot.y, sd.slot.w, sd.slot.h);
        this.keyShop = new KeyShop(this, sd.keyShop.x, sd.keyShop.y, sd.keyShop.w, sd.keyShop.h);
        this.repairPoint = new RepairPoint(this, sd.repairPoint.x, sd.repairPoint.y, sd.repairPoint.w, sd.repairPoint.h);
        this.boss = new Boss(this, sd.boss.x, sd.boss.y, sd.boss.w, sd.boss.h);
        
        // 宝箱 (成就奖励)
        this.treasures = {
            n1: new Treasure(this, sd.treasure1.x, sd.treasure1.y, sd.treasure1.w, sd.treasure1.h, 'n1'),
            n2: new Treasure(this, sd.treasure2.x, sd.treasure2.y, sd.treasure2.w, sd.treasure2.h, 'n2'),
            n3: new Treasure(this, sd.treasure3.x, sd.treasure3.y, sd.treasure3.w, sd.treasure3.h, 'n3'),
            n4: new Treasure(this, sd.treasure4.x, sd.treasure4.y, sd.treasure4.w, sd.treasure4.h, 'n4'),
            n5: new Treasure(this, sd.treasure5.x, sd.treasure5.y, sd.treasure5.w, sd.treasure5.h, 'n5')
        };
        
        this.setupButtons();
        this.startGameLoop();
        this.disp();
    }
    
    setupButtons() {
        const btns = ['Life', 'Act', 'Rpe', 'Atk', 'Def'];
        btns.forEach(b => {
            const el = document.getElementById('btnAdd' + b);
            if (el) {
                el.addEventListener('click', () => this.onAddP(b.toUpperCase()));
                el.disabled = true;
            }
        });
    }
    
    onAddP(type) {
        if (this.add_p <= 0) return;
        
        switch(type) {
            case 'LIFE': this.life_max++; this.life++; this.setMessage("ADD_LIFE"); break;
            case 'ACT': this.act_max++; this.act++; this.setMessage("ADD_ACT"); break;
            case 'RPE': this.rpe++; this.setMessage("ADD_RPE"); break;
            case 'ATK': this.atk_max++; this.atk++; this.setMessage("ADD_STR", 1); break;
            case 'DEF': this.def_max++; this.def++; this.setMessage("ADD_DEF", 1); break;
        }
        this.add_p--;
        this.disp();
    }
    
    addAddP(n) {
        this.add_p += n;
        this.disp();
    }
    
    setStartTime() {
        if (this.first_click_flg) {
            this.start_time = Date.now();
            this.first_click_flg = false;
        }
    }
    
    useKey(type = 0) {
        if (type === 1) {
            if (this.key > 0) { this.key--; this.lock1_cnt--; return true; }
        } else {
            if (this.key2 > 0) { this.key2--; return true; }
        }
        return false;
    }
    
    addParam(kind, val) {
        switch(kind) {
            case "GOLD": this.gold += val; break;
            case "EXP":
                this.exp += val;
                this.exp_total += val;
                if (this.exp >= this.exp_max) {
                    this.lv++;
                    this.exp -= this.exp_max;
                    this.exp_max = 100 + (this.lv - 1) * (this.lv - 1);
                    this.exp_total_max += this.exp_max;
                    this.addAddP(3);
                    this.setMessage("LEVEL_UP", this.lv);
                    this.life = this.life_max;
                    this.act = this.act_max;
                    if (this.repairLife) this.repairLife.resetPrice();
                    if (this.lv === 40 && this.slot) this.slot.entry();
                }
                break;
            case "KEY": this.key++; break;
            case "KEY2": this.key2++; break;
            case "NEKO":
                this.t_list[val] = 1;
                if (this.t_list.filter(t => t === 1).length === 9) this.setSecret(5);
                break;
        }
        
        if (this.combo_time > 0) this.combo++;
        else this.combo = 0;
        this.combo_time = this.COMBO_W_TIME;
        this.disp();
    }
    
    setItem(items, sx, sy) {
        items.forEach(([kind, val]) => {
            const item = new ItemObj(this, sx, sy, kind, val);
            this.items.push(item);
        });
    }
    
    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx > -1) this.items.splice(idx, 1);
    }
    
    setDamage(dmg) {
        if (this.def > 300) this.def = 300;
        let actual = Math.floor(dmg * 0.5 * (1 - this.def / 300));
        if (actual < 5) actual = Math.floor(5 + Math.random() * 10);
        this.setMessage("DAMAGE", actual);
        this.life -= actual;
        if (this.life < 0) {
            this.life = 0;
            this.atk = 0;
            this.def = 0;
            if (this.repairLife) this.repairLife.resetPrice();
        }
        this.disp();
    }
    
    setSecret(num) {
        if (this.secret_list[num - 1]) return; // 已经激活过
        this.secret_list[num - 1] = 1;
        
        // 激活对应的宝箱
        const treasureMap = { 1: 'n1', 2: 'n2', 3: 'n3', 4: 'n4', 5: 'n5' };
        if (treasureMap[num] && this.treasures && this.treasures[treasureMap[num]]) {
            this.treasures[treasureMap[num]].enable();
        }
        
        // 激活Boss (当完成所有任务和敌人时)
        if (this.secret_list[0] && this.secret_list[1] && this.boss) {
            this.boss.enable();
        }
        
        const msgs = { 1: "M_ALL", 2: "E_ALL", 3: "I_ALL", 4: "C_MAX", 5: "NEKOGAMES" };
        if (msgs[num]) this.setMessage(msgs[num]);
    }
    
    setMessage(key, param = 0) {
        const msg = MESSAGES[key];
        if (!msg) return;
        let text = this.jp ? msg[0] : msg[1];
        text = text.replace(/@/g, param);
        this.setMes(text, msg[2]);
    }
    
    setMes(msg, color) {
        const time = this.getTimerStr();
        const fullMsg = `<span style="color:#fff">${time}</span> <span style="color:${color}">${msg}</span>`;
        if (this.mes_list.length >= 4) this.mes_list.shift();
        this.mes_list.push([fullMsg, color]);
        this.messageArea.innerHTML = this.mes_list.map(m => `<div class="message-item">${m[0]}</div>`).join('');
    }
    
    getTimerStr() {
        if (this.first_click_flg) return "00:00:00";
        const sec = Math.floor((Date.now() - this.start_time) / 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor(sec % 3600 / 60);
        const s = sec % 60;
        return [h, m, s].map(v => v < 10 ? '0' + v : v).join(':');
    }
    
    startGameLoop() {
        setInterval(() => {
            if (this._state === "standby") {
                // 自动恢复
                this.life = Math.min(this.life + 0.004 + this.rpe * 0.002, this.life_max);
                this.act = Math.min(this.act + 0.06 + this.rpe * 0.01, this.act_max);
                this.def = Math.min(this.def + 0.03 + this.rpe * 0.01, this.def_max);
                this.atk = Math.min(this.atk + 0.03 + this.rpe * 0.01, this.atk_max);
                
                // 连击倒计时
                if (this.combo_time > 0) {
                    this.combo_time--;
                    if (this.combo_time === 0) {
                        if (this.combo >= this.COMBO_MAX) this.setSecret(4);
                        this.combo = 0;
                    }
                }
            }
            
            // 更新所有对象
            this.missions.forEach(m => m.update());
            this.enemies.forEach(e => e.update());
            this.items.forEach(i => i.update());
            if (this.slot) this.slot.update();
            if (this.boss) this.boss.update();
            
            this.disp();
        }, 16);
    }
    
    disp() {
        // 更新属性条
        this.updateMeter('life', this.life, this.life_max);
        this.updateMeter('act', this.act, this.act_max);
        this.updateMeter('exp', this.exp, this.exp_max);
        this.updateMeter('atk', this.atk, this.atk_max);
        this.updateMeter('def', this.def, this.def_max);
        this.updateMeter('combo', this.combo, this.COMBO_MAX);
        
        // 更新文本
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText('levelText', this.lv);
        setText('goldText', Math.floor(this.gold));
        setText('keyText', this.key);
        setText('key2Text', this.key2);
        setText('rpeText', this.rpe);
        
        // 更新按钮状态
        const btns = ['btnAddLife', 'btnAddAct', 'btnAddRpe', 'btnAddAtk', 'btnAddDef'];
        btns.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = this.add_p <= 0; });
        
        // 显示可分配点数
        const addPEl = document.getElementById('addPText');
        if (addPEl) addPEl.textContent = this.add_p > 0 ? `可分配: ${this.add_p}` : '';
    }
    
    updateMeter(type, current, max) {
        const bar = document.getElementById(type + 'Bar');
        const text = document.getElementById(type + 'Text');
        if (bar) {
            const percent = max > 0 ? Math.min(current / max, 1) : 0;
            bar.style.width = (percent * 100) + '%';
        }
        if (text) {
            text.textContent = type === 'exp' 
                ? `${this.exp_total}/${this.exp_total_max}` 
                : `${Math.floor(current)}/${max}`;
        }
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameMain();
});
