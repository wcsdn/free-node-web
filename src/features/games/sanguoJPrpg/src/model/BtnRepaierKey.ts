
module egret {

	export class BtnRepaierKey extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:number;
        addP:number = 0;
        active_flg:boolean;
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
            var _loc_3:any = this.mc.width * this.mc.height;
            this.price = 400;
			this.mc_num = GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text = "$" + this.price;
            this.main.addChild(this.mc_num);
            this.mc.gotoAndStop(0);
            this.active_flg = true;
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
            if (this.active_flg){
                if (GameMain.instance.gold >= this.price){
					GameMain.instance.gold -= this.price;
					GameMain.instance.key++;
					GameMain.instance.disp();
					GameMain.instance.setMessage("BUY_KEY");
                }
            }
            return;
        }

        public disable() : void{
            this.active_flg = false;
            this.mc.buttonMode = false;
            this.mc.gotoAndStop(1);
            this.mc_num.gotoAndStop(1);
            this.txt.text = "$" + this.price;
            return;
        }

    }
}