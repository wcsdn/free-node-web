//关于各种版本的处理....
var ImgUrl = "img/";
var ToMain="";
var ToAccount="";
var ToGold="";
var ToExtend="";
var ToExit="";
var ToForum="";
var ToMusic="";
var ToStory="";
var ToLittleGame="";
var ToBattle="";
var VName=Lang["Version_1"];
var VNameList = {
                    "0":Lang["Version_2"],
                    "1":Lang["Version_1"],  // Default CN version
                    "45":Lang["Version_3"],
                    "49":Lang["Version_4"],
                    "46":Lang["Version_5"],
                    "47":Lang["Version_6"],
                    "58":Lang["Version_7"],
                    "104":Lang["Version_8"],
                    "105":Lang["Version_9"],
                    "106":Lang["Version_10"],
		            "107":Lang["Version_11"],
		            "115":Lang["Version_12"],	
		            "109":Lang["Version_13"],
		            "111":Lang["Version_14"],
                    "il01":Lang["Version_15"],
                    "il02":Lang["Version_19_l"],
                    "94101":Lang["Version_20"],
                    "2157":Lang["Version_21"]
             	}


var VNum=Lang["Version_16"]+"cn_v1.1.5";                 
                 


function DoVersion()
{
    var who=VersionInfo[2];
    var t=who.split("|");
    var html="";
    
    //台湾
     if(VersionInfo[0]=="tw")
     {
         ImgUrl = "img/TW/";
     } 
    
    //51Wan
    if(VersionInfo[0]=="51wan")
    {     
        ToMain="http://www.51wan.com/jx/";
        ToAccount="http://user.51wan.com";
        ToGold=VersionInfo[3];
        ToExit="http://passport1.51wan.com/game/logout.php?Name=Qikuai&who="+t[0];
        ToForum="http://passport1.51wan.com/game/forumbbs.php?Name=Qikuai&who="+t[0];
        ToMusic="http://www.51wan.com/jx/200811/10898.shtml";
        ToStory="http://www.51wan.com/jx/200811/10831.shtml";
        ToLittleGame="http://www.51wan.com/jx/200811/10912.shtml";
        $("#Customer").attr("href",VersionInfo[5]);
        if(t[0]!="0")
        {
            $("#to_main").remove();
            $("#to_account").remove();
            $("#to_extend").remove();
        }
        
        if(t[0]=="7288")
        {
           var html="<a href='http://jx.yhgame.cn/news_list.aspx?news_type=%e6%96%b0%e9%97%bb%e5%85%ac%e5%91%8a' target='_blank' style='color:#ce0000'><b>"+Lang["Version_17"]+"</b></a>";
           $(".gonggao").html(html);
        }
                   
    }   
    //新浪
    else if (VersionInfo[0]=="sina")
    {
        ToMain="http://games.sina.com.cn/jxweb/";
        ToGold="http://sinapay.sina.com.cn/utg/utgGameChoose.php?gameid=01000703";
        ToForum="http://forum.games.sina.com.cn/index.php?board=1.0";
        ToExit="http://games.sina.com.cn/jxweb/";
        ToMusic="http://www.51wan.com/jx/200811/10898.shtml";
        ToStory="http://www.51wan.com/jx/200811/10831.shtml";
        ToLittleGame="http://www.51wan.com/jx/200811/10912.shtml";
        
        $("#to_account").remove();
        $("#to_extend").remove();           
    }
    //马来
    else if (VersionInfo[0]=="il")
    {
        ToMain="http://jxweb.i1play.com";
	    ToGold="http://jxweb.i1play.com/topup_jxweb.php";
        ToForum="http://forum.i1play.com";
        ToMusic="http://jxweb.i1play.com/main.php?sec=Misc";
        ToStory="http://jxweb.i1play.com/main.php?sec=Misc";
        ToLittleGame="http://jxweb.i1play.com/main.php?sec=Misc";
        if(VersionInfo[1]=="il01")
        ToExit="http://jxweb.i1play.com/logout.php?s=1";
        if(VersionInfo[1]=="il02")
        ToExit="http://jxweb.i1play.com/logout.php?s=2";
        $("#to_account").remove();
        //$("#to_gift").remove();
        $("#to_extend").remove();  
        $("#to_onlineNum").remove();   
    }
    //酷风车
    else if(VersionInfo[0]=="kfc")
    {
        $("#to_extend").remove(); 
        $("#to_account").remove();
        if(t[0]=="7110")
        {
            ToMain="http://game.koowo.com/g/st/Game?id=5";
            ToForum="http://bbs.koowo.com/bbs/s2/frame.jsp?bid=35308";
            ToGold="https://pay.kuwo.cn/pay/";
            ToExit="http://game.koowo.com/g/st/Game?id=5 ";
        }
        else if(t[0]=="7112")
        {
            ToMain="http://game.funshion.com/jxqy/";
            ToForum="http://group.funshion.com/thread-htm-fid-200.html";
            ToGold="http://game.funshion.com/jxqy/pay.php";
            ToExit="http://game.funshion.com/jxqy/";
        }
        else if(t[0]=="7111")
        {
            ToMain="http://jx.u966.com/";
            ToForum="http://www.u966.com/bbs/bbs.php";
            ToGold="http://www.u966.com/pay/payforgame/ipayforgame2/20/70/webgame/";
            ToExit="http://jx.u966.com/";
        }
	    else 
	    {   
	        ToMain="http://game.koowo.com/g/st/Game?id=5";
            ToForum="http://bbs.koowo.com/bbs/s2/frame.jsp?bid=35308";
            ToGold="https://pay.koowo.com/pay/index.jsp";
            ToExit="http://game.koowo.com/g/st/Game?id=5 ";
	    }
    }
    //酷狗
    else if(VersionInfo[0]=="kg")
    {
        $("#to_extend").remove(); 
        $("#to_account").remove();
        ToMain="http://jxqy.kugou.com";
        ToForum="http://games.kugou.com/bbs";
        ToGold="http://pay.kugou.com/buyjx.aspx";
        ToExit="http://jxqy.kugou.com";
    }
    //PPS
    else if(VersionInfo[0]=="pps")
    {
        ToMain = "http://g.pps.tv/jx";
        ToAccount = "http://i.pps.tv/";
        ToExit = "http://g.pps.tv/jx";
        ToForum = "http://joy.pps.tv/g7157/";
        ToGold="http://pay.pps.tv/game_jxqy.php?server_type=0";
        //$("#to_gift").remove();
        $("#to_extend").remove();  
    }
    //台湾
    else if(VersionInfo[0] == "tw")
    {
        ToMain = "http://jx.941wan.com.tw/index.html";
        ToAccount = "http://jx.941wan.com.tw/jx-memb-index.html";
        ToGold = "http://jx.941wan.com.tw/jx-memb-index.html";
        ToForum = "http://www.gamebase.com.tw/forum/60327";
        ToExit = "http://jx.941wan.com.tw/index.html";
        $("#to_extend").remove();  
    }
    //叶子猪 
    else if(VersionInfo[0] == "yzz")
    {
        ToMain="http://game.yezizhu.com/jx/";
        ToGold="http://pay.51wan.com/pay2/payment_trade_mode.php?gamename=jx&coid=7825&serverid=2157";
        ToForum="http://bbs.yezizhu.com/forumdisplay.php?fid=1416";
        ToExit="http://game.yezizhu.com/checkUser.php?out=jx";
        //ToMusic="http://www.51wan.com/jx/200811/10898.shtml";
        //ToStory="http://www.51wan.com/jx/200811/10831.shtml";
        //ToLittleGame="http://www.51wan.com/jx/200811/10912.shtml";
        $("#Customer").remove();
        $("#to_account").remove();
        $("#to_extend").remove();   
    } 
    else
    {
        ToExit="default.aspx";
        ToMain="";
        ToGold="";
        ToForum="";
    }
    
    $("#to_main").attr("href",ToMain);
    $("#to_account").attr("href",ToAccount);
    $("#to_gold").attr("href",ToGold);
    $("#to_forum").attr("href",ToForum);
    
    VName=VNameList[VersionInfo[1]];
    
    
    document.title=Lang["Version_18"]+VNum
    html=null;
}


