
var MessageText="";
var CanEnterPop=0;
var SpeedFlag=new Array(0,0,0,0,0,0,0,0,0,0);//0:行军方式(0:正常行军，1:快速行军,2:急速行军),1:占领玩家消费方式(0:占领玩家使用战勋,1:占领玩家使用元宝)
var AutoExpFlag=0;//0:不使用元宝闭关，1：使用元宝闭关
var AutoExpSign=false;

//显示弹出框
function ShowPopUp(id)
{
   var html;
   var t=id.split("_");
   var what=parseInt(t[t.length-1],10);

   if(what==0)
   {
       html=PopUpMessageBox();//显示MessageBox
   }
   if (what==1)
   {
        html=PopUpChoose(id);//遣返侠客、拆除建筑等
   }
   if (what==2)
   {
        html=PopUpEventControl(id);//取消事件
   }
   if (what==3)
   {
        html=PopUpChoose(id);
   }
   if (what==4)
   {
        html=PopUpChoose(id);
   }
   if (what==99)
   {
        html=PopUpChoose(id);
   }
   if(what==104)
   {
        html=PopUpChoose(id);
   }
   else if (what==25 || what==108)
   {
       html=PopUpNeedGold(id);//元宝不足
   }
   else if (what==29 || what==30 || what==82 || what==92 || what==93 ||  what==94 || what==95 || what==110)
   {
       html=PopUpAttackDecision(id);//攻击或支援
   }
   else if(what==105 || what==107)
   {
       html=PopUpList(id);//攻擂擂台或占领山寨列表
   }
   else if(what==109)
   {
       html=PopItemMall(id);
   }
   else if(what==106)
   {
       html=PoPresource();//资源交换倍数
   }
   else if (what==31)
   {
       html=PopUpConscribeChild(id);//招募弟子
   }
   else if(what==83)
   {
       html=PopUpFastConscribeChild(id);//快速招募弟子
   }
   else if(what==84)
   {
       html=PopUpAutoExp(id);
   }
   else if(what==85)
   {
       html=PopUpLookAutoExp(id);
   }
   else if(what==33 || what==37 || what==35 || what==32 || what==42 || what==43 || what==47 || what==101)
   {
       html=PopUpAboutEquip(id);//回收物品、使用物品、购买物品、出售物品,分解物品
   }
   else if(what==34)
   {
       html=PopUpSendMessage(id);//发送消息 
   }
   else if(what==36)
   {
       html=PopUpReadMessage(id);//查看消息
   }
   else if(what==38)
   {
       html=PopUpChoiceHero(id);//装备物品到英雄
   }
   else if(what==39)
   {
       html=PopUpEquipList(id);//可装备物品列表
   } 
   else if(what==40)
   {
       html=PopUpHeroEducate(id);//有侠客在招募训练
   }
   else if(what==41)
   {
       html=PopUpChoiceItem(id);//英雄选择物品
   }    
   $("#popup").show();
   $("#overlay").show();
}
//确定弹出框
function PopUpDo(id)
{
    var t=id.split("_");
    var what=parseInt(t[t.length-1],10);
    var handletype = parseInt(t[3],10);
    switch(what)
    {
        case 1 :
            TreeCommand(id);
            break
        case 2 :
            CancelEvent(id);
            break
        case 3 :  
            DeleteMailsBySelect();
            break
        case 4 :
            Main.Exit(cb_Exit);
            window.location.href=ToExit;
            break
        case 99://放弃任务
            DataTranslateBegin();
            Main.DeleteTask(TaskNumber,cb_DeleteTask);
            HidePopUp();
            break;
        case 104:
            CallCorpsBack();
            break
        default:     
        break          
    }
    if(handletype!=15)
    HidePopUp();    
}

function Exit()
{
     Main.Exit(cb_Exit);
}
function cb_Exit(result)
{
    window.location.href=ToExit;
}

//取消弹出框
function PopUpNotDo(id)
{
    var t=id.split("_");
    var what=parseInt(t[t.length-1],10); 
    InChoiceHero=false;
    UseExpItemSign=false;
    UseSkillBookSign=false;
    UseSkillPillSign=false
    UseSkillExpSign=false;
    GetMessage="";
    HidePopUp();
}

function HidePopUp()
{
    $("#popup").hide();
    $("#overlay").hide();
    CanEnterPop=0;
}

function GetLeftValue(PopWidth)
{
    var t = document.documentElement.clientWidth
	var left = (t-PopWidth)/2;
	return left;
}

//确认对话框
function PopUpMessageBox()
{
    var html="";
    var left=GetLeftValue(166)
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p style=\"text-align:center;\">"+MessageText+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    CanEnterPop=1;
}

//资源确认框
function PopUpGetBox()
{
    var html="";
    var left=GetLeftValue(166)
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"res_popup\">";
    html+="<div class=\"res_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"res_popup2\">";
    if(GetMoney>0 || GetMen>0 || GetGold>0 || GetFood>0)
        html+="<div style=\"text-align:center;margin-top:5px\">"+GetMessage+"</div>";
    html+="<div style=\"text-align:center;margin-top:5px\">"
    if(GetMoney>0)
       html+=HtmlImg("pop_money","",PicPath+PicMoney)+" "+GetMoney+" ";
    if(GetFood>0)
       html+=HtmlImg("pop_food","",PicPath+PicFood)+" "+GetFood+" ";
    if(GetMen>0)
       html+=HtmlImg("pop_men","",PicPath+PicMen)+" "+GetMen+" ";
    if(GetGold>0)
       html+=HtmlImg("pop_gold","",PicPath+PicGold)+" "+GetGold;
    if(GetValue>0)
    {
        if(TheItemInfo.UseType==5)
            html+="<p style=\"text-align:left;padding:5px 0 0 5px;\">"+Lang["PopUp_2"]+""+TheItemInfo.Name+""+Lang["PopUp_3"]+","+TheHeroInfo.Name+Lang["PopUp_4"]+GetValue+".</p>";
        else if(TheItemInfo.UseType==8)
            html+="<p style=\"text-align:left;padding:10px 0 0 15px;\">"+Lang["PopUp_5"]+""+TheItemInfo.Name+Lang["PopUp_6"]+GetValue+".</p>";
    }
    if(TheItemInfo.UseType==14)//战勋道具
        html+="<p style=\"height:30px;\">"+GetMessage+"</p>";
    if(TheItemInfo.StaticIndex==891 || TheItemInfo.StaticIndex==894 || TheItemInfo.StaticIndex==895|| TheItemInfo.StaticIndex==896 || TheItemInfo.StaticIndex==897)
        html+="<p>"+Lang["PopUp_7"]+"</p>";
    if(TheItemInfo.StaticIndex==1047)//1047:紫 1048:青 1049:兰
        html+="<p style=\"height:30px;\">"+Lang["PopUp_222"]+"</p>";
    if(TheItemInfo.StaticIndex==1048)
        html+="<p style=\"height:30px;\">"+Lang["PopUp_223"]+"</p>";
    if(TheItemInfo.StaticIndex==1049)
        html+="<p style=\"height:30px;\">"+Lang["PopUp_224"]+"</p>";
    html+="</div>";             
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    GetMoney=0;
    GetFood=0;
    GetMen=0;
    GetGold=0;
    GetValue=0;
    GetMessage="";
    $(".res_popup").css("height","auto");
    $(".res_popup1").css("height","auto");
    $(".res_popup2").css("height","auto");
    $("#popup").show();
    $("#overlay").show();
    CanEnterPop=1   
}

