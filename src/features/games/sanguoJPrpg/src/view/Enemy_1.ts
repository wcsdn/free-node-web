
module egret {

	export class Enemy_1 {
		public movieclip:any;
        public mc_focus:any;
        public mc_barBG:any;
        public mc_bar:any;
        public n:number = 0;
        public g:any;

        public constructor(){
			this.movieclip = GameMain.instance.getMcByName("mc_prm_flaEnemy_1");
        }

		public frame1():void{
            this.n = 0;
			this.mc_focus =  (this.movieclip.getChildByName("mc_focus"));
			this.mc_bar =  (this.movieclip.getChildByName("mc_bar"));
			this.mc_barBG = (this.movieclip.getChildByName("mc_barBG"));
            this.g = new Enemy(<starlingswf.SwfMovieClip><any> (GameMain.instance), this.movieclip, this.n);
			this.mc_barBG.stop();
			this.movieclip.stop();
        }

    }
}