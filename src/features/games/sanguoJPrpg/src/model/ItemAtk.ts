
module egret {

	export class ItemAtk extends egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:number = 0;
        addP:number = 0;
        mc_lock:any;
        lock_flg:any;
        m:number;
        private mc_focus:any;
        private txt:any;
        public constructor(param1, param2){
			super();
            this.main = param1;
            this.mc = param2;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.mc.buttonMode = true;
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_focus.visible = false;
            this.mc.getChildByName("mc_e").visible = false;
            this.m = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
            this.price = parseInt(""+this.m / 10) + Math.pow(GameMain.instance.getMcHeight(this.mc) - 30, 2) + (GameMain.instance.getMcHeight(this.mc) - 30) * 45;
            this.cnt = 0;
            this.addP = parseInt(""+this.m / 100) * 0.45;
            this.mc_num = GameMain.instance.getMcByName("mc_Num");
            this.txt = this.mc_num.getChildByName("txt");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt.touchEnabled = false;
            this.txt.text = "$" + this.price + "\nx" + this.cnt;
            this.main.addChild(this.mc_num);
            var _loc_3:any = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
            var _loc_4:any = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
            if (this.m > 1000){
                this.mc_lock  = GameMain.instance.getMcByName("mc_Key");
                this.mc_lock.x = _loc_3;
                this.mc_lock.y = _loc_4;
				this.mc_lock.touchEnabled =false;
                this.main.addChild(this.mc_lock);
                this.lock_flg = true;
				GameMain.instance.lock1_cnt  ++;
            }
            else{
                this.lock_flg = false;
            }
            return;
        }

        onOver(event:egret.TouchEvent) : void{
            this.mc_focus.visible = true;
            return;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
            return;
        }

        onDown(event:egret.TouchEvent) : void{
            var _loc_2:any = undefined;
            if (this.cnt == 9) {
				GameMain.instance.setMessage("LIMIT");//限量了
                return;
            }
            if (this.lock_flg) {
                if (GameMain.instance.key > 0)  {
					GameMain.instance.key--;
                    this.lock_flg = false;
					GameMain.instance.setMessage("I_UNLOCK");//解锁
                    this.mc_lock.visible = false;
                    return;
                }
				GameMain.instance.setMessage("LOCK");
                return;
            }
            if (GameMain.instance.gold >= this.price) {
				GameMain.instance.gold -= this.price;
                this.mc.getChildByName("mc_e").visible = true;
                _loc_2 = parseInt(""+this.addP * (1 - this.cnt * 0.05));
                if (_loc_2 < 0)
                    _loc_2 = 1;
				GameMain.instance.atk += _loc_2;
				GameMain.instance.atk_max  += _loc_2;
				this.cnt++;
                if (this.cnt == 1) {
					GameMain.instance.i_comp_cnt++;
                    if (GameMain.instance.i_comp_cnt == 9){
						GameMain.instance.setSecret(3);
                    }
                }
                if (this.cnt == 9) {
                    this.mc.gotoAndStop(1);
                    this.mc_num.gotoAndStop(1);
                }
                this.txt.text = "$" + this.price + "\nx" + this.cnt;
				GameMain.instance.setMessage("BUY_ATK", _loc_2);
				GameMain.instance.disp();
            }
            return;
        }

    }
}