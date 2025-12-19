// 商店物品类 (ATK/DEF)
class ShopItem {
    constructor(game, data, index) {
        this.game = game;
        this.data = data;
        this.index = index;
        this.type = data.type; // 'atk' or 'def'
        this.m = data.w * data.h;
        this.lock_flg = this.m > 1000;
        this.cnt = 0; // 购买次数，最多9次
        
        // 计算价格和加成
        if (this.type === 'atk') {
            this.price = Math.floor(this.m / 10) + Math.pow(data.h - 30, 2) + (data.h - 30) * 45;
            this.addP = Math.floor(this.m / 100) * 0.45;
        } else {
            this.price = Math.floor(this.m / 10) + Math.pow(data.w - 30, 2) - (data.h - 30) * 10;
            this.addP = Math.floor(this.m / 100) * 0.5;
        }
        
        if (this.lock_flg) this.game.lock1_cnt++;
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'game-block shop-item';
        if (this.lock_flg) this.element.classList.add('locked');
        
        Object.assign(this.element.style, {
            position: 'absolute',
            left: this.data.x + 'px',
            top: this.data.y + 'px',
            width: this.data.w + 'px',
            height: this.data.h + 'px',
            background: this.type === 'atk' ? '#FF00FF' : '#00FFFF'
        });
        
        // 价格和次数显示
        this.priceText = document.createElement('div');
        this.priceText.className = 'percent-text';
        this.priceText.style.fontSize = '8px';
        this.priceText.style.whiteSpace = 'pre-line';
        this.updateText();
        this.element.appendChild(this.priceText);
        
        this.element.addEventListener('click', () => this.onClick());
        this.game.gameArea.appendChild(this.element);
    }
    
    updateText() {
        this.priceText.textContent = `$${this.price}\nx${this.cnt}`;
    }
    
    onClick() {
        // 显示弹框
        if (typeof showShopModal === 'function') {
            showShopModal(this);
        } else {
            this.doBuy();
        }
    }
    
    // 实际购买逻辑
    doBuy() {
        // 已达上限
        if (this.cnt >= 9) {
            this.game.setMessage("LIMIT");
            return;
        }
        
        if (this.lock_flg) return;
        
        // 购买
        if (this.game.gold >= this.price) {
            this.game.gold -= this.price;
            
            // 计算实际加成（随购买次数递减）
            let actualAdd = Math.floor(this.addP * (1 - this.cnt * 0.05));
            if (actualAdd <= 0) actualAdd = 1;
            
            if (this.type === 'atk') {
                this.game.atk += actualAdd;
                this.game.atk_max += actualAdd;
                this.game.setMessage("BUY_ATK", actualAdd);
            } else {
                this.game.def += actualAdd;
                this.game.def_max += actualAdd;
                this.game.setMessage("BUY_DEF", actualAdd);
            }
            
            this.cnt++;
            
            // 首次购买计入完成数
            if (this.cnt === 1) {
                this.game.i_comp_cnt++;
                if (this.game.i_comp_cnt === 9) {
                    this.game.setSecret(3);
                }
            }
            
            // 购买满9次
            if (this.cnt >= 9) {
                this.element.style.opacity = '0.5';
            }
            
            this.updateText();
            this.game.disp();
        }
    }
}
