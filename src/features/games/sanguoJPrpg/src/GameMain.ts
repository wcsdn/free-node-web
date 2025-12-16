
module egret {

	export class GameMain extends egret.DisplayObjectContainer{
		public static  instance:GameMain;

		public movieClip:starlingswf.SwfMovieClip;
		public mc_if:any;//starlingswf.SwfMovieClip;
//		
        
        public mc_rLife:any;
        public mc_reLife:any;
        public mc_icon:any;
//        public var ek0:MovieClip;
        public mc_boss2:any;

        public mc_rAct:any;
        
//        public var ek1:MovieClip;
		public ek2:any;
//        public var ek3:MovieClip;
//        public var ek4:MovieClip;

//        public var ek5:MovieClip;

        public mc_keyShop:any;
		public me_life:any;
		public me_exp:any;
		public me_act:any;
		public me_combo:any;
		public me_atk:any;
		public me_def:any;
		public btn_list:any;
		public mes_list:any;
        public n1:any;
        public n2:any;
        public n3:any;
        public n4:any;
        public n5:any;
        public n6:any;
		public n7:any;
        public life:number;
        public life_max:number;
        public act:number;
        public act_max:number;
        public atk:number;
        public atk_max:number;
        public def:number;
        public def_max:number;
        public exp:number;
        public exp_max:number = 0;
        public lv:number = 0;
        public gold:number = 0;
        public exp_total:number = 0;
        public exp_total_max:number = 0;
        public rpe:number = 0;
        public key:number = 0;
        public key2:number = 0;
        public item_list:Array<any>;
        public add_p:number = 0;

