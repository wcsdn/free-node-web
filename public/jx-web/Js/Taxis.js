
var ViewTaxisPage=1;
var MaxHeroPage;
var MaxPlayerPage;
var TaxisType=1;//1:玩家排行类型2:侠客排行类型3:战勋排行类型4:名望排行类型5:声望排行类型6:领地排行7:个人竞技排行8:帮派竞技排行
var TaxisSign=false;
//var InsSign=false;
var FindTaxisWord="";
var InsWinnerType = [Lang["Taxis_25"],Lang["Taxis_26"],Lang["Taxis_27"],Lang["Taxis_28"],Lang["Taxis_29"]];
var FirstLoadUserIndex=-1;//是否第一次加载
var RankIsNull=false;//是否出现未进入排行榜

//创建排行页面框架
function CreateTaxisPage()
{
    var html="";
    html+="<div id=\"taxis\">";
    html+="<table width=\"545\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr>";
    html+="<td><a id=\"taxistype_1\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_1"]+"</a></td>";//玩家排行
    html+="<td><a id=\"taxistype_2\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_2"]+"</a></td>";//侠客排行
    html+="<td><a id=\"taxistype_3\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_30"]+"</a></td>";//战勋排行
    html+="<td><a id=\"taxistype_5\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_36"]+"</a></td>";//声望排行
    html+="<td><a id=\"taxistype_4\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_35"]+"</a></td>";//名望排行
    html+="<td><a id=\"taxistype_6\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_91"]+"</a></td>";//领地排行
    if(ChessIsOpen==1)
    {
        html+="<td><a id=\"taxistype_7\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_103"]+"</a></td>";//个人竞技
        html+="<td><a id=\"taxistype_8\" class=\"linkstyle_3\" onmousedown=\"ChangeTaxisType(this.id)\" href=\"#\">"+Lang["Taxis_96"]+"</a></td>";//帮派竞技
    }
    html+="</tr></table>";
    html+="<div id=\"taxiscontent\">";
    html+="<div id=\"taxislogo\"></div>";
    html+="<div id=\"taxistitle\">";
    html+="</div>";  
    html+="<div id=\"taxismain\">";
    html+="</div>";   
    html+="<div id=\"taxisfoot\">";
    html+="</div>";
    html+="</div></div>";
    var tree=document.getElementById("mainpic");
    tree.innerHTML=html;   
    html=null;
}

//请求排行榜页面信息
function FreshTaxisPage()
{
    //如果为玩家排行
    if(TaxisType==1 || TaxisType==3 || TaxisType==4 || TaxisType==5 || TaxisType==6 || TaxisType==7 || TaxisType==8)
    {   
        if(TaxisSign==true)
        {
            if(TaxisType==1)
                Main.GetUserRankByPage(ViewTaxisPage,20,cb_GetTaxis)//翻页/跳转调用
            else if(TaxisType==3)
               Main.GetInsigniaRankByPage(ViewTaxisPage,20,cb_GetTaxis);
            else if(TaxisType==4)
                Main.GetFameRankByPage(ViewTaxisPage,20,cb_GetTaxis)
            else if(TaxisType==5)
                Main.GetPrestigeRankByPage(ViewTaxisPage,20,cb_GetTaxis)
            else if(TaxisType==6)
                Main.GetTerritoryRankByPage(ViewTaxisPage,20,cb_GetTaxis)
            else if(TaxisType==7)//个人竞技
                Main.GetChessRankByPage(ViewTaxisPage,20,cb_GetTaxis);
            else if(TaxisType==8)//帮派竞技
                Main.GetUnionRankByPage(ViewTaxisPage,20,cb_GetTaxis);
        }
        else
        {
            if(FindTaxisWord=="")
            {
                var userName = UserInfo.Name;
                if(TaxisType==1)
                    Main.GetUserRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==3)
                    Main.GetInsigniaRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==4)
                    Main.GetFameRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==5)
                    Main.GetPrestigeRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==6)
                    Main.GetTerritoryRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==7)//个人竞技
                    Main.GetChessRankByUserName(userName,cb_GetTaxis);
                else if(TaxisType==8)//帮派竞技
                    Main.GetMyOrgnizeInfo(cb_GetMyUnionInfo); 
            }
            else//搜索
            {
                if(TaxisType==1)
                    Main.GetUserRankByUserName(FindTaxisWord,cb_GetTaxis);
                else if(TaxisType==4)
                    Main.GetFameRankByUserName(FindTaxisWord,cb_GetTaxis);
                else if(TaxisType==5)
                    Main.GetPrestigeRankByUserName(FindTaxisWord,cb_GetTaxis);
                else if(TaxisType==6)
                    Main.GetTerritoryRankByUserName(FindTaxisWord,cb_GetTaxis);
                else if(TaxisType==7)
                    Main.GetChessRankByUserName(FindTaxisWord,cb_GetTaxis);
                else if(TaxisType==8)
                    Main.GetUnionRankByUnionName(FindTaxisWord,cb_GetTaxis);
            }
        }
    }
    //如果为侠客排行
    if(TaxisType==2)
    {
       Main.GetHeroRankByPage(ViewTaxisPage,20,cb_GetTaxis);
    }
    DataTranslateBegin();
}

