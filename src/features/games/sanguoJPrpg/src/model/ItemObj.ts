
module egret {

	export class ItemObj extends egret.DisplayObjectContainer{
       public main:any;
	   public  mc:any;
	   public px:number;
	   public py:number;
	   public ax:number;
	   public ay:number;
	   public landing_y:number;
	   public val:number = 0;
	   public _state:string;
	   public stay_cnt:number = 0;
	   public kind:string;
	   public tx:number;
	   public ty:number;

        public constructor(param1, param2, param3, param4, param5){
			super();
            this.main = param1;
            this.mc =GameMain.instance.getMcByName("mc_ItmMC"); 
            this.main.addChild(this.mc);
            this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onOver, this);
            this.px = param2;
            this.py = param3;
            this.mc.x = this.px;
            this.mc.y = this.py;
            this.val = param5;
            this.kind = param4;
            switch(this.kind){
                case "GOLD":{
                    this.mc.gotoAndStop(0);
                    this.mc.getChildByName("txt_v").text = "$" + this.val;
                    this.tx = 90;
                    this.ty = 6;
                    break;
                }
                case "EXP":{
                    this.tx = 40;
                    this.ty = 25;
                    this.mc.gotoAndStop(1);
                    this.mc.getChildByName("txt_v").text = this.val.toString();
                    break;
                }
                case "KEY":{
                    this.tx = 150;
                    this.ty = 6;
                    this.mc.gotoAndStop(2);
                    break;
                }
                case "KEY2":{
                    this.tx = 195;
                    this.ty = 6;
                    this.mc.gotoAndStop(3);
                    break;
                }
                case "NEKO":{
                    this.tx = 300 + this.val * 10;
                    this.ty = 6;
                    this.mc.gotoAndStop(4 + this.val);
                    break;
                }
                default:{
                    break;
                }
            }
            var _loc_6:number = Math.random() * 40 + 70;
            var _loc_7:number = 20;
            this.ax = Math.cos(_loc_6 * Math.PI / 180) * _loc_7;
            this.ay = Math.sin(_loc_6 * Math.PI / 180) * _loc_7;
            this.landing_y = this.py + Math.abs(this.ax) + _loc_6 % 10;
            this._state = "in";
            this.mc.buttonMode = true;
            return;
        }

        private onOver(event:egret.TouchEvent) : void{
            if (this._state == "stay" || this._state == "stay2" || this._state == "stay3"){
                this._state = "move";
            }
            else if (this._state == "in"){
                if (this.ay > 0){
                    this._state = "move";
                }
            }
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_2:number = 0;
            var _loc_3:number = 0;
            switch(this._state){
                case "in":{
                    this.px = this.px + this.ax;
                    this.py = this.py + this.ay;
                    if (this.py > this.landing_y){
                        this.py = this.landing_y;
                        this.ay = (-this.ay) * 0.5;
                        this.ax = this.ax * 0.5;
                        if (this.ay > -1){
                            this.stay_cnt = 30;
                            this._state = "stay";
                        }
                    }
                    if (this.px < 10){
                        this.px = 10;
                        this.ax = -this.ax;
                    }
                    if (this.px > 750){
                        this.px = 750;
                        this.ax = -this.ax;
                    }
                    var _loc_5:number = this.ay + 1;
                    this.ay = _loc_5;
                    this.mc.x = this.px;
                    this.mc.y = this.py;
                    break;
                }
                case "stay":{
                    this.stay_cnt = this.stay_cnt - 1;
                    if (--this.stay_cnt == 0){
                        if (this.kind == "KEY" || this.kind == "KEY2" || this.kind == "NEKO"){
                            this._state = "stay3";
                        }
                        else{
                            this._state = "stay2";
                        }
                    }
                    break;
                }
                case "stay2":{
                    this.mc.visible = this.stay_cnt % 2;
                    var _loc_5:number = this.stay_cnt + 1;
                    this.stay_cnt = _loc_5;
                    if (this.stay_cnt == 30){
                        this.mc.visible = false;
                        this._state = "standby";
						GameMain.instance.removeChild(this.mc);
                        this.mc = null;
						GameMain.instance.clearItemObj(this);
                    }
                    break;
                }
                case "move":{
                    _loc_2 = (this.tx - this.px) / 3;
                    _loc_3 = (this.ty - this.py) / 6;
                    this.px = this.px + _loc_2;
                    this.py = this.py + _loc_3;
                    if (Math.abs(_loc_2) < 1 && Math.abs(_loc_3) < 1){
                        this._state = "standby";
                        this.mc.visible = false;
						GameMain.instance.addParam(this.kind, this.val);
                    }
                    this.mc.x = this.px;
                    this.mc.y = this.py;
                    break;
                }
            }
            return;
        }

    }
}