        public start_time:number;
        public combo:number = 0;
        public combo_time:number = 0;
        public _state:string;
        public total_e_num:number = 0;
        public total_m_num:number = 0;
        public secret_list:Array<any>;//探索状态
        public t_list:Array<any>;
        public m_comp_cnt:number = 0;
        public e_comp_cnt:number = 0;
        public i_comp_cnt:number = 0;
        public lock1_cnt:number = 0;//所有的锁头
        public jp:boolean = true;
        public inst:Inst;
        public bonus:number = 100;
        public first_click_flg:boolean;
		public  COMBO_MAX:number = 120;
		public  COMBO_W_TIME:number = 45;
        private dataDic:any={};
		public  MESSAGE:any= {
			UNLOCK_ENEMY:["敵のロックを解除した", "Unlock the enemy", "#FFFFFF"],
			M_UNLOCK:["ミッションのロックを解除した", "Unlock the mission", "#FFFFFF"],
			LOCK:["ロックされています", "Locked", "#888888"], 
			UNLOCK:["ロックを解除", "Unlock", "#FFFFFF"], 
			M_COMP:["ミッション完了!", "Mission completed", "#FF00FF"], 
			M_OK:["ミッション実行>成功", "Run>Success", "#FFFFFF"], 
			M_OK2:["徴収実行>成功", "Collect the money", "#FFFF00"], 
			M_NG:["ミッション実行>失敗:行動不足", "Run>Attempted:Lack of ACT.", "#888888"], 
			M_ALL:["全ミッション完了!", "Completed all mission.", "#FF00FF"], 
			E_ALL:["全敵討伐!", "To subdue all enemies.", "#FF00FF"], 
			I_ALL:["全アイテム購入!", "All items were purchased.", "#FF00FF"], 
			I_UNLOCK:["アイテムのロックを解除した", "Unlock the item", "#FFFFFF"], 
			BUY_KEY:["鍵購入", "Get key", "#66FFFF"], 
			C_MAX:["連続取得達成！", "MAXIMAM COMBO", "#FFFF00"], 
			DAMAGE:["@のダメージを受けた！", "@damage!", "#FF0000"],
			LEVEL_UP:["レベル @ になりました！", "Level @", "#66FF00"], 
			WIN:["敵に勝利しました！", "You win!", "#66FFFF"],
			ATK:["攻撃>敵に @ ダメージを与えた!", "Atk.>@ damage to enemy", "#FF00FF"], 
			NEKOGAMES:["NEKOGAMES完成!", "Complete NEKOGAMES!", "#FF00FF"], 
			ADD_LIFE:["体力が1増加！", "LIFE> +1", "#FFCC00"], 
			ADD_ACT:["行動が1増加！", "ACT.> +1", "#FF00FF"], 
			ADD_RPE:["回復が1増加！", "RCV.> +1", "#00FFFF"], 
			ADD_STR:["攻撃が @ 増加！", "STR.> +@", "#FF6699"], 
			ADD_DEF:["防御が @ 増加！", "DEF.> +@", "#33cc66"], 
			REP_LIFE:["体力回復 > 成功", "REPAIR LIFE", "#66FFFF"], 
			BUY_ATK:["武器を購入>攻撃力 @ UP!", "BUY WEAPON > ATK. @ UP!", "#FF6699"], 
			BUY_DEF:["防具を購入>防御力 @ UP!", "BUY ARMOR > DEF. @ UP!", "#33CC66"], 
			LIMIT:["所有数が上限に達しています", "items have reached the limit", "#FFFFFF"]};
        public constructor(){
			super();
			this.btn_list = [];
			this.mes_list = [];
			this.secret_list = [0, 0, 0, 0, 0, 0, 0, 0];
			this.t_list = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            var str:string ="instance4,776.95,612.95&ek20,166,16&ek23,424,16&m_23,38,30&m_9,74,30&m_27,108,24&ek15,82,38&m_34,48,30&m_33,82,18&m_31,84,36&m_12,40.05,22&m_17,78,16&m_18,54,22&m_16,38,46&m_15,26,92&m_13,36,42&ek2,752.05,72&ek13,126,60&ek16,40,24&m_2,68,14&m_3,68,14&ek14,98,42&ek4,80,30&mc_rAct,51.4,40&m_14,36,16&ek7,36,26&m_35,26,22&ek8,94,44&ek6,36,24&mc_reLife,50,50&ek5,32,31&ek0,40,14&ek3,44,14&m_19,54.5,40.15&m_6,72,24&ek28,36,32&m_4,40,81.95&m_48,132,16&m_38,26,74&m_27,92,22&ek25,144,42&m_49,62.1,41.95&m_7,28,136&m_8,188,20&m_21,74,32&ek9,46,66&m_40,66,46&ek21,226,68&ek24,58,104&ek11,170,14&m_42,144,16&m_10,54,68.6&ek17,178,16&ek19,88,40&ek27,412,52&m_25,72,44&m_54,38,108&m_52,28,162&ek18,36,134&ek1,108,14&n7,66,66&mc_RepairP_15,50,50&n6,288,48&n1,32,32&n5,60,62&n4,48,48&mc_keyShop,48,48&n3,32,30&mc_rLife,51.8,56.55&m_28,28,50&m_51,134,20&m_0,44,14&m_36,106.7,14&ek22,80,16&m_26,40,62&m_1,60.7,14&m_43,74,28&m_44,132,28&ek10,118,14&m_24,83.9,30&m_22,34,66&m_32,26,78&m_56,28,44&m_41,36,24&m_55,38,20&m_53,38,56&m_30,48,36&m_50,62,20&m_47,28,104&m_11,28,82&m_39,32,74&m_20,58,48.5&m_5,28,81.95&m_37,62,18&ItmAtk_2,60,60&ItmAtk_3,42,42&ItmDef_5,88,88&ItmDef_2,40,40&ItmDef_4,62,62&ItmAtk_1,30,30&ItmDef_1,32,30&ItmDef_3,52,52&ItmAtk_4,74,74&ek12,390,14&m_46,104,28&m_45,104,16&ek26,200,14&mc_boss2,752,97.05&n2,38,38&mc_if,800.55,70&mc_icon,728,433";
            var arr:any  = str.split("&");
            var ss:string;
            for(var i =0;i< arr.length;i++){
                ss = arr[i];
                var sarr:any  =ss.split(",");
                this.dataDic[sarr[0]] = sarr;
            }

			this.addEventListener(egret.Event.ADDED_TO_STAGE,this.onAddedToStage,this);

		}
		public fullItemForMain(dis1:any,dis2:any):void{

			dis1.movieclip.x = dis2.x;
			dis1.movieclip.name = dis2.name;
			dis1.movieclip.y = dis2.y;
            var arr:any =  this.dataDic[dis2.name];
            var ssx = Number(arr[1])/dis1.movieclip.width;
            var ssy = Number(arr[2])/dis1.movieclip.height;
          //  dis1.movieclip.width =  Number(arr[1]);
           // dis1.movieclip.height =  Number(arr[2]);
            dis1.movieclip.scaleX = ssx;
            dis1.movieclip.scaleY = ssy;
            if (dis2.name.indexOf("m_") > -1) {
                var mc_bar2 = dis1.movieclip.getChildByName("mc_bar2");
                mc_bar2.visible =false;
                var sp = new egret.Shape();
                sp.graphics.beginFill(Math.random() * 0xffffff);
                sp.graphics.drawRect( dis2.x, dis2.y, Number(arr[1]), Number(arr[2]));
                sp.touchEnabled =false;
                sp.graphics.endFill();
                this.addChild(sp);
            }
            this.addChild(dis1.movieclip);
			dis1.frame1();

			//dis1.movieclip["g"] = dis1.g;
		}

