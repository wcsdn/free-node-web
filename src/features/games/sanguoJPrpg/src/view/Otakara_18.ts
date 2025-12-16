
module egret {

	export class Otakara_18{
		public movieclip:any;
        public mc_focus:any;
        public mc_base:any;
        public mc_e:any;
        public g:any;

        public constructor(){
            //addFrameScript(0, frame1, 1, frame2, 2, frame3);
			this.movieclip =GameMain.instance.getMcByName("mc_prm_flaOtakara_18") ;
        }

		public  frame1():void{
			this.mc_focus =  (this.movieclip.getChildByName("mc_focus"));
			this.mc_base =  (this.movieclip.getChildByName("mc_base"));
			this.mc_e =  (this.movieclip.getChildByName("mc_e"));
            this.g = new BtnBonus(GameMain.instance, this.movieclip);
			this.movieclip.stop();
        }

       public frame2():void{
        }

        public frame3():void{
        }

    }
}