
//当前页面状态
var CityNum=0;
var PageNum=0;
var LastPageNum=0;
var CityID=0;
var TimePercent=0;
var JuntaNum=2;
var VersionInfo;
var ChessIsOpen = 0;//0:开启战场 1:关闭战场 

//承接服务器的下传的数据
var EventInfo; 
var UserInfo;
var ServerInfo = { Time: "12:00:00", ServerUnit: "1", online: true, playerCount: 0, cityCount: 0, corpsCount: 0, uptime: 0 };
var MapUnitInfo;
var CityInteriorInfo;
var LandformInfo;
var PersistEffectGroupInfo=new Array();
var OverdueEffectFlagInfo=new Array();
var TwoEffectInfo = new Array();
var ClientCropsStateInfo;
var IamVIP=false;

var PosBuildingInfo;
var TheBulidingInfo;
var TechnicInfo;

var HeroInfo;
var TheHeroInfo;
var CorpsInfo;
var TheCorpsInfo;
var SupportHeroInfo;
var DefendHeroInfo;
var PosNpcInfo;
var UserSubInfo;
var AutoExpInfo;

var JYTLevel=1;
var TangCount=0;
var haveWaitHero=0;
var HeroCount=0;
var GZFLevel=0;
var haveXF=0;
var haveKJ=0;
var haveMK=0;
var haveYWC=0;
var FSHeroCount=0;
var CFXZ=0;
var CFCount=0;
var haveHeroCZ=0;
var haveHeroZS=0;
var HeroHight=0;
var haveZPItem=0;
var haveXLItem=0;
var haveNewMail=0;
var haveNewTask=0;

var InChoiceHero=false;
var UseExpItemSign=false;//春节经验道具
var UseSkillBookSign=false;//使用技能书标志
var UseSkillPillSign=false;//使用技能药丸
var UseSkillExpSign=false;

var ItemInfo;
var TheItemInfo;
var CityInfo;
var InChoiceItem=false;

var MailInfo;
var FightInfo;

var PlayerTaxisInfo;
var InteriorPosNum=16;

var InteriorAreaCoords_Empty = new Array("53,145,94,126,122,147,80,165","184,132,223,114,254,129,213,148","337,125,391,131,371,155,314,149","441,150,471,129,512,148,484,169","100,179,140,160,172,179,131,199","49,263,84,287,130,263,93,238","160,219,208,196,241,215,193,238","268,153,321,165,299,199,242,186","167,402,219,431,272,396,220,363","200,284,276,317,297,306,311,312,342,296,352,277,329,245,292,223,275,215,259,216,225,229,206,243","324,230,359,205,410,234,376,261","407,193,430,169,485,192,464,217","326,444,376,406,424,433,374,471","313,356,362,325,414,360,366,389","417,300,476,322,509,288,453,266","89,351,155,312,212,344,143,386")
var InteriorAreaCoords_Full=new Array("46,137,64,158,88,156,111,151,119,142,106,108,68,96","191,51,190,140,241,140,242,51","300,115,398,117,397,147,317,148,290,130","431,146,477,168,512,155,519,127,468,100,436,111","96,184,133,195,163,179,143,151,124,147,101,155","49,276,78,288,124,270,131,254,115,231,74,210,44,244","156,223,198,239,254,215,210,194,207,179,188,171,159,184,158,200","256,148,287,132,313,149,314,159,335,172,324,194,278,200,242,190,238,167","194,366,229,338,263,366,273,389,285,411,260,431,215,433,174,410","200,284,276,317,297,306,311,312,342,296,352,277,329,245,292,223,275,215,259,216,225,229,206,243","318,231,379,263,430,238,430,209,407,190,390,180,357,170,313,206","428,154,497,189,479,218,412,186,409,171","306,424,375,382,449,427,442,442,375,473,308,439","323,353,382,383,430,362,424,322,356,284,317,314","405,290,468,328,518,288,492,237,447,242,418,246","75,352,136,397,149,388,215,347,218,315,156,287,113,313,81,307")

