
module egret {

	export class ItmDef_21{
		public movieclip:any;
        public mc_focus:any;
        public mc_base:any;
        public mc_e:any;
        public g:ItemDef;

        public constructor(){
			this.movieclip = GameMain.instance.getMcByName("mc_prm_flaItmDef_21") ;
        }
		public  frame1():void{
			this.mc_focus =  (this.movieclip.getChildByName("mc_focus"));
			this.mc_base = (this.movieclip.getChildByName("mc_base"));
			this.mc_e =  (this.movieclip.getChildByName("mc_e"));
            this.g = new ItemDef(GameMain.instance, this.movieclip);
			this.movieclip.stop();
        }

    }
}