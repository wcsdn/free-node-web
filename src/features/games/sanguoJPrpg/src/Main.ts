
class Main extends egret.DisplayObjectContainer{

    /**
     * 加载进度界面
     */
    private loadingView:LoadingUI;
    public static  instance:Main;
    public constructor() {
        super();

        this.addEventListener(egret.Event.ADDED_TO_STAGE,this.onAddToStage,this);
    }

    private onAddToStage(event:egret.Event){
        Main.instance =this;
        //设置加载进度界面
        this.loadingView  = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE,this.onConfigComp,this);
        RES.loadConfig("resource/resource.json","resource/");
    }
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     */
    private onConfigComp(event:RES.ResourceEvent):void{
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE,this.onConfigComp,this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE,this.onResourceLoadComplete,this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS,this.onResourceProgress,this);
        RES.loadGroup("preload");
    }
    /**
     * preload资源组加载完成
     */
    private onResourceLoadComplete(event:RES.ResourceEvent):void {
        if(event.groupName=="preload"){
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE,this.onResourceLoadComplete,this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS,this.onResourceProgress,this);
            this.createGameScene();
        }
    }
    /**
     * preload资源组加载进度
     */
    private onResourceProgress(event:RES.ResourceEvent):void {
        if(event.groupName=="preload"){
            this.loadingView.setProgress(event.itemsLoaded,event.itemsTotal);
        }
    }

    public swf:starlingswf.Swf;
    private showPanle:starlingswf.SwfMovieClip;
    public gameMain:egret.GameMain;
    /**
     * 创建游戏场景
     */
    private createGameScene():void{
        var swfData:Object = RES.getRes("GameRPG_swf");
        var spriteSheet:egret.SpriteSheet = RES.getRes("GameRPG");

        var assetsManager = new starlingswf.SwfAssetManager();
        assetsManager.addSpriteSheet("GameRPG",spriteSheet);

        this.swf = new starlingswf.Swf(swfData,assetsManager,60);

        this.gameMain = new egret.GameMain();
        this.gameMain.x = -45;
        this.gameMain.y=-9;
        this.addChild(this.gameMain);

        this.stage.addEventListener(egret.Event.RESIZE,this.onReSize,this);
       // egret.Profiler.getInstance().run();
       // Window.localStorage.setItem("name","test");
        //var name= Window.localStorage.getItem("name");
        //this.showHoerInfoPanle(name,name);
    }
    public showHoerInfoPanle(title:string,content:string=""):void{
        if(this.showPanle ==null){
            this.showPanle = egret.GameMain.instance.getMcByName("mc_ShowHeroPanle");
            this.showPanle.getChildByName("btn_close").addEventListener(egret.TouchEvent.TOUCH_TAP,this.onClick,this);
            this.addChild(this.showPanle);
        }
        this.showPanle.visible =true;
        var titleText:egret.TextField = <egret.TextField>this.showPanle.getChildByName("titleText");
        titleText.text = title;
        (<egret.TextField>this.showPanle.getChildByName("titleText")).text = content;
    }
    public onClick(e:Event):void{
        this.showPanle.visible =false;
    }

    /**
     * Sprite测试
     * */
    private test1():void{
        var sprite:starlingswf.SwfSprite = this.swf.createSprite("spr_1");
        this.addChild(sprite);
    }


    /**
     * 动画事件测试
     * */
    private test3():void{
        var mc:starlingswf.SwfMovieClip = this.swf.createMovie("mc_Tain");
        mc.x = 480 / 2;
        mc.y = 320 / 2;
        mc.addEventListener(egret.Event.COMPLETE,this.mcComplete,mc);
        mc.gotoAndPlay("walk");
        this.addChild(mc);
    }

    private mcComplete(e:egret.Event):void{
        console.log("mcComplete");
    }

    /**
     * 帧事件测试
     * */
    private test4():void{
        var mc:starlingswf.SwfMovieClip = this.swf.createMovie("mc_frame_event");
        mc.addEventListener("@out",this.frameEventOut,mc);
        mc.addEventListener("@in",this.frameEventIn,mc);
        this.addChild(mc);
    }

    private frameEventOut(e:egret.Event):void{
        console.log("@out");
    }

    private frameEventIn(e:egret.Event):void{
        console.log("@in");
    }


    private onReSize(e:egret.Event){
        console.log(this.stage.stageWidth);
        console.log(this.stage.stageHeight);
    }






}