//查看驻守部队侠客详细信息
function PopUpSeeHero()
{
    var html="";
    var team;
    team=SupportHeroInfo;
    var left=GetLeftValue(207)
    $("#popup").css("left",left);
    $("#popup").css("top","195px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div style=\"padding-left:10px;padding-top:10px;\" class=\"common_popup2\">";
    html+="<span>"+Lang["PopUp_8"]+"</span>";
    html+="<div id=\"seehero\">";
    html+="<table width=\"160\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"58\">"+Lang["PopUp_9"]+"</td><td width=\"43\">"+Lang["PopUp_10"]+"</td><td width=\"29\">"+Lang["PopUp_11"]+"</td><td width=\"30\">"+Lang["PopUp_12"]+"</td></tr>";
    for(var i=0;i<team.length;i++)
    {
        html+="<tr>";
        html+="<td><span class=\"hquality_"+team[i].Quality+"\">"+team[i].HeroName+"</span></td>";
        html+="<td><span>"+UnionName[team[i].Junta]+"</span></td>";
        html+="<td><span>"+team[i].Level+"</span></td>";
        html+="<td><span>"+team[i].HeroChildren+"</span></td>";
        html+="</tr>";
    }
    html+="</table>";
    html+="</div>";
    html+="</div>";             
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
     var tree=document.getElementById("popup");
     tree.innerHTML=html;    
     html=null;
    $(".common_popup").css("width","207px")
    $(".common_popup").css("height","210px")
    $(".common_popup1").css("width","203px")
    $(".common_popup1").css("height","196px")
    $(".common_popup2").css("width","168px")
    $(".common_popup2").css("height","156px")
    $(".common_popup2").css("margin-left","13px")
   $("#popup").show();
   $("#overlay").show();
}

//村镇秀弹出窗口
function CityShow()
{
    var html="";
    var team;
    var gold=CityInteriorInfo.Gold;
    var left=GetLeftValue(500);
    $("#popup").css("left",left);
    $("#popup").css("top","113px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div id=\"cityshow\">";
    html+="<p>"+Lang["PopUp_13"]+"</p>";
    html+="<ul>";
    html+="<li><img src=\""+ImgUrl+"2/b/o/m1.gif\"/></li>";
    html+="<li><img src=\""+ImgUrl+"2/b/o/m2.gif\"/></li>";
    html+="<li><img src=\""+ImgUrl+"2/b/o/m3.gif\"/></li>";
    html+="</ul>";
    html+="<div class=\"clear\"></div>";
    html+="<table width=\"418\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"21\"><img src=\"img/4/4.gif\" /></td><td width=\"17\">0</td>";
    html+="<td width=\"108\"><a href=\"#\" id=\"img_1\" class=\"linkstyle_1\" onmousedown=\"ChangeBackgroundImg(this.id)\">"+Lang["PopUp_14"]+"</a></td><td width=\"21\"><img src=\"img/4/4.gif\" /></td>";
    if(gold-100>=0)
    html+="<td width=\"36\">100</td>";
    else
    html+="<td width=\"36\"><span class=\"font_red\">100</span></td>";
    html+="<td width=\"103\"><a href=\"#\" id=\"img_2\" class=\"linkstyle_1\" onmousedown=\"ChangeBackgroundImg(this.id)\">"+Lang["PopUp_14"]+"</a></td>";
    html+="<td width=\"21\"><img src=\"img/4/4.gif\" />";
    if(gold-100>=0)
    html+="<td width=\"36\">100</td>";
    else
    html+="<td width=\"36\"><span class=\"font_red\">100</span></td>";
    html+="<td width=\"59\"><a href=\"#\" id=\"img_3\" class=\"linkstyle_1\" onmousedown=\"ChangeBackgroundImg(this.id)\">"+Lang["PopUp_14"]+"</a></td></tr></table>";  
    html+="<ul>";
    html+="<li><div class=\"showbox\"></div></li>";
    html+="<li><div class=\"showbox\"></div></li>";
    html+="<li><div class=\"showbox\"></div></li>";
    html+="</ul>";  
    html+="</div>";
    html+="<div style=\"margin-top:150px;\" class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_15"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
     var tree=document.getElementById("popup");
     tree.innerHTML=html;    
     html=null;
    $(".common_popup").css("width","500px")
    $(".common_popup").css("height","374px")
    $(".common_popup1").css("width","496px")
    $(".common_popup1").css("height","360px")
   $("#popup").show();
   $("#overlay").show();
}


//查看驻守部队获得资源信息
function PopUpSeeGoods(id)
{
    var t = id.split("_");
    var index = parseInt(t[1]);
    var html="";
    switch(index)
    {
        case 2:
        case 3:
        var team=DefendHeroInfo;
        var food = team.SchlepFood;
        var men = team.SchlepMen;
        var money = team.SchlepMoney;
        var insignia = team.Insignia;
        var time = DefendHeroInfo.Seconds;
        var dtime = ChangeTimeFormat(time);
        break
        case 1:
        var team=ClientCropsStateInfo.Res;
        var food = team.Grain;
        var men = team.Population;
        var money = team.Money;
        var insignia = ClientCropsStateInfo.Insignia;
        var time = ClientCropsStateInfo.Seconds;
        var dtime = ChangeTimeFormat(time); 
        break
        case 4:
        var insignia = ClientCropsStateInfo.Insignia;
        var time = ClientCropsStateInfo.Seconds;
        var dtime = ChangeTimeFormat(time);
        break 
        default:
        break;
    }
    if(food+men+money>0 || insignia>0)
    {
        var left=GetLeftValue(250)
        $("#popup").css("left",left);
        $("#popup").css("top","242px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        if(food+men+money>0)
        {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_16"]+""+dtime+"</li>";
        html+="<li>"+Lang["PopUp_17"]+"</li><li>";
        if(food>0)
        html+="<img src=\"img/4/2.gif\" />"+food+"";
        if(men>0)
        html+="<img src=\"img/4/3.gif\" />"+men+"";
        if(money>0)
        html+="<img src=\"img/4/1.gif\" />"+money+"";
        html+="</li></ul>"; 
        }
        if(insignia>0)
        {
            html+="<ul>";
            html+="<li>"+Lang["PopUp_185"]+""+dtime+"</li>";
            html+="<li>"+Lang["PopUp_17"]+"</li>";
            html+="<li><img src=\"img/o/76.gif\" />"+insignia+"</li>";
            html+="</ul>";
        }   
        html+="</div>";         
        html+="<div class=\"popup_button\">";
        html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $(".common_popup").css("width","250px")
        $(".common_popup").css("height","116px")
        $(".common_popup1").css("width","246px")
        $(".common_popup1").css("height","102px")
        $(".common_popup2").css("width","219px")
        $(".common_popup2").css("height","59px")
        $(".common_popup2").css("margin-left","13px")
       $("#popup").show();
       $("#overlay").show();
   }
   else
   ShowMessageBox(Lang["PopUp_18"]);
}

//侠客归隐确认框
function PopHeroToItem(heroName,exp,itemName,itemid)
{
    var left=GetLeftValue(166);
    $("#otherpopup").css("left",left);
    $("#otherpopup").css("top","257px");
    var html=""; 
    html+="<div class=\"common_popup\" style=\"height:104px;width:200px;\">"; 
    html+="<div class=\"common_popup1\" style=\"height:90px;width:196px;\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDoMall()><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\" style=\"height:55px;padding:5px 5px 5px 5px;width:169px;\">";
    html+="确认使用<b>"+itemName+"</b>？<br/><b>"+heroName+"</b>&nbsp;&nbsp;授功后归隐山林，可保存经验值<b>"+exp+"</b>点"; 
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=\"HeroToExp("+itemid+")\">"+Lang["PopUp_1"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDoMall()>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>"; 
    var tree=document.getElementById("otherpopup");
    tree.innerHTML=html;    
    html=null; 
    $("#otherpopup").show();
}

//确定取消对话框
function PopUpChoose(id)
{
    var html="";
    var t=id.split("_");
    var what=parseInt(t[t.length-1],10);
    var handleType=parseInt(t[3],10);
    var deletemail=t[1];
    var eventpop=t[0];
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if (handleType==5)
    {
        html+=Lang["PopUp_19"]+TheBuildingInfo.Name+TheBuildingInfo.Level+Lang["PopUp_20"];
    }
    if (handleType==24)
    {
        html+=Lang["PopUp_21"]+TheHeroInfo.Name+Lang["PopUp_22"];
    }
    if (handleType==17)
    {
        html+=Lang["PopUp_23"];
    }
    if (handleType==23)
    {
        html+=Lang["PopUp_24"];
    }
    if(handleType==49)
    {
        html+=Lang["PopUp_25"];
        html+=Lang["PopUp_26"];
    }
    if(handleType==15)
    {
        html+="<p>"+Lang["PopUp_186"]+"</p>";    
    }
    if(handleType==40)
    {
        html+="<p>"+Lang["PopUp_187"]+"</p>";
    }
    if(what==104)
    {
        html+="<p>"+Lang["PopUp_188"]+"</p>";
    }
    if (eventpop=="event")
    {   
        var e=t[2];
        var i=EventInfo[e].ActionType-1;
        if(i==0 || i==2 || i==4)
        {
           html+=Lang["PopUp_27"]+" "+EventActionType[i]+EventInfo[e].ObjName+" "+Lang["PopUp_22"];
           html+=Lang["PopUp_28"]+EventActionType[i]+Lang["PopUp_29"]; 
        }
        else if(i==1 || i==3)
        {
           html+=Lang["PopUp_27"]+" "+EventActionType[i]+EventInfo[e].ObjName+" "+Lang["PopUp_22"];
           html+=Lang["PopUp_28"]+EventActionType[i]+Lang["PopUp_30"]; 
        }
        else
        html+=Lang["PopUp_27"]+" "+EventActionType[i]+EventInfo[e].ObjName+" "+Lang["PopUp_22"];
    }
    if (deletemail=="delete")
    {
        html+=Lang["PopUp_31"];
    }
    if (eventpop=="exit")
    {
        html+=Lang["PopUp_32"];
    }
    if (eventpop=="task")
    {
        html+=Lang["PopUp_33"];
    }
  
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=PopUpDo(this.id)>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
}

//相关时长状态
function PopUpAboutEffect(id)
{
    var t=id.split("_");
    var index=parseInt(t[2],10);
    var left=GetLeftValue(166);
    var effect=TheBuildingInfo.EffectArray[index];
    var gold=CityInteriorInfo.Gold;
    var NeedGold=gold-effect.Gold;
    if(NeedGold>=0)
    {
        var html="";
        $("#popup").css("left",left);
        $("#popup").css("top","257px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        html+=Lang["PopUp_35"]+effect.EffectName+Lang["PopUp_36"];    
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<a id=\""+id+"\" href=\"#\" onmousedown=GetVipEffect(this.id)>"+Lang["PopUp_1"]+"</a>";
        html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $("#popup").show();
       $("#overlay").show();
   }
   else
   {
        ShowPopUp("pop_25");
   }
}

//元宝消费功能并且弹出提示对话框功能(快速寻访)
function PopUpGoldConsumer(id)
{
    var t=id.split("_");
    var index=parseInt(t[2],10);
    var left=GetLeftValue(166);
    var gold=CityInteriorInfo.Gold-5;
    var insignia=UserInfo.Insignia-200;
    if(t[3]==56)//快速寻访
    {
        if(gold>=0)
        {
            var html="";
            $("#popup").css("left",left);
            $("#popup").css("top","257px");
            html+="<div class=\"common_popup\">";
            html+="<div class=\"common_popup1\">";
            html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
            html+="<div class=\"common_popup2\">";
            html+=Lang["PopUp_35"]+Lang["PopUp_211"]+Lang["PopUp_36"];//确认使用快速寻访功能?
            html+="</div>";
            html+="<div class=\"popup_button\">";
            html+="<a id=\""+id+"\" href=\"#\" onmousedown=TreeCommand(id)>"+Lang["PopUp_1"]+"</a>";
            html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
            html+="</div>";
            html+="</div>";
            html+="</div>";
            var tree=document.getElementById("popup");
            tree.innerHTML=html;    
            html=null;
            $("#popup").show();
            $("#overlay").show();
       }
       else
       {
            ShowPopUp("pop_25");
       }
    }
    else if(t[3]==57)//占领山寨
    {
        var html="";
        var X=Math.floor(CityInfo.Pos%400);
        if(X==0)X=400;
        var Y=(Math.floor((CityInfo.Pos-1)/400)+1); 
        $("#popup").css("left",left);
        $("#popup").css("top","257px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        html+="<ul>";
        html+="<li>"+Lang["PopUp_218"]+" <font style=\"font-weight:bold\">"+CityInfo.Name+"</font>("+X+","+Y+")"+"?</li>";
        html+="<li>"+Lang["Tips_423"]+"</li>";
        html+="<li>"+Lang["Tips_424"]+"</li>";
        html+="<li>"+Lang["Tips_425"]+"</li>";
        html+="<li>"+Lang["Tips_426"]+"</li>";
        html+="<li>"+Lang["PopUp_220"]+"</li>";
        html+="<li><img src=\"img/4/4.gif\"> "+OccupationGold+"</li>";
        html+="<li><img src=\"img/o/76.gif\"> "+OccupationInsignia+"</li>";
        html+="</ul>";
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<a id=\""+id+"\" href=\"#\" onmousedown=TreeCommand(id)>"+Lang["PopUp_1"]+"</a>";
        html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $(".common_popup").css("height","auto");
        $(".common_popup1").css("height","auto");
        $(".common_popup2").css("height","auto");
        $(".common_popup2").css("margin-left","11px");
        $("#popup").show();
        $("#overlay").show();
    }
    else if(t[3]==58)//放弃占领
    {
        var html="";
        var X=Math.floor(CityInfo.Pos%400);
        if(X==0)X=400;
        var Y=(Math.floor((CityInfo.Pos-1)/400)+1);
        $("#popup").css("left",left);
        $("#popup").css("top","257px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        html+="<ul><li>"+Lang["PopUp_221"]+" <font style=\"font-weight:bold\">"+CityInfo.Name+"</font>("+X+","+Y+")"+"?</li></ul>";//确认放弃?
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<a id=\""+id+"\" href=\"#\" onmousedown=TreeCommand(id)>"+Lang["PopUp_1"]+"</a>";
        html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $("#popup").show();
        $("#overlay").show();
    }
    else if(t[3]==60)//赎身
    {
        var html="";
        $("#popup").css("left",left);
        $("#popup").css("top","257px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        html+="<ul>";
        html+="<li>"+Lang["PopUp_230"]+"</li>";
        html+="<li><input id=\"speed_1\" type=\"radio\" name=\"speed_\" checked=\"checked\" \> <img src=\"img/o/76.gif\"/><span id=\"ActionInsigniaNum\"> 500</span></li>";
        html+="<li><input id=\"speed_2\" type=\"radio\" name=\"speed_\" \> <img src=\"img/4/4.gif\"/><span id=\"ActionUseGoldNum\"> 1</span></li>";
        html+="</ul>";
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<a id=\""+id+"\" href=\"#\" onmousedown=DelUserLord(id)>"+Lang["PopUp_1"]+"</a>";
        html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $(".common_popup").css("height","auto");
        $(".common_popup1").css("height","auto");
        $(".common_popup2").css("height","auto");
        $(".common_popup2").css("margin-left","11px");
        $("#popup").show();
        $("#overlay").show();
    }
    
}

//取消免战状态
function PopUpCancelEffect(id)
{
    var t=id.split("_");
    var left=GetLeftValue(166);
    var index=parseInt(t[1]);
    var effect=PersistEffectGroupInfo[index];
    var html="";
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_37"]+"<span class=\"font_bold\">"+effect.EffectName+"</span>"+Lang["PopUp_38"]+"</p>";    
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=CancelPeaceEffect(this.id)>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $("#popup").show();
    $("#overlay").show();
}

//推广链接框
function PopUpExtendBox()
{
    var html="";
    var left=GetLeftValue(760)
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"tuiguang_popup\">";
    html+="<div class=\"tuiguang_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"tuiguang_popup2\">";
    html+="<div style=\"text-align:center;margin-top:5px\">"
    html+="<span><b>"+VName+"</b></span><span> "+Lang["PopUp_39"]+"</span>";
    html+="</div>";
    html+="<div style=\"text-align:center;margin-top:5px\">"
    html+="<span id=\"extendurl\">"+VersionInfo[4]+"</span>";
    html+="<p style=\"text-align:left;padding-left:5px;text-indent:22px;\">"+Lang["PopUp_40"]+"</p>";
    html+="</div>";             
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" style=\"margin-right:20px;\" onclick=\"copyCode();return false;\">"+Lang["PopUp_41"]+"</a>";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
   
    $("#popup").show();
    $("#overlay").show();
    CanEnterPop=1;   
}

//取消免战效果
function CancelPeaceEffect(id)
{
    var t=id.split("_");
    var mainType=parseInt(t[2]);
    DataTranslateBegin();       
    Main.ForceEffectOverdue(CityID,mainType,cb_ForceEffectOverdue);
}

function cb_ForceEffectOverdue(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        HidePopUp();
        Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    }
    else
    DataTranslateEnd();
}

//取消新手保护状态
function ChangeNewUserState()
{
    var html="";
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_42"]+"<span class=\"font_bold\">"+Lang["PopUp_43"]+"</span>"+Lang["PopUp_38"]+"</p>";    
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=ChangeUserState()>"+Lang["PopUp_1"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $("#popup").show();
   $("#overlay").show();
}

//取消用户新手保护状态
function ChangeUserState()
{
    DataTranslateBegin();  
    Main.ForceNewUserOverdue(cb_ForceNewUserOverdue);
}

function cb_ForceNewUserOverdue(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        HidePopUp();
        $("#userState").html("");
        Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    }
    else
    DataTranslateEnd();
}

//取消不同类型事件对话框
function PopUpEventControl(id)
{
    var html="";
    var t=id.split("_");
    var eventpop=t[0];
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if (eventpop=="event")
    {   
        var e=t[2];
        var i=EventInfo[e].ActionType-1;
        if(i==0 || i==2 || i==4)
        {   
           html+="<ul>";
           html+="<li>"+Lang["PopUp_37"]+""+" "+EventActionType[i]+EventInfo[e].ObjName+" "+""+Lang["PopUp_44"]+"</li>";
           html+="<li>"+Lang["PopUp_45"]+""+EventActionType[i]+""+Lang["PopUp_46"]+"</li>"; 
           html+="</ul>";
        }
        else if(i==1 || i==3)
        {
           html+="<ul>";
           html+="<li>"+Lang["PopUp_37"]+""+" "+EventActionType[i]+EventInfo[e].ObjName+" "+""+Lang["PopUp_44"]+"</li>";
           html+="<li>"+Lang["PopUp_45"]+""+EventActionType[i]+""+Lang["PopUp_47"]+"</li>"; 
           html+="</ul>";
        }
        else
        html+="<p>"+Lang["PopUp_37"]+""+" "+EventActionType[i]+EventInfo[e].ObjName+" "+""+Lang["PopUp_44"]+"</p>";
    }
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=PopUpDo(this.id)>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","236px")
    $(".common_popup").css("height","100px")
    $(".common_popup1").css("width","232px")
    $(".common_popup1").css("height","86px")
    $(".common_popup2").css("width","210px")
    $(".common_popup2").css("height","52px")
    $(".common_popup2").css("margin-left","11px")
}


//元宝不足对话框
function PopUpNeedGold(id)
{
    var html="";
    var t=id.split("_");
    var handleType=parseInt(t[3],10);
    var what=parseInt(t[t.length-1],10);
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if(what==25)
    html+="<p>"+Lang["PopUp_48"]+"</p>";
    else
    html+="<p>"+Lang["PopUp_227"]+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" target='_blank' href="+ToGold+" onclick=PopUpNotDo(this.id)>"+Lang["PopUp_49"]+"</a>";
    html+="<a id=\""+id+"\" style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    //html+="<a id=\""+id+"\" href=\"#\" onmousedown=PopUpNotDo(this.id)>[确定]</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
       
   CanEnterPop=1;    
}

//出征支援对话框
function PopUpAttackDecision(id)
{
    var html="";
    SpeedFlag[0]=0;
    var t=EventPopTemp.split("_");
    var pos=parseInt(t[3],10);
    t=id.split("_");
    var type=parseInt(t[t.length-1],10);
    //随机弹出框
    var value = 139+Math.random()*608;
    var left=GetLeftValue(value);
    var top = 120+Math.random()*198;
    var heroList = new Array();
    
    var i=0;
    while(HeroInfo!=null && HeroInfo[i]!=null)
    {
        if(HeroInfo[i].ListType==2)
            heroList.push(HeroInfo[i]); 
        i++;
    }
  
    $("#popup").css("left",left);
    $("#popup").css("top",top);
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<ul style=\"line-height:16px;\">";
    html+="<li>"+Lang["PopUp_50"]+"<span style=\"mragin-right:10px;\">"+(Math.floor(pos%400))+"</span> Y=<span style=\"margin-right:10px;\">"+(Math.floor(pos/400)+1)+"</span>"+Lang["PopUp_51"]+"</li>";    
    if (type==29 || type==110)//征服玩家
        html+="<li><span class=\"font_bold\">"+TargetCityName+" </span>"+Lang["PopUp_52"]+"</li>";
    else if (type==30)
        html+="<li><span class=\"font_bold\">"+TargetCityName+" </span>"+Lang["PopUp_53"]+"</li>";
    else if(type==82)
        html+="<li><span class=\"font_bold\">"+TargetCityName+" </span>"+Lang["PopUp_54"]+"</li>";
    else if(type==92)
        html+="<li><span class=\"font_bold\">"+TargetCityName+" </span>"+Lang["PopUp_55"]+"</li>";
    else if(type==94)
        html+="<li><span class=\"font_bold\">"+TargetCityName+" </span>"+Lang["PopUp_183"]+"</li>";
    html+=""+Lang["PopUp_56"]+":";
    var HasActionSpeed=false;
    if(PersistEffectGroupInfo!=null)
    {
        for(var i=0;i<PersistEffectGroupInfo.length;i++)
        {
            if(PersistEffectGroupInfo[i].MainEffectType==7)
            HasActionSpeed=true;
        }
    }
    if(HasActionSpeed==true)
        html+="<li><input id=\"speed_0\" onclick=\"ChooseActionSpeed(this.id)\" type=\"radio\" checked=\"checked\" name=\"speed\" value = \""+Lang["PopUp_57"]+"\">"+Lang["PopUp_58"]+""+IntToTime(CropsNeedTime/2)+"</li>";
    else
        html+="<li><input id=\"speed_0\" onclick=\"ChooseActionSpeed(this.id)\" type=\"radio\" checked=\"checked\" name=\"speed\" value = \""+Lang["PopUp_57"]+"\">"+Lang["PopUp_58"]+""+IntToTime(CropsNeedTime)+"</li>";
    //html+="<li><input id=\"speed_1\" onclick=\"ChooseActionSpeed(this.id)\" type=\"radio\" name=\"speed\" value = \"快速行军\">快速行军 时间:"+IntToTime(CropsNeedTime/2)+"</li>";
    html+="<li><input id=\"speed_1\" onclick=\"ChooseActionSpeed(this.id)\" type=\"radio\" name=\"speed\" value = \""+Lang["PopUp_59"]+"\"><span class=\"purple\">"+Lang["PopUp_59"]+"</span> "+Lang["PopUp_60"]+""+IntToTime(CropsNeedTime/5)+"</li>";
    
    html+="<li><span id=\"ActionNeedGold\" style=\"display:none;\">"+Lang["PopUp_61"]+"<img style=\"margin-right:10px;\" src=\"img/4/4.gif\"/><span id=\"ActionGoldNum\"></span></span></li>";
    if(type==110)//征服玩家
    {
        html+="<li>"+Lang["PopUp_228"]+"</li>";
        html+="<li><input id=\"speed_3\" type=\"radio\" name=\"speed_\" checked=\"checked\" \> <img src=\"img/o/76.gif\"/><span id=\"ActionInsigniaNum\"> 3500</span></li>";
        html+="<li><input id=\"speed_4\" type=\"radio\" name=\"speed_\" \> <img src=\"img/4/4.gif\"/><span id=\"ActionUseGoldNum\"> 10</span></li>";
    }
    html+="<li><span class=\"font_red\">"+Lang["PopUp_62"]+"</span></li>";
    if (type==29 || type==110)//征服玩家
        html+="<li>"+Lang["PopUp_63"]+"</li>";//参加攻击的侠客为
    if (type==30)
        html+="<li>"+Lang["PopUp_64"]+"</li>";
    if (type==82)
        html+="<li>"+Lang["PopUp_65"]+"</li>";
    if (type==92)
        html+="<li>"+Lang["PopUp_66"]+"</li>";
    if (type==94)
        html+="<li>"+Lang["PopUp_184"]+"</li>";
    html+="<li>";
    html+="<table width=\"168\" border=\"0\" height=\"70\" cellspacing=\"0\" cellpadding=\"0\">"
    var i=0;
    while(heroList!=null && heroList[i]!=null)
    {
        html+="<tr height=\"14px\">"
        html+="<td class=\"hquality_"+heroList[i].Quality+"\" width=\"106\">"+heroList[i].Name+"</td>"
        html+="<td width=\"62\">["+HeroStateName[heroList[i].State-1]+"]</td>"
        html+="</tr>"
        i++;
    }
    html+="</table>"
    html+="</li>";
    html+="<li>"+Lang["PopUp_67"]+"</li>";
    html+=""+Lang["PopUp_68"]+"";
    html+="</ul>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=AddAttackEvent()>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","248px");
    $(".common_popup").css("height","auto");
    $(".common_popup1").css("width","244px");
    $(".common_popup1").css("height","auto");
    $(".common_popup2").css("width","217px");
    $(".common_popup2").css("height","auto");
    $(".common_popup2").css("margin-left","13px");
}


//攻擂擂台或占领山寨列表对话框
function PopUpList(id)
{
    var t=id.split("_");
    var html="";
    //随机弹出框
    var value = 139+Math.random()*608;
    var left=GetLeftValue(value);
    var top = 120+Math.random()*198;
  
    $("#popup").css("left",left);
    $("#popup").css("top",top);
    html+="<div class=\"common_popup\">";
    html+="    <div class=\"common_popup1\">";
    html+="        <div><a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a></div>";
    html+="        <div class=\"common_popup2\">";
    if(t[1]==105)
        html+="        <div style=\"line-height:20px;\">"+Lang["PopUp_195"]+"</div>";
    if(t[1]==107)
    {
        html+="        <div style=\"line-height:20px;\">"+Lang["PopUp_217"]+"</div>";
        html+="        <div style=\"line-height:16px;\">"+Lang["Tips_424"]+"</div>";
        html+="        <div style=\"line-height:16px;\">"+Lang["Tips_425"]+"</div>";
        html+="        <div style=\"line-height:16px;\">"+Lang["Tips_426"]+"</div>";
    }
    if(t[1]==105)
    {
		html+="        <div>";
        html+="            <ul class=\"Arena\" style=\"width:130px;\">";
        html+="                <li style=\"font-weight:bold\">"+Lang["PopUp_196"]+"</li>";
        html+="                <li><a href=\"#\" id=\"116_303\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_197"]+"(116,303)\">"+Lang["PopUp_197"]+"(116,303)</a></li>";
        html+="                <li><a href=\"#\" id=\"226_353\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_198"]+"(226,353)\">"+Lang["PopUp_198"]+"(226,353)</a></li>";
        html+="                <li><a href=\"#\" id=\"161_114\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_199"]+"(161,114)\">"+Lang["PopUp_199"]+"(161,114)</a></li>";
        html+="                <li><a href=\"#\" id=\"282_100\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_200"]+"(282,100)\">"+Lang["PopUp_200"]+"(282,100)</a></li>";
        html+="                <li><a href=\"#\" id=\"116_345\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_201"]+"(116,345)\">"+Lang["PopUp_201"]+"(116,345)</a></li>";
        html+="                <li><a href=\"#\" id=\"106_213\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_202"]+"(106,213)\">"+Lang["PopUp_202"]+"(106,213)</a></li>";
        html+="                <li><a href=\"#\" id=\"91_284\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_203"]+"(91,284)\">"+Lang["PopUp_203"]+"(91,284)</a></li>";
        html+="                <li><a href=\"#\" id=\"241_252\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_204"]+"(241,252)\">"+Lang["PopUp_204"]+"(241,252)</a></li>";
        html+="                <li><a href=\"#\" id=\"308_252\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_205"]+"(308,252)\">"+Lang["PopUp_205"]+"(308,252)</a></li>";
        html+="                <li><a href=\"#\" id=\"136_185\" onmousedown=\"AddListXY(this.id)\" title=\""+Lang["PopUp_206"]+"(136,185)\">"+Lang["PopUp_206"]+"(136,185)</a></li>";
        html+="            </ul>";
        html+="            <ul class=\"Arena\">";
        html+="                <li style=\"font-weight:bold\">"+Lang["PopUp_207"]+"["+Lang["PopUp_208"]+"]</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 10 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 20 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 30 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 40 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 50 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 60 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 70 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 80 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 90 "+Lang["Task_20"]+"</li>";
        html+="                <li>"+Lang["PopUp_209"]+" &lt; 100 "+Lang["Task_20"]+"</li>";
        html+="            </ul>";
        html+="        </div>";
        html+="        <div style=\"color:#9d080d;width:290px;clear:both; padding-top:10px;\">("+Lang["PopUp_210"]+")</div>";
    }
    if(t[1]==107)
    {
		html+="        <div>";
        html+="            <div style=\"line-height:20px;\">"+Lang["PopUp_219"]+"</div>";
		html+="			   <div>";
        html+="            <ul class=\"Arena\" style=\"width:130px;\">";
        html+="                <li style=\"font-weight:bold\">"+Lang["Pages_66"]+"</li>";
        for(var i=0;i<AppendantNpcInfos.length;i++)
        {
            var X=Math.floor(AppendantNpcInfos[i].NpcPos%400);
            if(X==0)X=400;
            var Y=(Math.floor((AppendantNpcInfos[i].NpcPos-1)/400)+1); 
            html+="            <li><a href=\"#\" id="+X+"_"+Y+" onmousedown=\"AddListXY(this.id)\" title="+X+","+Y+">"+AppendantNpcInfos[i].NpcName+"("+X+","+Y+")</a></li>";
        }
        html+="            </ul>";
		html+="			   </div>";
		html+="			   <div>";
        html+="            <ul class=\"Arena\">";
        html+="                <li style=\"font-weight:bold\">"+Lang["PopUp_214"]+"</li>";
        for(var i=0;i<AppendantNpcInfos.length;i++)
        { 
            html+="            <li>"+AppendantNpcInfos[i].EndTime+"</li>";
        }
        html+="            </ul>";
		html+="			   </div>";
        html+="        </div>";
        html+="        <div style=\"color:#9d080d;width:290px;clear:both; padding-top:10px;\">("+Lang["PopUp_215"]+")</div>";
    }
    html+="        </div>";
    html+="        <div class=\"popup_button\">";        
    html+="            <a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="        </div>";
    html+="     </div>";
    html+="</div>";
     //$("#popup").html(html);
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","331px");
    $(".common_popup").css("height","auto");
    $(".common_popup1").css("width","327px");
    $(".common_popup1").css("height","auto");
    $(".common_popup2").css("width","300px");
    $(".common_popup2").css("height","auto");
    $(".common_popup2").css("margin-left","13px");
}

