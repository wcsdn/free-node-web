
var Chessboard;//棋盘
var ChessPos;//棋盘位置
var ChessplayerList;//棋手列表
var ChessplayerID;//自己棋手的ID 
var ChessEvent=new Array();//棋盘待处理事件
var ChessEventAll;//棋盘已经过去的所有事件
var ChessPicSize=32;//棋盘格子大小
var ChessMoveRange=new Array();//操作实体可移动的范围
var ChessActionRange=new Array();//操作实体技能范围
var ChessControlObj;//当前操作实体
var ChessSelectPos;//当前选中的位置
var ChessTX;//当前操作实体的目标位置X
var ChessTY;//当前操作实体的目标位置Y
var ChessObjActionType=0;//当前实体的操作类型
var GetChessData=0;//从服务器获得事件数据
var ChessControlState=0;//当前操作状态
var ChessEventState=0;//当前用户事件更新状态
var ChessControlSpanTime=0;//用户操作间隔
var ChessunitNotMove=100;
var ChessCampName=new Array("己方单位","友方单位","敌方单位");
var ChessLandformImg=new Array("Img/2/d/14.gif","Img/2/d/15.gif","Img/2/d/16.gif");
var ChessResImg=new Array("Img/2/d/10.gif","Img/2/d/11.gif","Img/2/d/12.gif","Img/2/d/13.gif");
var ChessMoveRangeImg="Img/2/h/a/0a.gif";
var ChessActionRangeImg="Img/2/h/a/0b.gif";
var ChessActonTargetImg=new Array("Img/2/h/a/7.gif","Img/2/h/a/13.gif","Img/2/h/a/21.gif")
var ChessmanDieImg=new Array("Img/2/h/a/14.gif","Img/2/h/a/22.gif");
var ChessHeroCampImg=new Array("Img/2/h/a/1.gif","Img/2/h/a/2.gif","Img/2/h/a/3.gif");
var ChessHeroStateImg="Img/2/h/a/4.gif";
var ChessActionStateImg= new Array("Img/2/h/a/12.gif","Img/2/h/a/10.gif","Img/2/h/a/11.gif");
var ChessSkillEffImg=new Array("Img/2/h/a/15.gif","Img/2/h/a/17.gif","Img/2/h/a/18.gif","Img/2/h/a/19.gif","Img/2/h/a/20.gif","Img/2/h/a/15.gif","Img/2/h/a/16.gif","Img/2/h/a/37.gif","Img/2/h/a/38.gif");
var ChessEffActionImg=new Array("Img/2/h/a/24.gif","Img/2/h/a/27.gif","Img/2/h/a/37.gif","Img/2/h/a/38.gif")
var ChessActionFlagImg=new Array("Img/2/h/a/23.gif","Img/2/h/a/23.gif");
var ChessStateImg=new Array("Img/2/h/a/28.gif","Img/2/h/a/29.gif","Img/2/h/a/30.gif","Img/2/h/a/31.gif");
var ChessTimeShow=new Array("Img/2/h/a/33.gif","Img/2/h/a/32.gif");
var ChessHPImg="Img/2/h/a/35.gif";
var ChessHPBackImg="Img/2/h/a/36.gif";
var ChessQuickSelectImg="Img/2/h/a/34.gif";
var ColorHong="color:#9D080D;";
var ColorLv="color:#35c235;";
var ColorZong="color:#a77a57;";
var ColorLan="color:#70add9;";
var ColorHei="color:#000000";
var ChessClientTime;
var ChessEventListStr="";
var SkillAttr=new Array("普","冰","火","雷","毒","械","医","益","损");
var CityChessState = 0 ;//1:战场开启,0:战场关闭
var HeroEffList = new Array();//侠客效果列表:0=普抗点,1=冰抗点,2=火抗点,3=雷抗点,4=毒抗点,5=攻击点,6=移动点,7聚气加成，8侠客经验类
var ChessItemActionImg = new Array("Img/2/h/a/39.gif","Img/2/h/a/40.gif","Img/2/h/a/41.gif","Img/2/h/a/40.gif","Img/2/h/a/39.gif");
var ChessItemName = new Array("千里丹","金疮药","鸣金令","白驹丸","通络酒");
var ObjItemInfo;//存储棋手道具信息
var CityInAttChessSign = 0;//1:战场进行中
var CityInDefChessSign = 0;//战场进行中
var ChessOver=false;    //战场结束标记

//根据战场状态决定战场页面的显示
function cb_GetChessPage(result)//获得指定战场位置
{
    if(DataValidate(result)==false) return;
    if(result.value==0)//无战场
    {   
        DataTranslateBegin(); 
        CreateBlankBattlePate();//创建无战场页面
    }
    else
    {
        //CityInChessSign=1;
        ChessPos=result.value;//得到战场位置     
        CreateBattlePage()//创建战场页面
    } 
    var html="";
    var tree=document.getElementById("eventinfo");
    tree.innerHTML=html;
    html=null; 
}

//无战场页面
function CreateBlankBattlePate()
{
   var html="";
   html+="<div id=\"chessunopen\">";
   //if(CityChessState==1)
   //html+="<p style=\"position: absolute;top:200px;left:200px;color:#9D080D;\">战场已开启！</p>";
   //else
   //html+="<p style=\"position: absolute;top:200px;left:200px;color:#9D080D;\">战场已关闭！</p>";
   html+="<div id=\"changechess\" style=\"position: absolute;top:280px;left:440px;\">";
   //if(CityChessState==1)
   //html+="<a href=\"#\" onmousedown=\"ChangeChessState()\"><img src=\"img/o/73.gif\" /></a>";
   //else
   //html+="<a href=\"#\" onmousedown=\"ChangeChessState()\"><img src=\"img/o/74.gif\" /></a>";
   html+="</div></div>";
   var page=document.getElementById("mainpic");
   page.innerHTML=html;     
   html=null;
   DataTranslateEnd();   
}

//开启/关闭战场
function ChangeChessState()
{
    var pos=UserInfo.CityList[CityNum].Pos;
    Main.ChangeBattleState(pos,CityChessState,cb_ChangeBattleState);
}

function cb_ChangeBattleState(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        var pos=UserInfo.CityList[CityNum].Pos;
        Main.GetBattleState(pos,cb_GetBattleState);
    }
}

//创建战斗页面                  
function CreateBattlePage()
{ 
    Main.GetChessboard(ChessPos,cb_GetChessboard);//根据位置获得棋盘信息
    ChessClientTime=Date();
}

//获得棋盘数据
function cb_GetChessboard(result)
{
    if(DataValidate(result)==false) return;
    
    Chessboard=result.value;
    
    if(Chessboard!=null && Chessboard.Pos==-1)
        Chessboard=null;
        
    if(Chessboard!=null)
    {
        //获得自己的棋手ID
        
        for(var i=0;i<Chessboard.ChessplayerList.length;i++)
        {
            if(Chessboard.ChessplayerList[i]!=null && Chessboard.ChessplayerList[i].UserName==UserInfo.Name)//如果username匹配
            {
                ChessplayerID=Chessboard.ChessplayerList[i].ID;
                break;
            }
        }
        
        //获得当前事件序号
        ChessEventState=Chessboard.ChessplayerList[ChessplayerID].EventState;//ID与其在数组中的序号是匹配的
        
        //创建页面
        CreateChessboard();//创建棋盘
        
        CreateChessstate();//创建棋手用户列表
               
    }
    else
        DataTranslateEnd();           
}

//创建棋盘
function CreateChessboard()
{
    var html="";
    var coords="";
    var style="";
    var unit;
    var camp=0;
    
    var i=0;
    var img="";
    var maxTime=1;
    var nowTime=1;
    var width=0;
    //显示时间条
   
    style="z-index:100;left:3px;top:4px;position:absolute;";
    html+=HtmlImgStyle("chesstimeshow_b",style,ChessTimeShow[0]);//时间条底图
    
    if(Chessboard.State==0)//战场准备中状态0
    {   
        nowTime=Chessboard.TotalSecondsNow;
        maxTime=Chessboard.WaitSeconds;
        width=Math.floor((nowTime/maxTime)*526); 
        if(width>526)
        width=526;
    }
    if(Chessboard.State==1)//战场进行中
    {
        nowTime=Chessboard.TotalSecondsNow-Chessboard.WaitSeconds;
        maxTime=Chessboard.BattleSeconds;
        width=Math.floor(((maxTime-nowTime)/maxTime)*526);
        if(width>526)
        width=526;
    }
      
    style="width:"+width+"px;height:3px;z-index:100;left:12px;top:8px;position:absolute;";//绿条
    html+=HtmlImgStyle("chesstimeshow_a",style,ChessTimeShow[1]);
    
    while(Chessboard!=null && Chessboard.ChessunitMap!=null && Chessboard.ChessunitMap[i]!=null)
    {
        unit=Chessboard.ChessunitMap[i];
       
        style="background: url(../img/2/b/m/22.gif) no-repeat left top;width:32px;height:32px;left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:100;cursor:pointer;"
        html+=HtmlDivChess("chessunit_"+i,style);
        style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:1;";
        if(Math.floor(i/Chessboard.Width)<=1)
        {
            img=ChessLandformImg[0];
        }
        else if (Math.floor(i/Chessboard.Width)<=11)
            img=ChessLandformImg[1];
        else 
            img=ChessLandformImg[2];      
              
        html+=HtmlImgStyle("chessunit_landform_"+i,style,img);
        if(unit.HeroID>=0)//此处有侠客
        {
            //棋子图片
            style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:25;";
            html+=HtmlImgStyle("chessunit_hero_"+i,style,PicPath+Chessboard.ChessmanList[unit.HeroID].Image);
            
            //棋子阵营框
            camp=GetChessmanCamp(Chessboard.ChessmanList[unit.HeroID]);
            if(camp>0)
            {
                style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:21;";
                html+=HtmlImgStyle("chessunit_hero_camp_"+CoordinateToPos(unit.X,unit.Y),style,ChessHeroCampImg[camp]);
            }
            else
            {
                style="left:"+(GetLeft(unit.X))+"px;top:"+(GetTop(unit.Y))+"px;width:0px;height:32px;position:absolute;z-index:24;";
                html+=HtmlImgStyle("chessman_hero_apimg_"+CoordinateToPos(unit.X,unit.Y),style,ChessHeroStateImg);
            }       
        }
              
        if(unit.BuildingID>=0)//此处有建筑
        {   
            if(Chessboard.ChessmanList[unit.BuildingID].Visible==1 && Chessboard.ChessplayerList[ChessplayerID].Camp!=Chessboard.ChessmanList[unit.BuildingID].Camp)
                unit.BuildingID=-1;
            else
            {
                style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:15;";
                html+=HtmlImgStyle("chessunit_building_"+i,style,PicPath+Chessboard.ChessmanList[unit.BuildingID].Image);
            }
        }    
        i++;
    }
    html+="</map>";
        
    //$("#mainpic").html(html); 
    var mainpic=document.getElementById("mainpic");
    mainpic.innerHTML=html;    
    html=null;
       
    DataTranslateEnd();
}


