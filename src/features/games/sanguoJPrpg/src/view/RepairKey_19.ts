
module egret {

	export class RepairKey_19{
		public movieclip:any;
        public mc_focus:any;
        public mc_base:any;
        public mc_e:any;
        public g:any;

        public constructor(){
            //addFrameScript(0, frame1, 1, frame2);
			this.movieclip =  GameMain.instance.getMcByName("mc_prm_flaRepairKey_19") ;
        }

		public  frame1():void {
            this.g = new BtnRepaierKey(GameMain.instance, this.movieclip);
			this.movieclip.stop();
        }

		private frame2():void {
			this.movieclip.stop();
        }

    }
}