
module egret {

	export class BtnRepaierPoint extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:any;
        addP:number = 0;
        mc_lock:any;
        lock_flg:boolean;

        public constructor(param1, param2){
			super();
            this.main = param1;
            this.mc = param2;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.mc.mc_focus.visible = false;
            var _loc_3:any = this.mc.width * this.mc.height;
            this.price = 200;
            this.mc_num =  GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.mc_num.txt.touchEnabled = false;
            this.mc_num.txt.text = "$" + this.price;
            this.main.addChild(this.mc_num);
            var _loc_4:any = this.mc.x + this.mc.width / 2;
            var _loc_5:any = this.mc.y + this.mc.height / 2;
            this.mc_lock =  GameMain.instance.getMcByName("mc_LockGold");
            this.mc_lock.x = _loc_4;
            this.mc_lock.y = _loc_5;
            this.main.addChild(this.mc_lock);
            this.lock_flg = true;
            this.mc.getChildByName("mc_e").visible = false;
            return;
        }

        onOver(event:egret.TouchEvent) : void{
            this.mc.mc_focus.visible = true;
            return;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc.mc_focus.visible = false;
            return;
        }

        onDown(event:egret.TouchEvent) : void{
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
            if (GameMain.instance.gold >= this.price){
				GameMain.instance.gold  -= this.price;
				GameMain.instance.addAddP(1);
				GameMain.instance.disp();
				GameMain.instance.setMes("ポイント購入", "#66FFFF");
            }
            return;
        }

    }
}