		public onAddedToStage(e:egret.Event):void{
			this.removeEventListener(egret.Event.ADDED_TO_STAGE,this.onAddedToStage,this);
			this.movieClip = this.getMcByName("mc_GameMain");
			GameMain.instance = this;
			var numChild:number = this.movieClip.numChildren;
			var valMc:any ;
			var disDis:any;
			for(var i:number =0;i<numChild;i++){
				valMc = this.movieClip.getChildAt(i);
                disDis=null;
				if(valMc.name.indexOf("m_") > -1){//任务valMc instanceof (<any><any> (getDefinitionByName("mc_prm_fla.Mission_5")))
					disDis = new Mission_5();
				}else if(valMc.name.indexOf("ek") > -1){//敌人 instanceof (<any><any> (getDefinitionByName("mc_prm_fla.Enemy_1")))
					disDis = new Enemy_1();
					if(valMc.name =="ek2")
						this.ek2= disDis;
				}else if(valMc.name =="mc_boss2"){//敌人
					disDis = new EnemyLast_22();
					this.mc_boss2 = disDis;
				}else if(valMc.name.indexOf("ItmDef_") > -1){//卖防御的
					disDis = new ItmDef_21();
				}else if(valMc.name =="mc_rAct"){//卖行动力的
					disDis = new RepairAct_9();
						this.mc_rAct = disDis;
				}else if(valMc.name =="mc_RepairP_15"){//
					disDis = new RepairP_15();
				}else if(valMc.name.indexOf("ItmAtk_") > -1){// 卖攻击的
					disDis = new ItmAtk_20();
				}else if(valMc.name =="mc_reLife"){//回复生命
					disDis = new RepairLife_13();
					this.mc_reLife = disDis;
				}else if(valMc.name =="mc_rLife"){//回复生命
                    disDis = new RepairLife_13();
                    if(valMc.name =="mc_rLife")
                        this.mc_rLife = disDis;
                }
                else if(valMc.name =="mc_icon"){//小UI
					 disDis = new Info_29();
					 this.mc_icon = disDis;
				}else if(valMc.name =="mc_if"){
					this.mc_if = this.getMcByName("mc_Sprite_sprite161");// new (getDefinitionByName("mc_Sprite_sprite161") as Class)() as MovieClip;//valMc as MovieClip;
					this.mc_if.x = valMc.x;
					this.mc_if.y= valMc.y;
					this.mc_if.gotoAndStop(0);
					for(var z:number =0;z<this.mc_if.numChildren;z++){
						valMc = this.mc_if.getChildAt(z);
						if(valMc.name.indexOf("btn_") >-1){
							valMc.stop();
						}
					}
					this.addChild(this.mc_if);
				}else if(valMc.name =="n1")
                    this.n1 = disDis;
                else if(valMc.name =="n2")
                    this.n2 = disDis;
                else if(valMc.name =="n3")
                    this.n3 = disDis;
                else if(valMc.name =="n4")
                    this.n4 = disDis;
                else if(valMc.name =="n5")
                    this.n5 = disDis;
                else if(valMc.name =="n6"){
                    disDis = new Boss_16();
                    this.n6 = disDis;
                }
                else if(valMc.name =="n7"){
                    disDis = new Slot_14();//摇奖
                    this.n7 = disDis;
                }

                else if(valMc.name =="mc_keyShop"){
                    disDis = new RepairKey_19();
                    this.mc_keyShop = disDis;
                }
				if(disDis)
					this.fullItemForMain(disDis,valMc);
			}
			this.init();
			this.addEventListener(egret.Event.ENTER_FRAME, this.run, this);
		}
		public initUImc(mc1:MovieClip,mc2:MovieClip):void{
			mc1 = mc2;
			this.addChild(mc1);
		}