var TargetNavImg= new Array("../img/1/1a.GIF","../img/1/2a.GIF","../img/1/3a.GIF","../img/1/4a.GIF","../img/1/5a.GIF","../img/1/6a.GIF","../img/1/7a.GIF");
var NavImg= new Array("../img/1/1.GIF","../img/1/2.GIF","../img/1/3.GIF","../img/1/4.GIF","../img/1/5.GIF","../img/1/6.GIF","../img/1/7.GIF")

//var UserLevel = new Array("白身","开国乡男","开国县男","世袭开国县男","开国县子","世袭开国县子","开国县伯","世袭开国县伯","开国县侯","世袭开国县侯","开国郡侯","世袭开国郡侯","世袭开国郡公","国公","世袭国公","郡王","世袭郡王","亲王","世袭亲王");
var UserLevel = new Array(Lang["Main_1"],Lang["Main_2"],Lang["Main_3"],Lang["Main_4"],Lang["Main_5"],Lang["Main_6"],Lang["Main_7"],Lang["Main_8"],Lang["Main_9"],Lang["Main_10"],Lang["Main_11"],Lang["Main_12"],Lang["Main_13"],Lang["Main_14"],Lang["Main_15"],Lang["Main_16"],Lang["Main_17"],Lang["Main_18"],Lang["Main_19"],Lang["Main_20"]);

var DegradeNeedResPercent=30;
var DegradeNeedTimePercent=30;
var FastUpdateNeedTimePercent=50; 

var DefenceWidth=17;
var DefenceHeight=14;
var WorldWidth=9;
var WorldHeight=9;
var WorldPicSize=46;
var DefencePicSize=32;

var ClientTime;
var ServerTime = 43200;

var AppendantNpcInfos;//从属山寨列表
var OccupationGold=20;//占领山寨所需元宝
var OccupationInsignia=200;//占领山寨所需战勋

$(document).ready(function(){     
    DataTranslateBegin();
    MainInit();     
});

//页面初始化
function MainInit()
{           
    DataInit();
    TimerInit();                        
}

function DataInit()
{     
    Main.GetVersionInfo(cb_GetVersionString);
}

function cb_GetVersionString(result)
{
    if(DataValidate(result)==false) return;
    VersionInfo=result.value;
    
    DoVersion();
    Main.GetPageInfo(cb_GetPageInfo);//请求页面状态
}

function TimerInit()
{  
    CreateWorChat2RoomTimer();//世界聊天计时器
    CreateChat2RoomTimer();//创建聊天室计时器
    CreateNewMailTimer();//创建长连接计时器
    CreateAttChessTimer();//攻击战场计时器
    CreateEventTimer();//创建事件计时器
    CreateResTimers();//创建资源计时器
    CreateUpdateTimer();//时间同步计时器               
    ChessmanStateTimer()//战场棋子状态计时器
    ChessEventTimer();//战场事件计算器
    ChessControlSpanTimer();//战场操作间隔计时器
}

//获得页面状态
function cb_GetPageInfo(result)
{  
     if(DataValidate(result)==false) return false;   
         
     var t=result.value.split("_");      
        
     CityNum=parseInt(t[0],10);
     PageNum=parseInt(t[1],10);
        
     if(CityNum<0 || CityNum>10) 
        CityNum=1;
     
     LastPageNum = PageNum;
     TargetNav();
        
             
     Main.GetServerInfo(cb_GetServerInfo); //请求服务器信息                       
}