//创建战场棋手用户列表
function CreateChessstate()
{
    
    var html="";
   
    //棋手列表
    html+="<div id='chessplayerlist' style='width:311px;margin-top:1px;background: url(img/2/h/a/pk.GIF) no-repeat;height:119px;'>";
    html+="<table width=311px border=0 cellspacing=0 cellpadding=0>";
    html+="<tr>";
    html+="<td height='23px' width='160px' align='center' valign='bottom'>";
    html+="<span><b>红方</b></span>";
    html+="</td>";
    html+="<td height='23px' width='151px' align='center' valign='bottom'>";
    html+="<span><b>蓝方</b></span>";
    html+="</td>"
    html+="</tr>";
    html+="<tr>";
    html+="<td height='94px' align='center'>";
    html+="<ul>";
    var styleM="color:";
    var styleF="color:";
    var styleA="color:";
    for(i=0;i<5;i++)
    {
        if(Chessboard.ChessplayerList[i]!=null)
        {
            html+="<li style='height:20px;width:160px;'>";
            if(i==ChessplayerID)
                html+="<span style='"+ColorLv+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";
            else if (Chessboard.ChessplayerList[i].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
                html+="<span style='"+ColorLan+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";    
            else
                html+="<span style='"+ColorHong+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";     
            html+="(<span id='chessplayernum_"+i+"'>"+GetChessmanNum(i)+"</span>/<span>"+Chessboard.ChessplayerList[i].MyChessman.length+")</span></li>";
        }
    }     
    html+="</ul>";
    html+="</td>";
    html+="<td align='center'>";
    html+="<ul>"
    for(var i=5;i<10;i++)
    {
        if(Chessboard.ChessplayerList[i]!=null)
        {
            html+="<li style='height:20px;width:100px;'>";
            if(i==ChessplayerID)
                html+="<span style='"+ColorLv+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";
            else if (Chessboard.ChessplayerList[i].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
                html+="<span style='"+ColorLan+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";    
            else
                html+="<span style='"+ColorHong+"'>"+Chessboard.ChessplayerList[i].CityName+"</span>";     
            html+="(<span id='chessplayernum_"+i+"'>"+GetChessmanNum(i)+"</span>/<span>"+Chessboard.ChessplayerList[i].MyChessman.length+")</span></li>";
        }
    }     
    html+="</ul>";
    html+="</td>";
    html+="</tr>";
    html+="</table>";
    html+="</div>";   
    
   
    //自己棋子快捷操作列表
    html+="<div id='chessmanlist' style='margin-left:1px;width:307px;height:60px;margin-top:1px;'>"; 
    html+="<table width='300px' border=0 cellspacing=0 cellpadding=0>";
    html+="<tr>";
    
    for(var i=0;i<5;i++)
    {
        html+="<td width='60px' align='center'>";
        var key=i+1;      
        if(i<Chessboard.ChessplayerList[ChessplayerID].MyChessman.length)
        {
            var hero=Chessboard.ChessmanList[Chessboard.ChessplayerList[ChessplayerID].MyChessman[i]];
            if(hero.Visible!=3)
            {      
                if(hero.State==0)
                {           
                    html+="<div id=chessman_quick_hp_"+i+" style='margin-top:4px;'>";
                    var wE=Math.ceil(32*(hero.HitPoint/hero.MaxHitPoint));
                    if(wE>ChessPicSize)
                        wE=ChessPicSize;
                    var wB=ChessPicSize-wE;
                    var styleF="height:4px;width:"+wE+"px;";
                    var styleB="height:4px;width:"+wB+"px;";
                    html+=HtmlImgStyle("chessman_hpf_"+i,styleF,ChessHPImg);    
                    html+=HtmlImgStyle("chessman_hpb_"+i,styleB,ChessHPBackImg);
                    html+="</div>";
                    html+="<div id=chessman_quick_img_"+i+" style='margin-top:4px;'>";
                    var style="cursor:pointer;";
                    html+=HtmlClickImgStype("chessman_"+ChessplayerID+"_"+i,style,PicPath+hero.Image,"QuickSelect(this.id)");
                    html+="</div>";
                    html+="<div>";
                    html+="<div id=\"chessman_num_"+i+"\" style='margin-top:1px;'><span><b>"+key+"</b></span></div>";
                    html+="</div>";          
                }
                else
                {
                    html+="<div id=chessman_quick_hp_"+i+" style='margin-top:4px;'>";
                    var wE=0;
                    if(wE>ChessPicSize)
                        wE=ChessPicSize;
                    var wB=ChessPicSize-wE;
                    var styleF="height:4px;width:"+wE+"px;";
                    var styleB="height:4px;width:"+wB+"px;";
                    html+=HtmlImgStyle("chessman_hpf_"+i,styleF,ChessHPImg);
                    html+=HtmlImgStyle("chessman_hpb_"+i,styleB,ChessHPBackImg);
                    html+="</div>";
                    html+="<div id=chessman_quick_img_"+i+" style='margin-top:4px;'>";
                    var style="";
                    html+=HtmlImgStyle("chessman_"+ChessplayerID+"_"+i,style,ChessmanDieImg[0]);
                    html+="</div>";
                    html+="<div>";
                    html+="<div id=\"chessman_num_"+i+"\" style='margin-top:1px;'><span><b>"+key+"</b></span></div>";
                    html+="</div>";           
                }
           }
        }
        html+="</td>"
    }
    
    html+"</tr>";
    html+="</table>";
    html+="</div>";
       
    //基本信息
    html+="<div id='chessunitinfo_base' style='margin-left:1px;border:1px solid gray;width:307px;height:40px;margin-top:1px;background:#F8F5F0;'>";
    html+="</div>";
    
    //扩展信息
    html+="<div id='chessunitinfo_expand' style='margin-left:1px;border:1px solid gray;width:307px;height:160px;margin-top:1px;'>";
    html+="</div>";
       
    //棋盘事件显示 
    html+="<div id='chesseventinfo' style='background:#fbf7eb;margin-left:1px;border:1px solid gray;width:307px;height:72px;margin-top:1px;overflow-y:auto;overflow-x:hidden;'>";
    html+="</div>";
    html+="</div>";
    
    var trees=document.getElementById("trees");
    trees.innerHTML=html;    
    html=null;
    
    AddEventInfo("");
}

//添加事件记录
function AddEventInfo(s)
{
    var html="";
    html+="<div style='margin-top:1px;margin-left:2px'>"+s+"</div>";
    ChessEventListStr+=html;
    var eventList = document.getElementById("chesseventinfo");
    eventList.innerHTML=ChessEventListStr;
    eventList.scrollTop += eventList.offsetHeight+655350;
}

//更新快捷栏棋子状态
function UpdateChessmanInQuick(index)
{
    if(index<0 || index>Chessboard.ChessplayerList[ChessplayerID].MyChessman.length)
        return;        
    var hero=Chessboard.ChessmanList[Chessboard.ChessplayerList[ChessplayerID].MyChessman[index]];
    var html="";
    var hp="#chessman_quick_hp_"+index;
    var img="#chessman_quick_img_"+index;
    if(hero.State==99)
    {
        var wE=0
        if(wE>ChessPicSize)
            wE=ChessPicSize;
        var wB=ChessPicSize-wE;
        var styleF="height:4px;width:"+wE+"px;";
        var styleB="height:4px;width:"+wB+"px;";
        html+=HtmlImgStyle("chessman_hpf_"+index,styleF,ChessHPImg);
        html+=HtmlImgStyle("chessman_hpb_"+index,styleB,ChessHPBackImg);
        $(hp).html(html);
        html="";
        var style="";
        html+=HtmlImgStyle("chessman_"+ChessplayerID+"_"+index,style,ChessmanDieImg[0]);
        $(img).html(html);
    }
    else if(hero.Visible==3)
    {
        $(hp).remove();
        $(img).remove();
        $("#chessunit_quickselect_0").remove();
        $("#chessman_num_"+index+"").remove();
    }
    else
    {
        html+="<div id=chessman_quick_hp_"+index+" style='margin-top:4px;'>";
        var wE=Math.ceil(32*(hero.HitPoint/hero.MaxHitPoint));
        if(wE>ChessPicSize)
            wE=ChessPicSize;
        var wB=ChessPicSize-wE;
        var styleF="height:4px;width:"+wE+"px;";
        var styleB="height:4px;width:"+wB+"px;";
        html+=HtmlImgStyle("chessman_hpf_"+index,styleF,ChessHPImg);
        html+=HtmlImgStyle("chessman_hpb_"+index,styleB,ChessHPBackImg);
        $(hp).html(html);
    }
    html=null;
}

//获得指定棋手活着的棋子数
function GetChessmanNum(id)
{
    var num=0;
    for(i=0;i<Chessboard.ChessplayerList[id].MyChessman.length;i++)
    {
         if(Chessboard.ChessmanList[Chessboard.ChessplayerList[id].MyChessman[i]].State!=99)
            num++;
    }
    return num;
}

//快捷栏点击侠客
function QuickSelect(id)
{
    var t=id.split("_");
    var id=parseInt(t[1],10);
    var i=parseInt(t[2],10);
    var pos=CoordinateToPos(Chessboard.ChessmanList[Chessboard.ChessplayerList[id].MyChessman[i]].X,Chessboard.ChessmanList[Chessboard.ChessplayerList[id].MyChessman[i]].Y);
    ObjSelect(pos);
}

//点击棋盘区域
function ClickChessArea(e,id)
{
    var t=id.split("_");
    var pos=parseInt(t[1],10);
    if(pos<0 || pos>=Chessboard.Width*Chessboard.Height)
        return;
    
    if (ChessControlState!=0)
        return;
    
    if (!e) e=window.event;
    if(ChessControlState==0)
    {
        if (e.button==2)
        {
            ObjAciton(pos);//行为操作
        }
        else
        {
            ObjSelect(pos); //选取操作
        }
    }        
}

//选取操作
function ObjSelect(pos)
{
   //客户端操作频率间隔
   if(ChessControlSpanTime>0)
       return;
   var hero=null;
   var building=null;   
   if(Chessboard.ChessunitMap[pos].HeroID>=0)
   {
       hero= Chessboard.ChessmanList[Chessboard.ChessunitMap[pos].HeroID];
       ObjItemInfo=Chessboard.ChessplayerList[hero.Player].ItemList;
   }
   ChessSelectPos=pos;    
   ChessControlSpanTime=2;
   ShowChessInfo(pos);//棋盘格信息
   ClearMoveRange();//清除移动范围
   ClearActionRange(); //清除行为范围
   ChessControlObj=null;//当前操作实体置为空
   ShowSelect(Chessboard.ChessunitMap[pos].X,Chessboard.ChessunitMap[pos].Y);//显示选中框
   HideQuickSelect(); //隐藏选中框  
   
   //选择的地方有侠客    
   if(hero!=null && Chessboard.ChessplayerList[ChessplayerID].ID==hero.Player && hero.State==0 && hero.ActionState==0)
   {
       ShowQuickSelect(hero.PlayerIndex);
       ChessControlSpanTime=3;
       ChessControlObj=hero;
        
       if(hero.ActionPoint>=hero.ActionNeed[0])
       {
            ShowMoveRange(ChessControlObj);// 显示移动范围
       }
       if(hero.ActionPoint>=hero.ActionNeed[1])
       {
            ShowActionRange(ChessControlObj);//显示行动范围
       }     
   }
   
   //选择的地方有可攻击建筑
   if(hero==null && Chessboard.ChessunitMap[pos].BuildingID>=0)
       building= Chessboard.ChessmanList[Chessboard.ChessunitMap[pos].BuildingID];
       
   if(building!=null && building.AttackPoint>0)    
   {
       ShowActionRange(building);//显示行动范围
   }      
}

//行为操作
function ObjAciton(pos)
{
     if(Chessboard.State!=1)
       return;
     var unit=Chessboard.ChessunitMap[pos];
     var hero=null;
     var building=null;
     var targetID=-1;
     if(unit.BuildingID>=0)
     {
        building=Chessboard.ChessmanList[unit.BuildingID];
        targetID=unit.BuildingID;
     }
     if(unit.HeroID>=0)
     {
        hero=Chessboard.ChessmanList[unit.HeroID];
        targetID=unit.HeroID;
     }            
     if(ChessControlObj!=null && ChessControlObj.State==0 && ChessControlObj.ActionState==0)
     {
         //移动
         if(hero==null && (building==null || building.CanMoveOn==1) && ChessControlObj.ActionPoint>=ChessControlObj.ActionNeed[0])
            ChessmanAction(pos,targetID,0);//没有侠客，没有建筑或有建筑可以站，移动力满足要求
         
         //普通攻击
         if(((hero!=null && hero.Camp!=ChessControlObj.Camp) || (building!=null && building.CanMoveOn==0 && building.Camp!=ChessControlObj.Camp)) && ChessControlObj.ActionPoint>=ChessControlObj.ActionNeed[1] && ChessControlObj.ActionPoint<ChessControlObj.ActionNeed[2])
         {
            ChessmanAction(pos,targetID,1);//有侠客，阵营不同或建筑不为空，建筑不可以站，阵营不同  && 满足移动力条件
         }
         //使用攻击技能
         if(((hero!=null && hero.Camp!=ChessControlObj.Camp) || (building!=null && building.Camp!=ChessControlObj.Camp && building.CanMoveOn==0)) && ChessControlObj.ActionPoint>=ChessControlObj.ActionNeed[2])
            ChessmanAction(pos,targetID,2);
         
         //使用恢复/增益技能
         if((ChessControlObj.SkillType==1 && hero!=null && hero.Camp==ChessControlObj.Camp) && ChessControlObj.ActionPoint>=ChessControlObj.ActionNeed[2])
            ChessmanAction(pos,targetID,2);    
            
         //使用道具               
     }   
}

//计算显示移动范围
function ShowMoveRange(obj)
{
    ClearMoveRange();
    //递归添加可移动路径
    var x=obj.X;
    var y=obj.Y;
    var mp=ChessControlObj.MovePoint;
    GetMoveRange(x,y,mp);
    
    //显示可移动范围
    var i=0;
    var html="";
    var unit;
    while(ChessMoveRange[i]!=null)
    {
        unit=Chessboard.ChessunitMap[ChessMoveRange[i]];
        style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:2;";
        html+=HtmlImgStyle("chess_move_"+ChessMoveRange[i],style,ChessMoveRangeImg);
        i++;
    }
    $("#mainpic").append(html);
    html=null;
}

//清空可以移动范围的列表
function ClearMoveRange()
{
    var i=0;
    while(ChessMoveRange[i]!=null)
    {
        var sUnit="#chess_move_"+ChessMoveRange[i];
        $(sUnit).remove();
        i++;
    }
    
    //清空移动范围数组,以便重新累加
    ChessMoveRange.splice(0,ChessMoveRange.length);
}

//获得可移动棋盘格
function GetMoveRange(x,y,mp)
{   
    if(mp<=0)
        return;
        
    var pos=y*Chessboard.Width+x;
    var moveExpend;
    
    moveExpend=GetMoveExpend(x+1,y,mp);
    if(mp-moveExpend>=0)
    {
        AddPosToMoveRange(CoordinateToPos(x+1,y));
        GetMoveRange(x+1,y,mp-moveExpend);   
    }
    
    moveExpend=GetMoveExpend(x-1,y,mp);
    if(mp-moveExpend>=0)
    {
        AddPosToMoveRange(CoordinateToPos(x-1,y));
        GetMoveRange(x-1,y,mp-moveExpend);   
    }
    
    moveExpend=GetMoveExpend(x,y+1,mp);
    if(mp-moveExpend>=0)
    {
        AddPosToMoveRange(CoordinateToPos(x,y+1));
        GetMoveRange(x,y+1,mp-moveExpend);   
    }
    
    moveExpend=GetMoveExpend(x,y-1,mp);
    if(mp-moveExpend>=0)  
    {
        AddPosToMoveRange(CoordinateToPos(x,y-1));
        GetMoveRange(x,y-1,mp-moveExpend);   
    }
}

//显示行为范围
function ShowActionRange(obj)
{
    ClearActionRange();
    GetActionRange(obj.X,obj.Y,obj.AttackRange);
    //显示可移动范围
    var i=0;
    var html="";
    var unit;
    while(ChessActionRange[i]!=null)
    {
        unit=Chessboard.ChessunitMap[ChessActionRange[i]];
        style="left:"+GetLeft(unit.X)+"px;top:"+GetTop(unit.Y)+"px;position:absolute;z-index:3;";
        html+=HtmlImgStyle("chess_action_"+ChessActionRange[i],style,ChessActionRangeImg);
        i++;
    }
    $("#mainpic").append(html);
    html=null;
}

//清除行为范围
function ClearActionRange()
{
    var i=0;
    while(ChessActionRange[i]!=null)
    {
        var sUnit="#chess_action_"+ChessActionRange[i];
        $(sUnit).remove();
        i++;
    }
    
    //清空移动范围数组,以便重新累加
    ChessActionRange.splice(0,ChessActionRange.length);
}


//获得攻击的棋盘格
function GetActionRange(x,y,type)
{
    switch(type)
    {
        case 5:
            AddActionRange(x+1,y-1);
            AddActionRange(x+1,y);
            AddActionRange(x+1,y+1);
            AddActionRange(x,y-1);
            AddActionRange(x,y+1);
            AddActionRange(x-1,y-1);
            AddActionRange(x-1,y);
            AddActionRange(x-1,y+1);
            break;
        case 3:
            AddActionRange(x+2,y);
            AddActionRange(x+1,y);
            AddActionRange(x-1,y);
            AddActionRange(x-2,y);
            AddActionRange(x,y+1);
            AddActionRange(x,y+2);
            AddActionRange(x,y-1);
            AddActionRange(x,y-2);
            break;
        case 4:
            AddActionRange(x+1,y-1);
            AddActionRange(x+2,y);
            AddActionRange(x+1,y+1);
            AddActionRange(x,y-2);
            AddActionRange(x,y+2);
            AddActionRange(x-1,y-1);
            AddActionRange(x-2,y);
            AddActionRange(x-1,y+1);
            break;
       case 7:
            for(var i=-2;i<=2;i++)
                for(var j=-2;j<=2;j++)
                    if((i+j!=0 || i!=0 || j!=0) && i*i+j*j<=4)
                        AddActionRange(x+i,y+j); 
            break;
       case 1:
            AddActionRange(x,y);
            break;
       case 2:
            AddActionRange(x,y);
            AddActionRange(x,y+1);
            AddActionRange(x,y-1);
            AddActionRange(x+1,y);
            AddActionRange(x-1,y);
            break;
       case 6:
            AddActionRange(x,y);
            AddActionRange(x+1,y-1);
            AddActionRange(x+1,y);
            AddActionRange(x+1,y+1);
            AddActionRange(x,y-1);
            AddActionRange(x,y+1);
            AddActionRange(x-1,y-1);
            AddActionRange(x-1,y);
            AddActionRange(x-1,y+1);                         
            break;                                                     
    }
}

function AddActionRange(x,y)
{
    if(x<0 || y<0 || x>=Chessboard.Width || y>=Chessboard.Height)
        return;
    ChessActionRange.push(CoordinateToPos(x,y));    
}

//获得指定位置移动消耗
function GetMoveExpend(x,y,mp)
{
    if(x<0 || y<0 || x>=Chessboard.Width || y>=Chessboard.Height)
        return ChessunitNotMove;        
    var unit=Chessboard.ChessunitMap[CoordinateToPos(x,y)];
    var moveExpend=unit.MoveExpend;
    if(unit.HeroID>=0)
    {
       moveExpend+=Chessboard.ChessmanList[unit.HeroID].MoveExpend[ChessControlObj.Camp]; 
    }
    else if(unit.BuildingID>=0)
    {
       moveExpend+=Chessboard.ChessmanList[unit.BuildingID].MoveExpend[ChessControlObj.Camp]; 
       if(Chessboard.ChessmanList[unit.BuildingID].CanMoveOn==1 && Chessboard.ChessmanList[unit.BuildingID].MoveExpend[ChessControlObj.Camp]>0)
           moveExpend=mp;     
    }        
    return moveExpend; 
}



//坐标转换为棋盘位置
function CoordinateToPos(x,y)
{
    return y*Chessboard.Width+x;
}

//添加位置到可移动范围列表
function AddPosToMoveRange(pos)
{
    var i=0;
    while(ChessMoveRange[i]!=null)
    {
        if(pos==ChessMoveRange[i] || pos==CoordinateToPos(ChessControlObj.X,ChessControlObj.Y))
            return;
        i++;
    }
    ChessMoveRange.push(pos);
}

//判断指定位置是否在移动范围类
function InRange(range,pos)
{
    var i=0;
    while(range[i]!=null)
    {
        if(pos==range[i])
            return true;
        i++;
    }
    return false;

}

//操作实体的行为
function ChessmanAction(target,targetID,type)
{
    var range=false;
    var actionImg="";
    actionImg=ChessActonTargetImg[type];
    switch(type)
    {
        case 0:
            range=InRange(ChessMoveRange,target);//指定位置是否移动范围内
            break;
        case 1:
        case 2:
            range=InRange(ChessActionRange,target);//指定位置是否移动范围内
            break;    
    } 
    if(range==false)
        return;
    
    ChessControlObj.ActionState=type+1;//客户端用的行为状态(actionstate)
    ChessControlState=type+1;//当前操作状态
    
    ChessTX=target%Chessboard.Width;
    ChessTY=Math.floor(target/Chessboard.Width);
    
    //显示行为目标
    ShowActionTarget(actionImg,ChessTX,ChessTY);//3种图片(移动/普通攻击/技能攻击)
    
    ChessObjActionType=type;//当前实体的操作类型
    
    switch(type)
    {
        case 0://战场移动行为
            Main.ChessActionMove(Chessboard.Pos,Chessboard.ChessplayerList[ChessplayerID].ID,ChessControlObj.ChessIndex,ChessTX,ChessTY,cb_HandleChessAction);          
            break;
        case 1://战场攻击行为
        case 2:
            Main.ChessActionAttack(Chessboard.Pos,Chessboard.ChessplayerList[ChessplayerID].ID,ChessControlObj.ChessIndex,targetID,type,cb_HandleChessAction);
            break;    
    }              
}

//行为请求返回
function cb_HandleChessAction(result)
{
     if(DataValidate(result)==false) return;
     
     if(result.value!=0)
     {
         HideActionTarget(ChessTX,ChessTY); //隐藏刚才3种行为行为的显示图片
         if(ChessControlObj!=null)
            ChessControlObj.ActionState=0;//当前操作实体行为状态置为0
     }
     else
     {
         ChessControlObj.ActionPoint-=ChessControlObj.ActionNeed[ChessObjActionType];//扣除行动力
     }
     ChessControlState=0;//当前操作状态
}





//实体的移动行为
function MoveAction(obj,target)
{ 
    var x=target%Chessboard.Width;
    var y=Math.floor(target/Chessboard.Width);
    
    ShowActionFlag(ChessActionFlagImg[0],obj.X,obj.Y,obj.Player*5+obj.Index);//显示行动框
    ShowActionFlag(ChessActionFlagImg[1],x,y,obj.Player*5+obj.Index);
    HideChessman(obj.X,obj.Y,obj.Type);
    
    if(obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
    {
        ClearMoveRange();
        ClearActionRange();
        HideActionTarget(x,y);
        HideActionState(obj.X,obj.Y,0);
        HideActionState(obj.X,obj.Y,1);
        HideActionState(obj.X,obj.Y,2);
        obj.ActionFlag[0]=0;
        obj.ActionFlag[1]=0;
        obj.ActionFlag[2]=0;
    }
      
    //改变实体对象在棋盘的位置
    Chessboard.ChessunitMap[CoordinateToPos(x,y)].HeroID=obj.ChessIndex; 
    Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].HeroID=-1;
    
    //清除当前操作目标允许下次操作
    obj.ActionState=0;
    
    //更新选中信息
    if(CoordinateToPos(x,y)==ChessSelectPos || CoordinateToPos(obj.X,obj.Y)==ChessSelectPos)
        ShowChessInfo(ChessSelectPos);
        
    obj.X=x;
    obj.Y=y;
    
    //刷新棋子位置
    ShowChessman(obj,x,y);
    if(ChessControlObj==obj)
    {
        ObjSelect(CoordinateToPos(x,y));
    }
    
    var s="";
    s+="<span style='color:#a77a57;'>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span>"
    s+="<span style='margin-left:10px'>移动到</span>";
    s+="<span style='margin-left:10px'>("+x+","+y+")</span>";
    
    //AddEventInfo(s);  
                          
}

//实体的攻击行为
function AttackAction(obj,target,value,expandValue,type)
{  
    //2个位置显示行动框，1个控制位置，1个目标位置
    ShowActionFlag(ChessActionFlagImg[0],obj.X,obj.Y,obj.Player*5+obj.Index);//显示行动框
    ShowActionFlag(ChessActionFlagImg[1],target.X,target.Y,obj.Player*5+obj.Index);//显示行动框
    var effImg="";
    
    //显示事件信息    
    var s="";
    var oColor="";
    var tColor="";
    if(obj.Player==ChessplayerID)
        oColor=ColorLv;
    else if(Chessboard.ChessplayerList[obj.Player].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
        oColor=ColorLan;
    else
        oColor=ColorHong;
    
    if(target.Player==ChessplayerID)
        tColor=ColorLv;
    else if(Chessboard.ChessplayerList[target.Player].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
        tColor=ColorLan;
    else
        tColor=ColorHong;    
                
    s+="<span style='"+oColor+"'>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span>"
    s+="<span style='margin-left:10px'>对</span>";
    s+="<span style='"+tColor+";margin-left:10px'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span>" 
    
    switch(type)
    {
        case 1:
            if (target!=null && target.Camp!=obj.Camp && target.CanMoveOn==0)
            {
                s+="<span style='margin-left:10px'>发动攻击</span>";
                if(expandValue[9]>0)
                   s+="<span style='margin-left:10px'>爆击</span>";
                if(expandValue[8]>0)
                   s+="<span style='margin-left:10px'>被闪躲</span>";    
                s+="<span style='margin-left:10px'>造成伤害</span>";
                s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                target.HitPoint=value;
                if(target.HitPoint==0)
                {
                    target.State=99;
                    s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                } 
                effImg=ChessSkillEffImg[0];
                      
            }
            break;
        case 2:
            if (target!=null && target.CanMoveOn==0)
            {
                //技能效果类型(0=减HP,1=加HP,2=加攻,3=减攻,4=加防,5=减防,6=减火抗,7=减毒抗,8=减冰抗,9=减雷抗,10=加所有抗)
                switch(obj.SkillEffType)
                {
                    case 0:
                    case 1:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";    
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            if(obj.SkillElement!=6)
                                effImg=ChessSkillEffImg[obj.SkillElement];
                            else
                                effImg=ChessSkillEffImg[0];
                        }
                        else if(target.Type==1)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            s+="<span style='margin-left:10px'>恢复弟子</span>";
                            s+="<span style='"+ColorLan+"margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            
                            target.HitPoint=value;              
                            effImg=ChessSkillEffImg[obj.SkillElement];
                        }
                        break;
                    case 2:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            
                            effImg=ChessSkillEffImg[0];
                        }
                        else if(target.Type==1)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            s+="<span style='margin-left:10px'>增加攻击</span>";
                            s+="<span style='"+ColorLan+"margin-left:10px'>"+Math.abs(expandValue[0]-target.AttackPoint)+"</span>";
                            
                            target.AttackPoint=expandValue[0];              
                            effImg=ChessSkillEffImg[obj.SkillElement];
                        }
                        break;    
                    case 3:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            
                            if(target.Type==1)
                            {
                                s+="<span style='margin-left:10px'>降低攻击</span>";
                                s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(expandValue[0]-target.AttackPoint)+"</span>";
                                target.AttackPoint=expandValue[0];
                            }
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            effImg=ChessSkillEffImg[obj.SkillElement];
                       }
                     case 4:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            effImg=ChessSkillEffImg[0];
                        }
                        else if(target.Type==1)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            s+="<span style='margin-left:10px'>增加普抗</span>";
                            s+="<span style='"+ColorLan+"margin-left:10px'>"+Math.abs(expandValue[0]-target.Resist[0])+"</span>";
                            
                            target.Resist[0]=expandValue[0];              
                            effImg=ChessSkillEffImg[obj.SkillElement];
                        }
                        break;    
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                    case 9:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            if(target.Type==1)
                            {
                                s+="<span style='margin-left:10px'>降低"+SkillAttr[obj.SkillEffType-5]+"抗</span>";
                                s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(expandValue[0]-target.Resist[obj.SkillEffType-5])+"</span>";
                                target.Resist[obj.SkillEffType-5]=expandValue[0];
                            }    
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            effImg=ChessSkillEffImg[obj.SkillElement];
                       } 
                       break;  
                    case 10:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            
                            effImg=ChessSkillEffImg[0];
                        }
                        else if(target.Type==1)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            for(var i=1;i<5;i++)
                            {
                                s+="<span style='margin-left:10px'>增加"+SkillAttr[i]+"抗</span>";
                                s+="<span style='"+ColorLan+"margin-left:10px'>"+Math.abs(expandValue[i-1]-target.Resist[i])+"</span>";
                                target.Resist[i]=expandValue[i-1];
                            }              
                            effImg=ChessSkillEffImg[obj.SkillElement];
                        }
                        break;
                     case 11:
                        if(target.Camp!=obj.Camp)
                        {
                            s+="<span style='margin-left:10px'>使用技能</span>";
                            s+="<span style='margin-left:10px'>"+obj.SkillName+"</span>";
                            if(expandValue[9]>0)
                                s+="<span style='margin-left:10px'>爆击</span>";
                            if(expandValue[8]>0)
                                s+="<span style='margin-left:10px'>被闪躲</span>";                              
                            s+="<span style='margin-left:10px'>造成伤害</span>";
                            s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(value-target.HitPoint)+"</span>";
                            target.HitPoint=value;
                            
                            if(target.Type==1)
                            {
                                s+="<span style='margin-left:10px'>降低攻击</span>";
                                s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(expandValue[0]-target.AttackPoint)+"</span>";
                                s+="<span style='margin-left:10px'>降低普抗</span>";
                                s+="<span style='color:#9D080D;margin-left:10px'>"+Math.abs(expandValue[1]-target.Resist[0])+"</span>";
                                target.AttackPoint=expandValue[0];
                                target.Resist[0]=expandValue[1]
                            }
;
                            if(target.HitPoint==0)
                            {
                                target.State=99;
                                s+="<br><span style='"+tColor+"'>"+target.Name+"["+Chessboard.ChessplayerList[target.Player].CityName+"]</span><span style='margin-left:10px'>挂了!</span>";
                            }
                            effImg=ChessSkillEffImg[obj.SkillElement];
                       }
                        break;       
                                                 
                }
            }   
            break;
    }    
    
    AddEventInfo(s); 
    HideActionTarget(target.X,target.Y);//隐藏行为目标
    ShowActionEff(effImg,CoordinateToPos(obj.X,obj.Y),target.X,target.Y);//显示行为效果
    if(target!=null && target.State==99)//棋子死亡
    {
        HideChessman(target.X,target.Y,target.Type);//隐藏棋子
        ChessmanDie(ChessmanDieImg[target.Type-1],target.X,target.Y);//棋子死亡效果 
    }
    
    //清除当前操作目标允许下次操作
    obj.ActionState=0;
    
    //清除自己棋子当前的聚气
    if(obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
    {
        if(obj.ActionPoint<obj.ActionNeed[0])
        {
            ClearMoveRange();
            HideActionState(obj.X,obj.Y,0);
            obj.ActionFlag[0]=0;
        }
        if(obj.ActionPoint<obj.ActionNeed[1])
        {
            ClearActionRange();
            HideActionState(obj.X,obj.Y,1);
            obj.ActionFlag[1]=0;
        }
        if(obj.ActionPoint<obj.ActionNeed[2])
        {
            HideActionState(obj.X,obj.Y,2);
            obj.ActionFlag[2]=0;
        }
    }
    
    //自己棋子死亡
    if(target!=null && target.Player==Chessboard.ChessplayerList[ChessplayerID].ID && target.State==99)
    {      
        HideActionState(target.X,target.Y,0);
        HideActionState(target.X,target.Y,1);
        HideActionState(target.X,target.Y,2);
        HideActionPoint(target.X,target.Y);
        target.ActionFlag[0]=0;
        target.ActionFlag[1]=0;
        target.ActionFlag[2]=0;       
    }
    
    //自己当前控制目标被死亡
    if(target!=null && target.State==99 && ChessControlObj==target)
    {
        ClearMoveRange();
        ClearActionRange();
        HideSelect();
        HideActionTarget(ChessTX,ChessTY);
        ChessControlObj=null;
    }
    
    //实体死亡清除
    if(target!=null && target.State==99)
    { 
        if(target.Type==1)
        {    
            UpdatePlayerNum(target.Player);
            Chessboard.ChessunitMap[CoordinateToPos(target.X,target.Y)].HeroID=-1;  
        }    
        else
            Chessboard.ChessunitMap[CoordinateToPos(target.X,target.Y)].BuildingID=-1;
    }  
    
    //更新快捷栏棋子状态
    if(target.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
    {
        UpdateChessmanInQuick(target.PlayerIndex);    
    }
    
    //更新信息显示
    if(CoordinateToPos(target.X,target.Y)==ChessSelectPos)
        ShowChessInfo(ChessSelectPos);
                     
}

//实体被动伤害效果
function ChessDamageAction(obj,value,type)
{    
    var s="";
    var oColor="";
    if(obj.Player==ChessplayerID)
        oColor=ColorLv;
    else if(Chessboard.ChessplayerList[obj.Player].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
        oColor=ColorLan;
    else
        oColor=ColorHong;   
    
    var tColor="";
    tColor=ColorHong;
    
    s+="<span style='"+oColor+"'>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span>"
    s+="<span style='margin-left:10px'>受到</span>";
    if(type==3)
        s+="<span style='"+tColor+"margin-left:10px'>箭塔</span>";
    else
        s+="<span style='"+tColor+"margin-left:10px'>陷阱</span>";
    s+="<span style='margin-left:10px'>伤害</span>";          
    
    //ShowActionFlag(ChessActionFlagImg[0],obj.X,obj.Y,obj.Player*5+obj.Index);
    
    switch(type)
    {
        case 3:
        case 4:
            s+="<span style='"+ColorHong+"margin-left:10px'>"+Math.abs(obj.HitPoint-value)+"</span>";
            obj.HitPoint=value;
            if(obj.HitPoint==0)
            {
                obj.State=99;
                s+="<br><span style='"+oColor+"'>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span><span style='margin-left:10px;'>挂了!</span>"; 
            } 
            ShowActionEff(ChessEffActionImg[type-3],type*(-1),obj.X,obj.Y);                   
            break;
    }    
    
    AddEventInfo(s);
     
    //死亡动画
    if(obj.State==99)
    {
        HideChessman(obj.X,obj.Y,obj.Type);
        ChessmanDie(ChessmanDieImg[obj.Type-1],obj.X,obj.Y);
    }
      
    //自己人死亡
    if(obj!=null && obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID && obj.State==99)
    {      
        HideActionState(obj.X,obj.Y,0);
        HideActionState(obj.X,obj.Y,1);
        HideActionState(obj.X,obj.Y,2);
        HideActionPoint(obj.X,obj.Y);       
    }
    
    //自己当前控制目标被死亡
    if(obj!=null && obj.State==99 && ChessControlObj==obj)
    {
        ClearMoveRange();
        ClearActionRange();
        HideSelect();
        HideActionTarget(ChessTX,ChessTY);
        ChessControlObj=null;
    }
    
    //实体死亡清除
    if(obj!=null && obj.State==99)
    {    
        if(obj.Type==1)
        {
            UpdatePlayerNum(obj.Player);
            Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].HeroID=-1;
        }
        else
            Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].BuildingID=-1;
    }  
    
    //更新快捷栏棋子状态
    if(obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
    {
        UpdateChessmanInQuick(obj.PlayerIndex);    
    }
    
    //陷阱爆清除范围内的陷阱
    
    var building=null;
    if(Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].BuildingID>=0)
    {
        building=Chessboard.ChessmanList[Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].BuildingID]
    }
    if(type==4 && building!=null && building.CanMoveOn==1 && building.AttackPoint>0)
    {
        HideChessman(building.X,building.Y,building.Type);
        ChessmanDie(PicPath+building.Image,building.X,building.Y);
        Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].BuildingID=-1;
    }
    
    //更新信息显示
    if(CoordinateToPos(obj.X,obj.Y)==ChessSelectPos)
        ShowChessInfo(ChessSelectPos);              
}