        public setMessage(param1:string, param2:number = 0):void {
            var _loc_3:string = "";
            if (this.jp)
                _loc_3 = this.MESSAGE[param1][0];
            else
                _loc_3 = this.MESSAGE[param1][1];
            _loc_3 = _loc_3.replace(/@""@/g, param2+"");
            this.setMes(_loc_3, this.MESSAGE[param1][2]);
        }
		/**
		 * 初始化数据 
		 */
        public init() : void {
            var _loc_2:any = undefined;
            var _loc_3:any = undefined;
            var _loc_4:any = undefined;
            this.lv = 1;
            this.rpe = 10;
            this.key = 0;
            this.key2 = 0;
            this.life = 100;
            this.act = 50;//50//行动力
            this.atk = 10;//10
            this.def = 10;//10
            this.gold = 0;
            this.life_max = this.life;
            this.act_max = this.act;
            this.atk_max = this.atk;
            this.def_max = this.def;
            this.exp = 0;
            this.exp_total = 0;
            this.exp_max = 100 + (this.lv - 1) * (this.lv - 1);
            this.exp_total_max = this.exp_max;
            this.add_p = 0;
            //this.mc_if.getChildByName("txt_addP").text = "";
            this.item_list = [];
            this.combo = 0;
            this.combo_time = 0;
            this.me_life = new Meter(this, "LIFE");
            this.me_exp = new Meter(this, "EXP");
            this.me_act = new Meter(this, "ACT");
            this.me_combo = new Meter(this, "COMBO");
            this.me_atk = new Meter(this, "ATK");
            this.me_def = new Meter(this, "DEF");
            var _loc_1:Array<any> = ["life", "act", "rpe", "atk", "def"];
            var length:number = _loc_1.length;
            for(var i:number = 0;i < length;i++){
            	_loc_2 = _loc_1[i];
                _loc_4 = new BtnAddP(this, this.mc_if.getChildByName("btn_" + _loc_2), _loc_2);
                this.btn_list.push(_loc_4);
            }
            _loc_3 = new ButtonObject2(this.mc_if.getChildByName("btn_inst"), this.onClickInst, this);//怎么玩
            this.inst = new Inst(this);
            this.first_click_flg = true;
            this.mc_if.gotoAndStop(0);
            this.mc_icon.movieclip.touchEnabled = false;
            this.disp();
            this._state = "standby";//待命地; 
        }

        public onClickInst(event:egret.TouchEvent) : void{
            this.inst.disp(true);
        }

        public setStartTime() : void{
            if (this.first_click_flg){
                this.start_time = getTimer();
                this.first_click_flg = false;
            }
        }

