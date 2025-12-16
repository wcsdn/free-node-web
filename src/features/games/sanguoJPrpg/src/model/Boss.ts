
module egret {

	export class Boss extends DisplayObjectContainer{
        mc:any;
        n:number = 0;
        main:any;
        life:number;
        life_max:number = 0;
        param:any;
        _state:string;
        cnt:number = 0;
        nw:number;
        mc_num:any;
        mc_lock:any;
        lock_flg:boolean;
        m:number;
        mes:any;
        key_cnt:number = 0;
        clear_time:string;

        public constructor(param1, param2, param3:number = 0){
			super();
            this.main = param1;
            this.n = param3;
            this.mc = param2;
            this.mc.touchEnabled =true;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);
            this.mc.getChildByName("mc_focus").visible = false;
			GameMain.instance.lock1_cnt++;
            this.life_max = 5 * 48;
            this.life = this.life_max;
            this.cnt = 0;
            this.nw = 0;
            this._state = "lock";
			this.mc_num = GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
			this.mc_num.stop();
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.mc_num.getChildByName("txt").touchEnabled = false;
            (<egret.TextField>this.mc_num.getChildByName("txt")).text = this.life + "/" + this.life_max;
            this.mc_num.visible = false;
            this.main.addChild(this.mc_num);
            this.m = this.mc.width * this.mc.height;
            this.key_cnt = parseInt(""+this.m / 1000) % 4 + 1;
            this.mc.getChildByName("mc_bar").visible = false;
            return;
        }

        public enable() : void{
            this.mc_num.visible = true;
            this.mc.getChildByName("mc_bar").visible = true;
            this._state = "stay";
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_3:any = undefined;
            var _loc_4:any = undefined;
            var _loc_5:any = undefined;
            switch(this._state){
                case "stay":{
                    this.life = this.life + ((this.life_max - this.life) * 0.002 + 0.001);
                    if (this.life > this.life_max){
                        this.life = this.life_max;
                    }
                    break;
                }
                case "turn":{
                    this.cnt ++;
                    if (this.cnt == 15){
                        _loc_3 = this.mc.height;
                        _loc_4 = this.mc.width;
                        _loc_5 = 100 - this.life / 4;
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
            var _loc_2:any = -(this.life_max - this.life);
            this.nw = this.nw + (_loc_2 - this.nw) / 2;
            this.mc.getChildByName("mc_bar").x = this.nw;
            (<egret.TextField>this.mc_num.getChildByName("txt")).text = parseInt(this.life+"") + "/" + this.life_max;
            return;
        }

        onOver(event:egret.TouchEvent) : void{
            if (this._state == "stay"){
                this.mc.getChildByName("mc_focus").visible = true;
            }
            return;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc.getChildByName("mc_focus").visible = false;
            return;
        }

        onDown(event:egret.TouchEvent) : void{
            if (GameMain.instance._state != "standby"){
                return;
            }
            if (this._state == "end"){
				GameMain.instance.setTweet(this.clear_time);
                return;
            }
            if (GameMain.instance.life <= 0 || this.life <= 0){
                return;
            }
            this.attack();
            return;
        }

        private attack() : void{
            var _loc_3:any = undefined;
            var _loc_4:number = 0;
            var _loc_5:any = undefined;
            var _loc_6:any = undefined;
            var _loc_7:any = undefined;
            var _loc_8:any = undefined;
            var _loc_9:any = undefined;
            var _loc_10:any = undefined;
            var _loc_1:any = 200;
            var _loc_2:any = parseInt(""+(GameMain.instance.atk - _loc_1)) * 0.2;
            if (_loc_2 < 0){
                _loc_2 = 1;
            }
            this.life = this.life - _loc_2;
			GameMain.instance.setMessage("ATK", _loc_2);
            if (this.life < 0){
                this.life = 0;
				GameMain.instance.setMessage("WIN");
            }
            if (this.life == 0){
                this._state = "end";
                this.life = 0;
                _loc_3 = [];
                _loc_5 = 10000;
                _loc_6 = 9999;
                _loc_7 = _loc_5 / 10;
                _loc_8 = Math.floor(_loc_7 / 1000);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    _loc_3.push(["GOLD", 1000]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 1000 / 100);
                _loc_4 = 0;
                while (_loc_4 < _loc_8) {
                    _loc_3.push(["GOLD", 100]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 100 / 50);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    
                    _loc_3.push(["GOLD", 50]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 50 / 10);
                _loc_4 = 0;
                while (_loc_4 < _loc_8) {
                    _loc_3.push(["GOLD", 10]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_5 % 10);
                if (_loc_8 > 0){
                    _loc_3.push(["GOLD", _loc_8]);
                }
                _loc_7 = _loc_6 / 15;
                _loc_8 = Math.floor(_loc_7 / 1000);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    _loc_3.push(["EXP", 1000]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 1000 / 100);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    _loc_3.push(["EXP", 100]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 100 / 50);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    _loc_3.push(["EXP", 50]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_7 % 50 / 10);
                _loc_4 = 0;
                while (_loc_4 < _loc_8){
                    _loc_3.push(["EXP", 10]);
                    _loc_4++;
                }
                _loc_8 = Math.floor(_loc_6 % 10);
                if (_loc_8 > 0){
                    _loc_3.push(["EXP", _loc_8]);
                }
                _loc_9 = this.mc.x + 24;
                _loc_10 = this.mc.y + 24;
                this.mc.getChildByName("mc_focus").visible = false;
                this.mc.gotoAndStop(1);
                this.mc_num.gotoAndStop(1);
                _loc_3.push(["NEKO", 8]);
				GameMain.instance.setItem(_loc_3, _loc_9, _loc_10);
                this.clear_time = GameMain.instance.getTimerStr();
				GameMain.instance.setTweet(this.clear_time);
				GameMain.instance.setSecret(6);
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