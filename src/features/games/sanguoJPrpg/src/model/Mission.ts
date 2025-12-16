
module egret {

	export class Mission extends egret.DisplayObjectContainer{
      	public mc:any;
		public n:number = 0;
		public main:any;
		public life:number;
		public life_max:number = 0;
		public _state:string;
		public cnt:number = 0;
		public  nw:number;
		public  sx:number;
		public  sy:number;
		public  cost:number = 0;
		public  gold:number;
		public  exp:number;
		public  mc_num:any;
		public  complete_flg:any = false;
		public  m: number;
		public  mc_lock:any;
		public  lock_flg:boolean;
        private mc_focus:any;
        private mc_bar:any;
        private txt:any;
        public constructor(param1, param2, param3)  {
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
            this.mc_num = GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x+3;
            this.mc_num.y = this.mc.y;
            this.mc.touchEnabled =true;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
			this.txt.touchEnabled = false;
            this.main.addChild(this.mc_num);
            this.life_max = GameMain.instance.getMcWidth(this.mc);
            this.sx = this.mc.x + GameMain.instance.getMcWidth(this.mc) / 2;
            this.sy = this.mc.y + GameMain.instance.getMcHeight(this.mc) / 2;
            this.cost = parseInt(""+GameMain.instance.getMcHeight(this.mc) / 5);
            this.m = GameMain.instance.getMcWidth(this.mc) * GameMain.instance.getMcHeight(this.mc);
            if (this.m > 1000){
                this.mc_lock = GameMain.instance.getMcByName("mc_Key"); 
				this.mc_lock.touchEnabled =false;
                this.mc_lock.x = this.sx;
                this.mc_lock.y = this.sy;
                this.main.addChild(this.mc_lock);
                this.lock_flg = true;
				GameMain.instance.lock1_cnt ++;
				
            }
            else
                this.lock_flg = false;
            this.gold = parseInt(""+this.m * 0.03 * (1 + Math.random()) * 2);
            this.exp = parseInt(""+this.m * 0.1 * (1 + Math.random()) * 2);
            this.life = 0;
            this.cnt = 0;
            this.nw = 0;
            this.cost = this.m * 0.01;
			GameMain.instance.total_m_num ++;
            this._state = "stay";
        }

        private run(event:egret.Event) : void{
            switch(this._state)  {
                case "stay":{
                    break;
                }

            }
            var num:number = 200 * (this.life / this.life_max);
            this.nw = this.nw + (num - this.nw) / 2;
            this.mc_bar.width = this.nw;
            num = (this.life / this.life_max)
            this.mc_bar.scaleX = num;
            this.txt.text = parseInt(""+100 * (this.life / this.life_max)) + "%";
            return;
        }

		public  onOver(event:egret.TouchEvent) : void {
            if (this._state == "stay")
                this.mc_focus.visible = true;
        }

		public   onOut(event:egret.TouchEvent) : void{
            if (this._state == "stay")
                this.mc_focus.visible = false;
        }

		public    onDown(event:egret.TouchEvent) : void {
            if (this.lock_flg){
                if (GameMain.instance.useKey(1)) {
                    this.lock_flg = false;
					GameMain.instance.setMessage("M_UNLOCK");
                    this.mc_lock.visible = false;
                    return;
                }
				GameMain.instance.setMessage("LOCK");
                return;
            }
            if (GameMain.instance.act >= this.cost) {
				GameMain.instance.act -= this.cost;
                if (!this.complete_flg) {
                    this.life = this.life + (10 + Math.random() * 3);
                    if (this.life > this.life_max){
                        this.life = this.life_max;
						GameMain.instance.addAddP(1);
						GameMain.instance.setMessage("M_COMP");
                        this.gold = this.gold * 1.5;
                        this.exp = this.exp * 1.5;
                        this.complete_flg = true;
						GameMain.instance.m_comp_cnt ++;
                        if (GameMain.instance.m_comp_cnt == GameMain.instance.total_m_num){//总任务数
							GameMain.instance.setSecret(1);
                        }
                        this.mc_bar.gotoAndStop(1);
                        this.mc_num.gotoAndStop(1);
                        this.txt.touchEnabled = false;
                    }
                    else{
						GameMain.instance.setMessage("M_OK");
                    }
                }
                else{
                    this.exp = 0;
                    this.gold = parseInt("" + (this.m / 10 + Math.random() * this.m / 100));
					GameMain.instance.setMessage("M_OK2");
                }
                this.setItems();
				GameMain.instance.disp();
            }
            else{
				GameMain.instance.setMessage("M_NG");
            }
        }

		public   setItems() : void{
            var randomCount:number = 0;
            var _loc_1:Array<any> = [];
            var _loc_3:any = this.gold / 10;
            var _loc_4:any = Math.floor(_loc_3 / 100);
            randomCount = 0;
            while (randomCount < _loc_4){
                _loc_1.push(["GOLD", 100]);
                randomCount++;
            }
            _loc_4 = Math.floor(_loc_3 % 100 / 50);
            randomCount = 0;
            while (randomCount < _loc_4){
                
                _loc_1.push(["GOLD", 50]);
                randomCount++;
            }
            _loc_4 = Math.floor(_loc_3 % 50 / 10);
            randomCount = 0;
            while (randomCount < _loc_4){
                
                _loc_1.push(["GOLD", 10]);
                randomCount++;
            }
            _loc_4 = Math.floor(this.gold % 10);
            if (_loc_4 > 0){
                _loc_1.push(["GOLD", _loc_4]);
            }
            _loc_3 = this.exp / 10;
            _loc_4 = Math.floor(_loc_3 / 100);
            randomCount = 0;
            while (randomCount < _loc_4){
                
                _loc_1.push(["EXP", 100]);
                randomCount++;
            }
            _loc_4 = Math.floor(_loc_3 % 100 / 50);
            randomCount = 0;
            while (randomCount < _loc_4){
                
                _loc_1.push(["EXP", 50]);
                randomCount++;
            }
            _loc_4 = Math.floor(_loc_3 % 50 / 10);
            randomCount = 0;
            while (randomCount < _loc_4){
                
                _loc_1.push(["EXP", 10]);
                randomCount++;
            }
            _loc_4 = Math.floor(this.exp % 10);
            if (_loc_4 > 0){
                _loc_1.push(["EXP", _loc_4]);
            }
            var _loc_5:any = parseInt(""+Math.random() * 100);
            if (parseInt(""+Math.random() * 100) < 3){
                _loc_1.push(["NEKO", parseInt(""+Math.random() * 8)]);
            }
			GameMain.instance.setItem(_loc_1, this.sx, this.sy);
            return;
        }

    }
}