//实体被动辅助效果
function ChessEffAction(obj,value,type)
{    
    var s="";
    var oColor="";
    if(obj.Player==ChessplayerID)
        oColor=ColorLv;
    else if(Chessboard.ChessplayerList[obj.Player].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
        oColor=ColorLan;
    else
        oColor=ColorHong;
    
    var tColor="";
    tColor=ColorHong;
    
    s+="<span style='"+oColor+"'>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span>"
    if(type==5)
        s+="<span style='margin-left:10px'>离开</span>";
    else    
        s+="<span style='margin-left:10px'>进入</span>";
    s+="<span style='"+tColor+"margin-left:10px'>护城河</span>";
    s+="<span style='margin-left:10px'>移动力</span>";
    if(type==5)
        s+="<span style='margin-left:10px'>提高</span>";
    else    
        s+="<span style='margin-left:10px'>降低</span>";          
    
    //ShowActionFlag(ChessActionFlagImg[0],obj.X,obj.Y,obj.Player*5+obj.Index);
    
    switch(type)
    {
        case 5:
        case 6:
            s+="<span style='"+ColorHong+"margin-left:10px'>"+Math.abs(obj.MovePoint-value)+"</span>";
            obj.MovePoint=value;
            //ShowActionEff(ChessEffActionImg[type-3],type*(-1),obj.X,obj.Y);                   
            break;
    }    
    
    AddEventInfo(s);
       
    //更新信息显示
    if(CoordinateToPos(obj.X,obj.Y)==ChessSelectPos)
        ShowChessInfo(ChessSelectPos);              
}


//从服务器获得未处理过的事件
function GetEventNoHandle()
{
    if(GetChessData==0 && (PageNum==6 || PageNum==2) && Chessboard!=null)
    {
        GetChessData=1;
        Main.GetChessEvent(Chessboard.Pos,Chessboard.ChessplayerList[ChessplayerID].ID,ChessEventState,cb_GetEventNoHandle);
    }
}

//0=移动,1=普通攻击,2=技能,3=箭塔,4=陷阱,5=走入护城河，6=走出护城河，97=新的棋手加入了，98=战斗开始,99=战斗结束
function cb_GetEventNoHandle(result)
{
    if(DataValidate(result)==false) return;
    var eventList=result.value;
    if(eventList[0].ID==-1)
       eventList=null;
    var i=0;
    var chessEvent=null;
    while(eventList!=null && eventList[i]!=null)
    {    
        chessEvent=eventList[i];
        
        var obj=null;
        obj = Chessboard.ChessmanList[chessEvent.ObjID];
        var target=null;
        if(obj!=null)
        {                
            switch(chessEvent.ObjAction)
            {       
                case 0 :
                    MoveAction(obj,chessEvent.TargetID);           //实体的移动行为    
                    break;
                case 1 :
                case 2 :
                    target = Chessboard.ChessmanList[chessEvent.TargetID];
                    AttackAction(obj,target,chessEvent.EffValue,chessEvent.ExpandEffValue,chessEvent.ObjAction);//实体的攻击行为
                    break;
                case 3:
                case 4:
                    ChessDamageAction(obj,chessEvent.EffValue,chessEvent.ObjAction);//实体被动伤害效果
                    break;
                case 5:
                case 6:
                    ChessEffAction(obj,chessEvent.EffValue,chessEvent.ObjAction);//实体被动辅助效果
                    break;
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                    ChessItemAction(obj,chessEvent.EffValue,chessEvent.ObjAction);//实体使用道具效果
                    break;
                case 97:
                    AddChessplayer(chessEvent.EffValue);//添加棋手
                    break;           
                case 98:
                    ChessFightBegin(chessEvent.EffValue);//战斗开始
                    break;
                case 99:
                    ChessFightEnd(chessEvent.EffValue);//战斗结束
                    Main.GetNewMailNum(cb_GetNewMailNum);                     
                    break;
                case 100:
                    window.location.reload();//重新载入页面
                    break;                          
                default :
                    break;
            }
        }
        if(ChessEventState<eventList[i].ID+1)
            ChessEventState=eventList[i].ID+1;        
        i++;
    }
    GetChessData=0;
}

//添加棋手
function AddChessplayer(value)
{
    var type=1;
    if(PageNum==6)
        type=2;
    Main.GetChessboardPos(CityID,type,cb_GetChessPage);
    
    var name="";
    switch(value)
    {
        case 2:
            name="新的攻击军团";
            break;
        case 3:
            name="新的防守军团";
            break;
    }
    AddEventInfo(ChessEventListStr);
    var s="";
    s+="<span style='font-size:12px'>"+name+"进入战场!</span>";
    AddEventInfo(s); 
}

//战斗开始
function ChessFightBegin(value)
{
    var s="";
    s+="<span style='font-size:12px'>战斗开始!</span>";
    AddEventInfo(s); 
    Chessboard.State=value;
    Chessboard.BattleTimeNow=Chessboard.BattleSeconds;
    var img=ChessStateImg[0];
    var x=Math.floor(Chessboard.Width/2-3);
    var y=Math.floor(Chessboard.Height/2-2);
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:100;";
    var html=HtmlImgStyle("chess_begin",style,img);
    $("#mainpic").append(html);
    html=null;
    var s="#chess_begin";
    $(s).fadeTo(5000, 0.01, function(){
         $(s).remove();
    });    
}

//战斗结束
function ChessFightEnd(value)
{
    ChessOver=true;
    Chessboard.State=value;
    ChessEventState=0;
    var s="";
      
    var x=Math.floor(Chessboard.Width/2-3);
    var y=Math.floor(Chessboard.Height/2-2);
    //alert("测试");
    //alert(value);
    var img;
    if(value==100)
    {
        img=ChessStateImg[1];
        s+="<span style='font-size:12px'>平局!</span>";
    }    
    else
    {
        if(Chessboard.ChessplayerList[ChessplayerID].Camp+101==value)
        {
            img=ChessStateImg[2];
            s+="<span style='font-size:12px'>胜利!</span>";
        }
        else
        {
            img=ChessStateImg[3];
            s+="<span style='font-size:12px'>失败!</span>";        
        }
    }    
    
    AddEventInfo(s);
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:100;";
    var html=HtmlImgStyle("chess_end",style,img);
    $("#mainpic").append(html);
    html=null;  
    ChessEventListStr="";
    CityInDefChessSign=0;
    CityInAttChessSign=0;       
     
}

//改变战场时间条
function UpdateTimeShow()
{
         
    if((PageNum!=6 && PageNum!=2)|| Chessboard==null || Chessboard.State>=100)
        return;
     
    var width=0;    
    Chessboard.TotalSecondsNow++;
        
    if(Chessboard.State==0)
    {   
        nowTime=Chessboard.TotalSecondsNow;
        maxTime=Chessboard.WaitSeconds;
        width=Math.floor((nowTime/maxTime)*526); 
        if(width>526)
        width=526;
    }
    if(Chessboard.State==1)
    {
        nowTime=Chessboard.TotalSecondsNow-Chessboard.WaitSeconds;
        maxTime=Chessboard.BattleSeconds;
        width=Math.floor(((maxTime-nowTime)/maxTime)*526);
        if(width>526)
        width=526;
    }
    if($("#chesstimeshow_a").width()!=width)
    {
        $("#chesstimeshow_a").width(width);                 
    } 
}

//战场事件计时器
function ChessEventTimer()
{
    GetEventNoHandle();//每秒请求事件
    UpdateTimeShow();//每秒改变战场时间条
    chessEventTimer=setTimeout("ChessEventTimer()",1000);
}


//战场行动力计时器
function ChessmanStateTimer()
{
    ShowActionPoint();//显示棋子行动条
    chessmanStateTimer=setTimeout("ChessmanStateTimer()",1000);
}


//战场操作间隔计时器
function ChessControlSpanTimer()
{
    UpdateActionSpan();//更新操作间隔
    chessEventTimer=setTimeout("ChessControlSpanTimer()",100);
}


//更新操作间隔
function UpdateActionSpan()
{
    ChessControlSpanTime--;
    if(ChessControlSpanTime<0)
        ChessControlSpanTime=0;
}

//显示棋子行动条
function ShowActionPoint()
{
        
    if((PageNum!=6 && PageNum!=2) || Chessboard==null || Chessboard.State!=1)
        return;
    
    var hero=null;
    for(var i=0;i<Chessboard.ChessplayerList[ChessplayerID].MyChessman.length;i++)
    {
        hero=Chessboard.ChessmanList[Chessboard.ChessplayerList[ChessplayerID].MyChessman[i]];
        
        //可能出现当前位置没有实体的情况
        if (hero!=null && hero.State==0 && hero.ActionState==0)
        {
            //当前操作实体
            if(ChessControlObj!=null && ChessControlObj==hero)//当前操作对象和hero对象吻合
            {
                //移动范围(添加条件actionpoint大于1000时,不执行前面的判断)
                    if((hero.ActionPoint<hero.ActionNeed[0]+hero.Speed && hero.ActionPoint>hero.ActionNeed[0]-hero.Speed) || hero.ActionPoint>1000)
                        ShowMoveRange(hero);
                    //行为范围
                    if((hero.ActionPoint<hero.ActionNeed[1]+hero.Speed && hero.ActionPoint>hero.ActionNeed[1]-hero.Speed) || hero.ActionPoint>1000)
                    {
                        ShowActionRange(hero);
                    }
            }
            
            //行为标志(不需要选中侠客就会出现)
            //ActionNeed    (0=移动,1=攻击,2=技能 )
            //ActionFlag    棋子的行动标志客户端用的 0=移动,1=攻击,2=技能
            if(hero.ActionPoint>hero.ActionNeed[0] && hero.ActionFlag[0]==0)
            {
                //HideActionState(hero.X,hero.Y,0);
                ShowActionState(hero.X,hero.Y,0);
                hero.ActionFlag[0]=1;
            }
            
            if(hero.ActionPoint>hero.ActionNeed[1] && hero.ActionFlag[1]==0)
            {
                //HideActionState(hero.X,hero.Y,1);
                ShowActionState(hero.X,hero.Y,1);
                hero.ActionFlag[1]=1;
            }
            
            if(hero.ActionPoint>hero.ActionNeed[2] && hero.ActionFlag[2]==0)
            {
                HideActionState(hero.X,hero.Y,1);//隐藏攻击标志
                //HideActionState(hero.X,hero.Y,2);
                ShowActionState(hero.X,hero.Y,2);
                hero.ActionFlag[2]=1;
            }
                hero.ActionPoint+=hero.Speed;//如果有使用加行动力效果道具..
            if(hero.ActionPoint>hero.MaxActionPoint)
                hero.ActionPoint=hero.MaxActionPoint;
                                  
            //显示气条
            var sImg="#chessman_hero_apimg_"+CoordinateToPos(hero.X,hero.Y);
            var width=Math.floor((ChessPicSize)*(hero.ActionPoint/hero.MaxActionPoint));
            if(width>=(ChessPicSize))
                width=0; 
            if($(sImg).width()!=width)
            {
                $(sImg).width(width);                 
            }
        }
    }       
}

//棋子的阵营显示值
function GetChessmanCamp(obj)
{
    //如果是自己的建筑物
    if(obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
        return 0;         
    else if(obj.Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
        return 1;
    else
        return 2;    
}

//在战场按下ESC
function ChessEscDown()
{
    if((PageNum==6 || PageNum==2) && Chessboard!=null && ChessControlObj!=null && ChessControlState==0)
    {
        CancelControlObj();
    }
}

//在战场上按数字
function ChessNumDown(keyNum)
{
    if(keyNum>=49 && keyNum<=53 && (PageNum==6 || PageNum==2) && Chessboard!=null && ChessControlState==0)
    {
        if(keyNum-49<Chessboard.ChessplayerList[ChessplayerID].MyChessman.length && Chessboard.ChessplayerList[ChessplayerID].MyChessman[keyNum-49]>=0)
        {
            var hero=Chessboard.ChessmanList[Chessboard.ChessplayerList[ChessplayerID].MyChessman[keyNum-49]];
            ObjSelect(CoordinateToPos(hero.X,hero.Y));
        }
    }
}

//取消当前选中目标
function CancelControlObj()
{
    //清除移动范围
    ClearMoveRange();
    //清除行为范围
    ClearActionRange();
    HideSelect(ChessControlObj.X,ChessControlObj.Y);
    ChessControlObj=null;
}


//更新棋手棋子数
function UpdatePlayerNum(id)
{
    s="#chessplayernum_"+id;
    var html="";
    html+=GetChessmanNum(id);
    $(s).html(html);
}

//显示行为目标
function ShowActionTarget(img,x,y)
{
    //显示行为目标提示
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:27;";
    var html=HtmlImgStyle("chess_target_"+CoordinateToPos(x,y),style,img);
    $("#mainpic").append(html);
    
    html=null;
}

//隐藏行为目标
function HideActionTarget(x,y)
{
    var s="#chess_target_"+CoordinateToPos(x,y);   
    $(s).remove();
}



//显示行为状态
function ShowActionState(x,y,type)
{
    //显示行为状态
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:26;";
    var html=HtmlImgStyle("chess_actionstate_"+type+"_"+CoordinateToPos(x,y),style,ChessActionStateImg[type]);
    $("#mainpic").append(html);
    
    html=null;
}

//隐藏行为状态
function HideActionState(x,y,type)
{
    var s="#chess_actionstate_"+type+"_"+CoordinateToPos(x,y);   
    $(s).remove();
}


//显示棋子
function ShowChessman(obj,x,y)
{
    var html="";
    var style="";
    //棋子图片
    style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:25;";
    html+=HtmlImgStyle("chessunit_hero_"+CoordinateToPos(x,y),style,PicPath+obj.Image);
    
    //棋子阵营框
    var camp=GetChessmanCamp(obj);
    if(camp>0)
    {
        style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:21;";
        html+=HtmlImgStyle("chessunit_hero_camp_"+CoordinateToPos(x,y),style,ChessHeroCampImg[camp]);
    }
    else
    {
        style="left:"+(GetLeft(x)+1)+"px;top:"+(GetTop(y)+1)+"px;width:0px;height:30px;position:absolute;z-index:24;";
        html+=HtmlImgStyle("chessman_hero_apimg_"+CoordinateToPos(x,y),style,ChessHeroStateImg);
    }            
    $("#mainpic").append(html);
    html=null;
}

//隐藏棋子
function HideChessman(x,y,type)
{  
    switch(type)
    {
        case 1:
            var sObjHero="#chessunit_hero_"+CoordinateToPos(x,y);
            var sObjCamp="#chessunit_hero_camp_"+CoordinateToPos(x,y);
            var sAPImg="#chessman_hero_apimg_"+CoordinateToPos(x,y);
            $(sObjHero).remove();
            $(sObjCamp).remove();
            $(sAPImg).remove();
            break;
        case 2: 
            var sObjBuild="#chessunit_building_"+CoordinateToPos(x,y);
            $(sObjBuild).remove();
            break;   
    } 
}

//显示选中框
function ShowSelect(x,y)
{
    HideSelect();
    //显示选中框
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:22;";
    var html=HtmlImgStyle("chessunit_select_"+0,style,ChessHeroCampImg[0]);
    $("#mainpic").append(html);
    
    html=null;
}

//显示快捷选中框
function ShowQuickSelect(index)
{
    HideQuickSelect();
    var left=21+index*60;
    var top=246;
    //显示选中框
    var style="left:"+left+"px;top:"+top+"px;position:absolute;z-index:1;";
    var html=HtmlImgStyle("chessunit_quickselect_"+0,style,ChessQuickSelectImg);
    $("#chessmanlist").append(html);
    
    html=null;
}

//隐藏快捷选中框
function HideSelect()
{
    var s="#chessunit_select_0";
    $(s).remove();
}

//隐藏选中框
function HideQuickSelect()
{
    var s="#chessunit_quickselect_0";
    $(s).remove();
}

//隐藏气槽
function HideActionPoint(x,y)
{
    var s="#chessman_hero_apimg_"+CoordinateToPos(x,y);
    $(s).remove();
}

//棋子死亡效果
function ChessmanDie(img,x,y)
{
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:8;";
    var html=HtmlImgStyle("chessman_die"+CoordinateToPos(x,y),style,img);
    $("#mainpic").append(html);
    html=null;
    var s="#chessman_die"+CoordinateToPos(x,y);
    $(s).fadeTo(1500, 0.1, function(){
         $(s).remove();
    }); 
    
}

//显示行为效果
function ShowActionEff(img,pos,x,y)
{ 
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:28;";
    var html=HtmlImgStyle("chessunit_actioneff_"+pos+"_"+CoordinateToPos(x,y),style,img);
    $("#mainpic").append(html);
    html=null;
    var sEff="#chessunit_actioneff_"+pos+"_"+CoordinateToPos(x,y);
    $(sEff).fadeTo(1000, 0.1, function(){
        $(sEff).remove();
    }); 
}

//显示行动框
function ShowActionFlag(img,x,y,flag)
{
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:29;";
    var html=HtmlImgStyle("chessunit_actionflag_"+CoordinateToPos(x,y)+flag,style,img);
    $("#mainpic").append(html);
    html=null;
    var sFlag="#chessunit_actionflag_"+CoordinateToPos(x,y)+flag;
    $(sFlag).fadeTo(500,0.6, function(){
        $(sFlag).remove();
    }); 
}

//棋盘格的信息
function ShowChessInfo(pos)
{
    var html="";
    var style="";
    var img="";
    var x=pos%Chessboard.Width;
    var y=Math.floor(pos/Chessboard.Width);
    var obj=null;
    var name="";
    var des="";

    if(Chessboard.ChessunitMap[pos].BuildingID>=0)
        obj=Chessboard.ChessmanList[Chessboard.ChessunitMap[pos].BuildingID];            
    if(Chessboard.ChessunitMap[pos].HeroID>=0)
    {
        obj=Chessboard.ChessmanList[Chessboard.ChessunitMap[pos].HeroID];
    }
    var oColor=ColorHei;        
    //基本信息
    if(obj==null)
    {
        name="一块空地";
        des="很普通的平地";
        if(Math.floor(pos/Chessboard.Width)<=3)
        {
            img=ChessLandformImg[0];
        }
        else if (Math.floor(pos/Chessboard.Width)<=11)
            img=ChessLandformImg[1];
        else 
            img=ChessLandformImg[2];     
        }
        
    else
    {

        if(obj.Player==ChessplayerID)
            oColor=ColorLv;
        else if(Chessboard.ChessplayerList[obj.Player].Camp==Chessboard.ChessplayerList[ChessplayerID].Camp)
            oColor=ColorLan;
        else
            oColor=ColorHong;
        name=obj.Name
        des=Chessboard.ChessplayerList[obj.Player].CityName;
        img=PicPath+obj.Image;
    }
    
    html+="<table width='307px' style=\"margin-top:2px;\" border='0' cellspacing='0' cellpadding='0'>";
    html+="<tr>";
    html+="<td height='36px' width='40px' align='center'>";
    html+=HtmlImgStyle("chessunit_landform_img"+pos,style,img);
    html+="</td>";
    html+="<td width='56px' align='center'>";
    html+="<span style='"+oColor+"'>"+name+"</span>";
    html+="</td>";
    html+="<td width='44px' align='center'>";
    html+="<span>("+x+","+y+")</span>";
    html+="</td>";
    html+="<td align='center' width='140px'>";
    html+="<span style='"+oColor+"'>"+des+"</span>";
    html+="</td>";
    html+="</tr>";    
    html+="</table>";   
    var tree=document.getElementById("chessunitinfo_base");
    tree.innerHTML=html;    
    html="";   
    
    //扩展信息
    if(obj==null)
    {
        html+="<table width='307px' height='80' border='0' cellspacing='0' cellpadding='0'>";
        html+="<tr>";
        html+="<td align='center'>";
        html+="<span>空地可以放置各种道具(暂未开放)</span>";
        html+="</td>";
        html+="</tr>";
        html+="</table>";
    }
    else
    {
        html+="<div id='chessunitinfo_chessman_info4' style='width:307px;height:18px;margin-top:1px;'>";
        if(obj.Type==1)
        {
            html+="<table width='307px' border='0' cellspacing='0' cellpadding='0'>";
            html+="<tr>";
            html+="<td height='18px' width='30px' align='left'>";
            html+="<span><b>属性</b></span>";
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            switch(obj.Element)
            {
                case 1:
                    html+="<span style=\"color:#DB2F07;\">金</span>";
                    break;
                case 2:
                    html+="<span style=\"color:#DB2F07;\">木</span>";
                    break;    
                case 3:
                    html+="<span style=\"color:#DB2F07;\">土</span>";
                    break;
                case 4:
                    html+="<span style=\"color:#DB2F07;\">水</span>";
                    break;
                case 5:
                    html+="<span style=\"color:#DB2F07;\">火</span>";
                    break;
            }
            
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            html+="<span style=\"color:#A77B58\">级:</span><span>"+obj.Level+"</span>";
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            html+="<span style=\"color:#A77B58\">闪:</span><span>"+obj.Dodge+"</span>";
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            html+="<span style=\"color:#A77B58\">爆:</span><span>"+obj.CrushBlow+"</span>";
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            html+="<span style=\"color:#A77B58\">移:</span><span>"+obj.MovePoint+"</span>";
            html+="</td>";
            html+="<td height='18px' width='40px' align='left'>";
            html+="</td>";
            html+="</tr>";    
            html+="</table>";
            html+="</div>";
        }
        else
        {
            html+="<table width='307px' border='0' cellspacing='0' cellpadding='0'>";
            html+="<tr>";
            html+="<td height='18px' width='30px' align='left'>";
            html+="<span><b>属性</b></span>";
            html+="</td>";
            html+="<td height='18px' width='240px' align='left'>";
            html+="<span>抵抗所有非机械类型伤害</span>";
            html+="</td>";
            html+="</tr>"
            html+="</table>";
            html+="</div>";
        }
        
        html+="<div id='chessunitinfo_chessman_info1' style='width:307px;height:18px;margin-top:1px;'>";
        html+="<table width='307px' border='0' cellspacing='0' cellpadding='0'>";
        html+="<tr>";
        html+="<td height='18px' width='30px' align='left'>";
        if(obj.Type==1)
            html+="<span><b>战力</b></span>";
        else
            html+="<span><b>耐久</b></span>";
        html+="</td>";
        html+="<td height='18px' width='80px' align='left'>";
        html+="<span>"+obj.HitPoint+"</span><span>/</span><span>"+obj.MaxHitPoint+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        if(obj.Type==1)
            html+="<span><b>士气</b></span>";
        html+="</td>";
        html+="<td height='18px' width='80px' align='left'>";
        if(obj.Type==1)
            html+="<span>"+obj.Educate+"%</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="</td>";
        html+="</tr>";    
        html+="</table>";
        html+="</div>";
  
        html+="<div id='chessunitinfo_chessman_info2' style='width:307px;height:18px;margin-top:1px;'>";
        html+="<table width='307px' border='0' cellspacing='0' cellpadding='0'>";
        html+="<tr>";
        html+="<td height='18px' width='30px' align='left'>";
        html+="<span><b>攻击</b></span>";
        html+="</td>";
        html+="<td height='18px' width='80px' align='left'>";
        html+="<span style=\"color:#A77B58\">普:</span><span>"+obj.AttackPoint+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        if(obj.Type==1)
            html+="<span><b>技能</b></span>";
        html+="</td>";
        html+="<td height='18px' width='120px' align='left'>";
        if(obj.Type==1)
        {
            if(obj.ActionNeed[2]>obj.MaxActionPoint)
                html+="<span>"+obj.SkillName+"</span><span style='"+ColorHong+"'>(无法使用!)</span>";
            else    
                html+="<span>"+obj.SkillName+"</span><span>("+SkillAttr[obj.SkillElement]+"</span>:<span>"+obj.SkillPoint+")</span>";
        }
        html+="</td>";
        html+="<td height='18px' width='0px' align='left'>";
        html+="</td>";
        html+="</tr>";    
        html+="</table>";
        html+="</div>";
           
        html+="<div id='chessunitinfo_chessman_info3' style='border-bottom:1px solid gray;width:307px;height:18px;margin-top:1px;'>";
        html+="<table width='307px' border='0' cellspacing='0' cellpadding='0'>";
        html+="<tr>";
        html+="<td height='18px' width='30px' align='left'>";
        html+="<span><b>抵抗</b></span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">普:</span><span>"+obj.Resist[0]+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">冰:</span><span>"+obj.Resist[1]+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">火:</span><span>"+obj.Resist[2]+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">雷:</span><span>"+obj.Resist[3]+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">毒:</span><span>"+obj.Resist[4]+"</span>";
        html+="</td>";
        html+="<td height='18px' width='40px' align='left'>";
        html+="<span style=\"color:#A77B58\">械:</span><span>"+obj.Resist[5]+"</span>";
        html+="</td>";
        html+="</tr>";    
        html+="</table>";
        html+="</div>";
        
        //可使用道具
        html+="<div id='chessunitinfo_item' style='width:307px;height:70px;margin-top:7px;'>";
        if(Chessboard.ChessplayerList[obj.Player].ItemList!=null && Chessboard.ChessplayerList[ChessplayerID].ID==obj.Player)
        {
            for(var i=0;i<ObjItemInfo.length;i++)
            {
                if(ObjItemInfo[i]!=null)
                {
                    if(ObjItemInfo[i].IsUsed!=1)
                    {
                        if(ObjItemInfo[i].UseType==12)
                        {
                            html+="<ul id=\"chessItem_"+i+"\" style=\"float:left;margin-left:12px;\">";
                            if(obj.EffList[8]>0)//经验效果
                            html+="<li><img title=\"已拥有此效果\" src=\"Img/2/w/bn4.gif\" /></li>";
                            else
                            html+="<li><a href=\"#\" id=\"citem_"+ObjItemInfo[i].ID+"_"+i+"_"+ObjItemInfo[i].UseType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" onmousedown=\"UserBattleItem(event,this.id)\"><img src=\""+PicPath+ObjItemInfo[i].Cutu+"\" /></a></li>";
                            html+="<li>"+ObjItemInfo[i].Name+"</li>";
                            html+="</ul>";
                        }
                        else if(ObjItemInfo[i].UseType==13)
                        {
                            html+="<ul id=\"chessItem_"+i+"\" style=\"float:left;margin-left:12px;\">";
                            if(obj.EffList[7]>0)
                            html+="<li><img title=\"已拥有此效果\" src=\"Img/2/w/bn2.gif\" /></li>";
                            else
                            html+="<li><a href=\"#\" id=\"citem_"+ObjItemInfo[i].ID+"_"+i+"_"+ObjItemInfo[i].UseType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" onmousedown=\"UserBattleItem(event,this.id)\"><img src=\""+PicPath+ObjItemInfo[i].Cutu+"\" /></a></li>";
                            html+="<li>"+ObjItemInfo[i].Name+"</li>";
                            html+="</ul>";
                        }
                        else
                        {
                            html+="<ul id=\"chessItem_"+i+"_"+ObjItemInfo[i].UseType+"\" style=\"float:left;margin-left:12px;\">";
                            html+="<li><a href=\"#\" id=\"citem_"+ObjItemInfo[i].ID+"_"+i+"_"+ObjItemInfo[i].UseType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" onmousedown=\"UserBattleItem(event,this.id)\"><img src=\""+PicPath+ObjItemInfo[i].Cutu+"\" /></a></li>";
                            html+="<li>"+ObjItemInfo[i].Name+"</li>";
                            html+="</ul>";
                        }
                    }
                }    
            }
        }
        else
        html+="<span>没有可以使用的道具</span>";
        html+="</div>";
        
    }
    
    var tree=document.getElementById("chessunitinfo_expand");
    tree.innerHTML=html;    
    html=null;   
    
}

//获得图片的left值
function GetLeft(x)
{
    return ChessPicSize*x+3;
}

//获得图片的top值
function GetTop(y)
{
    return ChessPicSize*y+20;
}

var ChessItemIndex;
//使用战场道具
function UserBattleItem(e,id)
{
    if(ChessOver)
        return; 
    var t=id.split("_");
    ChessItemIndex = parseInt(t[2],10);
    var ItemID = parseInt(t[1],10);
    if (!e) e=window.event;
    if(e.button==2)
    Main.UserBattleItem(Chessboard.Pos,CityID,Chessboard.ChessplayerList[ChessplayerID].ID,ChessControlObj.ChessIndex,0,ItemID,1,1,cb_UserBattleItem);
}

function cb_UserBattleItem(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)//使用成功,去掉道具图片
    {
        var k="#chessItem_"+ChessItemIndex+"";
        $(k).remove();
        ObjItemInfo[ChessItemIndex]=null;
    }
    else
    alert("使用失败");
}

//使用道具事件
function ChessItemAction(obj,value,type)
{
    var s = "";
    var ItemImg = ChessItemActionImg[type-9];//取得对应道具效果图片
    ShowItemActionEff(ItemImg,obj.X,obj.Y)
    s+="<span>"+obj.Name+"["+Chessboard.ChessplayerList[obj.Player].CityName+"]</span>"
    s+="<span>使用了"+ChessItemName[type-9]+"</span>";
    switch(type)
    {
        case 9:
            s+="<span>瞬间补满行动力</span>";
            obj.ActionPoint+=value;//给当前棋子加上道具添加的行动力
        break
        case 10:
            s+="<span>恢复"+value+"名弟子</span>";
            obj.HitPoint=obj.HitPoint+value;
            if(obj.HitPoint>obj.MaxHitPoint)//如果弟子数大于最大弟子数，则弟子数等于最大弟子数
            obj.HitPoint=obj.MaxHitPoint;
        break
        case 11: 
            s+="<span>成功撤退战场</span>"; 
            obj.Speed = 0;
            obj.ActionPoint = 0;
            HideChessman(obj.X,obj.Y,obj.Type);//隐藏侠客
            HideActionState(obj.X,obj.Y,0)//隐藏移动标识
            HideActionState(obj.X,obj.Y,1)//隐藏普通攻击标识
            HideActionState(obj.X,obj.Y,2)//隐藏技能攻击标识
            HideActionPoint(obj.X,obj.Y);//隐藏气槽      
            ClearMoveRange();//隐藏移动范围
            ClearActionRange();//隐藏行动范围/攻击范围标识
            HideSelect();//隐藏选中
            ChessControlObj=null;
            UpdatePlayerNum(obj.Player);
            Chessboard.ChessunitMap[CoordinateToPos(obj.X,obj.Y)].HeroID=-1;
            var hero=Chessboard.ChessmanList[Chessboard.ChessplayerList[ChessplayerID].MyChessman[obj.PlayerIndex]];
            hero.Visible = 3;//侠客设为不可见
            if(obj.Player==Chessboard.ChessplayerList[ChessplayerID].ID)
            {
                UpdateChessmanInQuick(obj.PlayerIndex);//更新右侧快捷栏信息  
            }
            //更新信息显示
            if(CoordinateToPos(obj.X,obj.Y)==ChessSelectPos)
            ShowChessInfo(ChessSelectPos); //更新右侧信息
        break
        case 12:
            s+="<span>侠客获得经验值提高10%</span>";
            obj.EffList[8] = 1;
        break
        case 13:
            s+="<span>侠客行动力回复速度提高20%</span>";
            obj.EffList[7] = 1;
            obj.Speed*=2.5;
        break
        default:
        break
    }
    AddEventInfo(s);
    ShowChessInfo(CoordinateToPos(obj.X,obj.Y));
}

//显示使用道具效果
function ShowItemActionEff(img,x,y)
{ 
    var style="left:"+GetLeft(x)+"px;top:"+GetTop(y)+"px;position:absolute;z-index:28;";
    var html=HtmlImgStyle("chessunit_Itemactioneff_"+CoordinateToPos(x,y),style,img);
    $("#mainpic").append(html);
    html=null;
    var sEff="#chessunit_Itemactioneff_"+CoordinateToPos(x,y);
    $(sEff).fadeTo(1000, 0.1, function(){
        $(sEff).remove();
    }); 
}

function CheckIsRedRank(ChessMail,name) {
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')'); 
    var redKey=false;  
    if(ChessMailText.RedBankInfo!=null) 
    {
        for(var i=0;i<ChessMailText.RedBankInfo.length;i++)
        {
            if(ChessMailText.RedBankInfo[i]!=null && name==ChessMailText.RedBankInfo[i].UserName)
            {
                 redKey=true;
                 break;
            }  
        }  
    }  
    return redKey; 
}

function CheckIsBlueRank(ChessMail,name) {
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')'); 
    var blueKey=false;  
    if(ChessMailText.BlueBankInfo!=null) 
    {
        for(var i=0;i<ChessMailText.BlueBankInfo.length;i++)
        {
            if(ChessMailText.BlueBankInfo[i]!=null && name==ChessMailText.BlueBankInfo[i].UserName)
            {
                 blueKey=true;
                 break;
            }  
        }    
    } 
    return blueKey; 
} 

