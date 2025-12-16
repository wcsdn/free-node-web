
module egret {

	export class BtnBonus extends  egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        str:string;
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
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_focus.visible = false;
            var _loc_3:any = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
            this.mc.gotoAndStop(0);
            this.active_flg = false;
			this.mc_num =GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.main.addChild(this.mc_num);
            this.str = "?";
            this.txt.text = this.str;
        }

        onOver(event:egret.TouchEvent) : void{
            this.mc_focus.visible = true;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
        }

        onDown(event:egret.TouchEvent) : void{
            var _loc_2:any = undefined;
            var _loc_3:any = undefined;
            var _loc_4:Array<any> = null;
            var _loc_5:any = undefined;
            if (this.active_flg){
                switch(this.mc.name){
                    case "n1":{
						GameMain.instance.life_max  += 20;
                        break;
                    }
                    case "n2":{
						GameMain.instance.rpe  *= 2;
                        break;
                    }
                    case "n3":{
						GameMain.instance.act_max  += 20;
                        break;
                    }
                    case "n4":{
                        _loc_2 = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
                        _loc_3 = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
                        _loc_4 = [];
                        _loc_5 = 1;
                        while (_loc_5 < GameMain.instance.lv){
                            
                            _loc_4.push(["GOLD", 200]);
                            _loc_5 = _loc_5 + 1;
                        }
						GameMain.instance.setItem(_loc_4, _loc_2, _loc_3);
                        break;
                    }
                    case "n5":{
						GameMain.instance.atk_max = GameMain.instance.atk_max * 2;
                        break;
                    }
                    default:{
                        break;
                    }
                }
				GameMain.instance.disp();
                this.disable();
            }
            return;
        }

        public enable() : void{
            switch(this.mc.name){
                case "n1":{
                    if (GameMain.instance.jp){
                        this.str = "体力\n+20";
                    }
                    else{
                        this.str = "LIFE\n+20";
                    }
                    break;
                }
                case "n2":{
                    if (GameMain.instance.jp){
                        this.str = "回復\nx2";
                    }
                    else{
                        this.str = "RCV.\nx2";
                    }
                    break;
                }
                case "n3":{
                    if (GameMain.instance.jp){
                        this.str = "行動\n+20";
                    }
                    else{
                        this.str = "ACT.\n+20";
                    }
                    break;
                }
                case "n4":{
                    this.str = "$200\nxLv.";
                    break;
                }
                case "n5":{
                    if (GameMain.instance.jp){
                        this.str = "攻撃\nx2";
                    }
                    else{
                        this.str = "ATK.\nx2";
                    }
                    break;
                }
                default:{
                    break;
                }
            }
            this.txt.text = this.str;
            this.active_flg = true;
            this.mc.gotoAndStop(1);
            return;
        }

        public disable() : void{
            this.active_flg = false;
            this.mc.buttonMode = false;
            this.mc.gotoAndStop(2);
            this.mc_num.gotoAndStop(1);
            this.txt.text = this.str;
            return;
        }

    }
}