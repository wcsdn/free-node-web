// 任务类
class Mission {
    constructor(game, data, index) {
        this.game = game;
        this.data = data;
        this.index = index;
        this.life = 0;
        this.life_max = data.w;
        this.complete_flg = false;
        this.m = data.w * data.h;
        this.lock_flg = this.m > 1000;
        this.cost = this.m * 0.01;
        this.gold = Math.floor(this.m * 0.03 * (1 + Math.random()) * 2);
        this.exp = Math.floor(this.m * 0.1 * (1 + Math.random()) * 2);
        this.nw = 0;
        
        if (this.lock_flg) {
            this.game.lock1_cnt++;
        }
        this.game.total_m_num++;
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'game-block mission';
        if (this.lock_flg) this.element.classList.add('locked');
        
        Object.assign(this.element.style, {
            position: 'absolute',
            left: this.data.x + 'px',
            top: this.data.y + 'px',
            width: this.data.w + 'px',
            height: this.data.h + 'px',
            background: 'linear-gradient(135deg, #2196F3, #1976D2)'
        });
        
        // 进度条
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';
        this.progressBar.appendChild(this.progressFill);
        this.element.appendChild(this.progressBar);
        
        // 百分比文本
        this.percentText = document.createElement('div');
        this.percentText.className = 'percent-text';
        this.element.appendChild(this.percentText);
        
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
        this.update();
    }
    
    onClick() {
        this.game.setStartTime();
        // 显示弹框
        if (typeof showMissionModal === 'function') {
            showMissionModal(this);
        } else {
            this.doExecute();
        }
    }
    
    // 实际执行任务逻辑
    doExecute() {
        if (this.lock_flg) return;
        
        if (this.game.act >= this.cost) {
            this.game.act -= this.cost;
            
            if (!this.complete_flg) {
                this.life += (10 + Math.random() * 3);
                if (this.life >= this.life_max) {
                    this.life = this.life_max;
                    this.game.addAddP(1);
                    this.game.setMessage("M_COMP");
                    this.gold = Math.floor(this.gold * 1.5);
                    this.exp = Math.floor(this.exp * 1.5);
                    this.complete_flg = true;
                    this.game.m_comp_cnt++;
                    if (this.game.m_comp_cnt === this.game.total_m_num) {
                        this.game.setSecret(1);
                    }
                    this.progressFill.classList.add('complete');
                } else {
                    this.game.setMessage("M_OK");
                }
            } else {
                this.exp = 0;
                this.gold = Math.floor(this.m / 10 + Math.random() * this.m / 100);
                this.game.setMessage("M_OK2");
            }
            
            this.createItems();
            this.game.disp();
        } else {
            this.game.setMessage("M_NG");
        }
    }
    
    createItems() {
        const items = [];
        // 金币
        let g = Math.floor(this.gold / 10);
        while (g >= 100) { items.push({ kind: "GOLD", val: 100 }); g -= 100; }
        while (g >= 50) { items.push({ kind: "GOLD", val: 50 }); g -= 50; }
        while (g >= 10) { items.push({ kind: "GOLD", val: 10 }); g -= 10; }
        if (this.gold % 10 > 0) items.push({ kind: "GOLD", val: this.gold % 10 });
        
        // 经验
        let e = Math.floor(this.exp / 10);
        while (e >= 100) { items.push({ kind: "EXP", val: 100 }); e -= 100; }
        while (e >= 50) { items.push({ kind: "EXP", val: 50 }); e -= 50; }
        while (e >= 10) { items.push({ kind: "EXP", val: 10 }); e -= 10; }
        if (this.exp % 10 > 0) items.push({ kind: "EXP", val: this.exp % 10 });
        
        // 随机NEKO
        if (Math.random() * 100 < 3) {
            items.push({ kind: "NEKO", val: Math.floor(Math.random() * 8) });
        }
        
        console.log('Mission createItems 生成了物品:', items);
        
        // 在弹框中显示掉落物品
        if (typeof showDropsInModal === 'function') {
            console.log('调用 showDropsInModal');
            // 先保存掉落物品
            this.lastDrops = items;
            showDropsInModal(items);
        } else {
            console.log('showDropsInModal 函数不存在，使用降级方案');
            // 降级：直接添加到地图
            this.lastDrops = null;
            const cx = this.data.x + this.data.w / 2;
            const cy = this.data.y + this.data.h / 2;
            items.forEach(item => {
                this.game.setItem([[item.kind, item.val]], cx, cy);
            });
        }
    }
    
    update() {
        const percent = this.life_max > 0 ? (this.life / this.life_max) : 0;
        const target = 200 * percent;
        this.nw += (target - this.nw) / 2;
        this.progressFill.style.width = (percent * 100) + '%';
        this.percentText.textContent = Math.floor(percent * 100) + '%';
    }
}
