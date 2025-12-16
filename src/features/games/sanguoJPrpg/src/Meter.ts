
module egret {

	export class Meter extends egret.DisplayObjectContainer{
        main:GameMain;
        mc:any;
        mc_max:any;
        txt:any;
        kind:any;
        w:number;
        target_n:number;
        n:number;
        n_max:number;
        sx:any;
        WIDTH_MAX:number = 200;

        public constructor(param1, param2) {
			super();
            this.main = param1;
            this.kind = param2;
            this.w = 0;
            this.n = 0;
            this.target_n = 0;
            this.n_max = 0;
            this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);

            switch(this.kind) {
                case "EXP":  {
                    this.txt = GameMain.instance.mc_if.getChildByName("txt_exp");
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_exp");
                    this.mc_max = GameMain.instance.mc_if.getChildByName("mc_expMax");
                    break;
                }
                case "LIFE": {
                    this.txt = GameMain.instance.mc_if.getChildByName("txt_life");
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_life");
                    this.mc_max = GameMain.instance.mc_if.getChildByName("mc_lifeMax");
                    this.sx = 35;
                    break;
                }
                case "ACT": {
                    this.txt = GameMain.instance.mc_if.getChildByName("txt_act");
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_act");
                    this.mc_max = GameMain.instance.mc_if.getChildByName("mc_actMax");
                    this.sx = 35;
                    break;
                }
                case "COMBO": {
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_bonus");
                    break;
                }
                case "ATK":{
                    this.txt = GameMain.instance.mc_if.getChildByName("txt_atk");
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_atk");
                    this.mc_max = GameMain.instance.mc_if.getChildByName("mc_atkMax");
                    this.sx = 290;
                    break;
                }
                case "DEF":{
                    this.txt = GameMain.instance.mc_if.getChildByName("txt_def");
                    this.mc = GameMain.instance.mc_if.getChildByName("mc_def");
                    this.mc_max = GameMain.instance.mc_if.getChildByName("mc_defMax");
                    this.sx = 290;
                    break;
                }
                default:{
                    break;
                }
            }
            return;
        }

        public setV(param1, param2) : void{
            this.target_n = param1;
            this.n_max = param2;
            if (this.kind == "EXP"){
                if (this.target_n < this.n){
                    this.n = 0;
                }
            }
            if (this.target_n == 0){
                this.n = 0;
            }
            return;
        }

        private run(event:egret.Event) : void{
            var _loc_2:number = 0;
            var _loc_3:number = 0;
            switch(this.kind){
                case "LIFE":
                case "ACT":
                case "ATK":
                case "DEF":{
                    _loc_2 = (this.target_n - this.n) / 10;
                    this.n = this.n + _loc_2;
                    this.w = this.n_max * (this.n / this.n_max);
                    if (this.w > this.WIDTH_MAX){
                        this.w = this.WIDTH_MAX;
                    }
                   // this.mc.width = this.w;

                    this.mc.scaleX =this.w/this.mc.width;
                    this.txt.text = Math.round(this.n) + "/" + this.n_max;
                    _loc_3 = this.sx + this.n_max;
                    if (_loc_3 > this.sx + this.WIDTH_MAX){
                        _loc_3 = this.sx + this.WIDTH_MAX;
                    }
                    this.mc_max.x = _loc_3;
                    break;
                }
                case "EXP":{
                    _loc_2 = (this.target_n - this.n) / 10;
                    this.n = this.n + _loc_2;
                    this.w = 200 * (this.n / this.n_max);
                    //this.mc.width = this.w;
                    this.mc.scaleX =this.w/this.mc.width;
                    this.txt.text = GameMain.instance.exp_total + "/" + GameMain.instance.exp_total_max;
                    break;
                }
                case "COMBO":{
                    if (this.target_n - this.n < 0){
                        _loc_2 = (this.target_n - this.n) / 5;
                    }
                    else{
                        _loc_2 = (this.target_n - this.n) / 10;
                    }
                    this.n = this.n + _loc_2;
                    this.w = 752 * (this.n / this.n_max);
                    if (this.w >= 752) //宽度
                    {
                        this.w = 752;
                        this.mc.gotoAndStop(1);
                    }
                    else{
                        this.mc.gotoAndStop(0);
                    }
                    //this.mc.width = this.w;
                    this.mc.scaleX =this.w/this.mc.width;
                    break;
                }
                default:{
                    break;
                }
            }
            return;
        }

    }
}