//资源交换倍数
function PoPresource()
{
    var html="";
    if(TaskInfo[TaskNameIndex]==null)
        return;
    var x=Math.floor(TaskInfo[TaskNameIndex].ConditonTargetPos%400);
    if(x==0)x=400;
    var y=(Math.floor((TaskInfo[TaskNameIndex].ConditonTargetPos-1)/400)+1); 
        
    var left=GetLeftValue(247);
    $("#popup").css("left",left);
    $("#popup").css("top","266px");
    
    html+="<div class=\"common_popup\">";
    html+="    <div class=\"common_popup1\">";
    html+="        <div><a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a></div>";
    html+="        <div class=\"common_popup2\">";
    html+="            <ul style=\"margin-left:5px; line-height: 18px;\">";
    html+="                <li>"+Lang["PopUp_212"]+"</li>";
    html+="                <li><input onkeyup=\"ChangeResource()\" value=\"1\" maxlength=\"2\" onkeydown=\"OnlyNum(event)\" class=\"input_presource\" id=\"input_presource\"/><font style=\"color:#35c235\">("+Lang["PopUp_213"]+")</font></li>";
    html+="                <li>";
    //任务目标
    if((TaskInfo[TaskNameIndex].CostMoney+TaskInfo[TaskNameIndex].CostFood+TaskInfo[TaskNameIndex].CostMen+TaskInfo[TaskNameIndex].CostGold+TaskInfo[TaskNameIndex].CostInsignia)>0)
    {
        if(TaskInfo[TaskNameIndex].CostMoney>0)
            html+="<img title=\""+Lang["Task_28"]+"\" src=\"img/4/1.gif\"/><span id=\"mon\">"+TaskInfo[TaskNameIndex].CostMoney+"</span>";
        if(TaskNameIndex==27)
            html+=" + "
        else
            html+=" ";
        if(TaskInfo[TaskNameIndex].CostFood>0)
            html+="<img title=\""+Lang["Task_29"]+"\" src=\"img/4/2.GIF\"/><span id=\"food\">"+TaskInfo[TaskNameIndex].CostFood+"</span> ";
        if(TaskNameIndex==29)
            html+=" + "
        else
            html+=" ";
        if(TaskInfo[TaskNameIndex].CostMen>0)
            html+="<img title=\""+Lang["Task_30"]+"\" src=\"img/4/3.GIF\"/><span id=\"man\">"+TaskInfo[TaskNameIndex].CostMen+"</span>";
    }
    html+=" = ";    
    //任务奖励
    if((TaskInfo[TaskNameIndex].GetMoney+TaskInfo[TaskNameIndex].GetFood+TaskInfo[TaskNameIndex].GetMen)>0)
    {
        if(TaskInfo[TaskNameIndex].GetMoney>0)
            html+="<img title=\""+Lang["Task_28"]+"\" src=\"img/4/1.gif\"/><span id=\"summon\">"+TaskInfo[TaskNameIndex].GetMoney+"</span>";
        if(TaskInfo[TaskNameIndex].GetFood>0)
            html+="<img title=\""+Lang["Task_29"]+"\" src=\"img/4/2.GIF\"/><span id=\"sumfood\">"+TaskInfo[TaskNameIndex].GetFood+"</span>";
        if(TaskInfo[TaskNameIndex].GetMen>0)
            html+="<img title=\""+Lang["Task_30"]+"\" src=\"img/4/3.GIF\"/><span id=\"summan\">"+TaskInfo[TaskNameIndex].GetMen+"</span>";
    }
    
    html+="                </li>";
    html+="            </ul>";
    html+="        </div>";
    html+="        <div class=\"popup_button\">";
    html+="            <a onmousedown=\"ResourceTask()\" href=\"#\">"+Lang["PopUp_1"]+"</a>";
    html+="            <a onmousedown=\"PopUpNotDo(this.id)\" href=\"#\" style=\"margin-left: 30px;\">"+Lang["PopUp_34"]+"</a>";
    html+="        </div>";
    html+="    </div>";
    html+="</div>";
    
    
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;
       html=null;
    $(".common_popup").css("width","235px")
    $(".common_popup").css("height","112px")
    $(".common_popup1").css("width","231px")
    $(".common_popup1").css("height","98px")
    $(".common_popup2").css("width","200px")
    $(".common_popup2").css("height","73px")
    $(".common_popup2").css("margin-left","13px")
}



