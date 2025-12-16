
module egret {

	export class ButtonObject2 extends  egret.DisplayObjectContainer{
       private target_object:any;
	   private _state:string = "out";
	   private ev:any;
	   private main:any;
	   private disable_flg:boolean;
        public constructor(param1, param2, param3 = null){
			super();
            this.main = param3;
            this.target_object = param1;
            this.target_object.gotoAndStop("OUT");
            this.target_object.touchEnabled= true;
           // this.target_object.addEventListener(egret.TouchEvent.TOUCH_END, param2,this);
            this.target_object.addEventListener(egret.TouchEvent.TOUCH_OVER, this.onMouseOver, this);
            this.target_object.addEventListener(egret.TouchEvent.TOUCH_OUT, this.onMouseOut, this);
            this.target_object.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onMouseDown, this);
            this.ev = param2;
        }

        public release() : void{
            this.target_object.removeEventListener(egret.TouchEvent.TOUCH_OVER, this.onMouseOver, this);
            this.target_object.removeEventListener(egret.TouchEvent.TOUCH_OUT, this.onMouseOut, this);
            this.target_object.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onMouseDown, this);
            //this.target_object.removeEventListener(egret.TouchEvent.TOUCH_END, this.ev, this);
        }

        public disable() : void{
            this.target_object.gotoAndStop("DISABLE");
            this.disable_flg = true;
        }

        public enable() : void{
            this.target_object.gotoAndStop("OUT");
            this.disable_flg = false;
        }

        private onMouseOver(event:egret.TouchEvent) : void{
            if (this.disable_flg)
                return;
            if (event.touchDown){
                if (this.main != null && this._state != "down"){
					this._state = "down";
					this.target_object.gotoAndStop("DOWN");
                }
            }
            else{
                this._state = "over";
                this.target_object.gotoAndStop("OVER");
            }
            return;
        }

        private onMouseOut(event:egret.TouchEvent) : void{
            if (this.disable_flg)
                return;
            if (this.main != null && this._state == "down"){
				this._state = "out";
				this.target_object.gotoAndStop("OUT");
            }
        }


        private onMouseDown(event:egret.TouchEvent) : void{
            if (this.disable_flg)
                return;
            if (this.main != null && this._state == "over"){
				this._state = "down";
				this.target_object.gotoAndStop("DOWN");
            }
        }

    }
}