//获得服务器信息
function cb_GetServerInfo(result) { 
    console.log("cb_GetServerInfo called, result:", JSON.stringify(result).substring(0, 500));
    if(DataValidate(result)==false) {
        console.log("DataValidate failed, using default");
        result = { value: { Time: "12:00:00", ServerUnit: "1", online: true, playerCount: 0, cityCount: 0, corpsCount: 0, uptime: 0 } };
    }
    
    ServerInfo=result.value;
    console.log("ServerInfo after assignment:", JSON.stringify(ServerInfo).substring(0, 200));
    
    if(!ServerInfo) { 
        console.log("ServerInfo is null, using default"); 
        ServerInfo = { Time: "12:00:00", ServerUnit: "1", online: true, playerCount: 0, cityCount: 0, corpsCount: 0, uptime: 0 }; 
    }
    
    if(ServerInfo && ServerInfo.Time)
    {
        ClientTime=Date();
        var times=ServerInfo.Time.split(":");
        ServerTime = parseInt(times[0],10)*3600+parseInt(times[1],10)*60+parseInt(times[2],10);

        //用于处理12小时制
        var times12 = times[0].split(" ");
        if(times12.length>1)
            ServerTime =parseInt(times12[1],10)*3600+parseInt(times[1],10)*60+parseInt(times[2],10);
        
        var VChange = ServerInfo.ServerUnit;
        var VAll = VName;
        if(VersionInfo[0]!="il")
        {
            VAll = VAll+"("+VChange+""+Lang["Main_21"]+")";
        }
        //为5区2服加名字
        if(VersionInfo[1] == '58')
        {
            if(ServerInfo.ServerUnit == "2")
                VAll = Lang["Main_36_l"];
        }
        
        
        var ToGold = Lang["Main_35_l"];
        
        //为新浪额外处理的
        if(VersionInfo[1]=="105")
        {
            if(ServerInfo.ServerUnit=="1")
                VAll=Lang["Main_22"];   
            if(ServerInfo.ServerUnit=="2")
                VAll=Lang["Main_23"];        
        }
        if(VersionInfo[1]=="106")
        {
            if(ServerInfo.ServerUnit=="1")
                VAll=Lang["Main_24"];   

            if(ServerInfo.ServerUnit=="2")
                VAll=Lang["Main_25"];        
        }
        //为库狗加2服加名字
        if(VersionInfo[1] == "111")
        {
            if(ServerInfo.ServerUnit == "1")
                VAll=Lang["Main_38_l"];
            if(ServerInfo.ServerUnit == "2")
                VAll=Lang["Main_37_l"];
        }
        //为PPS的处理
        if(VersionInfo[1]=="133")
        {
            var ToPPs1 = "http://game.pps.tv/jx_top.php?type=351";
            var ToPPs2 = "http://game.pps.tv/jx_top.php?type=352";
            if(ServerInfo.ServerUnit=="1")
            {
                VAll=Lang["Main_33_l"];   
                $("#to_gold").attr("href","http://pay.pps.tv/game_jxqy.php?server_type=351");
                document.getElementById("iFrame1").src=ToPPs1;
            }
            if(ServerInfo.ServerUnit=="2")
            {
                VAll=Lang["Main_34_l"];        
                $("#to_gold").attr("href","http://pay.pps.tv/game_jxqy.php?server_type=352");
                document.getElementById("iFrame1").src=ToPPs2;
            }
        }
        
        $("#serverName").text(VAll);
        var onlineNum=ServerInfo.O;
		if(VersionInfo[0]!="tw")
            $("#onlineNum").text(onlineNum);   
        $("#serverTime").text(ServerInfo.Time);
        $("#expPer").text(ServerInfo.ExpPer);
        $("#to_gold").text(ToGold);
        
        TimePercent=ServerInfo.TimePercent;
        JuntaNum=ServerInfo.JuntaNum;
        if(ServerInfo.TimePercent>0)
        {
            var text=(100/TimePercent)+Lang["Main_26"];
            if(TimePercent>100)
                text=Lang["Main_27"];
            $("#percent").text(text);
        }
        else
        {
            $("#percent").text(Lang["Main_28"]);
        }
    }
    
    
    Main.GetUserInfo(cb_GetUserInfo);//请求用户信息
    
    CreateServerTimer();//创建服务器时间计时器                      
}

