
module egret {

	export class BtnAddP extends  egret.DisplayObjectContainer{
        main:any;
        mc:any;
        kind:string;
        flg:boolean;

        public constructor(param1, param2, param3) {
			super();
            this.main = param1;
            this.mc = param2;
            this.kind = param3;
            this.mc.gotoAndStop(0);
            this.mc.touchEnabled = true;
            this.mc.addEventListener(TouchEvent.TOUCH_END, this.onUp, this);
            this.mc.addEventListener(TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(TouchEvent.TOUCH_OUT, this.onOut, this);
            this.flg = false;
            return;
        }

        private onUp(event:TouchEvent) : void{
            var _loc_2:any = undefined;
            if (this.flg){
                switch(this.kind){
                    case "life":{
						GameMain.instance.life++;
						GameMain.instance.life_max ++;
						GameMain.instance.setMessage("ADD_LIFE");
                        break;
                    }
                    case "act":{

						GameMain.instance.act++;
						GameMain.instance.act_max ++;
						GameMain.instance.setMessage("ADD_ACT");
                        break;
                    }
                    case "rpe":{
						GameMain.instance.rpe ++;
						GameMain.instance.setMessage("ADD_RPE");
                        break;
                    }
                    case "atk":{
                        _loc_2 = parseInt(""+(Math.random() * 3 + 1));
						GameMain.instance.atk = GameMain.instance.atk + _loc_2;
						GameMain.instance.atk_max = GameMain.instance.atk_max + _loc_2;
						GameMain.instance.setMessage("ADD_STR", _loc_2);
                        break;
                    }
                    case "def":{
                        _loc_2 = parseInt(""+(Math.random() * 3 + 1));
						GameMain.instance.def = GameMain.instance.def + _loc_2;
						GameMain.instance.def_max = GameMain.instance.def_max + _loc_2;
						GameMain.instance.setMessage("ADD_DEF", _loc_2);
                        break;
                    }
                    default:{
                        break;
                    }
                }
				GameMain.instance.addAddP(-1);
            }
            return;
        }

        private onOver(event:TouchEvent) : void{
            if (this.flg){
                this.mc.gotoAndStop(2);
            }
            return;
        }

        private onOut(event:TouchEvent) : void{
            if (this.flg){
                this.mc.gotoAndStop(1);
            }
            else{
                this.mc.gotoAndStop(0);
            }
            return;
        }

        public setDisp(param1:boolean) : void{
            this.flg = param1;
            if (this.flg){
                this.mc.gotoAndStop(1);
                this.mc.buttonMode = true;
            }
            else{
                this.mc.gotoAndStop(0);
                this.mc.buttonMode = false;
            }
            return;
        }

    }
}