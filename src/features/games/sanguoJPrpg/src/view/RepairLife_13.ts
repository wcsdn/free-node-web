
module egret {

	export class RepairLife_13{
		public movieclip:any;
        public mc_focus:any;
        public mc_base:any;
        public mc_e:any;
        public g:any;

        public constructor(){
			this.movieclip =  GameMain.instance.getMcByName("mc_prm_flaRepairLife_13") ;
        }

		public frame1():void {
            this.g = new BtnRepaierLife(GameMain.instance, this.movieclip);
        }

    }
}