//选择行军速度
function ChooseActionSpeed(id)
{
    var t = id.split("_");
    SpeedFlag[0] = parseInt(t[1],10);
    
    if(SpeedFlag[0]==0)
    {
        $("#ActionNeedGold").hide();
    }
    else
    {
        $("#ActionNeedGold").show();
        $("#ActionGoldNum").text(20);
    }
}



//招募弟子
function PopUpConscribeChild(id)
{
    var html="";
    var left=GetLeftValue(247);
    $("#popup").css("left",left);
    $("#popup").css("top","266px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<ul class=\"childtop\">";
    html+="<li>"+Lang["PopUp_69"]+"</li>";
    html+="<li><input id=\"input_child\" class=\"input_child\"/ onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeInputChild()\">/<span id=\"input_max\">99</span></li>";
    html+="</ul>";
    html+="<table class=\"table_child\" width=\"130\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    html+="<tr>";
    html+="<td colspan=\"4\">"+Lang["PopUp_70"]+"</td>";
    html+="</tr>";
    html+="<tr>";
    html+="<td width=\"28\"><img src=\"img/4/1.gif\"/></td>";
    html+="<td width=\"39\">"+TheHeroInfo.ConscriptionCostMoney+"</td>";
    html+="<td width=\"25\"><img src=\"img/4/2.GIF\"/></td>";
    html+="<td width=\"38\">"+TheHeroInfo.ConscriptionCostFood+"</td>";
     html+="<td width=\"25\"><img src=\"img/4/3.GIF\"/></td>";
    html+="<td width=\"38\">"+TheHeroInfo.ConscriptionCostMen+"</td>";
    html+="</tr>";
    html+="<tr>";
    html+="<td colspan=\"4\">"+Lang["PopUp_71"]+"</td>";
    html+="</tr>";
    html+="<tr>";
    html+="<td><img src=\"img/4/1.gif\"/></td>";
    html+="<td id=\"max_money\">"+TheHeroInfo.ConscriptionCostMoney+"</td>";
    html+="<td><img src=\"img/4/2.GIF\"/></td>";
    html+="<td id=\"max_food\">"+TheHeroInfo.ConscriptionCostFood+"</td>";
    html+="<td><img src=\"img/4/3.GIF\"/></td>";
    html+="<td id=\"max_men\">"+TheHeroInfo.ConscriptionCostMood+"</td>";
    html+="</tr>";
    html+="<tr>";
    html+="<td><img src=\"img/o/18.GIF\"/></td>";
    html+="<td id=\"max_time\" colspan=\"3\">"+IntToTime(TheHeroInfo.ConscriptionCostTime)+"</td>";
    html+="</tr>";
    html+="</table>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=AddConscribeEvent()>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;
       html=null;
    $(".common_popup").css("width","225px")
    $(".common_popup").css("height","170px")
    $(".common_popup1").css("width","221px")
    $(".common_popup1").css("height","156px")
    $(".common_popup2").css("width","193px")
    $(".common_popup2").css("height","130px")
    $(".common_popup2").css("margin-left","13px")
    
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.ConscriptionCostMoney;
    var needFood=TheHeroInfo.ConscriptionCostFood;
    var needTime=TheHeroInfo.ConscriptionCostTime;
    var needMen=TheHeroInfo.ConscriptionCostMen;
    var maxNum;
    maxNum=Math.min(Math.floor(food/needFood),Math.floor(money/needMoney),Math.floor(men/needMen));
    if(TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum<maxNum)
        maxNum=TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum;
    $("#input_max").text(maxNum);
    $("#input_child").val(maxNum);
    ChangeInputChild();
}

//快速招募弟子
function PopUpFastConscribeChild(id)
{   
//    var gold=CityInteriorInfo.Gold;
//    var needGold=TheHeroInfo.FastConscriptionCostGold;
//    var mgold=Math.floor(gold/needGold);
//    if(mgold<1)
//    ShowPopUp("pop_25");
//    else
//    {
        var html="";
        var left=GetLeftValue(247);
        $("#popup").css("left",left);
        $("#popup").css("top","257px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        html+="<ul class=\"childtop\">";
        html+="<li>"+Lang["PopUp_69"]+"</li>";
        html+="<li><input id=\"input_child\" class=\"input_child\"/ onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeFastInputChild()\">/<span id=\"input_max\">99</span></li>";
        html+="</ul>";
        html+="<table class=\"table_child\" width=\"130\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
        html+="<tr>";
        html+="<td colspan=\"4\">"+Lang["PopUp_70"]+"</td>";
        html+="</tr>";
        html+="<tr>";
        html+="<td width=\"28\"><img src=\"img/4/1.gif\"/></td>";
        html+="<td width=\"39\">"+TheHeroInfo.FastConscriptionCostMoney+"</td>";
        html+="<td width=\"25\"><img src=\"img/4/2.GIF\"/></td>";
        html+="<td width=\"38\">"+TheHeroInfo.FastConscriptionCostFood+"</td>";
        html+="<td width=\"25\"><img src=\"img/4/3.GIF\"/></td>";
        html+="<td width=\"38\">"+TheHeroInfo.FastConscriptionCostMen+"</td>";
        html+="</tr>";
        html+="<tr>";
        html+="<td colspan=\"4\">"+Lang["PopUp_71"]+"</td>";
        html+="</tr>";
        html+="<tr>";
        html+="<td><img src=\"img/4/1.gif\"/></td>";
        html+="<td id=\"max_money\">"+TheHeroInfo.FastConscriptionCostMoney+"</td>";
        html+="<td><img src=\"img/4/2.GIF\"/></td>";
        html+="<td id=\"max_food\">"+TheHeroInfo.FastConscriptionCostFood+"</td>";
        html+="<td><img src=\"img/4/3.GIF\"/></td>";
        html+="<td id=\"max_men\">"+TheHeroInfo.FastConscriptionCostMen+"</td>";
        html+="</tr>";
        html+="<tr>";
        html+="<td><img src=\"img/4/4.gif\"/></td>";
        html+="<td id=\"max_gold\">"+TheHeroInfo.FastConscriptionCostGold+"</td>";
        html+="</tr>";
        html+="<tr>";
        html+="<td><img src=\"img/o/18.GIF\"/></td>";
        html+="<td id=\"max_time\" colspan=\"3\">"+IntToTime(TheHeroInfo.ConscriptionCostTime)+"</td>";
        html+="</tr>";
        html+="</table>";
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<a id=\""+id+"\" href=\"#\" onmousedown=FastConscription()>"+Lang["PopUp_1"]+"</a>";
        html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
        html+="</div>";
         //$("#popup").html(html);
         var tree=document.getElementById("popup");
           tree.innerHTML=html;    
           html=null;
        $(".common_popup").css("width","225px")
        $(".common_popup").css("height","185px")
        $(".common_popup1").css("width","221px")
        $(".common_popup1").css("height","171px")
        $(".common_popup2").css("width","193px")
        $(".common_popup2").css("height","145px")
        $(".common_popup2").css("margin-left","13px")
        
        var money=CityInteriorInfo.Money;
        var food=CityInteriorInfo.Food;
        var gold=CityInteriorInfo.Gold;
        var men=CityInteriorInfo.Men;
        var needMoney=TheHeroInfo.FastConscriptionCostMoney;
        var needFood=TheHeroInfo.FastConscriptionCostFood;
        var needGold=TheHeroInfo.FastConscriptionCostGold;
        var needTime=TheHeroInfo.FastConscriptionCostTime;
        var needMen=TheHeroInfo.FastConscriptionCostMen;
        var maxNum;
        
    //    if(Math.floor(money/needMoney)>=Math.floor(food/needFood))//取其中的最小值(通过资源来算)
    //        maxNum=Math.floor(food/needFood);//maxNum能招募弟子的最大数量
    //    else
    //        maxNum=Math.floor(money/needMoney);
        var mmoney=Math.floor(money/needMoney);
        var mfood=Math.floor(food/needFood);
        var mmen=Math.floor(men/needMen);
        //var mgold=Math.floor(gold/needGold);
        maxNum=Math.min(mmoney,mfood,mmen);
        
        if(TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum<maxNum)//当前能招募的弟子数量和maxnum比较
            maxNum=TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum;
        $("#input_max").text(maxNum);
        $("#input_child").val(maxNum);
        ChangeFastInputChild();
//    }
}

//快速招募更改元宝判断
function FastConscription()
{
    if(IsFastConscription==true)
    AddConscribeEvent();
    else
    ShowPopUp("pop_25");
}


//装备物品之指定英雄
function PopUpChoiceHero(id)
{
    var html="";
    var t=id.split("_");
    var pos=parseInt(t[t.length-1],10);
    
    var left=GetLeftValue(558);
    $("#popup").css("left",left);
    $("#popup").css("top","110px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    
    {
        html+="<li>  "+Lang["PopUp_72"]+"</li>";
        html+="<div id=\"heros\">";
        html+="</div>";
    }
    
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","558px")
    $(".common_popup").css("height","440px")
    $(".common_popup1").css("width","554px")
    $(".common_popup1").css("height","426px")
}

function PouUpChoiceHeroOK(index)
{
    var heroid;

    InChoiceHero=false;

    if(HeroInfo==null || HeroInfo[index]==null)
        return;
        
    heroid=HeroInfo[index].ID;
    
    //装配物品
    if(TheItemInfo!=null)
        Main.TakeItem(CityID,TheItemInfo.ID,heroid,cb_PouUpItemCommand);
    
    HidePopUp();
}

//使用经验道具
function PouUpUseExpItem(index)
{
    SelectHero(index);
    var heroid;

    UseExpItemSign=false;

    if(HeroInfo==null || HeroInfo[index]==null)
        return;
        
    heroid=HeroInfo[index].ID;
    
    TheHeroInfo = HeroInfo[index];
    
    //装配物品
    if(TheItemInfo!=null)
    {
        if(TheItemInfo.LostRate!=null && TheItemInfo.LostRate!=0) 
            PopHeroToItem(TheHeroInfo.Name,Math.floor(TheHeroInfo.ExpCount*TheItemInfo.LostRate/100),TheItemInfo.Name,TheItemInfo.ID); 
        else 
            Main.UseItemHeroExp(CityID,TheItemInfo.ID,heroid,cb_PouUpItemCommand); 
    }     
}

//使用技能书
function PouUpUseSkillBook(index)
{
    var heroid;
    UseSkillBookSign=false;
    if(HeroInfo==null || HeroInfo[index]==null)
        return;
    heroid=HeroInfo[index].ID;
    if(TheItemInfo!=null)
     Main.UserItemChangeSkill(CityID,heroid,TheItemInfo.ID,cb_UserItemChangeSkill)    
}

//使用技能书后
function cb_UserItemChangeSkill(result)
{
   if(DataValidate(result)==false) return;
   var SkillName = result.value;
   if(result.value!="")
   {
        //刷新物品列表
        FreshItemPage(true);
        ShowMessageBox(""+Lang["PopUp_73"]+""+SkillName+"");
   }
    else    
        ShowMessageBox(Lang["PopUp_74"]);
 }

//使用技能药丸
function PouUpUseSkillPill(index)
{
    var heroid;
    UseSkillPillSign=false;
    if(HeroInfo==null || HeroInfo[index]==null)
        return;
    heroid=HeroInfo[index].ID;
    if(TheItemInfo!=null)
     Main.UserItemUpSkill(CityID,heroid,TheItemInfo.ID,cb_UserItemUpSkill)  
}

//使用药丸后
function cb_UserItemUpSkill(result)
{
   if(DataValidate(result)==false) return;
   if(result.value==0)
   {
        //刷新物品列表
        FreshItemPage(true);
        ShowMessageBox(Lang["PopUp_75"]);
   }
    else    
        ShowMessageBox(Lang["PopUp_74"]);
}

//使用提升技能经验道具
function PouUpUseSkillExp(index)
{
    var heroid;

    UseSkillExpSign=false;

    if(HeroInfo==null || HeroInfo[index]==null)
        return;
        
    heroid=HeroInfo[index].ID;
   
    if(TheItemInfo!=null)
     Main.UserItemSkillEXP(CityID,heroid,TheItemInfo.ID,cb_PouUpItemCommand);
}

//回收物品、使用物品、购买物品、出售物品、修复物品、分解物品
function PopUpAboutEquip(id)
{
    var html="";
    var t=id.split("_");
    var pos=parseInt(t[t.length-1],10);
    var left=GetLeftValue(214)
    $("#popup").css("left",left);
    $("#popup").css("top","253px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if (pos==33)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_76"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"item_name\"></span></li>"
        html+="<li><table width=\"165\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
        html+="<tr>"
        html+="<td width=\"35\">"+Lang["PopUp_77"]+"</td>"
        html+="<td width=\"25\"><img src=\"img/4/1.gif\"/></td>"
        html+="<td width=\"40\"><span id=\"item_sell_money\"></span></td>"
        html+="<td width=\"25\"><img src=\"img/4/2.GIF\"/></td>"
        html+="<td width=\"37\"><span id=\"item_sell_food\"></span></td>"
        html+="</tr>"
        html+="</table>"
        html+="</li>"
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>"
    }
    if (pos==37)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_78"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"item_name\"></span></li>"
        html+="<li><table width=\"100\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
        if(TheItemInfo.UseGold>0)
        {
            html+="<tr>"
            html+="<td width=\"35\">"+Lang["PopUp_79"]+"</td>"
            html+="<td width=\"25\"><img src=\"img/4/4.gif\"/></td>"
            html+="<td width=\"40\"><span id=\"item_use_pay\"></span></td>"
            html+="</tr>"
        }
        html+="</table>"
        html+="</li>"
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>"
    }
    if (pos==101)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_78"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"feastitem_name\"></span></li>"
        html+="<li><table width=\"100\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
        if(TheItemInfo.UseGold>0)
        {
            html+="<tr>"
            html+="<td width=\"35\">"+Lang["PopUp_79"]+"</td>"
            html+="<td width=\"25\"><img src=\"img/4/4.gif\"/></td>"
            html+="<td width=\"40\"><span id=\"feastitem_use_pay\"></span></td>"
            html+="</tr>"
        }
        html+="</table>"
        html+="</li>"
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>"
    }
    if (pos==35)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_80"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"item_name\"></span></li>"
        html+="<li><table width=\"100\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
        html+="<tr>"
        html+="<td width=\"35\">"+Lang["PopUp_79"]+"</td>"
        html+="<td width=\"25\"><img src=\"img/4/4.gif\"/></td>"
        html+="<td width=\"40\"><span id=\"item_buy_pay\"></span></td>"
        html+="</tr>"
        html+="</table>"
        html+="</li>"
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>"
    }
    if (pos==32)
    {
        html+="<ul style=\"text-align:center;\">";
        html+="<li>"+Lang["PopUp_81"]+"</li>"
        html+="<li>"+Lang["PopUp_82"]+"<input class=\"input_sell\" maxlength=\"6\" onkeydown=\"OnlyNum(event)\" id=\"item_price\"/>"+Lang["PopUp_83"]+" <span class=\"font_red\" id=\"sellerror\"></span></li>"
        html+="</ul>"
    }
    if (pos==42)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_84"]+"</li>";
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>";
    }
    if (pos==43)
    {
        html+="<p>"+Lang["PopUp_85"]+"</p>";
    }
    if (pos==47)
    {
        html+="<ul>";
        html+="<li>"+Lang["PopUp_86"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"item_name\"></span></li>"
        html+="<li>"+Lang["PopUp_87"]+"<span style=\"font-weight:bold;margin-left:5px;\" id=\"item_get_name\"></span></li>"
        html+="</li>"
        html+="<li>"+Lang["PopUp_68"]+"</li>"
        html+="</ul>"
    }
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=PouUpItemCommand("+pos+")>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+pos+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","214px")
    $(".common_popup").css("height","94px")
    $(".common_popup1").css("width","210px")
    $(".common_popup1").css("height","80px")
    $(".common_popup2").css("width","186px")
    $(".common_popup2").css("height","58px")
    $(".common_popup2").css("margin-left","11px")
}

