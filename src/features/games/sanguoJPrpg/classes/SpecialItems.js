// 回复生命按钮
class RepairLife {
    constructor(game, x, y, w, h) {
        this.game = game;
        this.lock_flg = true;
        this.price = 100 + game.lv * 20;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block shop-item locked';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: 'linear-gradient(135deg, #4CAF50, #388E3C)'
        });
        this.priceText = document.createElement('div');
        this.priceText.className = 'percent-text';
        this.priceText.style.fontSize = '8px';
        this.updatePrice();
        this.element.appendChild(this.priceText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    updatePrice() {
        this.price = 100 + this.game.lv * 20;
        this.priceText.textContent = `$${this.price}\n回复`;
    }
    resetPrice() { this.updatePrice(); }
    
    onClick() {
        if (this.lock_flg) {
            if (this.game.key2 > 0) {
                this.game.key2--;
                this.lock_flg = false;
                this.element.classList.remove('locked');
                this.game.setMessage("UNLOCK");
            } else this.game.setMessage("LOCK");
            return;
        }
        if (this.game._state !== "standby") return;
        if (this.game.life < this.game.life_max && this.game.gold >= this.price) {
            this.game.gold -= this.price;
            this.game.life = Math.min(this.game.life + 100, this.game.life_max);
            this.price = Math.min(Math.floor(this.price * 1.5), 3600);
            this.updatePrice();
            this.game.setMessage("REP_LIFE");
            this.game.disp();
        }
    }
}

// 购买行动力/生命上限
class RepairStat {
    constructor(game, x, y, w, h, kind) {
        this.game = game;
        this.kind = kind;
        this.lock_flg = true;
        this.price = 100;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block shop-item locked';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: this.kind === 'ACT' ? '#FF9800' : '#E91E63'
        });
        this.priceText = document.createElement('div');
        this.priceText.className = 'percent-text';
        this.priceText.style.fontSize = '8px';
        this.priceText.textContent = `$${this.price}\n+${this.kind}`;
        this.element.appendChild(this.priceText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    onClick() {
        if (this.lock_flg) {
            if (this.game.key2 > 0) {
                this.game.key2--;
                this.lock_flg = false;
                this.element.classList.remove('locked');
            } else this.game.setMessage("LOCK");
            return;
        }
        if (this.game.gold >= this.price) {
            if (this.kind === 'ACT') {
                if (this.game.act_max < 200) { this.game.act_max++; this.game.setMessage("ADD_ACT"); }
                else return;
            } else {
                if (this.game.life_max < 200) { this.game.life_max++; this.game.setMessage("ADD_LIFE"); }
                else return;
            }
            this.game.gold -= this.price;
            this.price = Math.floor(this.price * 1.05);
            this.priceText.textContent = `$${this.price}\n+${this.kind}`;
            this.game.disp();
        }
    }
}

// 购买钥匙
class KeyShop {
    constructor(game, x, y, w, h) {
        this.game = game;
        this.price = 400;
        this.active = true;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block shop-item';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: '#607D8B'
        });
        this.priceText = document.createElement('div');
        this.priceText.className = 'percent-text';
        this.priceText.style.fontSize = '8px';
        this.priceText.textContent = `$${this.price}\n🔑`;
        this.element.appendChild(this.priceText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    onClick() {
        if (this.active && this.game.gold >= this.price) {
            this.game.gold -= this.price;
            this.game.key++;
            this.game.setMessage("BUY_KEY");
            this.game.disp();
        }
    }
    
    disable() {
        this.active = false;
        this.element.style.opacity = '0.5';
    }
}

// 购买属性点
class RepairPoint {
    constructor(game, x, y, w, h) {
        this.game = game;
        this.lock_flg = true;
        this.price = 200;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block shop-item locked';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: '#9C27B0'
        });
        this.priceText = document.createElement('div');
        this.priceText.className = 'percent-text';
        this.priceText.style.fontSize = '8px';
        this.priceText.textContent = `$${this.price}\n+P`;
        this.element.appendChild(this.priceText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    onClick() {
        if (this.lock_flg) {
            if (this.game.key2 > 0) {
                this.game.key2--;
                this.lock_flg = false;
                this.element.classList.remove('locked');
                this.game.setMessage("UNLOCK");
            } else this.game.setMessage("LOCK");
            return;
        }
        if (this.game.gold >= this.price) {
            this.game.gold -= this.price;
            this.game.addAddP(1);
            this.game.disp();
        }
    }
}

// 宝箱 (成就奖励)
class Treasure {
    constructor(game, x, y, w, h, name) {
        this.game = game;
        this.name = name;
        this.active = false;
        this.used = false;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: '#795548', opacity: '0.5'
        });
        this.text = document.createElement('div');
        this.text.className = 'percent-text';
        this.text.style.fontSize = '8px';
        this.text.textContent = '?';
        this.element.appendChild(this.text);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
        this.x = x; this.y = y; this.w = w; this.h = h;
    }
    
    enable() {
        this.active = true;
        this.element.style.opacity = '1';
        this.element.style.background = '#FF9800';
        const rewards = {
            n1: '体力\n+20', n2: '回复\nx2', n3: '行动\n+20',
            n4: '$200\nxLv', n5: '攻击\nx2'
        };
        this.text.textContent = rewards[this.name] || '?';
    }
    
    onClick() {
        if (!this.active || this.used) return;
        
        switch(this.name) {
            case 'n1': this.game.life_max += 20; break;
            case 'n2': this.game.rpe *= 2; break;
            case 'n3': this.game.act_max += 20; break;
            case 'n4':
                const items = [];
                for (let i = 1; i < this.game.lv; i++) items.push(["GOLD", 200]);
                this.game.setItem(items, this.x + this.w/2, this.y + this.h/2);
                break;
            case 'n5': this.game.atk_max *= 2; break;
        }
        this.game.disp();
        this.disable();
    }
    
    disable() {
        this.used = true;
        this.active = false;
        this.element.style.opacity = '0.3';
        this.element.style.background = '#555';
    }
}