        private run(event:egret.Event) : void{
            switch(this._state){
                case "standby":{
                    this.life = this.life + (0.004 + this.rpe * 0.002);
                    if (this.life > this.life_max)
                        this.life = this.life_max;
                    this.act = this.act + (0.06 + this.rpe * 0.01);
                    if (this.act > this.act_max)
                        this.act = this.act_max;
                    this.def = this.def + (0.03 + this.rpe * 0.01);
                    if (this.def > this.def_max)
                        this.def = this.def_max;
                    this.atk = this.atk + (0.03 + this.rpe * 0.01);
                    if (this.atk > this.atk_max)
                        this.atk = this.atk_max;
                    if (this.combo_time > 0) {
                        var _loc_3:number = this.combo_time - 1;
                        this.combo_time = _loc_3;
                        if (this.combo_time == 0){
                            if (this.combo >= this.COMBO_MAX)
                                this.setSecret(4);
                            this.combo = 0;
                        }
                    }
                    break;
                }
            }
            this.disp();
        }

        public disp() : void{
            this.me_life.setV(this.life, this.life_max);
            this.me_exp.setV(this.exp, this.exp_max);
            this.me_act.setV(this.act, this.act_max);
            this.me_combo.setV(this.combo, this.COMBO_MAX);
            this.me_atk.setV(this.atk, this.atk_max);
            this.me_def.setV(this.def, this.def_max);
            (<egret.TextField>this.mc_if.getChildByName("txt_level")).text = this.lv+"";
            (<egret.TextField>this.mc_if.getChildByName("txt_gold")).text = this.gold+"";
            (<egret.TextField>this.mc_if.getChildByName("txt_key")).text = this.key+"";
            (<egret.TextField>this.mc_if.getChildByName("txt_key2")).text = this.key2+"";
            var _loc_1:any = this.rpe;
            if (_loc_1 > 200)
                _loc_1 = 200;
            (<egret.TextField>this.mc_if.getChildByName("txt_rpe")).text = this.rpe+"";
            this.mc_if.getChildByName("mc_rpe").width = _loc_1;
            this.dispNeko();
            return;
        }

        private dispNeko() : void{
            var _loc_2:any = undefined;
            var _loc_1:any = 0;
            while (_loc_1 < 9){
                
                if (this.t_list[_loc_1] == 0){
                    _loc_2 = _loc_1 + 1;
                }
                else{
                    _loc_2 = (_loc_1 + 1) + 10;
                }
                this.mc_if.getChildByName("t" + _loc_1).gotoAndStop(_loc_2-1);
                _loc_1 = _loc_1 + 1;
            }
            return;
        }

        public setItem(param1:Array<any>, param2, param3) : void{
            var _loc_5:any = undefined;
            var _loc_6:any = undefined;
            var _loc_7:any = undefined;
            var _loc_4:any = 0;
            while (_loc_4 < param1.length){
                
                _loc_5 = param1[_loc_4][0];
                _loc_6 = param1[_loc_4][1];
                _loc_7 = new ItemObj(this, param2, param3, _loc_5, _loc_6);
                _loc_4 = _loc_4 + 1;
            }
            return;
        }

        public clearItemObj(param1) : void{
            param1 = null;
            return;
        }

        public useKey(param1:number = 0) : boolean{
            var _loc_2:boolean = false;
			var _loc_4:number;
            if (param1 == 1) {
                if (this.key > 0){
                    this.key --;
                    this.lock1_cnt --;
                    if (this.lock1_cnt == 0)
                        this.mc_keyShop.g.disable();
                    _loc_2 = true;
                }
                else
                    _loc_2 = false;
            }
            else if (this.key2 > 0){
                 this.key2 --;
                _loc_2 = true;
            }
            else{
                _loc_2 = false;
            }
            return _loc_2;
        }

