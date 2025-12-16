// 掉落物品类
class ItemObj {
    constructor(game, sx, sy, kind, val) {
        this.game = game;
        this.px = sx;
        this.py = sy;
        this.kind = kind;
        this.val = val;
        this._state = "in";
        this.stay_cnt = 0;
        
        // 目标位置
        switch(kind) {
            case "GOLD": this.tx = 90; this.ty = 6; break;
            case "EXP": this.tx = 40; this.ty = 25; break;
            case "KEY": this.tx = 150; this.ty = 6; break;
            case "KEY2": this.tx = 195; this.ty = 6; break;
            case "NEKO": this.tx = 300 + val * 10; this.ty = 6; break;
        }
        
        // 初始速度
        const angle = Math.random() * 40 + 70;
        const speed = 20;
        this.ax = Math.cos(angle * Math.PI / 180) * speed;
        this.ay = Math.sin(angle * Math.PI / 180) * speed;
        this.landing_y = this.py + Math.abs(this.ax) + (angle % 10);
        
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = `item-drop ${this.kind.toLowerCase()}`;
        this.element.style.left = this.px + 'px';
        this.element.style.top = this.py + 'px';
        
        let text = '';
        switch(this.kind) {
            case "GOLD": text = '$' + this.val; break;
            case "EXP": text = this.val.toString(); break;
            case "KEY": text = '�️';b break;
            case "KEY2": text = '�''; break;
            case "NEKO": text = '🐱'; break;
        }
        this.element.textContent = text;
        
        this.element.addEventListener('mouseenter', () => this.onOver());
        this.element.addEventListener('click', () => this.onOver());
        this.element.addEventListener('touchstart', () => this.onOver());
        this.element.style.cursor = 'pointer';
        this.element.style.pointerEvents = 'auto';
        this.game.gameArea.appendChild(this.element);
    }
    
    onOver() {
        if (this._state === "stay" || this._state === "stay2" || this._state === "stay3") {
            this._state = "move";
        } else if (this._state === "in" && this.ay > 0) {
            this._state = "move";
        }
    }
    
    update() {
        switch(this._state) {
            case "in":
                this.px += this.ax;
                this.py += this.ay;
                
                if (this.py > this.landing_y) {
                    this.py = this.landing_y;
                    this.ay = (-this.ay) * 0.5;
                    this.ax = this.ax * 0.5;
                    if (this.ay > -1) {
                        this.stay_cnt = 30;
                        this._state = "stay";
                    }
                }
                
                if (this.px < 10) { this.px = 10; this.ax = -this.ax; }
                if (this.px > 750) { this.px = 750; this.ax = -this.ax; }
                
                this.ay += 1;
                this.element.style.left = this.px + 'px';
                this.element.style.top = this.py + 'px';
                break;
                
            case "stay":
                this.stay_cnt--;
                if (this.stay_cnt <= 0) {
                    this._state = (this.kind === "KEY" || this.kind === "KEY2" || this.kind === "NEKO") ? "stay3" : "stay2";
                }
                break;
                
            case "stay2":
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
                const dx = (this.tx - this.px) / 3;
                const dy = (this.ty - this.py) / 6;
                this.px += dx;
                this.py += dy;
                
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                    this._state = "standby";
                    this.element.style.display = 'none';
                    this.game.addParam(this.kind, this.val);
                    this.game.removeItem(this);
                    if (this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                    }
                } else {
                    this.element.style.left = this.px + 'px';
                    this.element.style.top = this.py + 'px';
                }
                break;
        }
    }
    
    remove() {
        this.element.style.display = 'none';
        this._state = "standby";
        this.game.removeItem(this);
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
