
module egret {

	export class Tweet extends egret.DisplayObjectContainer{
        main:any;
        mc:any;
        btn_objs:Array<any>;
        select_level_num:number = 0;
        btn_exit:any;
        btn_tweet:any;
        post:string;

        public constructor(param1, param2:string) {
			super();
            this.btn_objs = [];
            this.main = param1;
            this.mc = GameMain.instance.getMcByName("mc_TweetPopUp");
            this.main.addChild(this.mc);this.mc.stop();
			this.mc.x= (this.main.width-this.mc.width)/2;
			this.mc.y =(this.main.height-this.mc.height)/2 ;
            this.btn_exit = new ButtonObject2(this.mc.getChildByName("btn_exit"), this.onClickExit, this.main);
            this.btn_tweet = new ButtonObject2(this.mc.getChildByName("btn_tweet"), this.onClickTweet, this.main);
            this.post = "Parameters Cleared! 共用时 " + param2 + "  http://www.baidu.com";
            this.mc.getChildByName("txt_post").text = this.post;
            return;
        }

        public release() : void{
            this.btn_exit.release();
            this.btn_tweet.release();
            this.main.removeChild(this.mc);
            this.mc = null;
            return;
        }

        public onClickExit(event:egret.TouchEvent) : void{
            this.main.releaseTweet(this);
            return;
        }

        public onClickTweet(event:egret.TouchEvent){
           // this.navigateToURL(new URLRequest("http://www.baidu.com?status=" , "_blank"));
            return;
        }

    }
}