        public addParam(param1:string, param2:number = 0) : void{
            var _loc_3:any = undefined;
            var _loc_4:any = undefined;
            switch(param1){
                case "GOLD":{
                    this.gold = this.gold + param2;
                    break;
                }
                case "EXP":{
                    this.exp = this.exp + param2;
                    this.exp_total = this.exp_total + param2;
                    if (this.exp >= this.exp_max){
						this.lv++;
                        this.exp = this.exp - this.exp_max;
                        this.exp_max = 100 + (this.lv - 1) * (this.lv - 1);
                        this.exp_total_max = this.exp_total_max + this.exp_max;
                        this.addAddP(3);
                        this.setMessage("LEVEL_UP", this.lv);
                        this.life = this.life_max;
                        this.act = this.act_max;
						this.mc_reLife.g.resetPrice();
                        if (this.lv == 40){
                            this.n7.g.entry();
                        }
                    }
                    break;
                }
                case "KEY":{
					this.key++;
                    break;
                }
                case "KEY2":{
					this.key2++;
                    break;
                }
                case "NEKO":{
                    this.t_list[param2] = 1;
                    _loc_3 = 0;
                    var length:number = this.t_list.length;
                    for(var i:number = 0;i < length;i++){
                    	_loc_4 = this.t_list[i];
                        if (_loc_4)
                            _loc_3 ++;
                    }
                    if (_loc_3 == 9)
                        this.setSecret(5);
                    break;
                }
            }
            if (this.combo_time > 0)
                 this.combo ++;
            else{
                this.combo = 0;
            }
            this.combo_time = this.COMBO_W_TIME;
            this.disp();
            return;
        }

        public addAddP(param1:number = 0) : void{
            this.add_p = this.add_p + param1;
            if (this.add_p <= 0){
                ( <egret.TextField> this.mc_if.getChildByName("txt_addP")).text = "";
                this.dispBtn(false);
                this.disp();
            }
            else{
                ( <egret.TextField>this.mc_if.getChildByName("txt_addP")).text = "+" + this.add_p;
                this.dispBtn(true);
            }
            return;
        }

        private dispBtn(param1:boolean) : void{
            var _loc_2:BtnAddP;
            var length:number = this.btn_list.length;
            for(var i:number = 0;i < length;i++){
            	_loc_2 = this.btn_list[i];
                
                _loc_2.setDisp(param1);
            }
            return;
        }

        public setDamage(param1:number = 0) : void{
            if (this.def > 300){
                this.def = 300;
            }
            var _loc_2:any = parseInt(""+param1 * 0.5 * (1 - this.def / 300));
            if (_loc_2 < 5){
                _loc_2 = parseInt(""+(5 + Math.random() * 10));
            }
            this.setMessage("DAMAGE", _loc_2);
            this.life = this.life - _loc_2;
            if (this.life < 0){
                this.life = 0;
                this.atk = 0;
                this.def = 0;
                this.mc_reLife.g.resetPrice();
            }
            this.disp();
            return;
        }

        public setTweet(param1:string) : void{
            var _loc_2:any = new Tweet(this, param1);
            return;
        }

        public releaseTweet(param1) : void{
            param1.release();
            param1 = null;
            return;
        }

        public setSecret(param1) : void{
            switch(param1){
                case 1:{
                    this.n1.g.enable();
                    this.setMessage("M_ALL");
					//完成所有任务
                    break;
                }
                case 2: {
					this.n2.g.enable();
                    this.n6.g.enable();
					//征服所有的敌人
                    this.setMessage("E_ALL");
                    break;
                }
                case 3:{//所有项目均购
					this.n3.g.enable();
                    this.setMessage("I_ALL");
                    break;
                }
                case 4: {
                    if (!this.secret_list[(4 - 1)]){
						this.n4.g.enable();
                        this.setMessage("C_MAX");
						//最大的组合？
                    }
                    break;
                }
                case 5:{
                    if (!this.secret_list[(5 - 1)]) {
						this.n5.g.enable();//集齐文字
                        this.setMessage("NEKOGAMES");
                    }
                    break;
                }
                case 6:{
                    break;
                }
            }
            this.secret_list[(param1 - 1)] = 1;//指定状态达成
            var num:number = 0;
            var countNum:number = 0;
            while (countNum < 3){
				num +=  this.secret_list[countNum];
				countNum ++;
            }
            if (this.secret_list[0] && this.secret_list[5])//任务完成 并且 
                this.mc_boss2.g.enable();
            return;
        }

