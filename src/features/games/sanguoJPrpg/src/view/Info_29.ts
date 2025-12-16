
module egret {

	export class Info_29{
		public movieclip:any;
        public constructor(){
			this.movieclip = GameMain.instance.getMcByName("mc_prm_flaInfo_29");
			this.movieclip.stop();
        }
		public frame1():void{}
    }
}