
module egret {

	export class BtnRepaierLife extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:number;
        addP:number = 0;
        lock_flg:boolean;
        mc_lock:any;
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
            var _loc_3:any = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
			this.mc_num = GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text = "$" + this.price;
            this.main.addChild(this.mc_num);
            this.resetPrice();
            this.mc_lock =  GameMain.instance.getMcByName("mc_LockGold");
            this.mc_lock.x = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
            this.mc_lock.y =  this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
			this.mc_lock.touchEnabled =false;
            this.main.addChild(this.mc_lock);
            this.lock_flg = true;
            this.mc.getChildByName("mc_e").visible = false;
            return;
        }

		public  onOver(event:egret.TouchEvent) : void{
            this.mc_focus.visible = true;
            return;
        }

		public  onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
            return;
        }

		public  resetPrice() : void{
            this.price = 100 + GameMain.instance.lv * 20;
            this.txt.text = "$" + this.price;
            return;
        }

		public  onDown(event:egret.TouchEvent) : void{
            var _loc_2:any = undefined;
            if (this.lock_flg){
                if (GameMain.instance.key2 > 0){
					GameMain.instance.key2 --;
                    this.lock_flg = false;
					GameMain.instance.setMessage("UNLOCK");
                    this.mc_lock.visible = false;
                    this.mc.getChildByName("mc_e").visible = true;
                    return;
                }
				GameMain.instance.setMessage("LOCK");
                return;
            }
            if (GameMain.instance._state != "standby"){
                return;
            }
            if (GameMain.instance.life < GameMain.instance.life_max){
                if (GameMain.instance.gold >= this.price){
					GameMain.instance.gold -= this.price;
                    _loc_2 = GameMain.instance.life;
					GameMain.instance.life  += 100;
                    if (GameMain.instance.life > GameMain.instance.life_max){
						GameMain.instance.life = GameMain.instance.life_max;
                    }
                    this.price = parseInt(""+this.price * 1.5);
                    if (this.price > 3600){
                        this.price = 3600;
                    }
                    this.txt.text = "$" + this.price;
					GameMain.instance.disp();
					GameMain.instance.setMessage("REP_LIFE");
                }
            }
            return;
        }

    }
}