        public getTimerStr() : string{ 
			var num:number = getTimer() - this.start_time;
            var miao:number = Math.floor(num / 1000);
			return GameMain.secondsToTime(miao);
//            var _loc_6:String;
//            var _loc_7:String;
//            var _loc_8:String;
//            var _loc_1:Number = getTimer() - start_time;
//            var _loc_2:Number = Math.floor(_loc_1 / 1000);
//            var _loc_3:Number = _loc_2 % 60;
//            var _loc_4:Number = Math.floor(_loc_2 / 60);
//            var _loc_5:Number = Math.floor(_loc_1 % 1000 / 10);
//            if (_loc_3 < 10)
//                _loc_6 = "0" + _loc_3.toString();
//            else
//                _loc_6 = _loc_3.toString();
//            if (_loc_4 < 10)
//                _loc_7 = "0" + _loc_4.toString();
//            else
//                _loc_7 = _loc_4.toString();
//			
//            if (_loc_5 < 10)
//                _loc_8 = "0" + _loc_5.toString();
//            else
//                _loc_8 = _loc_5.toString();
//            var _loc_9:* = _loc_7 + ":" + _loc_6 + ":" + _loc_8;
//            if (Number(_loc_7) > 99)
//                _loc_9 = "99:99:99";
//            return _loc_9;
        }
		/**
		 * 将秒数转换为00:00:00格式
		 */ 
		public static secondsToTime(sec:number = 0):string{
			var result:string="";
			if(sec<=0)
				result="00:00:00"		            
			else{		    	
				var hour:number = Math.floor(sec/3600);
				var minute:number = Math.floor(sec%3600/60);
				var second:number = Math.floor(sec%3600%60);
				var hourStr:string;
				var minuteStr:string;
				var secondStr:string;
				
				if(hour<10)
					hourStr="0"+hour;
				else
					hourStr=hour.toString();
				if(minute<10)
					minuteStr="0"+minute;
				else
					minuteStr=minute.toString();
				if(second<10)
					secondStr="0"+second;
				else
					secondStr=second.toString();
				result = hourStr+":"+minuteStr+":"+secondStr; 
			}
			return result;
		}
        public setMes(param1:string, param2) : void{
            var _loc_5:any = undefined;
            var _loc_3:any = this.getTimerStr();
            var _loc_4:any = "<font color=\'#ffffff\'>" + _loc_3 + " </font>";
            if (this.mes_list.length == 4){
                this.mes_list.shift();
            }
            param1 = _loc_4 + param1;
            this.mes_list.push([param1, param2]);
            ( <egret.TextField>this.mc_if.getChildByName("txt_mes")).text = "";
            var length:number = this.mes_list.length;
            for(var i:number = 0;i < length;i++){
            	_loc_5 = this.mes_list[i];

                ( <egret.TextField>this.mc_if.getChildByName("txt_mes")).text = ( <egret.TextField>this.mc_if.getChildByName("txt_mes")).text + ("<font color=\'" + _loc_5[1] + "\'>" + _loc_5[0] + "\n</font>");
            }
            return;
        }
		public getMcByName(nameStr:string):starlingswf.SwfMovieClip{
			var mc:starlingswf.SwfMovieClip =	Main.instance.swf.createMovie(nameStr);
			mc.stop();
            mc.touchEnabled =true;
			return mc;
		}
        public getMcWidth(mc:any):number{
            var num:number = mc.width * mc.scaleX;
            return parseInt(""+num) ;
        }
        public getMcHeight(mc:any):number{
            var num:number = mc.height * mc.scaleY;
            return parseInt(""+num) ;
        }
    }
}