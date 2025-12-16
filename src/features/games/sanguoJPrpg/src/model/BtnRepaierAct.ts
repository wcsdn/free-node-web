
module egret {

	export class BtnRepaierAct extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:number = 0;
        addP:number = 0;
        mc_lock:any;
        lock_flg:boolean;
        _kind:string;
private mc_focus:any;
        private txt:any;
        public constructor(param1, param2) {
			super();
            this.main = param1;
            this.mc = param2;
            if (this.mc.name == "mc_rAct"){
                this._kind = "ACT";
            }
            else{
                this._kind = "LIFE";
            }
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_focus.visible = false;
            this.price = 100;
			this.mc_num =GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text = "$" + this.price;
            this.main.addChild(this.mc_num);
            this.mc_lock = GameMain.instance.getMcByName("mc_LockGold");
            this.mc_lock.x = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
            this.mc_lock.y = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
			this.mc_lock.touchEnabled =false;
            this.main.addChild(this.mc_lock);
            this.lock_flg = true;
            this.mc.getChildByName("mc_e").visible = false;
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
            if (this.lock_flg){
                if (GameMain.instance.key2 > 0){
					GameMain.instance.key2 --;
                    this.lock_flg = false;
                    this.mc_lock.visible = false;
                    this.mc.getChildByName("mc_e").visible = true;
                    return;
                }
				GameMain.instance.setMessage("LOCK");
                return;
            }
            if (GameMain.instance.gold >= this.price){
                if (this._kind == "ACT"){
                    if (GameMain.instance.act_max < 200){
						GameMain.instance.act_max ++;
						GameMain.instance.setMessage("ADD_ACT");
                    }
                    else{
                        return;
                    }
                }
                else if (GameMain.instance.life_max < 200){
					GameMain.instance.life_max ++;
					GameMain.instance.setMessage("ADD_LIFE");
                }
                else{
                    return;
                }
				GameMain.instance.gold -= this.price;
                this.price = parseInt(""+this.price * 1.05);
                this.txt.text = "$" + this.price;
				GameMain.instance.disp();
            }
            return;
        }

    }
}