function PouUpItemCommand(id)
{
    switch(id)
    {
       case 35: //购买
            Main.BuyItem(CityID,TheItemInfo.ID,TheItemInfo.Price,cb_PouUpItemCommand);
            HidePopUp();
            break;
       case 37: //使用
            Main.UseItem(CityID,TheItemInfo.ID,cb_UseBox);
            HidePopUp();
            break;
       case 101: //使用节日礼包
            Main.UseFeastItem(CityID,TheItemInfo.ID,cb_UseFeastBox);
            HidePopUp();
            break;
       case 32: //出售
            {
                $("#sellerror").text("");
                var price=$("#item_price").val();
                price=price.replace(/\D+/g,'');
                if (price!="")
                {
                    HidePopUp();
                    Main.SellItem(CityID,TheItemInfo.ID,price,cb_PouUpItemCommand);
                }
                else
                {
                    $("#sellerror").text("*");
                }
            }
            break;
       case 33: //回收
            Main.DonateItem(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
            HidePopUp();
            break;
       case 42://修复
            Main.RepairItem(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
            HidePopUp();
            break;
       case 43://卸下道具
            Main.DebusItem(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
            HidePopUp();
            break;
       case 47://分解道具
            Main.DisassembleItem(CityID,TheItemInfo.ID,TheItemInfo.StaticIndex,cb_PouUpItemCommand);
            HidePopUp();
            break;
       default:
            break;
    }
}
var GetItemInfo;
function cb_UseBox(result)
{
    if(DataValidate(result)==false) return;
    GetItemInfo=result.value;
    if(GetItemInfo!="")
    {
        //var text="恭喜您获得物品:<br><span class=\"font_bold\">"+result.value+"<span>";
        FreshItemPage(true);
        ShowGetItemInfoBox();
    }
    else
    {   
         ShowMessageBox(Lang["PopUp_88"]);
        //window.location.reload();
    }  
}

function cb_UseFeastBox(result)
{
    if(DataValidate(result)==false) return;
    GetItemInfo=result.value;
    if(GetItemInfo!="")
    {
        //var text="恭喜您获得物品:<br><span class=\"font_bold\">"+result.value+"<span>";
        FreshItemPage(true);
        ShowFeastItemBox();
    }
    else
    {   
         ShowMessageBox(Lang["PopUp_88"]);
        //window.location.reload();
    }  
}

function cb_DisassembleItem(result)
{
    if(DataValidate(result)==false) return;
    GetItemInfo=result.value;
    if(GetItemInfo!="")
    {
        //var text="恭喜您获得物品:<br><span class=\"font_bold\">"+result.value+"<span>";
        FreshItemPage(true);
        ShowDisassembleBox();
    }
    else
    {   
         ShowMessageBox(Lang["PopUp_88"]);
        //window.location.reload();
    }  
}

//节日宝箱礼品
function ShowFeastItemBox()
{
    var html="";
    var left=GetLeftValue(214)
    $("#popup").css("left",left);
    $("#popup").css("top","253px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_89"]+"</p>";
    html+="<p>"+GetItemInfo+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","214px")
    $(".common_popup").css("height","94px")
    $(".common_popup1").css("width","210px")
    $(".common_popup1").css("height","80px")
    $(".common_popup2").css("width","186px")
    $(".common_popup2").css("height","58px")
    $("#popup").show();
    $("#overlay").show();
}

//显示开宝箱得到物品
function ShowDisassembleBox()
{
    var html="";
    var left=GetLeftValue(214)
    $("#popup").css("left",left);
    $("#popup").css("top","253px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_90"]+"</p>";
    html+="<p>"+GetItemInfo+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","214px")
    $(".common_popup").css("height","94px")
    $(".common_popup1").css("width","210px")
    $(".common_popup1").css("height","80px")
    $(".common_popup2").css("width","186px")
    $(".common_popup2").css("height","58px")
    $("#popup").show();
    $("#overlay").show();
}

//显示开宝箱得到物品
function ShowGetItemInfoBox()
{
    var html="";
    var left=GetLeftValue(214)
    $("#popup").css("left",left);
    $("#popup").css("top","253px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_89"]+"</p>";
    for(var i=0;i<GetItemInfo.length;i++)
    {
        html+="<p>"+GetItemInfo[i]+"</p>";
    }
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","214px")
    $(".common_popup").css("height","94px")
    $(".common_popup1").css("width","210px")
    $(".common_popup1").css("height","80px")
    $(".common_popup2").css("width","186px")
    $(".common_popup2").css("height","58px")
    $("#popup").show();
    $("#overlay").show();
}

function cb_PouUpItemCommand(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        //刷新物品列表
        FreshItemPage(true);
        $("#userIns").html(Main.GetUserInfo().value.Insignia.toString());//刷新用户战勋值
        if(GetMessage!="")
            PopUpGetBox();
    }
    else if(result.value==10123)
        ShowMessageBox(Lang["PopUp_226"]);
    else
    {
        //异常错误
        //ShowErrorBox(result.value);
        
        //window.location.reload();
        DataTranslateEnd();
        if(result.value==30055)
            ShowMessageBox(Lang["PopUp_91"]);
        else if(result.value==30157)
        {
            ShowMessageBox(Lang["PopUp_92"]);
            Main.GetSellItemByType(ViewItemType+1,ViewItemPage, OrderBy, OrderType,cb_GetItemByType);
        }
        else if(result.value==30168)//使用紫侠兑换券时
        {
            ShowMessageBox(Lang["PopUp_93"]);
        }    
        else if(result.value==60018)/*chess*/
            ShowMessageBox("携带数量已到上限");     
        else    
            ShowMessageBox(Lang["PopUp_74"]);
   }
}

//发送消息
function PopUpSendMessage(id)
{
    var html="";
    var left=GetLeftValue(426)
    $("#popup").css("left",left);
    $("#popup").css("top","197px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<ul style=\"margin-left:15px;\">";
    html+="<li>"+Lang["PopUp_94"]+"<input onKeyDown=\"CheckMaxInput(this,40)\" onKeyUp=\"CheckMaxInput(this,40)\" onBlur=\"CheckMaxInput(this,40)\" class=\"input_mtitle\" id=\"popup_mail_title\"><span id=\"errortitle\" class=\"font_red\"></span></li>";
    html+="<li>"+Lang["PopUp_95"]+"<input onKeyDown=\"CheckMaxInput(this,14)\" onKeyUp=\"CheckMaxInput(this,14)\" onBlur=\"CheckMaxInput(this,14)\" class=\"input_mname\"  id=\"popup_mail_to\"><span id=\"errorto\" class=\"font_red\"></span></li>";
    html+="<li><textarea onKeyDown=\"CheckMaxInput(this,400)\" onKeyUp=\"CheckMaxInput(this,400)\" onBlur=\"CheckMaxInput(this,400)\" class=\"textbox_content\"  id=\"popup_mail_content\"></textarea></li>";
    html+="</ul>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=PouUpMail_New()>"+Lang["PopUp_100"]+"</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:100px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","426px")
    $(".common_popup").css("height","316px")
    $(".common_popup1").css("width","422px")
    $(".common_popup1").css("height","302px")
}

function PouUpMail_New()
{
    $("#errorto").text("");
    $("#errortitle").text("");
    var title=$("#popup_mail_title").val();
    var to=$("#popup_mail_to").val();
    var content=$("#popup_mail_content").val();
    
    title=title.replace(/(^\s*)|(\s*$)/g,"");
    
    if(title!="" && to!="")
    {
        Main.GetNameState(to,cb_GetNameState);
       
    }
    else
    {
        if(title=="")
           $("#errortitle").text(Lang["PopUp_96"]); 
        if(to=="")
           $("#errorto").text(Lang["PopUp_96"]);    
    }     
}

function cb_GetNameState(result)
{
    if(DataValidate(result)==false) return;
    
    if(result.value==0)
    {
        var title=$("#popup_mail_title").val();
        var to=$("#popup_mail_to").val();
        var content=$("#popup_mail_content").val();
        Main.AddnewMail(to,title,content,3,cb_NewMail); //发送用户书信消息类型
        HidePopUp();
    }
    else
        $("#errorto").text(Lang["PopUp_97"]);       
}
 
//查看消息
function PopUpReadMessage(id)
{
    var html="";
    var left=GetLeftValue(426)
    $("#popup").css("left",left);
    $("#popup").css("top","197px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<ul style=\"margin-top:10px;margin-left:15px;\">";
    html+="<li>"+Lang["PopUp_94"]+"<input readonly=\"true\" class=\"input_mtitle\" id=\"popup_mail_title\"></li>";
    html+="<li>"+Lang["PopUp_95"]+"<input readonly=\"true\" class=\"input_mname\"  id=\"popup_mail_from\"></li>";
    html+="<li><div class=\"readbox\" id=\"popup_mail_content\"></div></li>";
    html+="</ul>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\"mail_rp\" href=\"#\" onmousedown=PouUpMail_Replay()>"+Lang["PopUp_98"]+"</a>";
    html+="<a name=\"popup_delete_mailid\"  href=\"#\" style=\"margin-left:100px;\" onmousedown=PouUpMail_Delete()>"+Lang["PopUp_99"]+"</a>";
    html+="<a href=\"#\" style=\"margin-left:100px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_15"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","426px")
    $(".common_popup").css("height","316px")
    $(".common_popup1").css("width","422px")
    $(".common_popup1").css("height","302px")
}

function PouUpMail_Replay()
{
    //获得回复对象名
    var to=$("#popup_mail_from").val();
    var b=to.indexOf("[");
    to=to.slice(0,b);
    HidePopUp();
    //回复
    NewMail(to);
}

function PouUpMail_Delete()
{
    HidePopUp();
    
    //删除指定ID 的mail
    DeleteMail(CurOpenMailID);
}

//改变弟子数量
function ChangeInputChild()
{
    var input=document.getElementById('input_child');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#input_child").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0;     
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.ConscriptionCostMoney;
    var needFood=TheHeroInfo.ConscriptionCostFood;
    var needTime=TheHeroInfo.ConscriptionCostTime;
    var needMen=TheHeroInfo.ConscriptionCostMen;
    var maxNum;
    maxNum=Math.min(Math.floor(food/needFood),Math.floor(money/needMoney),Math.floor(men/needMen));
    if(TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum<maxNum)
        maxNum=TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum;      
    if(inputNum<0)
        inputNum=0;
    if(inputNum>=maxNum)
        inputNum=maxNum;
    if(inputNum>0)
    $("#input_child").val(inputNum);
    $("#max_money").text(inputNum*needMoney);
    $("#max_food").text(inputNum*needFood);
    $("#max_men").text(inputNum*needMen);
    $("#max_time").text(IntToTime(inputNum*needTime));        
}

var IsFastConscription=false;//存储快速招募元宝状态，true为可以使用，false为不可以
//快速招募动态改变需要资源
function ChangeFastInputChild()
{
    $("#max_gold").css("color","black")
    var input=document.getElementById('input_child');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#input_child").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0;     
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var gold=CityInteriorInfo.Gold;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.FastConscriptionCostMoney;
    var needFood=TheHeroInfo.FastConscriptionCostFood;
    var needTime=TheHeroInfo.FastConscriptionCostTime;
    var needGold=TheHeroInfo.FastConscriptionCostGold;
    var needMen=TheHeroInfo.FastConscriptionCostMen;
    var maxNum;
    
    var mmoney=Math.floor(money/needMoney);
    var mfood=Math.floor(food/needFood);
    var mmen=Math.floor(men/needMen);
//    var mgold=Math.floor(gold/needGold);
    maxNum=Math.min(mmoney,mfood,men);
    
    if(TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum<maxNum)
        maxNum=TheHeroInfo.MaxPrenticeNum-TheHeroInfo.PrenticeNum; 
    if(inputNum<0)
        inputNum=0;  
    if(inputNum>=maxNum)
        inputNum=maxNum;
   
    //计算快速招募需要元宝数量
    var FinalyGold = Math.round((inputNum*needGold)/100)+1;
    if(gold-FinalyGold>=0)
    IsFastConscription=true;
    else
    $("#max_gold").css("color","red")
    $("#input_child").val(inputNum);
    $("#max_money").text(inputNum*needMoney);
    $("#max_food").text(inputNum*needFood);
    $("#max_men").text(inputNum*needMen);
    $("#max_gold").text(FinalyGold);
    $("#max_time").text(IntToTime(needTime));
}


//装备物品之指定物品
function PopUpChoiceItem(id)
{
    var html="";
    var t=id.split("_");
    var pos=parseInt(t[t.length-1],10);
    
    var left=GetLeftValue(558);
    $("#popup").css("left",left);
    $("#popup").css("top","110px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    
    {
        html+="<br>";
        html+="<div id=\"itemtitle\" >";
        html+="</div>"
        html+="<div id=\"items\">";
        html+="</div>";
        html+="<div id=\"pagefoot\">";
        html+="</div>"
    }
    
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
     var tree=document.getElementById("popup");
       tree.innerHTML=html;    
       html=null;
    $(".common_popup").css("width","408px")
    $(".common_popup").css("height","480px")
    $(".common_popup1").css("width","404px")
    $(".common_popup1").css("height","466px")
}

function PouUpChoiceItemOK(index)
{
    var itemid;

    InChoiceItem=false;

    if(ItemInfo==null || ItemInfo[index]==null)
        return;
        
    itemid=ItemInfo[index].ID;
    
    //装配物品
    if(TheHeroInfo!=null)
        Main.TakeItem(CityID,itemid,TheHeroInfo.ID,cb_PouUpChoiceItemOK);
    
    HidePopUp();
}

function cb_PouUpChoiceItemOK(result)
{
   if(DataValidate(result)==false) return;
   if(result.value==0)
   {
        //刷新
         Main.GetCityHero(CityID,cb_GetCityHero);
   }
   else
   {
        //异常错误
        ShowErrorBox(Lang["PopUp_101"]);
        DataTranslateEnd();
        //window.location.reload();  
   }
}


/*warpaper popup*/
function ShowWarpaperBox()
{
   var html="";
   var left=GetLeftValue(540);
   $("#popup").css("left",left);
   $("#popup").css("top","105px");
   html+="<div id=\"warpaper\">";
   html+="<div class=\"warpaper_popup\">";
   html+="<div class=\"warpaper_popup1\">";
   html+="<a class=\"closepic\" onmousedown=\"HideWarpaperPopup()\" href=\"#\" ><img src=\"img/o/22.gif\"/></a>";
   html+="<div id=\"warpaper_logo\">";
   html+="</div>";
   html+="<div id=\"warpaper_content\">";
   html+="<div id=\"warpaper_top\">";
   html+="</div>";
   html+="<div id=\"warpaper_middle\">";
   html+="</div>";
   html+="<div id=\"warpaper_support\">";
   html+="</div>";
   html+="<div id=\"warpaper_bottom\">";
   html+="</div>";
   html+="</div>";
   html+="<div id=\"warpaper_button\">";
   html+="<a class=\"linkstyle_1\" onmousedown=\"HideWarpaperPopup()\" href=\"#\" >"+Lang["PopUp_102"]+"</a>";
   html+="</div>";
   html+="</div>";
   html+="</div>";
   html+="</div>";
   var tree=document.getElementById("popup");
   tree.innerHTML=html;    
   html=null;
   $("#popup").show();
   $("#overlay").show();
}

var StandType = [Lang["PopUp_103"],Lang["PopUp_104"]];
var HurtType = [Lang["PopUp_105"],Lang["PopUp_106"],Lang["PopUp_107"],Lang["PopUp_108"],Lang["PopUp_109"],Lang["PopUp_110"],Lang["PopUp_111"],Lang["PopUp_112"],Lang["PopUp_113"],Lang["PopUp_114"],Lang["PopUp_115"],Lang["PopUp_116"],Lang["PopUp_117"],Lang["PopUp_118"],Lang["PopUp_119"],Lang["PopUp_120"]];
var WuXingType = [Lang["PopUp_121"],Lang["PopUp_122"],Lang["PopUp_123"],Lang["PopUp_124"],Lang["PopUp_125"]];
var WuXingStyle= ["font_gold","font_wood","font_dust","font_water","font_fire"];

//战报胜利或失败标识
function CreateWarLogo()
{
    var html="";
    var UserCityName=UserInfo.CityList[0].Name;
    var WinCityName=FightInfo.FightResultName;
    var IsDefenceArmy=false;
    //如果是攻击方
    if(UserCityName==FightInfo.AttackCity.CityName)
    {
        if(FightInfo.FightResult==1)
        html+="<div class=\"warpaper_logo_1\">";
        else
        html+="<div class=\"warpaper_logo_2\">";
    }
    if(UserCityName==FightInfo.DefenceCity.CityName)
    IsDefenceArmy=true;
    if(FightInfo.DefenceUnionArmy!=null)
    {
        for(var i=0;i<FightInfo.DefenceUnionArmy.length;i++)
        {
            if(FightInfo.DefenceUnionArmy[i].CityName==UserCityName)
            {
                IsDefenceArmy=true;
            }
        }
    }
    //如果此城处于防守方
    if(IsDefenceArmy==true)
    {
        if(FightInfo.FightResult==2)
        html+="<div class=\"warpaper_logo_1\">";
        else
        html+="<div class=\"warpaper_logo_2\">";
    }
    
    html+="<span>"+Lang["PopUp_126"]+"</span></div>";
    var tree=document.getElementById("warpaper_logo");
    tree.innerHTML=html;    
    html=null;
}

//战报被动技能
function CreateTopMail()
{
    var html="";
    var x;
    var y;
    var UserCityName=UserInfo.CityList[0].Name;//本城城名
    var TotalAddDamage=0;
    html+="<span>"+Lang["PopUp_60"]+""+FightInfo.FightTime+"</span>";
    html+="<div class=\"warpaper_box\">";
    html+="<b>"+Lang["PopUp_127"]+"</b>";
    html+="<ul>";
    x=Math.floor(FightInfo.AttackCity.CityPos%400);
    if(x==0)x=400;
    y=(Math.floor((FightInfo.AttackCity.CityPos-1)/400)+1); 
    html+="<li><a href=\"#\" onmousedown=\"WriteLetterToAttack()\"><b class=\"font_green\">"+FightInfo.AttackCity.UserName+"</b></a> "+Lang["PopUp_128"]+" <b class=\"font_green\">"+FightInfo.AttackCity.CityName+"</b>["+x+","+y+"]</li>";
    var apassive=FightInfo.AttackCity.SkillArrayEffect;
    if(apassive!=null)
    {
        for(var i=0;i<apassive.length;i++)
        {
            if(apassive[i].PropertyType==16)
            html+="<li><b class=\"hquality_"+apassive[i].AttackQuality+"\">"+apassive[i].AttackHeroName+"</b> "+Lang["PopUp_129"]+" <b class=\"font_green\">"+apassive[i].SkillName+""+apassive[i].SkillLevel+""+Lang["PopUp_130"]+"</b>"+" "+StandType[apassive[i].AimType]+" "+Lang["PopUp_131"]+" <span class='font_red'>"+apassive[i].PropertyChange+"</span> "+Lang["PopUp_132"]+" <span class='font_red'>"+apassive[i].PropertyChange+"</span></li>";
            else if(apassive[i].PropertyType==7)
            {
                TotalAddDamage+=apassive[i].PropertyChange;
                html+="<li><b class=\"hquality_"+apassive[i].AttackQuality+"\">"+apassive[i].AttackHeroName+"</b> "+Lang["PopUp_129"]+" <b class=\"font_green\">"+apassive[i].SkillName+""+apassive[i].SkillLevel+""+Lang["PopUp_130"]+"</b>"+" "+StandType[apassive[i].AimType]+HurtType[apassive[i].PropertyType-1]+" <span class='font_red'>"+apassive[i].PropertyChange+"</span></li>";
            }
            else
            html+="<li><b class=\"hquality_"+apassive[i].AttackQuality+"\">"+apassive[i].AttackHeroName+"</b> "+Lang["PopUp_129"]+" <b class=\"font_green\">"+apassive[i].SkillName+""+apassive[i].SkillLevel+""+Lang["PopUp_130"]+"</b>"+" "+StandType[apassive[i].AimType]+HurtType[apassive[i].PropertyType-1]+" <span class='font_red'>"+apassive[i].PropertyChange+"</span></li>";
        }
    }
    if(FightInfo.AttackCity.Power<=1)
    html+="<li><span>"+Lang["PopUp_133"]+""+1+"</span>";
    else
    html+="<li><span>"+Lang["PopUp_133"]+""+Math.floor(FightInfo.AttackCity.Power*66)+"</span>";
    html+="<span style=\"padding-left:10px;\">"+Lang["PopUp_134"]+""+Math.floor(FightInfo.AttackCity.PowerBattleOver*66)+"</span></li>";
    html+="</ul>";
    html+="<b>"+Lang["PopUp_135"]+"</b>";
    html+="<ul>";   
    x=Math.floor(FightInfo.DefenceCity.CityPos%400);
    if(x==0)x=400;
    y=(Math.floor((FightInfo.DefenceCity.CityPos-1)/400)+1); 
    if(FightInfo.UserType!=2)
    html+="<li><a href=\"#\" onmousedown=\"WriteLetterToDefence()\"><b class=\"font_green\">"+FightInfo.DefenceCity.UserName+"</a></b> "+Lang["PopUp_128"]+" <b class=\"font_green\">"+FightInfo.DefenceCity.CityName+"</b>["+FightInfo.DefenceCity.CityPos%400+","+(parseInt(FightInfo.DefenceCity.CityPos/400,10)+1)+"]</li>";
    else
    html+="<li><b class=\"font_green\">"+FightInfo.DefenceCity.UserName+"</b> "+Lang["PopUp_128"]+" <b class=\"font_green\">"+FightInfo.DefenceCity.CityName+"</b>["+FightInfo.DefenceCity.CityPos%400+","+(parseInt(FightInfo.DefenceCity.CityPos/400,10)+1)+"]</li>";
    var dpassive=FightInfo.DefenceCity.SkillArrayEffect;
    if(dpassive!=null)
    {
        for(var i=0;i<dpassive.length;i++)
        {
            if(dpassive[i].PropertyType==16)
            html+="<li><b class=\"hquality_"+dpassive[i].DefenceQuality+"\">"+dpassive[i].AttackHeroName+"</b> "+Lang["PopUp_129"]+" <b class=\"font_green\">"+dpassive[i].SkillName+""+dpassive[i].SkillLevel+""+Lang["PopUp_130"]+"</b>"+" "+StandType[dpassive[i].AimType]+" "+Lang["PopUp_131"]+"<span class='font_red'>"+dpassive[i].PropertyChange+"</span> "+Lang["PopUp_132"]+" <span class='font_red'>"+dpassive[i].PropertyChange+"</span></li>";
            else
            html+="<li><b class=\"hquality_"+dpassive[i].DefenceQuality+"\">"+dpassive[i].AttackHeroName+"</b> "+Lang["PopUp_129"]+" <b class=\"font_green\">"+dpassive[i].SkillName+""+dpassive[i].SkillLevel+""+Lang["PopUp_130"]+"</b>"+" "+StandType[dpassive[i].AimType]+HurtType[dpassive[i].PropertyType-1]+" <span class='font_red'>"+dpassive[i].PropertyChange+"</span></li>";
        }
    }
    if(FightInfo.DefenceCity.Power<=1)
    html+="<li><span>"+Lang["PopUp_133"]+""+1+"</span>";
    else
    html+="<li><span>"+Lang["PopUp_133"]+""+Math.floor(FightInfo.DefenceCity.Power*66)+"</span>";
    html+="<span style=\"padding-left:10px;\">"+Lang["PopUp_134"]+""+Math.floor(FightInfo.DefenceCity.PowerBattleOver*66)+"</span></li>";
    html+="</ul>";
    html+="</div>";
    var FightPower=FightInfo.AttackCity.Power;
    var DefencePower=FightInfo.DefenceCity.Power;
    if(DefencePower==0)
    DefencePower=1;
//    var JudgeSign;//判断实力的标志1:1方无损，2:实力差过大,3:同时满足1和2条件
//    if(FightInfo.NoLossAttack==1 || FightInfo.NoLossDefence==1)
//    JudgeSign=1;
//    if(FightPower/DefencePower<=0.1 || FightPower/DefencePower>=10)
//    JudgeSign=2;
//    if((FightPower/DefencePower<=0.1 && (FightInfo.NoLossAttack==1 || FightInfo.NoLossDefence==1)) || (FightPower/DefencePower>=10 && (FightInfo.NoLossAttack==1 || FightInfo.NoLossDefence==1)))
//    JudgeSign=3;
    if(FightInfo.FightResult==1)
    html+="<span>"+Lang["PopUp_136"]+"<b class=\"font_green\">"+FightInfo.AttackCity.CityName+"</b> "+Lang["PopUp_137"]+"</span>";
    else
    html+="<span>"+Lang["PopUp_136"]+"<b class=\"font_green\">"+FightInfo.DefenceCity.CityName+"</b> "+Lang["PopUp_137"]+"</span>";
//    switch(JudgeSign)
//    {
//        case 1:
//        html+="<p class=\"font_red\">【倚强凌弱，胜利方士气受到影响。】</p>";
//        break
//        case 2:
//        html+="<p class=\"font_red\">【战斗双方实力相差过大，战斗经验有所削减。】</p>";
//        break
//        case 3:
//        html+="<p class=\"font_red\">【战斗双方实力相差过大，战斗经验有所削减。倚强凌弱，胜利方士气受到影响。】</p>";
//        break   
//    }
    if(FightInfo.Res!=null)
    {
        html+="<div class=\"warpaper_box\">";
        if(FightInfo.Res.Money+FightInfo.Res.Food+FightInfo.Res.Men>0)
        {
            html+="<b>"+Lang["PopUp_138"]+"</b>";
            html+="<div id=\"warpaper_res\">";
            html+="<table width=\"440\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
            html+="<td width=\"110\"><b class=\"font_green\">"+FightInfo.Res.CityName+"</b></td>";
            if(FightInfo.Res.Money>0)
            html+="<td width=\"22\"><img src=\"img/4/1.gif\" /></td><td width=\"60\">"+FightInfo.Res.Money+"</td>";
            if(FightInfo.Res.Food>0)
            html+="<td width=\"22\"><img src=\"img/4/2.gif\" /></td><td width=\"60\">"+FightInfo.Res.Food+"</td>";
            if(FightInfo.Res.Men>0)
            html+="<td width=\"22\"><img src=\"img/4/3.gif\" /></td><td>"+FightInfo.Res.Men+"</td>";
            html+="</tr></table>";
            html+="</div>";
        }
       
        if(FightInfo.WeiWang>=0)
        html+="<div style=\"margin-left:13px;\">"+Lang["PopUp_278"]+FightInfo.WeiWang+"</div>"; 
         
        //html+=""; 
        var aitem=FightInfo.Res.ItemArray;
        if(aitem!=null)
        {
            html+="<b>"+Lang["PopUp_139"]+"</b>";
            var i=0;
            
            html+="<span class=\"font_red\">"+StorageDes(aitem)+"</span>";
            
            html+="<p>";
            for(var i=0;i<aitem.length;i++)
            {
                if(aitem[i].ItemType==1)
                html+="<img src=\"img"+aitem[i].ItemPath+"\" />";
            }
            html+="</p>";
            for(var i=0;i<aitem.length;i++)
            {
                if(aitem[i].ItemType==2)
                {
                    html+="<b>"+Lang["PopUp_140"]+"</b>";
                    html+="<ul><li>"+aitem[i].ItemName+"</li></ul>";
                }
            }
        }
        var index ;
        if(FightInfo.DefenceUnionArmy!=null)
        {
            for(var i=0;i<FightInfo.DefenceUnionArmy.length;i++)
            {
                if(FightInfo.DefenceUnionArmy[i].CityName==UserCityName)
                index = i;
            }
        }
        if(UserCityName==FightInfo.AttackArmy.CityName && FightInfo.AttackArmy.OrgResArray!=null)
        {   
            html+="<b>"+Lang["PopUp_141"]+"</b>";
            for(var i=0;i<FightInfo.AttackArmy.OrgResArray.length;i++)
            {
                html+="<p>"+FightInfo.AttackArmy.OrgResArray[i].Name+"("+FightInfo.AttackArmy.OrgResArray[i].Value+")</p>";
            }
        }
        if(UserCityName==FightInfo.DefenceArmy.CityName &&  FightInfo.DefenceArmy.OrgResArray!=null)
        {
            html+="<b>"+Lang["PopUp_141"]+"</b>";
            for(var i=0;i<FightInfo.DefenceArmy.OrgResArray.length;i++)
            {
                html+="<p>"+FightInfo.DefenceArmy.OrgResArray[i].Name+"("+FightInfo.DefenceArmy.OrgResArray[i].Value+")</p>";
            }
        }
        if(index!=null)
        {
            if(FightInfo.DefenceUnionArmy[index].OrgResArray!=null)
            {
                html+="<b>"+Lang["PopUp_141"]+"</b>";
                for(var i=0;i<FightInfo.DefenceUnionArmy[index].OrgResArray.length;i++)
                {
                     html+="<p>"+FightInfo.DefenceUnionArmy[index].OrgResArray[i].Name+"("+FightInfo.DefenceUnionArmy[index].OrgResArray[i].Value+")</p>";
                }
            }
        }
        if(UserCityName==FightInfo.AttackCity.CityName && FightInfo.IsSkillExp==1)
        {
            html+="<p>"+Lang["PopUp_142"]+"</p>";//攻击方
        }
        if(UserCityName==FightInfo.AttackCity.CityName)
        {
            if(FightInfo.AttackInsignia>0 || FightInfo.AttackPlundInsignia>0)
            html+="<b>"+Lang["PopUp_189"]+"</b>";
            if(FightInfo.FightResult==1)
            {
                if(FightInfo.AttackInsignia>0)
                html+="<p>"+Lang["PopUp_190"]+""+FightInfo.AttackInsignia+"";
                if(FightInfo.AttackPlundInsignia>0)
                html+=""+Lang["PopUp_191"]+""+FightInfo.AttackPlundInsignia+"</p>";
            }
            else
            {
                if(FightInfo.AttackInsignia>0)
                html+="<p>"+Lang["PopUp_192"]+""+FightInfo.AttackInsignia+"</p>";
            }
        }
        if(index!=null && FightInfo.DefInsignia>0)
        {
            html+="<b>"+Lang["PopUp_193"]+"</b>";
            html+="<p>"+Lang["PopUp_194"]+""+FightInfo.DefInsignia+"</p>";
        }
        html+="</div>";
    }
    var top=document.getElementById("warpaper_top");
    top.innerHTML=html;
    html=null; 
}

//仓库道具已满描述
function StorageDes(aitem)
{
    //var aitem=FightInfo.Res.ItemArray;
    var result = "";
    
    for(var i=0;i<(aitem.length);i++)
    {
        if(aitem[i].IsFill == 1)
        {
            result = Lang["PopUp_143"]
            break;
        }
    }
    
    return result;
}

function CreateMiddleMail()
{
    var html="";
    var ainitiative=FightInfo.AttackArmy.SkillArrayEffect;
    var ahero=FightInfo.AttackArmy.HeroPropertyArray;
    var dinitiative=FightInfo.DefenceArmy.SkillArrayEffect;
    var dhero=FightInfo.DefenceArmy.HeroPropertyArray;
    var defence=FightInfo.DefenceBuildList;
    var lostinfo=FightInfo.CityBuilds;
    var HasBuilding=false;
    html+="<span>"+Lang["PopUp_144"]+"</span>";
    html+="<div class=\"warpaper_box\">";
    html+="<b class=\"font_green\">"+FightInfo.AttackCity.CityName+":</b><ul>";
    if(ainitiative!=null)
    {
        for(var i=0;i<ainitiative.length;i++)
        {
            html+="<li>(<span class=\""+WuXingStyle[ainitiative[i].AttackWuXing-1]+"\">"+WuXingType[ainitiative[i].AttackWuXing-1]+"</span>)<b class=\"hquality_"+ainitiative[i].AttackQuality+"\">"+ainitiative[i].AttackHeroName+"</b> "+Lang["PopUp_145"]+" (<span class=\""+WuXingStyle[ainitiative[i].DefenceWuXing-1]+"\">"+WuXingType[ainitiative[i].DefenceWuXing-1]+"</span>)<b class=\"hquality_"+ainitiative[i].DefenceQuality+"\">"+ainitiative[i].DefenceHeroName+"";  
            html+="</b>"+Lang["PopUp_129"]+" <b class=\"font_green\">"+ainitiative[i].SkillName+""+ainitiative[i].SkillLevel+""+Lang["PopUp_130"]+"</b> "+HurtType[ainitiative[i].PropertyType-1]+" <span class='font_red'>"+ainitiative[i].PropertyChange+"</span> "+Lang["PopUp_146"]+"";
            if((ainitiative[i].AttackWuXing-ainitiative[i].DefenceWuXing)==-1 || (ainitiative[i].AttackWuXing-ainitiative[i].DefenceWuXing)==4)
            html+=""+Lang["PopUp_147"]+"";
            if((ainitiative[i].AttackWuXing-ainitiative[i].DefenceWuXing)==1 || (ainitiative[i].AttackWuXing-ainitiative[i].DefenceWuXing)==-4)
            html+=""+Lang["PopUp_148"]+"";
            if(ainitiative[i].OtherDodge==2)
            html+=""+Lang["PopUp_149"]+"";
            if(ainitiative[i].UsCrushBlow==2 && ainitiative[i].OtherDodge!=2)
            html+=""+Lang["PopUp_150"]+"";
            html+="</li>"
        }
    }
    html+="</ul>";
    html+="<table width=\"362\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bordercolor=\"#FFFFFF\">";
    html+="<tr><td width=\"57\">"+Lang["PopUp_151"]+"</td>";
    html+="<td width=\"53\">"+Lang["PopUp_152"]+"</td>";
    html+="<td width=\"53\">"+Lang["PopUp_153"]+"</td>";
    html+="<td width=\"39\">"+Lang["PopUp_154"]+"</td>";
    html+="<td width=\"66\">"+Lang["PopUp_155"]+"</td>";
    html+="<td width=\"53\">"+Lang["PopUp_156"]+"</td>";
    html+="<td width=\"41\">"+Lang["PopUp_157"]+"</td></tr>";
    for(var i=0;i<ahero.length;i++)
    {
        html+="<tr><td><b class=\"hquality_"+ahero[i].Quality+"\">"+ahero[i].HeroName+"</b></td>";
        html+="<td>"+ahero[i].ChildrenCount+"</td><td>"+ahero[i].ChildrenLoss+"</td><td>"+ahero[i].TrainingCount+"</td><td>"+ahero[i].TrainingLoss+"</td><td>"+ahero[i].GainExp+"</td><td>";
        if(ahero[i].HeroStatefFlag==1)
        html+="<img title=\""+Lang["PopUp_158"]+"\" src=\"img/o/39.gif\" />";
        if(ahero[i].HeroUpdateFlag==1)
        html+="<img title=\""+Lang["PopUp_159"]+"\" src=\"img/o/38.gif\" />";
        html+="</td></tr>";
    }
    html+="</table>";
    html+="</div>";
    html+="<span>"+Lang["PopUp_160"]+"</span>";
    html+="<div class=\"warpaper_box\">";
    html+="<b class=\"font_green\">"+FightInfo.DefenceCity.CityName+":</b><ul>";
    
    for(var i=0;i<defence.length;i++)
    {
        if(defence[i].DefenceCount>0)
        {
            HasBuilding=true;
        }
    }
        
    if(dhero!=null || HasBuilding==true)
    {
    if(dinitiative!=null)
    {
        for(var i=0;i<dinitiative.length;i++)
        {
            html+="<li>(<span class=\""+WuXingStyle[dinitiative[i].AttackWuXing-1]+"\">"+WuXingType[dinitiative[i].AttackWuXing-1]+"</span>)<b class=\"hquality_"+dinitiative[i].AttackQuality+"\">"+dinitiative[i].AttackHeroName+"</b> "+Lang["PopUp_145"]+" (<span class=\""+WuXingStyle[dinitiative[i].DefenceWuXing-1]+"\">"+WuXingType[dinitiative[i].DefenceWuXing-1]+"</span>)<b class=\"hquality_"+dinitiative[i].DefenceQuality+"\">"+dinitiative[i].DefenceHeroName+"";  
            html+="</b>"+Lang["PopUp_129"]+" <b class=\"font_green\">"+dinitiative[i].SkillName+""+dinitiative[i].SkillLevel+""+Lang["PopUp_130"]+"</b> "+HurtType[dinitiative[i].PropertyType-1]+" <span class='font_red'>"+dinitiative[i].PropertyChange+"</span> "+Lang["PopUp_146"]+"";
            if((dinitiative[i].AttackWuXing-dinitiative[i].DefenceWuXing)==-1 || (dinitiative[i].AttackWuXing-dinitiative[i].DefenceWuXing)==4)
            html+=""+Lang["PopUp_147"]+"";
            if((dinitiative[i].AttackWuXing-dinitiative[i].DefenceWuXing)==1 || (dinitiative[i].AttackWuXing-dinitiative[i].DefenceWuXing)==-4)
            html+=""+Lang["PopUp_148"]+"";
            if(dinitiative[i].OtherDodge==2)
            html+=""+Lang["PopUp_149"]+"";
            if(dinitiative[i].UsCrushBlow==2 && dinitiative[i].OtherDodge!=2)
            html+=""+Lang["PopUp_150"]+"";
            html+="</li>";
        } 
    }
    html+="</ul>";
    if(dhero!=null)
    {
        html+="<table width=\"362\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bordercolor=\"#FFFFFF\">";
        html+="<tr><td width=\"57\">"+Lang["PopUp_151"]+"</td>";
        html+="<td width=\"53\">"+Lang["PopUp_152"]+"</td>";
        html+="<td width=\"53\">"+Lang["PopUp_153"]+"</td>";
        html+="<td width=\"39\">"+Lang["PopUp_154"]+"</td>";
        html+="<td width=\"66\">"+Lang["PopUp_155"]+"</td>";
        html+="<td width=\"53\">"+Lang["PopUp_156"]+"</td>";
        html+="<td width=\"41\">"+Lang["PopUp_157"]+"</td></tr>";
        for(var i=0;i<dhero.length;i++)
        {
            html+="<tr><td><b class=\"hquality_"+dhero[i].Quality+"\">"+dhero[i].HeroName+"</b></td>";
            html+="<td>"+dhero[i].ChildrenCount+"</td><td>"+dhero[i].ChildrenLoss+"</td><td>"+dhero[i].TrainingCount+"</td><td>"+dhero[i].TrainingLoss+"</td><td>"+dhero[i].GainExp+"</td><td>";
            if(dhero[i].HeroStatefFlag==1)
            html+="<img title=\""+Lang["PopUp_158"]+"\" src=\"img/o/39.gif\" />";
            if(dhero[i].HeroUpdateFlag==1)
            html+="<img title=\""+Lang["PopUp_159"]+"\" src=\"img/o/38.gif\" />";
            html+="</td></tr>";
        }
        html+="</table>";
    }
    if(defence!=null)
    {
        if(HasBuilding==true)
        {
            html+="<b class=\"font_green\">"+Lang["PopUp_161"]+"</b>";
            html+="<table width=\"200\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
            html+="<tr><td>"+Lang["PopUp_162"]+"</td><td>"+Lang["PopUp_163"]+"</td><td>"+Lang["PopUp_164"]+"</td><td>"+Lang["PopUp_165"]+"</td></tr>";
        }
        for(var i=0;i<defence.length;i++)
        {
            if(defence[i].DefenceCount>0)
            {
                html+="<tr><td><b>"+defence[i].DefenceName+"</b></td><td>"+defence[i].DefenceCount+"</td>";
                html+="<td>"+defence[i].DefenceLoss+"</td><td>"+(defence[i].DefenceCount-defence[i].DefenceLoss)+"</td></tr>";
            }
        }
        html+="</table>";
    } 
    }
    else
        html+="<ul><li>"+Lang["PopUp_166"]+"</li></ul>";
    if(lostinfo!=null)
    {
        html+="<b class=\"font_green\">"+Lang["PopUp_167"]+"</b>";
        html+="<table width=\"200\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr><td>"+Lang["PopUp_168"]+"</td><td>"+Lang["PopUp_169"]+"</td><td>"+Lang["PopUp_170"]+"</td><td>"+Lang["PopUp_171"]+"</td></tr>";
        for(var i=0;i<lostinfo.length;i++)
        {
            html+="<tr><td><b>"+InteriorBuildings[lostinfo[i].Index-1]+"</b></td><td>"+lostinfo[i].CurrentLevel+"</td>";
            html+="<td>"+(lostinfo[i].CurrentLevel-lostinfo[i].EndLevel)+"</td><td>"+lostinfo[i].EndLevel+"</td></tr>";
        }
        html+="</table>";
    }
    html+="</div>";
    var top=document.getElementById("warpaper_middle");
    top.innerHTML=html;
    html=null; 
}

function CreateSupportMail()
{
    var html="";
    var support=FightInfo.DefenceUnionArmy;
    if(support!=null)
    {
        html+="<span>"+Lang["PopUp_172"]+"</span>";
        html+="<div class=\"warpaper_box\">";
        for(var i=0;i<support.length;i++)
        {
            html+="<b class=\"font_green\">"+support[i].CityName+":</b><ul>";
            var dsupport=support[i].SkillArrayEffect;
            var asupport=support[i].HeroPropertyArray;
            if(dsupport!=null)
            {
                for(var n=0;n<dsupport.length;n++)
                {
                    html+="<li>(<span class=\""+WuXingStyle[dsupport[n].AttackWuXing-1]+"\">"+WuXingType[dsupport[n].AttackWuXing-1]+"</span>)<b class=\"hquality_"+dsupport[n].AttackQuality+"\">"+dsupport[n].AttackHeroName+"</b> "+Lang["PopUp_145"]+" (<span class=\""+WuXingStyle[dsupport[n].DefenceWuXing-1]+"\">"+WuXingType[dsupport[n].DefenceWuXing-1]+"</span>)<b class=\"hquality_"+dsupport[n].DefenceQuality+"\">"+dsupport[n].DefenceHeroName+"";  
                    html+="</b>"+Lang["PopUp_129"]+" <b class=\"font_green\">"+dsupport[n].SkillName+dsupport[n].SkillLevel+""+Lang["PopUp_130"]+"</b> "+HurtType[dsupport[n].PropertyType-1]+" <span class='font_red'>"+dsupport[n].PropertyChange+"</span> "+Lang["PopUp_146"]+"";
                    if((dsupport[n].AttackWuXing-dsupport[n].DefenceWuXing)==-1 || (dsupport[n].AttackWuXing-dsupport[n].DefenceWuXing)==4)
                    html+=""+Lang["PopUp_147"]+"";
                    if((dsupport[n].AttackWuXing-dsupport[n].DefenceWuXing)==1 || (dsupport[n].AttackWuXing-dsupport[n].DefenceWuXing)==-4)
                    html+=""+Lang["PopUp_148"]+"";
                    if(dsupport[n].OtherDodge==2)
                    html+=""+Lang["PopUp_149"]+"";
                    if(dsupport[n].UsCrushBlow==2 && dsupport[n].OtherDodge!=2)
                    html+=""+Lang["PopUp_150"]+"";
                    html+="</li>";
                } 
            }
            html+="</ul>";
            html+="<table width=\"362\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bordercolor=\"#FFFFFF\">";
            html+="<tr><td width=\"57\">"+Lang["PopUp_151"]+"</td>";
            html+="<td width=\"53\">"+Lang["PopUp_152"]+"</td>";
            html+="<td width=\"53\">"+Lang["PopUp_153"]+"</td>";
            html+="<td width=\"39\">"+Lang["PopUp_154"]+"</td>";
            html+="<td width=\"66\">"+Lang["PopUp_155"]+"</td>";
            html+="<td width=\"53\">"+Lang["PopUp_156"]+"</td>";
            html+="<td width=\"41\">"+Lang["PopUp_157"]+"</td></tr>";
            for(var m=0;m<asupport.length;m++)
            {
                html+="<tr><td><b class=\"hquality_"+asupport[m].Quality+"\">"+asupport[m].HeroName+"</b></td>";
                html+="<td>"+asupport[m].ChildrenCount+"</td><td>"+asupport[m].ChildrenLoss+"</td><td>"+asupport[m].TrainingCount+"</td><td>"+asupport[m].TrainingLoss+"</td><td>"+asupport[m].GainExp+"</td><td>";
                if(asupport[m].HeroStatefFlag==1)
                html+="<img title=\""+Lang["PopUp_158"]+"\" src=\"img/o/39.gif\" />";
                if(asupport[m].HeroUpdateFlag==1)
                html+="<img title=\""+Lang["PopUp_159"]+"\" src=\"img/o/38.gif\" />";
                html+="</td></tr>";
            }
            html+="</table>";
        }
            html+="</div>";
    }
    var top=document.getElementById("warpaper_support");
    top.innerHTML=html;
    html=null;
}

function CreateBottomMail()
{
    var html="";
    var revert=FightInfo.RevertSkill;
    if(revert!=null)
    {
        html+="<span>"+Lang["PopUp_173"]+"</span>";
        html+="<div class=\"warpaper_box\">";
        for(var i=0;i<revert.length;i++)
        {
            html+="<b class=\"font_green\">"+revert[i].CityName+":</b><ul>";
            var drevert=revert[i].SkillArrayEffect;
            if(drevert!=null)
            {
                for(var n=0;n<drevert.length;n++)
                {
                    html+="<li><b class=\"hquality_"+drevert[n].AttackQuality+"\">"+drevert[n].AttackHeroName+"</b> "+Lang["PopUp_145"]+" <b class=\"hquality_"+drevert[n].DefenceQuality+"\">"+drevert[n].DefenceHeroName+"";
                    html+="</b>"+Lang["PopUp_2"]+"<b class=\"font_red\">"+drevert[n].SkillName+"</b> "+HurtType[drevert[n].PropertyType-1]+" <span class='font_red'>"+drevert[n].PropertyChange+""+Lang["PopUp_146"]+"</span></li>";
                }
                html+="</ul>";
            }
        }
        html+="</div>";
    }
    var top=document.getElementById("warpaper_bottom");
    top.innerHTML=html;
    html=null; 
}

function HideWarpaperPopup()
{
    $("#popup").hide();
    $("#overlay").hide();
}

//弹出后遮盖层的问题
var isIE = (document.all)?true : false;
var isIE6 = isIE && ([/MSIE (\d)\.0/i.exec(navigator.userAgent)][0][1] == 6);
window.onload = SetLay;
window.onresize = SetLay;
function SetLay()
{
    var overlay = document.getElementById("overlay");
    var otheroverlay = document.getElementById("otheroverlay");
    if(isIE6)
    {
		overlay.style.position = "absolute";
		overlay.style.width = Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth) + "px";
		overlay.style.height = Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight) + "px";
		otheroverlay.style.position = "absolute";
		otheroverlay.style.width = Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth) + "px";
		otheroverlay.style.height = Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight) + "px";
    }
	else
	{
		otheroverlay.style.position = "fixed";
		otheroverlay.style.width = "100%";
		otheroverlay.style.height = "100%";
		overlay.style.position = "fixed";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
	}
}

