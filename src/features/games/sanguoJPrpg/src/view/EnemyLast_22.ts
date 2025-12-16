
module egret {

	export class EnemyLast_22{
		public movieclip:any;
        public mc_focus:any;
        public mc_barBG:any;
        public mc_bar:any;
        public n:number = 0;
        public g:any;

        public constructor(){
			this.movieclip =GameMain.instance.getMcByName("mc_prm_flaEnemyLast_22");
        }

		public frame1():void{
            this.n = 0;
            this.g = new EnemyLast(GameMain.instance, this.movieclip, this.n);
			this.movieclip.stop();
            return;
        }

    }
}