//获得用户信息
function cb_GetUserInfo(result)
{
    if(DataValidate(result)==false) return;    
    
    UserInfo=result.value;
    //CreateWorChat2RoomTimer();//世界聊天计时器
    if(CityNum>=0 && UserInfo.CityList!=null && CityNum<UserInfo.CityList.length)
        CityID=UserInfo.CityList[CityNum].ID;
        
    if(UserInfo!=null)
    {
        $("#userName").html(UserInfo.Name);
        if(UserInfo.State==3)
            $("#userState").html("<a href=\"#\" onmousedown=\"ChangeNewUserState()\">"+Lang["Main_29"]+"</a>");
        $("#userName").html(UserInfo.Name);
        //$("#userLevel").html(UserLevel[UserInfo.Level]);
        if(UserInfo.Organise!="")
            $("#userUnit").html(UserInfo.Organise);
        else
            $("#userUnit").html(Lang["Main_30"]);
        $("#userIns").text(UserInfo.Insignia);
        var i=0;
        var html="";
        while(UserInfo.CityList!=null && UserInfo.CityList[i]!=null)
        {
            var city=UserInfo.CityList[i];
            var x=Math.floor(city.Pos%400);
            if(x==0)x=400;
            var y=(Math.floor((city.Pos-1)/400)+1); 
            html+="<ul>";
            html+="<li><span class=\"font_bold\">"+city.Name+"</span></li>"; 
            html+="<br>";
            html+="<li>"+Lang["Main_31"]+"<span id=\"cityPos_"+i+"\">("+x+","+y+")</span></li>";  
            html+="</ul>"
            i++;
        }
       //$("#usercity").html(html)
       var tree=document.getElementById("usercity");
       tree.innerHTML=html;    
       html=null;
       EventQueueNum[0]=UserInfo.InteriorBuildingQueueNum;
       EventQueueNum[1]=UserInfo.DefanceBuildingQueueNum;
       DegradeNeedResPercent=UserInfo.DegradeNeedResPercent;
       DegradeNeedTimePercent=UserInfo.DegradeNeedTimePercent;
       FastUpdateNeedTimePercent=UserInfo.FastUpDateNeedTimePercent; 
        
    }
    
    if(PageNum==5)
    {
       var pos=UserInfo.CityList[CityNum].Pos
       var x=Math.floor(pos%400);
       if(x==0)x=400;
       var y=(Math.floor((pos-1)/400)+1); 
       ViewNumY=y-4;
       ViewNumX=x-4;
       if(ViewNumY<1)
            ViewNumY=1;
       if(ViewNumX<1)
            ViewNumX=1;     
       if(ViewNumY>400-9+1)
            ViewNumY=400-9+1;
       if(ViewNumX>400-9+1)
            ViewNumX=400-9+1;        
    }
    var userName = UserInfo.Name;
    Main.GetUserSub(userName,cb_GetUserSubFromSelf);       
}

function cb_GetUserSubFromSelf(result)
{
    if(DataValidate(result)==false) return;
    UserSubInfo=result.value;
    if(UserSubInfo!=null && UserSubInfo.Age==-1)
    UserSubInfo=null;  
    var pos=UserInfo.CityList[CityNum].Pos;
    Main.ChessIsOpen(cb_ChessIsOpen);
}

function cb_ChessIsOpen(result)
{
    if(DataValidate(result)==false) return;
    ChessIsOpen=result.value;
    Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息 
}