// Boss
class Boss {
    constructor(game, x, y, w, h) {
        this.game = game;
        this.life_max = 5 * 48;
        this.life = this.life_max;
        this._state = "lock";
        this.cnt = 0;
        this.nw = 0;
        this.createElement(x, y, w, h);
        this.x = x; this.y = y; this.w = w; this.h = h;
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block';
        this.element.style.display = 'none';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: '#8B0000'
        });
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';
        this.progressFill.style.background = '#F44336';
        this.progressBar.appendChild(this.progressFill);
        this.element.appendChild(this.progressBar);
        this.lifeText = document.createElement('div');
        this.lifeText.className = 'percent-text';
        this.element.appendChild(this.lifeText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    enable() {
        this._state = "stay";
        this.element.style.display = 'flex';
    }
    
    onClick() {
        if (this.game._state !== "standby") return;
        if (this._state === "lock") return;
        if (this._state === "end") return;
        if (this.game.life <= 0 || this.life <= 0) return;
        
        const damage = Math.max(1, Math.floor((this.game.atk - 200) * 0.2));
        this.life -= damage;
        this.game.setMessage("ATK", damage);
        
        if (this.life <= 0) {
            this.life = 0;
            this._state = "end";
            this.game.setMessage("WIN");
            // 掉落奖励
            const items = [];
            for (let i = 0; i < 10; i++) items.push(["GOLD", 1000]);
            for (let i = 0; i < 6; i++) items.push(["EXP", 1000]);
            items.push(["NEKO", 8]);
            this.game.setItem(items, this.x + this.w/2, this.y + this.h/2);
            this.game.setSecret(6);
        } else {
            this.cnt = 0;
            this._state = "turn";
            this.game._state = "turn";
        }
    }
    
    update() {
        if (this._state === "stay") {
            this.life += (this.life_max - this.life) * 0.002 + 0.001;
            if (this.life > this.life_max) this.life = this.life_max;
        }
        if (this._state === "turn") {
            this.cnt++;
            if (this.cnt === 15) {
                const damage = 100 - this.life / 4;
                this.game.setDamage(damage);
                this._state = "stay";
                this.game._state = "standby";
            }
        }
        const percent = this.life / this.life_max;
        this.progressFill.style.width = (percent * 100) + '%';
        this.lifeText.textContent = `${Math.floor(this.life)}/${this.life_max}`;
    }
}

// 老虎机
class Slot {
    constructor(game, x, y, w, h) {
        this.game = game;
        this._state = "lock";
        this.price = 10;
        this.s_idx = 0;
        this.s_list = [0, 0, 0];
        this.str = [
            ["$", "$", "$", "@", "@", "7", "*", "*"],
            ["$", "$", "$", "@", "@", "7", "*", "$"],
            ["$", "@", "7", "*", "$", "@", "7", "*"]
        ];
        this.cnt = 0;
        this.sx = x + w / 2;
        this.sy = y + h / 2;
        this.createElement(x, y, w, h);
    }
    
    createElement(x, y, w, h) {
        this.element = document.createElement('div');
        this.element.className = 'game-block';
        this.element.style.display = 'none';
        Object.assign(this.element.style, {
            position: 'absolute', left: x + 'px', top: y + 'px',
            width: w + 'px', height: h + 'px',
            background: '#9C27B0', flexDirection: 'column'
        });
        this.slotDisplay = document.createElement('div');
        this.slotDisplay.style.cssText = 'font-size:12px;color:#fff;';
        this.slotDisplay.textContent = '$ $ $';
        this.element.appendChild(this.slotDisplay);
        this.priceText = document.createElement('div');
        this.priceText.style.cssText = 'font-size:8px;color:#ff0;';
        this.priceText.textContent = `$${this.price}`;
        this.element.appendChild(this.priceText);
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    entry() {
        this._state = "stay";
        this.element.style.display = 'flex';
    }
    
    onClick() {
        if (this.game._state !== "standby") return;
        if (this._state === "stay") {
            if (this.game.gold >= this.price) {
                this.game.gold -= this.price;
                this.game.disp();
                this.s_idx = 0;
                this.s_list = [0, 0, 0];
                this._state = "push";
            }
        } else if (this._state === "push") {
            this.s_idx++;
            if (this.s_idx === 3) this._state = "result";
        }
    }
    
    update() {
        if (this._state === "push") {
            this.cnt++;
            if (this.cnt % 2) {
                for (let i = this.s_idx; i < 3; i++) {
                    this.s_list[i] = Math.floor(Math.random() * 8);
                }
                this.slotDisplay.textContent = this.s_list.map((v, i) => this.str[i][v]).join(' ');
            }
        } else if (this._state === "result") {
            const s0 = this.str[0][this.s_list[0]];
            const s1 = this.str[1][this.s_list[1]];
            const s2 = this.str[2][this.s_list[2]];
            if (s0 === s1 && s1 === s2) {
                const items = [];
                switch(s0) {
                    case "$": for (let i = 0; i < 8; i++) items.push(["GOLD", 200]); break;
                    case "@": for (let i = 0; i < 10; i++) items.push(["EXP", 20]); break;
                    case "7": for (let i = 0; i < 20; i++) items.push(["GOLD", 777]); break;
                    case "*": for (let i = 0; i < 12; i++) items.push(["GOLD", 800]); break;
                }
                if (items.length > 0) this.game.setItem(items, this.sx, this.sy);
            }
            this._state = "stay";
        }
    }
}