//村镇改名,修改占领信息
function ChangeName(id)
{
    var t=id.split("_");
    var type=parseInt(t[1]);
    var gold=CityInteriorInfo.Gold;
    switch(type)
    {
        case 1:
        case 3:
        {
            if(gold-5>=0)
                PopUpChangeName(id);
            else
                ShowPopUp("pop_25");
        }
            break;
        case 2:
            PopUpChangeName(id);
            break;
        default:
            break;
    }
}

//村镇侠客改名,修改占领信息
function PopUpChangeName(id)
{
    var t=id.split("_");
    var type=parseInt(t[1]);
    var html="";
    var left=GetLeftValue(214);
    $("#popup").css("left",left);
    $("#popup").css("top","248px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if(type==3)
        html+="<p>"+Lang["PopUp_229"]+"</p>";//请输入新的占领信息
    else
        html+="<p>"+Lang["PopUp_174"]+"</p>";//请输入新名称
    if(type==1)
    {
        html+="<p><input id=\"newname_change\" type=\"text\" class=\"input_searchitem\" maxlength=\"4\"/></p>";
        html+="<p style=\"color:#6F6F6F\">"+Lang["PopUp_175"]+"</p>";//名称不能超过4个汉字
    }
    else if(type==3)
    {
        html+="<p><input id=\"newname_change\" type=\"text\" class=\"input_searchitem\" maxlength=\"34\"/></p>";
        html+="<p style=\"color:#6F6F6F\">"+Lang["PopUp_231"]+"</p></p>";//名称不能超过34个汉字
        html+="<p>"+Lang["PopUp_220"]+"</p>";
        html+="<p><img src=\"img/4/4.gif\"/> 5</p>";
    }
    else
    {
        html+="<p><input id=\"newname_change\" type=\"text\" class=\"input_searchitem\" maxlength=\"9\"/></p>";
        html+="<p style=\"color:#6F6F6F\">"+Lang["PopUp_176"]+"</p></p>";//名称不能超过9个汉字
    }
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=ChangeHeroCityName(id)>"+Lang["PopUp_1"]+"</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>"+Lang["PopUp_34"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","214px");
    $(".common_popup").css("height","auto");
    $(".common_popup1").css("width","210px");
    $(".common_popup1").css("height","auto");
    $(".common_popup2").css("width","186px");
    $(".common_popup2").css("height","auto");
    $("#popup").show();
    $("#overlay").show();
}