function CreateChessLogLogo(ChessMail)
{
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')');  
    var htmltop=new StringBuffer(); 
    var redKey=CheckIsRedRank(ChessMail,UserInfo.Name); 
    var blueKey=CheckIsBlueRank(ChessMail,UserInfo.Name);   
    
    if ((ChessMailText.WinName==1 && redKey) || (ChessMailText.WinName==3 && blueKey) || ChessMailText.WinName==0) 
        htmltop.append("<div class=\"warpaper_logo_1\">"); 
    else
        htmltop.append("<div class=\"warpaper_logo_2\">");
         
    if(ChessMailText.ChessType==1) 
        htmltop.append("<span>"+Lang["PopUp_126"]+"</span></div>");
    else if(ChessMailText.ChessType==2) 
        htmltop.append("<span>"+Lang["PopUp_262"]+"</span></div>");
    else if(ChessMailText.ChessType==3) 
        htmltop.append("<span>"+Lang["PopUp_263"]+"</span></div>");  
    var treetop=document.getElementById("warpaper_logo");
    treetop.innerHTML=htmltop.toString();    
    htmltop=null;
}

function CreateChessLogTop(ChessMail)
{
    if(ChessMail==null)return;
    var ChessMailText=eval('('+ChessMail.Text+')');  
    var html=new StringBuffer();
    html.append("<span>"+Lang["PopUp_60"]+""+ChessMailText.Date+"</span>"); 
    html.append("<div class=\"warpaper_box\">");
    html.append("<b>"+Lang["PopUp_264"]+"</b>");
    html.append("<ul>");
    if(ChessMailText.RedBankInfo!=null) 
    {    
        for(var i=0;i<ChessMailText.RedBankInfo.length;i++)
        {
            if(ChessMailText.RedBankInfo[i]!=null) 
            {
                var x,y;
                x=Math.floor(ChessMailText.RedBankInfo[i].CityPos%400);
                if(x==0)x=400;
                y=(Math.floor((ChessMailText.RedBankInfo[i].CityPos-1)/400)+1)%400; 
                if(ChessMailText.RedBankInfo[i].UserName!=UserInfo.Name) 
                    html.append("<li><a href=\"#\" onmousedown=\"WriteLetterToChess('"+ChessMailText.RedBankInfo[i].UserName+"')\"><b class=\"font_green\">"+ChessMailText.RedBankInfo[i].UserName+"</b></a>&nbsp;"+Lang["PopUp_128"]+"&nbsp;<b class=\"font_green\">"+ChessMailText.RedBankInfo[i].CityName+"</b>&nbsp;&nbsp;&nbsp;&nbsp;["+x+","+y+"]</li>"); 
                else
                    html.append("<li><b class=\"font_green\">"+ChessMailText.RedBankInfo[i].UserName+"</b>&nbsp;"+Lang["PopUp_128"]+"&nbsp;<b class=\"font_green\">"+ChessMailText.RedBankInfo[i].CityName+"</b>&nbsp;&nbsp;&nbsp;&nbsp;["+x+","+y+"]</li>");   
                html.append("<li><table style=\"margin-left:0;margin-bottom:0;\" width=\"200px\">") 
                html.append("<tr><td style=\"border:0;text-align:left\" width=\"100px\">"+Lang["PopUp_266"]+":"+ChessMailText.RedBankInfo[i].Power+"</td>"); 
                html.append("<td style=\"border:0;text-align:left\" width=\"100px\">"+Lang["PopUp_267"]+":"+ChessMailText.RedBankInfo[i].BattelPower+"</td></tr>");  
                html.append("</table></li>");           
            } 
        } 
    }  
    html.append("</ul>");  
    html.append("<b>"+Lang["PopUp_265"]+"</b>");
    html.append("<ul>");
    if(ChessMailText.BlueBankInfo!=null) 
    {    
        for(var i=0;i<ChessMailText.BlueBankInfo.length;i++)
        {
            if(ChessMailText.BlueBankInfo[i]!=null) 
            {
                var x,y;
                x=Math.floor(ChessMailText.BlueBankInfo[i].CityPos%400);
                if(x==0)x=400;
                y=(Math.floor((ChessMailText.BlueBankInfo[i].CityPos-1)/400)+1)%400; 
                if(ChessMailText.BlueBankInfo[i].UserName!=UserInfo.Name)  
                    html.append("<li><a href=\"#\" onmousedown=\"WriteLetterToChess('"+ChessMailText.BlueBankInfo[i].UserName+"')\"><b class=\"font_green\">"+ChessMailText.BlueBankInfo[i].UserName+"</b></a>&nbsp;"+Lang["PopUp_128"]+"&nbsp;<b class=\"font_green\">"+ChessMailText.BlueBankInfo[i].CityName+"</b>&nbsp;&nbsp;&nbsp;&nbsp;["+x+","+y+"]</li>"); 
                else
                    html.append("<li><b class=\"font_green\">"+ChessMailText.BlueBankInfo[i].UserName+"</b>&nbsp;"+Lang["PopUp_128"]+"&nbsp;<b class=\"font_green\">"+ChessMailText.BlueBankInfo[i].CityName+"</b>&nbsp;&nbsp;&nbsp;&nbsp;["+x+","+y+"]</li>");   
                html.append("<li><table style=\"margin-left:0;margin-bottom:0;\" width=\"200px\">");
                html.append("<tr><td style=\"border:0;text-align:left\" width=\"100px\">"+Lang["PopUp_266"]+":"+ChessMailText.BlueBankInfo[i].Power+"</td>"); 
                html.append("<td style=\"border:0;text-align:left\" width=\"100px\">"+Lang["PopUp_267"]+":"+ChessMailText.BlueBankInfo[i].BattelPower+"</td></tr>");  
                html.append("</table></li>"); 
            } 
        } 
    }  
    html.append("</ul>");   
    html.append("</div>"); 
    var top=document.getElementById("warpaper_top");
    top.innerHTML=html.toString();
    html=null;  
} 

