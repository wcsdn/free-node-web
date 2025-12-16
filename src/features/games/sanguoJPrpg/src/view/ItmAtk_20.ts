
module egret {

	export class ItmAtk_20 {
		public movieclip:any;
        public mc_focus:any;
        public mc_base:any;
        public mc_e:any;
        public g:any;

        public constructor(){
			this.movieclip = GameMain.instance.getMcByName("mc_prm_flaItmAtk_20") ;
        }

		public frame1():void{
			this.mc_focus =  (this.movieclip.getChildByName("mc_focus"));
			this.mc_base =  (this.movieclip.getChildByName("mc_base"));
			this.mc_e =  (this.movieclip.getChildByName("mc_e"));
            this.g = new ItemAtk(GameMain.instance, this.movieclip);
			this.movieclip.stop();
        }

    }
}