//获得城市内政信息
function cb_GetCityInteriorInfo(result)
{
    if(DataValidate(result)==false) return;
    CanReturnSign=0;
    NeedUpdate=false;
    CityInteriorInfo=result.value;
    if(CityInteriorInfo!=null)
    {
        $("#area").html(CityInteriorInfo.Area.toString());
        $("#areaRoom").html(CityInteriorInfo.AreaRoom.toString());
        $("#child").html(CityInteriorInfo.Child.toString());
        $("#bloom").html(CityInteriorInfo.Bloom.toString()); 
        $("#childRate").html(CityInteriorInfo.ChildRate.toString());
        $("#r_gold").html(CityInteriorInfo.Gold.toString());
        $("#r_money").html(CityInteriorInfo.Money.toString());
        $("#moneyRoom").html(CityInteriorInfo.MoneyRoom.toString());
        $("#r_food").html(CityInteriorInfo.Food.toString());
        $("#foodRoom").html(CityInteriorInfo.FoodRoom.toString());
        $("#r_men").html(CityInteriorInfo.Men.toString());
        $("#menRoom").html(CityInteriorInfo.MenRoom.toString());
        $("#moneySpeed").html(CityInteriorInfo.MoneySpeed.toString());
        $("#foodSpeed").html(CityInteriorInfo.FoodSpeed.toString());
        $("#menSpeed").html(CityInteriorInfo.MenSpeed.toString());
        $("#userLevel").html(UserLevel[CityInteriorInfo.Level-1]);
    }
    //同步服务器时间
    $("#serverTime").text(ServerInfo.Time);    
        
    CreatePage();//创建页面
    
}


//请求换页...
function ChangePage(id)
{
    var t=id.split("_");
    if(t[0]=="pp" && t[1]==6)
    {
        $("#defence_chess").hide();
        $("#attack_chess").hide();
        CityInAttChessSign=1;
    }
    var pageNum=parseInt(t[1],10);
    if(PageNum==pageNum)
        return;   
    Clear();
    HidePopUp();
    DataTranslateBegin();
    Main.SetPageInfo(CityNum,pageNum,cb_SetPageInfo);
    WorldIndex=""; 
}

//换页数据读取
function cb_SetPageInfo(result)
{
    if(DataValidate(result)==false) return;
    
    var s=result.value;
    var t=s.split("_");
    
    CityNum=parseInt(t[0],10);
    PageNum=parseInt(t[1],10);
    
    //确定地图显示区域
    if(PageNum==5)
    {
       var pos=UserInfo.CityList[CityNum].Pos
       var x=Math.floor(pos%400);
       if(x==0)x=400;
       var y=(Math.floor((pos-1)/400)+1); 
       ViewNumY=y-4;
       ViewNumX=x-4;
       if(ViewNumY<1)
            ViewNumY=1;
       if(ViewNumX<1)
            ViewNumX=1;     
       if(ViewNumY>400-9+1)
            ViewNumY=400-9+1;
       if(ViewNumX>400-9+1)
            ViewNumX=400-9+1;       
    }
    if(PageNum==2)
    {
       ViewNumX=10;
       ViewNumY=16;
    }
    
    TargetNav();
    ControlTarget=1;//将控制目标变为事件
    ClickPos=0;//将点击位置变为空
    ClickHeroIndex=-1;//将点击侠客置为空
    
    ViewMailType=0;//将默认邮件类型恢复
    ViewItemPage=1;//将道具当前页在置为1
    Main.GetUserInfo(cb_GetUserInfo);//更换页面
}

function Clear()
{
    EventInfo=null; 
    MapUnitInfo=null;
    CityInteriorInfo=null;
    LandformInfo=null;
    PosBuildingInfo=null;
    TheBulidingInfo=null;
    TechnicInfo=null;
    HeroInfo=null;
    TheHeroInfo=null;
    CorpsInfo=null;
    TheCorpsInfo=null;
    ItemInfo=null;
    TheItemInfo=null;
    CityInfo=null;
    MailInfo=null;
    currWarfareType=1;  
    currWarfareModel=1; 
    currWarfareArea=0;  
    if($.browser.msie) 
        CollectGarbage();
}

//更换导航样式
function TargetNav()
{
    var id="#p_"+LastPageNum;
    var tid="#p_"+PageNum;
    var css="nav_a_"+LastPageNum;
    var tcss="nav_a_"+PageNum+"_"+"t";
    
    if(LastPageNum!=PageNum)
    {
        $(id).removeClass();
        $(id).addClass(css);
    }
    $(tid).removeClass();
    $(tid).addClass(tcss);
    
    LastPageNum=PageNum;
}