function CreateChessLogCenter(ChessMail)
{
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')'); 
    var html=new StringBuffer();
    if(ChessMailText.WinName==0) 
        html.append("<span>"+Lang["PopUp_136"]+"&nbsp;&nbsp;&nbsp;&nbsp;"+Lang["PopUp_268"]+"</span>"); 
    else if(ChessMailText.WinName==1)
        html.append("<span>"+Lang["PopUp_136"]+"&nbsp;&nbsp;<b class=\"font_green\">"+Lang["PopUp_264"]+"</b>&nbsp;&nbsp;"+Lang["PopUp_269"]+"</span>");
    else if(ChessMailText.WinName==3)
        html.append("<span>"+Lang["PopUp_136"]+"&nbsp;&nbsp;<b class=\"font_green\">"+Lang["PopUp_265"]+"</b>&nbsp;&nbsp;"+Lang["PopUp_269"]+"</span>");
    html.append("<div class=\"warpaper_box\">");
    html.append("<b>"+Lang["PopUp_264"]+Lang["PopUp_270"]+"</b>");
    html.append("<table width=\"300px\" style=\"margin-top:5px;\">");
    if(ChessMailText.RedBankGet!=null)
    {
        for(var i=0;i<ChessMailText.RedBankGet.length;i++)
        {
            if (ChessMailText.RedBankGet[i]!=null) 
            {
                html.append("<tr height=\"20px\">");
                html.append("<td style=\"border:0;text-align:left\" width=\"150px\"><b class=\"font_green\">"+ChessMailText.RedBankGet[i].CityName+"</b></td>"); 
                html.append("<td style=\"border:0;text-align:left\" width=\"75px\"><img alt="+Lang["PopUp_277"]+" style=\"vertical-align:text-bottom\" src=\"img/o/76.GIF\"/>&nbsp;"+ChessMailText.RedBankGet[i].Exploit+"</td>"); 
                if(ChessMailText.WinName==1)  
                    html.append("<td style=\"border:0;text-align:right\" width=\"75px\">"+Lang["PopUp_271"]+"&nbsp;"+Lang["PopUp_275"]+"</td>"); 
                else
                    html.append("<td style=\"border:0;text-align:right\" width=\"75px\">"+Lang["PopUp_271"]+"&nbsp;"+Lang["PopUp_276"]+"</td>"); 
                html.append("</tr>"); 
            } 
        } 
    }      
    html.append("</table>");  
    html.append("<b>"+Lang["PopUp_265"]+Lang["PopUp_270"]+"</b>");
    html.append("<table width=\"300px\" style=\"margin-top:5px;\">");
    if(ChessMailText.BlueBankGet!=null)
    {
        for(var i=0;i<ChessMailText.BlueBankGet.length;i++)
        {
            if (ChessMailText.BlueBankGet[i]!=null) 
            {
                html.append("<tr height=\"20px\">");
                html.append("<td style=\"border:0;text-align:left\" width=\"150px\"><b class=\"font_green\">"+ChessMailText.BlueBankGet[i].CityName+"</b></td>"); 
                html.append("<td style=\"border:0;text-align:left\" width=\"75px\"><img alt="+Lang["PopUp_277"]+" style=\"vertical-align:text-bottom\" src=\"img/o/76.GIF\"/>&nbsp;"+ChessMailText.BlueBankGet[i].Exploit+"</td>"); 
                if(ChessMailText.WinName==3)  
                    html.append("<td style=\"border:0;text-align:right\" width=\"75px\">"+Lang["PopUp_271"]+"&nbsp;"+Lang["PopUp_275"]+"</td>"); 
                else
                    html.append("<td style=\"border:0;text-align:right\" width=\"75px\">"+Lang["PopUp_271"]+"&nbsp;"+Lang["PopUp_276"]+"</td>");
                html.append("</tr>"); 
            } 
        } 
    }      
    html.append("</table>");  
    html.append("</div>");   
    var center=document.getElementById("warpaper_middle");
    center.innerHTML=html.toString();
    html=null;  
} 