//更改侠客/村镇名字
function ChangeHeroCityName(id)
{    
    var t=id.split("_");
    var type=parseInt(t[1]);
    var newname=$("#newname_change").val();
    var newname=filterhtml(newname);
    if(type==1)
        Main.UpdateHeroName(CityID,TheHeroInfo.ID,newname,cb_UpdateName);
    else if(type==2)
        Main.UpdateCityName(CityID,newname,cb_UpdateName);
    else if(type==3)//修改占领信息
    {
        Main.UpdateBrief(CityID,CityInfo.Pos,newname,cb_UpdateBrief);
    }
}

function filterhtml(str)
{
    str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
    str.value = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
    str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
    return str;
}

function cb_UpdateName(result)
{
    if(DataValidate(result)==false) return;
    HidePopUp();
    if(result.value==0)
        Main.GetUserInfo(cb_GetUserInfo);//请求用户信息
    else if(result.value==513)
        ShowMessageBox(Lang["PopUp_177"]);
    else if(result.value==515)
        ShowMessageBox(Lang["PopUp_178"]);
    else if(result.value==4)
        ShowMessageBox(Lang["PopUp_179"]);
    else if(result.value==10113)
        ShowMessageBox(Lang["PopUp_180"]);
    else if(result.value==10114)
        ShwoMessageBox(Lang["PopUp_182"]);
    else
        ShowMessageBox(Lang["PopUp_181"]);
}

