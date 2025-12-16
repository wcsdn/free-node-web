
module egret {

	export class Enemy extends egret.DisplayObjectContainer{
       private  mc:any;
	   private  n:number = 0;
	   private  main:any;
	   private  life:number;
	   private  life_max:number = 0;
	   private   param:any;
	   private  _state:string;
	   private  cnt:number = 0;
	   private  nw:number;
	   private  mc_num:any;
	   private  mc_lock:any;
	   private  lock_flg:boolean;
	   private  m:number;
	   private  mes:any;
	   private  key_cnt:number = 0;
       private mc_focus:any;
        private mc_barBG:any;
        private mc_bar:any;
        private txt:any;
	  // private shape:egret.Shape = new egret.Shape();
        public constructor(param1, param2, param3){
			super();
            this.main = param1;
            this.n = param3;
            this.mc = param2;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_barBG = this.mc.getChildByName("mc_barBG");
            this.mc_bar = this.mc.getChildByName("mc_bar");
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);
            this.mc.buttonMode = true;
            this.mc_focus.visible = false;
            this.life_max = GameMain.instance.getMcWidth(this.mc);
            this.life = this.life_max;
            this.cnt = 0;
            this.nw = 200;
            this._state = "stay";
			this.mc_num =GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x+3;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text =this.life + "/" + this.life_max;
            this.main.addChild(this.mc_num);
			
			//头像
			
//			this.shape.graphics.beginFill(Math.random() *0xffffff);
//			this.shape.graphics.drawCircle(8,8,8);
//			this.shape.graphics.endFill();
//			this.main.addChild(this.shape);
//			this.shape.x =this.mc.x+GameMain.instance.getMcWidth(this.mc) - this.shape.width;
//			this.shape.y= this.mc.y;
//			this.shape.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCLICK, this);
			
			
            this.m = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
            if (this.m > 1500) {
                this.mc_lock =  GameMain.instance.getMcByName("mc_Key");
                this.mc_lock.x = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
                this.mc_lock.y = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
				this.mc_lock.touchEnabled =false;
                this.main.addChild(this.mc_lock);
                this.lock_flg = true;
				GameMain.instance.lock1_cnt++;
            }
            else
                this.lock_flg = false;
            this.key_cnt = parseInt(""+this.m / 1000) % 4 + 1;
			GameMain.instance.total_e_num ++;
            return;
        }

        public disable() : void {
            this.mc.visible = false;
            this.mc_num.visible = false;
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_3:any = undefined;
            var _loc_4:any = undefined;
            var _loc_5:any = undefined;
            switch(this._state){
                case "stay":{
                    this.life = this.life + ((this.mc.y - 70) * 0.0001 * (this.life_max / 100) + GameMain.instance.rpe * 0.01);
                    if (this.life > this.life_max){
                        this.life = this.life_max;
                    }
                    break;
                }
                case "turn":{
                    this.cnt ++;
                    if (this.cnt == 15){
                        _loc_3 = GameMain.instance.getMcHeight(this.mc);
                        _loc_4 = GameMain.instance.getMcWidth(this.mc);
                        _loc_5 = 20 + (_loc_3 + _loc_4) / 2;
						GameMain.instance.setDamage(_loc_5);
                        this._state = "stay";
						GameMain.instance._state = "standby";
                    }
                    break;
                }
                default:{
                    break;
                }
            }
            var num:any = 200 * (this.life / this.life_max);
            this.nw = this.nw + (num - this.nw) / 2;
            this.mc_bar.width = this.nw;
            num = (this.life / this.life_max)
            this.mc_bar.scaleX = num;
            this.txt.text = parseInt(""+this.life) + "/" + this.life_max;//"兵："+this.life;// int(life) + "/" + life_max;
			
            return;
        }

        onOver(event:egret.TouchEvent) : void{
            if (this._state == "stay"){
                this.mc_focus.visible = true;
            }
            return;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
            return;
        }
		/**
		 *事件点击 
		 * @param e
		 * 
		 */
		public onCLICK(e:egret.Event):void{
			Main.instance.showHoerInfoPanle("也不知道是谁！！"," 估计不是什么好人！！！");
		}
		
        onDown(event:egret.TouchEvent) : void{
            var _loc_6:any = undefined;
            var _loc_7:number = 0;
            var _loc_8:any = undefined;
            var _loc_9:any = undefined;
            var _loc_10:any = undefined;
            var _loc_11:any = undefined;
            var _loc_12:any = undefined;
            var _loc_13:any = undefined;
            var _loc_14:number = 0;
            if (GameMain.instance._state != "standby")
                return;
            if (this.lock_flg){
                if (GameMain.instance.useKey(1)){
                    this.lock_flg = false;
					GameMain.instance.setMessage("UNLOCK_ENEMY");
                    this.mc_lock.visible = false;
                    return;
                }
				GameMain.instance.setMessage("LOCK");
                return;
            }
            if (GameMain.instance.life <= 0 || this.life <= 0){
                return;
            }
            var _loc_2:any = GameMain.instance.getMcHeight(this.mc) / 10;
            var _loc_3:any = GameMain.instance.getMcWidth(this.mc) / 10;
            var _loc_4:any = _loc_2 * _loc_2 + (this.mc.y - 70);
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
                this.mc_num.gotoAndStop(1);
                this.txt.touchEnabled = false;
				GameMain.instance.setMessage("WIN");
            }
            if (this.life == 0){
                this._state = "end";
                this.life = 0;
                _loc_6 = [];
                _loc_8 = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
                _loc_9 = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
                _loc_10 = _loc_8 / 10;
                _loc_11 = Math.floor(_loc_10 / 1000);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["GOLD", 1000]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 1000 / 100);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["GOLD", 100]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 100 / 50);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["GOLD", 50]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 50 / 10);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["GOLD", 10]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_8 % 10);
                if (_loc_11 > 0){
                    _loc_6.push(["GOLD", _loc_11]);
                }
                _loc_10 = _loc_9 / 15;
                _loc_11 = Math.floor(_loc_10 / 1000);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["EXP", 1000]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 1000 / 100);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    _loc_6.push(["EXP", 100]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 100 / 50);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["EXP", 50]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_10 % 50 / 10);
                _loc_7 = 0;
                while (_loc_7 < _loc_11){
                    
                    _loc_6.push(["EXP", 10]);
                    _loc_7++;
                }
                _loc_11 = Math.floor(_loc_9 % 10);
                if (_loc_11 > 0){
                    _loc_6.push(["EXP", _loc_11]);
                }
                _loc_12 = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
                _loc_13 = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
                if (this.mc.name.substr(0, 2) == "ek"){
                    _loc_6.push(["KEY2", 1]);
                }
                _loc_7 = 0;
                while (_loc_7 < this.key_cnt){
                    
                    _loc_6.push(["KEY", 1]);
                    _loc_7++;
                }
                this.mc_barBG.gotoAndStop(1);
                this.mc_focus.visible = false;
                this.mc.buttonMode = false;
                _loc_14 = parseInt(""+Math.random() * 100);
                if (_loc_14 < 25){
                    _loc_6.push(["NEKO", _loc_14 % 8]);
                }
				GameMain.instance.setItem(_loc_6, _loc_12, _loc_13);
				GameMain.instance.e_comp_cnt++;
                if (GameMain.instance.e_comp_cnt == GameMain.instance.total_e_num){
					GameMain.instance.setSecret(2);
                }
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