var ChangeViewState=0
//改变显示区域
function NextRange(way,range)
{   
    if(ChangeViewState!=0)
        return;
            
    var m=0;
    var n=0;
    
    switch(PageNum)
    {
        case 2:
            m=30;
            n=13;
            break;
        case 5:
            m=400;
            n=9;
            break;    
        default:       
            return;
    }
    
    switch (way)
    {
        case 1:
            if(ViewNumY==1)
                return;
            ViewNumY-=range;
            if(ViewNumY<1)
                ViewNumY=1;
            break;
        case 2:
            if(ViewNumY==m-n+1)
                return;
            ViewNumY+=range;
            if(ViewNumY>m-n+1)
                ViewNumY=m-n+1;
            break;
        case 3:
            if(ViewNumX==1)
                return;
            ViewNumX-=range;
            if(ViewNumX<1)
                ViewNumX=1;
            break;
        case 4:
            if(ViewNumX==m-n+1)
                return;
            ViewNumX+=range;
            if(ViewNumX>m-n+1)
                ViewNumX=m-n+1;
            break;
        default:
            break;          
     }
     WorldIndex="";
     ClickPos=0;
          
     ChangeViewState=1;
     
     CreatePage();
     
     DataTranslateBegin();    
}

//大地图转跳
function JumpToRange()
{
    var x=$("#WorldMapX").val();
    var y=$("#WorldMapY").val();
    x=x.replace(/\D+/g,'');
    y=y.replace(/\D+/g,'');
    if(x=="")
        x=1;
    if(y=="")
        y=1;      
    $("#WorldMapX").val(x);
    $("#WorldMapY").val(y);
    
    var max=0;
    var l = 0;
    switch( PageNum )
    {
        case 2:
            max = 30;
            l = 13;
            break;
        case 5:
            max = 400;
            l = 9;
            break;    
        default:       
            return;
    }
    
    var VX = parseInt(x, 10);
    var VY = parseInt(y, 10);
    
    VX = VX - (l-1)/2;
    VY = VY - (l-1)/2;
    
    if( VX == 1 )
        return;
        
    if( VX < 1 )
        VX = 1;
        
    if( VX == max )
        return;
        
    if( VX > max-l+1 )
        VX = max-l+1;
        
    if( VY == 1 )
        return;
        
    if( VY < 1 )
        VY = 1;
        
    if( VY == max )
        return;
        
    if( VY > max-l+1)
        VY = max-l+1;
        
    ViewNumX = VX;
    ViewNumY = VY;
    //alert("x"+ViewNumX+"y"+ViewNumY);
     
     WorldIndex="";   
     CreatePage();
     DataTranslateBegin(); 
    
}

//返回自己城市
function BackCity()
{
    var pos = UserInfo.CityList[CityNum].Pos;
    ViewNumY = Math.floor(pos/400) - 4 + 1;
    ViewNumX = pos % 400 - 4;
    if( ViewNumY < 1 )
        ViewNumY = 1;
    if( ViewNumX < 1 )
        ViewNumX = 1;     
    if( ViewNumY > 400 - 4 )
        ViewNumY = 1;
    if( ViewNumX > 400 - 4 )
        ViewNumX = 1; 
     WorldIndex="";
     CreatePage();
     DataTranslateBegin(); 
}

//返回从属山寨
function SubordinateCity(id)
{
    AppendantNpcInfos=Main.GetAllAppendantNpcInfo().value;
    if(AppendantNpcInfos!=null)
    {
         ShowPopUp(id);
    }
    else
        ShowMessageBox(Lang["Main_32"]);
    
}

//数据传输开始
function DataTranslateBegin()
{
    $("#waiting").show();

}

//数据传输结束
function DataTranslateEnd()
{
    $("#waiting").hide(); 
}