//获得帮派信息
function cb_GetMyUnionInfo(result) 
{
    if(DataValidate(result)==false) return;
    OrgInfo = result.value;  
    if(OrgInfo==null || OrgInfo.MyOrganize==null || OrgInfo.MyOrganize.OrgName==null)
        Main.GetUnionRankByPage(ViewTaxisPage,20,cb_GetTaxis); 
    else 
        Main.GetUnionRankByUnionName(OrgInfo.MyOrganize.OrgName,cb_GetTaxis); 
}

//显示玩家排行信息//显示侠客排行信息
function cb_GetTaxis(result)
{
    if(TaxisType==7 || TaxisType==8)
    {
        PlayerTaxisInfo=null;
    } 
    if(DataValidate(result)==false) return;
        PlayerTaxisInfo=result.value;
    if(PlayerTaxisInfo!=null && PlayerTaxisInfo[0]!=null && PlayerTaxisInfo[0].Rank==-1)
        PlayerTaxisInfo=null; 
    CreateTaxisTitle();
    CreateTaxisMain();
    CreateTaxisFoot();
    if(TaxisType==1)
        Main.GetPlayerNum(cb_GetPlayerNum);
    if(TaxisType==2)
        Main.GetHeroCount(cb_GetHeroCount);
    if(TaxisType==3)
        Main.GetInsPlayerNum(cb_GetPlayerNum);
    if(TaxisType==4)
        Main.GetFameRankCount(cb_GetPlayerNum);
    if(TaxisType==5)
        Main.GetPrestigeRankCount(cb_GetPlayerNum);
    if(TaxisType==6)    
        Main.GetTerritoryPlayerNum(cb_GetPlayerNum);
    if(TaxisType==7)
        Main.GetChessNum(cb_GetPlayerNum);//个人竞技
    if(TaxisType==8)
        Main.GetUnionNum(cb_GetPlayerNum);//帮派竞技
}