function CreateChessLogSupport(ChessMail)
{
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')');  
    var html=new StringBuffer();
    html.append("<span>"+Lang["PopUp_264"]+"</span>");
    html.append("<div class=\"warpaper_box\">");
    if(ChessMailText.RedRankHero!=null)
    {
        for(var i=0;i<ChessMailText.RedRankHero.length;i++)
        {
            if(ChessMailText.RedRankHero[i]!=null) 
            { 
                html.append("<b class=\"font_green\">"+ChessMailText.RedRankHero[i].CityName+"</b>");  
                html.append("<ul>"); 
                html.append("<li>"+Lang["PopUp_272"]+"<font color=\"red\">"+ChessMailText.RedRankHero[i].PipNum+"</font></li>");
                html.append("<li><table style=\"margin-left:0;\" width=\"362\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bordercolor=\"#FFFFFF\">");
                html.append("<tr><td width=\"57\">"+Lang["PopUp_151"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_152"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_153"]+"</td>");
                html.append("<td width=\"39\">"+Lang["PopUp_273"]+"</td>");
                html.append("<td width=\"66\">"+Lang["PopUp_274"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_156"]+"</td>");
                html.append("<td width=\"41\">"+Lang["PopUp_157"]+"</td></tr>");
                if(ChessMailText.RedRankHero[i].HeroInfos!=null)
                {              
                    for(var j=0;j<ChessMailText.RedRankHero[i].HeroInfos.length;j++)
                    {
                        if(ChessMailText.RedRankHero[i].HeroInfos[j]!=null)
                        {
                            html.append("<tr><td><span class=\"hquality_"+ChessMailText.RedRankHero[i].HeroInfos[j].Quality+"\"><b>"+ChessMailText.RedRankHero[i].HeroInfos[j].HeroName+"</b><span></td>");
                            html.append("<td>"+ChessMailText.RedRankHero[i].HeroInfos[j].ChildrenCount+"</td>");
                            html.append("<td>"+ChessMailText.RedRankHero[i].HeroInfos[j].ChildrenLoss+"</td>");
                            html.append("<td>"+ChessMailText.RedRankHero[i].HeroInfos[j].TrainingCount+"</td>");
                            html.append("<td>"+ChessMailText.RedRankHero[i].HeroInfos[j].TrainingLoss+"</td>");
                            html.append("<td>"+ChessMailText.RedRankHero[i].HeroInfos[j].GainExp+"</td>");
                            html.append("<td>");
                            if(ChessMailText.RedRankHero[i].HeroInfos[j].HeroUpdateFlag==1)
                                html.append("<img alt="+Lang["PopUp_159"]+" src=\"img/o/38.GIF\"/>");
                            if(ChessMailText.RedRankHero[i].HeroInfos[j].HeroStatefFlag==1)
                                html.append("<img alt="+Lang["PopUp_158"]+" src=\"img/o/39.GIF\"/>");
                            html.append("</td></tr>");
                        }
                    } 
                }
                html.append("</table></li></ul>"); 
            } 
        }  
    } 
    html.append("</div>"); 
    var center=document.getElementById("warpaper_support");
    center.innerHTML=html.toString();
    html=null;   
} 


function CreateChessLogBottom(ChessMail)
{
    if(ChessMail==null)return; 
    var ChessMailText=eval('('+ChessMail.Text+')');  
    var html=new StringBuffer();
    html.append("<span>"+Lang["PopUp_265"]+"</span>");
    html.append("<div class=\"warpaper_box\">");
    if(ChessMailText.BlueRankHero!=null)
    {
        for(var i=0;i<ChessMailText.BlueRankHero.length;i++)
        {
            if(ChessMailText.BlueRankHero[i]!=null) 
            { 
                html.append("<b class=\"font_green\">"+ChessMailText.BlueRankHero[i].CityName+"</b>");  
                html.append("<ul>"); 
                html.append("<li>"+Lang["PopUp_272"]+"<font color=\"red\">"+ChessMailText.BlueRankHero[i].PipNum+"</font></li>");
                html.append("<li><table style=\"margin-left:0;\" width=\"362\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bordercolor=\"#FFFFFF\">");
                html.append("<tr><td width=\"57\">"+Lang["PopUp_151"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_152"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_153"]+"</td>");
                html.append("<td width=\"39\">"+Lang["PopUp_273"]+"</td>");
                html.append("<td width=\"66\">"+Lang["PopUp_274"]+"</td>");
                html.append("<td width=\"53\">"+Lang["PopUp_156"]+"</td>");
                html.append("<td width=\"41\">"+Lang["PopUp_157"]+"</td></tr>");
                if(ChessMailText.BlueRankHero[i].HeroInfos!=null)
                {              
                    for(var j=0;j<ChessMailText.BlueRankHero[i].HeroInfos.length;j++)
                    {
                        if(ChessMailText.BlueRankHero[i].HeroInfos[j]!=null)
                        {
                            html.append("<tr><td><span class=\"hquality_"+ChessMailText.BlueRankHero[i].HeroInfos[j].Quality+"\"><b>"+ChessMailText.BlueRankHero[i].HeroInfos[j].HeroName+"</b></span></td>");
                            html.append("<td>"+ChessMailText.BlueRankHero[i].HeroInfos[j].ChildrenCount+"</td>");
                            html.append("<td>"+ChessMailText.BlueRankHero[i].HeroInfos[j].ChildrenLoss+"</td>");
                            html.append("<td>"+ChessMailText.BlueRankHero[i].HeroInfos[j].TrainingCount+"</td>");
                            html.append("<td>"+ChessMailText.BlueRankHero[i].HeroInfos[j].TrainingLoss+"</td>");
                            html.append("<td>"+ChessMailText.BlueRankHero[i].HeroInfos[j].GainExp+"</td>");
                            html.append("<td>");
                            if(ChessMailText.BlueRankHero[i].HeroInfos[j].HeroUpdateFlag==1)
                                html.append("<img alt="+Lang["PopUp_159"]+" src=\"img/o/38.GIF\"/>");
                            if(ChessMailText.BlueRankHero[i].HeroInfos[j].HeroStatefFlag==1)
                                html.append("<img alt="+Lang["PopUp_158"]+" src=\"img/o/39.GIF\"/>");
                            html.append("</td></tr>");
                        }
                    } 
                }
                html.append("</table></li></ul>"); 
            } 
        }  
    } 
    html.append("</div>"); 
    var center=document.getElementById("warpaper_bottom");
    center.innerHTML=html.toString();
    html=null;   
} 