function cb_UpdateBrief(result)
{
    if(DataValidate(result)==false) return;
        HidePopUp();
    if(result.value==0)
    {
        Main.GetUserInfo(cb_GetUserInfo);//请求用户信息
    }
    else if(result.value==70005)
        ShowMessageBox(Lang["PopUp_229"]);
    else if(result.value==70004)
        ShowPopUp("pop_25");
    else if(result.value==70009)
        ShowMessageBox(Lang["PopUp_233"]);
}

function DelUserLord()
{
    var speed_1=document.getElementById("speed_1").checked;
    var speed_2=document.getElementById("speed_2").checked;
    var flag=0;
    if(speed_1)
        flag=-1;
    else
        flag=1;
        
     
    Main.DeleteOccupationInfo(CityID,CityInfo.Pos,flag,cb_DeleteOccupationInfo);
}

function cb_DeleteOccupationInfo(result)
{
    if(DataValidate(result)==false) return;
    HidePopUp();
    if(result.value==0)
        Main.GetUserInfo(cb_GetUserInfo);//请求用户信息
    else if(result.value==70004)//元宝不足
        ShowPopUp("pop_25");
    else if(result.value==70002)//战勋不足
        ShowMessageBox(Lang["PopUp_216"]);
    else if(result.value==70006)
        ShowMessageBox(Lang["PopUp_232"]);
}