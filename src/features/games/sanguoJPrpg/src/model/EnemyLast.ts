
module egret {

	export class EnemyLast extends egret.DisplayObjectContainer{
       private mc:any;
	   private  n:number = 0;
	   private  main:any;
	   private  life:number;
	   private   life_max:number = 0;
	   private  param:any;
	   private  _state:string;
	   private  cnt:number = 0;
	   private  nw:number;
	   private  mc_num:any;
	   private  mc_lock:any;
	   private  lock_flg:boolean;
	   private  m:any;
	   private  mes:any;
	   private  key_cnt:number = 0;
        private mc_focus:any;
        private mc_bar:any;
        private txt:any;
        public constructor(param1, param2, param3) {
			super();
            this.main = param1;
            this.n = param3;
            this.mc = param2;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);
            this.mc.buttonMode = true;
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_bar = this.mc.getChildByName("mc_bar");
            this.mc_focus.visible = false;
            this.life_max = 9999;
            this.life = this.life_max;
            this.cnt = 0;
            this.nw = 200;
            this._state = "stay";
			this.mc_num =GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text = this.life + "/" + this.life_max;
            this.main.addChild(this.mc_num);
            this.mc_num.visible = false;
            this.mc.visible = false;
            return;
        }

        public enable() : void{
			GameMain.instance.ek2.g.disable(); 
            this.mc.visible = true;
            this.mc_num.visible = true;
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_3:any = undefined;
            switch(this._state){
                case "stay":{
                    this.life = this.life + GameMain.instance.rpe * 0.03;
                    if (this.life > this.life_max){
                        this.life = this.life_max;
                    }
                    break;
                }
                case "turn":{
                    this.cnt += 1;
                    if (this.cnt == 15){
                        _loc_3 = 5 + (this.life_max - this.life) / 200 + Math.random() * 20;
						GameMain.instance.setDamage(_loc_3);
                        this._state = "stay";
						GameMain.instance._state = "standby";
                    }
                    break;
                }
                default:{
                    break;
                }
            }
            var _loc_2:any = 752 * (this.life / this.life_max);
            this.nw = this.nw + (_loc_2 - this.nw) / 2;
            this.mc_bar.width = this.nw;
			this.mc_num.stop();
            this.txt.text = parseInt(this.life+"") + "/" + this.life_max;
            return;
        }

        onOver(event:egret.TouchEvent) : void{
            if (this._state == "stay")
                this.mc_focus.visible = true;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
            return;
        }

        onDown(event:egret.TouchEvent) : void{
            if (GameMain.instance._state != "standby")//待命地; 
                return;
            if (GameMain.instance.life <= 0 || this.life <= 0)
                return;
            var _loc_2:any = GameMain.instance.getMcHeight(this.mc) / 10;
            var _loc_3:any = GameMain.instance.getMcWidth(this.mc) / 10;
            var _loc_4:any = _loc_2 * _loc_2;
            var _loc_5:any = parseInt(""+GameMain.instance.atk * (1 - _loc_4 / 2600) * 0.5);
            if (_loc_2 > _loc_3){
                _loc_5 = parseInt(""+(GameMain.instance.atk * 0.25 + Math.random() * 10 - 5));
            }
            if (_loc_5 < 0){
                _loc_5 = 1;
            }
            this.life = this.life - _loc_5;
			GameMain.instance.setMessage("ATK", _loc_5);
            if (this.life < 0){
                this.life = 0;
                this.mc.getChildByName("mc_barBG").gotoAndStop(1);
                this.mc_focus.visible = false;
                this.mc.buttonMode = false;
                this.mc_num.gotoAndStop(1);
                this.txt.touchEnabled = false;
				GameMain.instance.setMessage("WIN");
            }
            if (this.life == 0) {
                this._state = "end";
                this.life = 0;
            }
            if (this.life > 0){
                this.cnt = 0;
                this._state = "turn";
				GameMain.instance._state = "turn";
            }
            return;
        }

    }
}