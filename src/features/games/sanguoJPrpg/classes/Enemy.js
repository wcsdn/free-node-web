// 敌人类
class Enemy {
    constructor(game, data, index) {
        this.game = game;
        this.data = data;
        this.index = index;
        this.life_max = data.w;
        this.life = this.life_max;
        this.m = data.w * data.h;
        this.lock_flg = this.m > 1500;
        this.key_cnt = Math.floor(this.m / 1000) % 4 + 1;
        this._state = "stay";
        this.cnt = 0;
        this.nw = 200;
        
        if (this.lock_flg) this.game.lock1_cnt++;
        this.game.total_e_num++;
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'game-block enemy';
        if (this.lock_flg) this.element.classList.add('locked');
        
        Object.assign(this.element.style, {
            position: 'absolute',
            left: this.data.x + 'px',
            top: this.data.y + 'px',
            width: this.data.w + 'px',
            height: this.data.h + 'px',
            background: 'linear-gradient(135deg, #F44336, #D32F2F)'
        });
        
        // 进度条
        this.progressBarBG = document.createElement('div');
        this.progressBarBG.className = 'progress-bar';
        this.progressBarBG.style.background = 'rgba(255, 0, 0, 0.3)';
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';
        this.progressFill.style.background = '#F44336';
        this.progressBarBG.appendChild(this.progressFill);
        this.element.appendChild(this.progressBarBG);
        
        // 生命值文本
        this.lifeText = document.createElement('div');
        this.lifeText.className = 'percent-text';
        this.element.appendChild(this.lifeText);
        
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
        this.update();
    }
    
    disable() {
        this.element.style.display = 'none';
    }
    
    onClick() {
        this.game.setStartTime();
        
        if (this.game._state !== "standby") return;
        
        if (this.lock_flg) {
            if (this.game.useKey(1)) {
                this.lock_flg = false;
                this.element.classList.remove('locked');
                this.game.setMessage("UNLOCK_ENEMY");
            } else {
                this.game.setMessage("LOCK");
            }
            return;
        }
        
        if (this.game.life <= 0 || this.life <= 0) return;
        
        // 计算伤害
        const h = this.data.h / 10;
        const w = this.data.w / 10;
        const dist = h * h + (this.data.y - 70);
        let damage = Math.floor(this.game.atk * (1 - dist / 2600) * 0.5);
        
        if (h > w) {
            damage = Math.floor(this.game.atk * 0.25 + Math.random() * 10 - 5);
        }
        if (damage < 0) damage = 1;
        
        this.life -= damage;
        this.game.setMessage("ATK", damage);
        
        if (this.life < 0) {
            this.life = 0;
            this.game.setMessage("WIN");
        }
        
        if (this.life === 0) {
            this._state = "end";
            this.createRewards();
            this.game.e_comp_cnt++;
            if (this.game.e_comp_cnt === this.game.total_e_num) {
                this.game.setSecret(2);
            }
            this.progressBarBG.style.background = 'rgba(0, 255, 0, 0.3)';
        } else {
            this.cnt = 0;
            this._state = "turn";
            this.game._state = "turn";
        }
        
        this.update();
    }
    
    createRewards() {
        const items = [];
        const goldVal = this.m / 10;
        const expVal = this.m / 15;
        
        // 金币
        let g = Math.floor(goldVal);
        while (g >= 1000) { items.push(["GOLD", 1000]); g -= 1000; }
        while (g >= 100) { items.push(["GOLD", 100]); g -= 100; }
        while (g >= 50) { items.push(["GOLD", 50]); g -= 50; }
        while (g >= 10) { items.push(["GOLD", 10]); g -= 10; }
        if (this.m % 10 > 0) items.push(["GOLD", this.m % 10]);
        
        // 经验
        let e = Math.floor(expVal);
        while (e >= 1000) { items.push(["EXP", 1000]); e -= 1000; }
        while (e >= 100) { items.push(["EXP", 100]); e -= 100; }
        while (e >= 50) { items.push(["EXP", 50]); e -= 50; }
        while (e >= 10) { items.push(["EXP", 10]); e -= 10; }
        if (this.m % 10 > 0) items.push(["EXP", this.m % 10]);
        
        // 钥匙
        items.push(["KEY2", 1]);
        for (let i = 0; i < this.key_cnt; i++) {
            items.push(["KEY", 1]);
        }
        
        // 随机NEKO
        const rand = Math.floor(Math.random() * 100);
        if (rand < 25) {
            items.push(["NEKO", rand % 8]);
        }
        
        const cx = this.data.x + this.data.w / 2;
        const cy = this.data.y + this.data.h / 2;
        this.game.setItem(items, cx, cy);
    }
    
    update() {
        // 敌人回血
        if (this._state === "stay" && this.life > 0 && this.life < this.life_max) {
            this.life += (this.data.y - 70) * 0.0001 * (this.life_max / 100) + this.game.rpe * 0.01;
            if (this.life > this.life_max) this.life = this.life_max;
        }
        
        // 敌人反击
        if (this._state === "turn") {
            this.cnt++;
            if (this.cnt === 15) {
                const h = this.data.h;
                const w = this.data.w;
                const damage = 20 + (h + w) / 2;
                this.game.setDamage(damage);
                this._state = "stay";
                this.game._state = "standby";
            }
        }
        
        const percent = this.life_max > 0 ? (this.life / this.life_max) : 0;
        const target = 200 * percent;
        this.nw += (target - this.nw) / 2;
        this.progressFill.style.width = (percent * 100) + '%';
        this.lifeText.textContent = `${Math.floor(this.life)}/${this.life_max}`;
    }
}
