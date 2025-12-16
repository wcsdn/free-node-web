
module egret {

	export class Inst extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        btn:any;
        btn_c:any;
private btn_jp:any;
        private btn_en:any;
        private btn_play:any;
        private btn_close:any;
        public constructor(param1){
			super();
            this.main = param1;
            this.mc =GameMain.instance.getMcByName("mc_InstMC");
            this.mc.gotoAndStop(1);
            this.main.addChild(this.mc);
			//this.mc.x= (this.main.width-this.mc.width)/2;
			//this.mc.y =(this.main.height-this.mc.height)/2 ;
            this.btn_en = this.mc.getChildByName("btn_en");
            this.btn_jp = this.mc.getChildByName("btn_jp");
            this.btn_jp.touchEnabled= true;
            this.btn_en.touchEnabled= true;
            this.btn_jp.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickLang, this);
            this.btn_en.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickLang, this);
            this.btn_jp.gotoAndStop(0);
            this.btn_en.gotoAndStop(1);
            this.btn_play = this.mc.getChildByName("btn_play");
            this.btn_close = this.mc.getChildByName("btn_close");
            this.btn = new ButtonObject2(this.btn_play, this.onClickPlay, this.main);
            this.btn_c = new ButtonObject2(this.btn_close, this.onClickPlay, this.main);
            this.btn_play.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickPlay, this);
            this.btn_close.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickPlay, this);
            return;
        }

        public onClickPlay(event:egret.TouchEvent) : void{
            this.disp(false);

            GameMain.instance.setStartTime();
            return;
        }

        private onClickLang(event:egret.TouchEvent) : void{
            if (event.currentTarget == this.btn_jp){
				GameMain.instance.jp = true;
                this.mc.gotoAndStop(0);
                this.btn_jp.gotoAndStop(0);
                this.btn_en.gotoAndStop(1);
				GameMain.instance.mc_if.gotoAndStop(0);
				GameMain.instance.mc_icon.movieclip.gotoAndStop(0);
            }
            else{
				GameMain.instance.jp = false;
                this.mc.gotoAndStop(1);
                this.btn_jp.gotoAndStop(1);
                this.btn_en.gotoAndStop(0);
				GameMain.instance.mc_if.gotoAndStop(1);
				GameMain.instance.mc_icon.movieclip.gotoAndStop(1);
            }
            return;
        }

        public disp(param1:boolean) : void{
            var _loc_2:any = undefined;
            this.mc.visible = param1;
            if (param1){
                _loc_2 = GameMain.instance.numChildren;
				GameMain.instance.setChildIndex(this.mc, (_loc_2 - 1));
            }
            return;
        }

    }
}