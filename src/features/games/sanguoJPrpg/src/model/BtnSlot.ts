
module egret {

	export class BtnSlot extends egret.DisplayObjectContainer{
        mc:any;
        main:any;
        _state:string;
        cnt:number = 0;
        mc_num:any;
        price:number = 0;
        addP:number = 0;
        sx:any;
        sy:any;
        s_list:any;
        s_idx:number = 0;
        public str:any;
        private mc_focus:any;
        private txt:any;
        public constructor(param1, param2){
			super();
            this.s_list = [0, 0, 0];
            this.str = [["$", "$", "$", "@", "@", "7", "*", "*"], ["$", "$", "$", "@", "@", "7", "*", "$"], ["$", "@", "7", "*", "$", "@", "7", "*"]];
            this.main = param1;
            this.mc = param2;
            this.mc.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onDown, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onOver, this);
            this.mc.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onOut, this);
            this.addEventListener(Event.ENTER_FRAME, this.run, this);
            this.mc_focus = this.mc.getChildByName("mc_focus");
            this.mc_focus.visible = false;
            this.price = 10;
			this.mc_num =GameMain.instance.getMcByName("mc_Num");
            this.mc_num.x = this.mc.x;
            this.mc_num.y = this.mc.y;
            this.mc_num.touchEnabled = false;
            this.txt = this.mc_num.getChildByName("txt");
            this.txt.touchEnabled = false;
            this.txt.text = "$" + this.price;
            this.main.addChild(this.mc_num);
            this.sx = this.mc.x + this.mc.width / 2;
            this.sy = this.mc.y + this.mc.height / 2;
            this._state = "lock";
            this.mc.getChildByName("mc_e").visible = false;
            this.mc_num.visible = false;
            this.mc.getChildByName("s0").visible = false;
            this.mc.getChildByName("s1").visible = false;
            this.mc.getChildByName("s2").visible = false;
            return;
        }

        public entry() : void {
            this.mc.getChildByName("mc_e").visible = true;
            this.mc.buttonMode = true;
            this.mc_num.visible = true;
            this.mc.getChildByName("s0").visible = true;
            this.mc.getChildByName("s1").visible = true;
            this.mc.getChildByName("s2").visible = true;
            this._state = "stay";
        }

        onOver(event:egret.TouchEvent) : void{
            this.mc_focus.visible = true;
        }

        onOut(event:egret.TouchEvent) : void{
            this.mc_focus.visible = false;
        }

        onDown(event:egret.TouchEvent) : void{
            if (GameMain.instance._state != "standby")
                return;
            switch(this._state){
                case "stay":{
                    if (GameMain.instance.gold >= this.price){
						GameMain.instance.gold -= this.price;
						GameMain.instance.disp();
                        this.s_idx = 0;
                        this.s_list = [0, 0, 0];
                        this._state = "push";
                    }
                    break;
                }
                case "push":{
					this.s_idx++;
                    if (this.s_idx == 3){
                        this._state = "result";
                    }
                    break;
                }
            }
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_2:Array<any> = null;
            var _loc_3:string = null;
            var _loc_4:any = undefined;
            switch(this._state){
                case "stay":{
                    break;
                }
                case "push":{
					//var _loc_5:String = this;
					//_loc_5.cnt = cnt + 1;
                    this.cnt ++;
                    if (this.cnt % 2){
                        _loc_4 = this.s_idx;
                        while (_loc_4 < 3){
                            this.s_list[_loc_4] = parseInt(""+Math.random() * 8);
                            this.mc["s" + _loc_4].text = this.str[_loc_4][this.s_list[_loc_4]];
                            _loc_4 = _loc_4 + 1;
                        }
                    }
                    break;
                }
                case "result":{
                    _loc_2 = [];
                    _loc_3 = this.mc.s0.text;
                    if (_loc_3 == this.mc.s1.text && _loc_3 == this.mc.s2.text){
                        switch(_loc_3){
                            case "$":{
                                _loc_4 = 0;
                                while (_loc_4 < 8){
                                    _loc_2.push(["GOLD", 200]);
                                    _loc_4 = _loc_4 + 1;
                                }
								GameMain.instance.setItem(_loc_2, this.sx, this.sy);
                                break;
                            }
                            case "@":{
                                _loc_4 = 0;
                                while (_loc_4 < 10){
                                    _loc_2.push(["EXP", 20]);
                                    _loc_4 = _loc_4 + 1;
                                }
								GameMain.instance.setItem(_loc_2, this.sx, this.sy);
                                break;
                            }
                            case "7":{
                                _loc_4 = 0;
                                while (_loc_4 < 20){
                                    
                                    _loc_2.push(["GOLD", 777]);
                                    _loc_4 = _loc_4 + 1;
                                }
								GameMain.instance.setItem(_loc_2, this.sx, this.sy);
                                break;
                            }
                            case "*":{
                                _loc_4 = 0;
                                while (_loc_4 < 12){
                                    
                                    _loc_2.push(["GOLD", 800]);
                                    _loc_4 = _loc_4 + 1;
                                }
								GameMain.instance.setItem(_loc_2, this.sx, this.sy);
                                break;
                            }
                            default:{
                                break;
                                break;
                            }
                        }
                        ;
                    }
                    this._state = "stay";
                }
                default:{
                    break;
                }
            }
            return;
        }

    }
}