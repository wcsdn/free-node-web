
module egret {

	export class Boss_16 {
		public movieclip:any;
        public mc_focus:any;
        public mc_bar:any;
        public n:number = 0;
        public g:any;

        public constructor(){
			this.movieclip = GameMain.instance.getMcByName("mc_prm_flaBoss_16");
        }

		public frame1():void{
            this.n = 0;
			this.mc_focus = (this.movieclip.getChildByName("mc_focus"));
			this.mc_bar =(this.movieclip.getChildByName("mc_bar"));
			this.mc_bar.stop();
            this.g = new Boss(GameMain.instance, this.movieclip, this.n);
			this.movieclip.stop();
        }
    }
}