//更改玩家总页数显示,根据此玩家用户名获取排行信息
function cb_GetPlayerNum(result)
{
    if(DataValidate(result)==false) return;
        MaxPlayerPage=result.value;
    var index;
    if(PlayerTaxisInfo!=null)
    {
        if(FindTaxisWord!="")
        {
            for(var i=0;i<PlayerTaxisInfo.length;i++)
            {
                if(PlayerTaxisInfo[i].MySelf==1)
                    index = i;
            }
            var s="#taxispalyer_"+index;
            $(s).addClass("taxis_special");
        }
        else
        {
            var userName = UserInfo.Name;
            for(var i=0;i<PlayerTaxisInfo.length;i++)
            {
                if(PlayerTaxisInfo[i].MySelf==1)
                index = i;
            }
            var s="#taxispalyer_"+index;
            $(s).addClass("taxis_special");
        }
        //如果是第一次加载玩家排行
        if(FirstLoadUserIndex==-1 && RankIsNull==false)
        {
            ViewTaxisPage = parseInt(PlayerTaxisInfo[index].Rank/20+1);
            FirstLoadUserIndex=index;
        }
        else if(FirstLoadUserIndex==-1 && RankIsNull==true)
        {
            ViewTaxisPage = parseInt(PlayerTaxisInfo[1].Rank/20+1);
        }
        else
        {  
            ViewTaxisPage = parseInt(PlayerTaxisInfo[FirstLoadUserIndex].Rank/20+1);
        }
    }
    $("#nowplayer").text(ViewTaxisPage);
    $("#maxplayer").text(MaxPlayerPage);
    TaxisSign=false;    
    //InsSign=false;
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

//更改侠客总页数显示,根据页数和显示条目数请求侠客信息
function cb_GetHeroCount(result)
{
    if(DataValidate(result)==false) return;
        MaxPlayerPage=result.value;
    $("#nowplayer").text(ViewTaxisPage);
    $("#maxplayer").text(MaxPlayerPage);
    TaxisSign=false;
    //InsSign=false;
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

//更改个人竞技排行榜页数实现
function cb_GetChessNum(result)
{
    if(DataValidate(result)==false) return;
    MaxPlayerPage=result.value;
    var index=-1;
    if(TaxisSign!=true && PlayerTaxisInfo!=null)
    {
       for(var i=0;i<PlayerTaxisInfo.length;i++)
        {
            if(PlayerTaxisInfo[i].MySelf==1)
            index = i;
        }
        var s="#taxispalyer_"+index;
        $(s).addClass("taxis_special");
        ViewTaxisPage = parseInt(PlayerTaxisInfo[index].Rank/20+1);
    }
    $("#nowplayer").text(ViewTaxisPage);
    $("#maxplayer").text(MaxPlayerPage);
    TaxisSign=false;
    FindTaxisWord=""; 
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

////更改战勋排行榜页数现实
//function cb_GetInsPlayerNum(result)
//{
//    if(DataValidate(result)==false) return;
//        MaxPlayerPage=result.value;
//    var ins ;
////    if(InsSign!=true)
////    {
//        for(var i=0;i<PlayerTaxisInfo.length;i++)
//        {
//            if(PlayerTaxisInfo[i].MyselfTag==1)
//            ins=i;
//        }
//            var s="#Inspalyer_"+ins;
//            $(s).addClass("taxis_special"); 
////    }
//    $("#nowplayer").text(ViewTaxisPage);
//    $("#maxplayer").text(MaxPlayerPage);
//    //InsSign=false;
//    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
//}

//排行榜表头信息
function CreateTaxisTitle()
{
    var html="";
    var s="#taxistype_"+TaxisType;
    $(s).css({"font-weight":"bold","text-decoration":"underline"})
    if(TaxisType==1 || TaxisType==3)
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_3"]+"</td>";
        html+="<td width=\"121\">"+Lang["Taxis_4"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_5"]+"</td>";
        //html+="<td width=\"87\">玩家村镇坐标</td>";
        html+="<td width=\"104\">"+Lang["Taxis_6"]+"</td>";
        if(TaxisType==1)
            html+="<td width=\"88\">"+Lang["Taxis_7"]+"</td>";
        else
            html+="<td width=\"88\">"+Lang["Taxis_31"]+"</td>";
        html+="</tr></table>";
    }
    else if(TaxisType==4)//名望排行
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_37"]+"</td>";
        html+="<td width=\"121\">"+Lang["Taxis_38"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_39"]+"</td>";
        html+="<td width=\"88\">"+Lang["Taxis_40"]+"</td>";
        html+="<td width=\"104\">"+Lang["Taxis_41"]+"</td>";
        html+="</tr></table>";
    }
    else if(TaxisType==5)//声望排行
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_42"]+"</td>";
        html+="<td width=\"121\">"+Lang["Taxis_43"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_44"]+"</td>";
        html+="<td width=\"88\">"+Lang["Taxis_45"]+"</td>";
        html+="<td width=\"104\">"+Lang["Taxis_46"]+"</td>";
        html+="</tr></table>";
    }
    else if (TaxisType==6)//领地排行
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_3"]+"</td>";//玩家名次
        html+="<td width=\"121\">"+Lang["Taxis_4"]+"</td>";//玩家名称
        html+="<td width=\"156\">"+Lang["Taxis_33"]+"</td>";//所属帮派
        html+="<td width=\"88\">"+Lang["Taxis_89"]+"</td>";//占领村镇数
        html+="<td width=\"104\">"+Lang["Taxis_90"]+"</td>";//玩家威望
        html+="</tr></table>";
    }
    else if(TaxisType==7)//个人竞技
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_3"]+"</td>";
        html+="<td width=\"121\">"+Lang["Taxis_4"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_104"]+"</td>";
        html+="<td width=\"104\">"+Lang["Taxis_105"]+"</td>";
        html+="<td width=\"88\">"+Lang["Taxis_95"]+"</td>";
        html+="</tr></table>";
    }
    else if(TaxisType==8)//帮派竞技
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"69\">"+Lang["Taxis_97"]+"</td>";
        html+="<td width=\"121\">"+Lang["Taxis_98"]+"</td>";
        html+="<td width=\"106\">"+Lang["Taxis_99"]+"</td>";
        html+="<td width=\"154\">"+Lang["Taxis_105"]+"</td>";
        html+="<td width=\"88\">"+Lang["Taxis_95"]+"</td>";
        html+="</tr></table>";
    }
    else
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr>";
        html+="<td width=\"89\">"+Lang["Taxis_8"]+"</td>";
        html+="<td width=\"89\">"+Lang["Taxis_9"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_10"]+"</td>";
        html+="<td width=\"156\">"+Lang["Taxis_11"]+"</td>";
        html+="<td width=\"48\">"+Lang["Taxis_12"]+"</td>";
        html+="</tr></table>";
    }
    var tree=document.getElementById("taxistitle");
    tree.innerHTML=html;   
    html=null;
}

//排行榜主体内容
function CreateTaxisMain()
{
    var player;
    var html="";
    DataTranslateEnd();
    if(PlayerTaxisInfo!=null)
    {
        html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tbody>";
        for(var i=0;i<PlayerTaxisInfo.length;i++)
        {
            if(PlayerTaxisInfo[i]!=null)
            {
                player=PlayerTaxisInfo[i];
                var x=Math.floor(player.CityPos%400);
                if(x==0)x=400;
                var y=(Math.floor((player.CityPos-1)/400)+1);
                if(TaxisType==1 || TaxisType==3)
                { 
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.UserName+"</td>";
                    html+="<td width=\"156\">"+player.CityName+"</td>";
                    //html+="<td width=\"94\">("+x+","+y+")</td>";
                    if(player.Organise==null)
                        html+="<td width=\"104\">"+Lang["Taxis_13"]+"</td>";
                    else
                        html+="<td width=\"104\">"+player.Organise+"</td>";
                    if(TaxisType==1)
                        html+="<td width=\"88\">"+player.Bloom+"</td>";
                    else
                        html+="<td width=\"88\">"+player.Insignia+"</td>";
                    html+="</tr>";
                }
                else if(TaxisType==4)//名望排行
                { 
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.UserName+"</td>";
                    html+="<td width=\"156\">"+GetFameByFameLevel(player.FameLevel)+"</td>";
                    html+="<td width=\"94\">"+player.FameValue+"</td>";
                    html+="<td width=\"98\">"+player.Effect+"%</td>";
                    html+="</tr>";
                }
                else if(TaxisType==5)//声望排行
                { 
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.UserName+"</td>";
                    html+="<td width=\"156\">"+GetPrestigeByPrestigeLevel(player.PrestigeLevel)+"</td>";
                    html+="<td width=\"94\">"+player.PrestigeValue+"</td>";
                    html+="<td width=\"98\">"+player.Effect+"%</td>";
                    html+="</tr>";
                }
                else if(TaxisType==6)
                {
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.UserName+"</td>";
                    if(player.Organise==null)
                        html+="<td width=\"104\">"+Lang["Taxis_13"]+"</td>";
                    else
                        html+="<td width=\"104\">"+player.Organise+"</td>";
                    html+="<td width=\"94\">"+player.DependencyNum+"</td>";
                    html+="<td width=\"98\">"+player.WeiWang+"</td>";
                    html+="</tr>";
                }
                else if(TaxisType==7)//个人竞技
                {
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.UserName+"</td>";
                    html+="<td width=\"156\">"+UserLevel[player.Prosperity-1]+"</td>";
                    html+="<td width=\"104\">"+player.BattleWinNum+"/"+player.BattleDogfallNum+"/"+player.BattleFailNum+"</td>";
                    html+="<td width=\"88\">"+player.BattleWinNum+"</td>";
                    html+="</tr>"; 
                }
                else if(TaxisType==8)//帮派竞技
                {
                    html+="<tr id=\"taxispalyer_"+i+"\">";
                    html+="<td width=\"69\">"+player.Rank+"</td>";
                    html+="<td width=\"121\">"+player.OrgName+"</td>";
                    html+="<td width=\"106\">"+player.Level+"</td>";
                    html+="<td width=\"154\">"+player.BattleWinNum+"/"+player.BattleDogfallNum+"/"+player.BattleFailNum+"</td>";
                    html+="<td width=\"88\">"+player.BattleWinNum+"</td>";
                    html+="</tr>"; 
                }
                else//侠客排行
                {
                    html+="<tr>";
                    html+="<td width=\"89\">"+player.Rank+"</td>";
                    html+="<td width=\"89\">"+player.HeroName+"</td>";
                    html+="<td width=\"156\">"+player.CityName+"</td>";
                    html+="<td width=\"156\">"+player.UserName+"</td>";
                    html+="<td width=\"48\">"+player.HeroLevel+"</td>";
                    html+="</tr>"
                }
            }
        }
        html+="</tbody></table>";
    }
    else
    {
        if(FindTaxisWord=="")
        {
            switch(TaxisType)
            {
                 case 1:
                    html+="<p>"+Lang["Taxis_14"]+"</p>";
                    html+="<p>"+Lang["Taxis_15"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 4:
                    html+="<p>"+Lang["Taxis_47"]+"</p>";
                    html+="<p>"+Lang["Taxis_15"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 3:
                    html+="<p>"+Lang["Taxis_92"]+"</p>";
                    html+="<p>"+Lang["Taxis_93"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 5:
                    html+="<p>"+Lang["Taxis_48"]+"</p>";
                    html+="<p>"+Lang["Taxis_15"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 6:
                    html+="<p>"+Lang["Taxis_94"]+"</p>";
                    html+="<p>"+Lang["Taxis_15"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 7:
                    html+="<p>"+Lang["Taxis_100"]+"</p>";
                    html+="<p>"+Lang["Taxis_15"]+"</p>";
                    RankIsNull=true;
                    break;
                 case 8:
                    html+="<p>"+Lang["Taxis_101"]+"</p>";
                    html+="<p>"+Lang["Taxis_45"]+"</p>";
                    RankIsNull=true;
                    break;
                 default:
                    break;
            }        
        }
        else
        {
            html+="<p>"+Lang["Taxis_16"]+"</p>";
        }
    }
    var tree=document.getElementById("taxismain");
    tree.innerHTML=html;   
    html=null;
    Teacher_Open();
}

//表尾
function CreateTaxisFoot()
{
    var html="";
    html+="<table width=\"498\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    if(TaxisType==1||TaxisType==4||TaxisType==5 || TaxisType==6 || TaxisType==7|| TaxisType==8)
    {
        html+="<tr><td width=\"90\"><input onkeydown=\" var e=window.event || arguments[0];if(e.keyCode==13){SerachTaxis();}\" id=\"taxisfind_player\" class=\"input_honour\" /></td>";
        html+="<td width=\"105\" class=\"taxis_pad\"><a href=\"#\" onmousedown=\"SerachTaxis()\" class=\"linkstyle_1\">"+Lang["Taxis_17"]+"</a></td>";
    }
    else
        html+="<td width=\"105\" class=\"taxis_pad\"></td>";
    html+="<td width=\"60\">"+Lang["Taxis_18"]+"<input id=\"taxisnum\"  class=\"input_page\" />"+Lang["Taxis_19"]+"</td>";
    html+="<td width=\"92\" class=\"taxis_pad\"><a onmousedown=\"ChangeTaxisPage()\" href=\"#\" class=\"linkstyle_1\">"+Lang["Taxis_20"]+"</a></td>";
    html+="<td width=\"50\"><a onmousedown=\"TurnTaxisPage(true)\" href=\"#\">"+Lang["Taxis_21"]+"</a></td>";
    html+="<td width=\"50\"><a onmousedown=\"TurnTaxisPage(false)\" href=\"#\">"+Lang["Taxis_22"]+"</a></td>";
    html+="<td width=\"45\"><span id=\"nowplayer\">0</span>/<span id=\"maxplayer\">0</span></td>";
    html+="</table>";
    var tree=document.getElementById("taxisfoot");
    tree.innerHTML=html;   
    html=null;
}

//点击不同类型排行执行
function ChangeTaxisType(id)
{
    FindTaxisWord="";
    $("taxisfind_player").val("");
    var s="#taxistype_"+TaxisType;
    $(s).css({"font-weight":"normal","text-decoration":"none"})
    var t=id.split("_");
    TaxisType=parseInt(t[1]);
    ViewTaxisPage=1;
    FirstLoadUserIndex=-1;
    FreshTaxisPage();
}

//点击翻页显示
function TurnTaxisPage(forward)
{
    if(forward==true)//上一页
    {
        if(ViewTaxisPage<=1)
            return;
        ViewTaxisPage--;
        TaxisSign=true;
        //InsSign=true;
    }
    else//下一页
    {
        if(ViewTaxisPage>=MaxPlayerPage)
        return;
        ViewTaxisPage++;
        TaxisSign=true;
        //InsSign=true;
    }
    FreshTaxisPage();
}

//根据输入跳转排行页面
function ChangeTaxisPage()
{
    var page = $("#taxisnum").val();
    var r = IsInteger(page);//判断是否为数字
    if(r!=0)
    {
        if(r==1)
            ShowMessageBox(Lang["Taxis_23"]);
        else
            ShowMessageBox(Lang["Taxis_24"]);
        return;
    }
    if(page>=1 && page<=MaxPlayerPage)
    {
        ViewTaxisPage = page;
        TaxisSign=true;
        //InsSign=true;
        FreshTaxisPage();
    }
    $("#taxisnum").val("");
}

//搜索排行
function SerachTaxis()
{
    FindTaxisWord=$("#taxisfind_player").val();
    FreshTaxisPage();
}

//查看英雄榜
function GetSeeHeros()
{
    Main.GetUserHeros(CityInfo.Pos,cb_GetUserHeros);
}
var HeroInsInfo;

function cb_GetUserHeros(result)
{
    if(DataValidate(result)==false) return;
    HeroInsInfo=result.value;
    PopUpSeeHeros();
}

//显示英雄榜
function PopUpSeeHeros()
{
    var html="";
    var left=GetLeftValue(400)
    $("#popup").css("left",left);
    $("#popup").css("top","240px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<div style=\"padding-left:10px;text-align:left;padding-top:5px;line-height:14px;\">";
    html+="<table width=\"350\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"63\">&nbsp;</td><td width=\"111\"><b>"+Lang["Taxis_32"]+"</b></td><td width=\"111\"><b>"+Lang["Taxis_33"]+"</b></td><td width=\"65\"><b>"+Lang["Taxis_34"]+"</td></b></tr>";
    for(var i=0;i<HeroInsInfo.length;i++)
    {
        if(HeroInsInfo[i]!=null)
        {
            html+="<tr>";
            html+="<td>"+InsWinnerType[HeroInsInfo[i].WinnerType-1]+"</td>";
            if(HeroInsInfo[i].UserName!=null)
            html+="<td>"+HeroInsInfo[i].UserName+"</td>";
            else
            html+="<td>"+Lang["Taxis_13"]+"</td>";
            if(HeroInsInfo[i].OrgName!=null)
            html+="<td>"+HeroInsInfo[i].OrgName+"</td>";
            else
            html+="<td>"+Lang["Taxis_13"]+"</td>";
            if(HeroInsInfo[i].WinnerTime!=null)
            html+="<td>"+HeroInsInfo[i].WinnerTime+"</td>";
            else
            html+="<td>00:00:00</td>";
            html+="</tr>";
        }
    }
    html+="</table>";
    html+="</div>";
    html+="</div>";         
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["Common_11"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","400px")
    $(".common_popup").css("height","120px")
    $(".common_popup1").css("width","396px")
    $(".common_popup1").css("height","106px")
    $(".common_popup2").css("width","370px")
    $(".common_popup2").css("height","80px")
    $(".common_popup2").css("margin-left","13px")
   $("#popup").show();
   $("#overlay").show();
}

//根据名望或声望等级获取防守或攻击实力加成
function GetAddByLevel(_level)
{
    switch (_level) {
        case 1 :
            return 0;
        case 2 :
            return 4;
        case 3 :
            return 6;
        case 4 :
            return 8;
        case 5 :
            return 10;
        case 6 :
            return 12;
        case 7 :
            return 14;
        case 8 :
            return 16;
        case 9 :
            return 18;
        case 10 :
            return 20;
        case 11 :
            return 23;
        case 12 :
            return 26;
        case 13 :
            return 29;
        case 14 :
            return 32;
        case 15 :
            return 35;
        case 16 :
            return 38;
        case 17 :
            return 41;
        case 18 :
            return 44;
        case 19 :
            return 47;
        case 20 :
            return 50;
        default : 
           return 0;
     } 
}

function GetFameByFameLevel(FameLevel)
{
    switch (FameLevel) {
        case 1 :
            return Lang["Taxis_49"];
        case 2 :
            return Lang["Taxis_50"];
        case 3 :
            return Lang["Taxis_51"];
        case 4 :
            return Lang["Taxis_52"];
        case 5 :
            return Lang["Taxis_53"];
        case 6 :
            return Lang["Taxis_54"];
        case 7 :
            return Lang["Taxis_55"];
        case 8 :
            return Lang["Taxis_56"];
        case 9 :
            return Lang["Taxis_57"];
        case 10 :
            return Lang["Taxis_58"];
        case 11 :
            return Lang["Taxis_59"];
        case 12 :
            return Lang["Taxis_60"];
        case 13 :
            return Lang["Taxis_61"];
        case 14 :
            return Lang["Taxis_62"];
        case 15 :
            return Lang["Taxis_63"];
        case 16 :
            return Lang["Taxis_64"];
        case 17 :
            return Lang["Taxis_65"];
        case 18 :
            return Lang["Taxis_66"];
        case 19 :
            return Lang["Taxis_67"];
        case 20 :
            return Lang["Taxis_68"];
        default :
           break;
    }
}

function GetPrestigeByPrestigeLevel(PrestigeLevel)
{
    switch (PrestigeLevel) {
        case 1 :
            return Lang["Taxis_69"];
        case 2 :
            return Lang["Taxis_70"];
        case 3 :
            return Lang["Taxis_71"];
        case 4 :
            return Lang["Taxis_72"];
        case 5 :
            return Lang["Taxis_73"];
        case 6 :
            return Lang["Taxis_74"];
        case 7 :
            return Lang["Taxis_75"];
        case 8 :
            return Lang["Taxis_76"];
        case 9 :
            return Lang["Taxis_77"];
        case 10 :
            return Lang["Taxis_78"];
        case 11 :
            return Lang["Taxis_79"];
        case 12 :
            return Lang["Taxis_80"];
        case 13 :
            return Lang["Taxis_81"];
        case 14 :
            return Lang["Taxis_82"];
        case 15 :
            return Lang["Taxis_83"];
        case 16 :
            return Lang["Taxis_84"];
        case 17 :
            return Lang["Taxis_85"];
        case 18 :
            return Lang["Taxis_86"];
        case 19 :
            return Lang["Taxis_87"];
        case 20 :
            return Lang["Taxis_88"];
        default :
           break;
    }
}