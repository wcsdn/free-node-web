
var MallItemType = 1;//商品类型，1=热销!，2=建筑类，3=科技类，4=侠客类，5=军事类，6=道具类，7=资源类，8=其它类
var MallItemInfo;
var NeedUpdate = false;//是否刷新

//点击'商城'
function ClickMall()
{
    ShowPopUp("Pop_109");
    DataTranslateBegin();
    Main.GetCommoditysByType(CityID,MallItemType,cb_GetCommoditysByType);
}

//获得道具信息
function cb_GetCommoditysByType(result)
{
    if(DataValidate(result)==false) return;
    MallItemInfo = result.value;
    if(MallItemInfo!=null && MallItemInfo[0].Id==-1)
    MallItemInfo=null;
    if(MallItemInfo!=null)
    {
        if(MallItemType!=1)
        $("#MallItem_"+MallItemType+"").css({"color":"#35C235"});
        else
        $("#MallItem_"+MallItemType+"").css({"color":"red"});
        CreateMallContent();//道具主体信息
    }
    DataTranslateEnd();
    if(NeedUpdate==true)
    Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息
}

//商城页面
function PopItemMall(id){
    var html="";
    var t=id.split("_");
    var pos=parseInt(t[t.length-1],10); 
    var left=GetLeftValue(529);
    $("#popup").css("left",left);
    $("#popup").css("top","110px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div id=\"ItemMall\">";
    html+="<h4>"+Lang["Mall_1"]+"</h4>";
    html+="<div class=\"malltitle\"><table width=\"480\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
    html+="<td><a href=\"#\" id=\"MallItem_1\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_2"]+"</a></td>";
    //html+="<td><a href=\"#\" id=\"MallItem_2\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">建筑类</a></td>";
    //html+="<td><a href=\"#\" id=\"MallItem_3\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">科技类</a></td>";
    html+="<td><a href=\"#\" id=\"MallItem_4\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_3"]+"</a></td>";
    html+="<td><a href=\"#\" id=\"MallItem_5\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_4"]+"</a></td>";
    html+="<td><a href=\"#\" id=\"MallItem_6\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_5"]+"</a></td>";
    html+="<td><a href=\"#\" id=\"MallItem_7\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_6"]+"</a></td>";
    html+="<td><a href=\"#\" id=\"MallItem_8\" onmousedown=\"ChangeItemMallType(this.id)\" class=\"linkstyle_2\">"+Lang["Mall_7"]+"</a></td>";
    html+="</tr></table></div>";
    html+="<ul id=\"mallcontent\">";
    html+="</ul>";
    
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["PopUp_15"]+"</a>";
    html+="</div>";
    
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","539px")
    $(".common_popup").css("height","400px")
    $(".common_popup1").css("width","535px")
    $(".common_popup1").css("height","386px")
    DataTranslateEnd();
}

//填充主体页面
function CreateMallContent()
{
    var html="";
    for(var i=0;i<MallItemInfo.length;i++)
    {
        html+="<li class=\"aaa\">";
        html+="<ul class=\"singleitem\">";
        html+="<li><div class=\"singleitem_title\"><b>"+MallItemInfo[i].TypeName+"</b></div></li>";
        html+="<li><div class=\"item_img\"><a id=\"mall_"+i+"_"+MallItemInfo[i].BuyType+"\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\"img"+MallItemInfo[i].Image+"\" /></a></div></li>";
        if(MallItemInfo[i].Usetype==1)//usetype 1:可购买类型
        {
            if(MallItemInfo[i].BuyType==1)//buytype 1:道具,2:持续状态,3:资源购买
            html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /><span>"+MallItemInfo[i].Gold+"</span></td><td width=\"55\"><a href=\"#\" id=\"item_"+MallItemInfo[i].Type+"_"+MallItemInfo[i].Id+"_"+MallItemInfo[i].Index+"_"+i+"_"+MallItemInfo[i].BuyType+"\" onmousedown=\"ShowMallPop(this.id)\" class=\"linkstyle_mall\">"+Lang["Mall_8"]+"</a></td></tr></table></li>";
            else if(MallItemInfo[i].BuyType==2)
            {
                if(MallItemInfo[i].IsUsed==0)//0:没效果,1:有效果
                html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /><span>"+MallItemInfo[i].Gold+"</span></td><td width=\"55\"><a href=\"#\" id=\"item_"+MallItemInfo[i].MainEffectType+"_"+MallItemInfo[i].EffectType+"_"+i+"_"+MallItemInfo[i].BuyType+"\" onmousedown=\"ShowMallPop(this.id)\" class=\"linkstyle_mall\">"+Lang["Mall_8"]+"</a></td></tr></table></li>";
                else
                html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /><span>"+MallItemInfo[i].Gold+"</span></td><td width=\"55\"><a title=\""+Lang["Tips_131"]+"\" class=\"linkstyle_mall\"><span style=\"color:gray;\">"+Lang["Mall_8"]+"</span></a></td></tr></table></li>";
            }
            else
            {
                if((MallItemInfo[i].BuyType==3 && MallItemInfo[i].TradeRes.LevelMen>0) || (MallItemInfo[i].BuyType==4 && MallItemInfo[i].TradeRes.LevelMoney>0) || (MallItemInfo[i].BuyType==5 && MallItemInfo[i].TradeRes.LevelFood>0))
                    html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /></td><td width=\"55\"><a href=\"#\" id=\"item_"+MallItemInfo[i].BuyType+"_"+i+"\" onmousedown=\"BuyMallRes(this.id)\" class=\"linkstyle_mall\">"+Lang["Mall_8"]+"</a></td></tr></table></li>";
                else
                    html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /></td><td width=\"55\"><a title=\""+Lang["Tips_140"]+"\" class=\"linkstyle_mall\"><span style=\"color:gray;\">"+Lang["Mall_8"]+"</span></a></td></tr></table></li>";    
            }
        }
        else
        html+="<li><table height=\"17\" width=\"115\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\"><img src=\"img/4/4.gif\" /><span></td><td width=\"55\"><a class=\"linkstyle_mall\"><span style=\"color:gray;\">"+Lang["Mall_8"]+"</span></a></td></tr></table></li>";
        html+="</ul>";
        html+="</li>";
    }
    var tree=document.getElementById("mallcontent");
    tree.innerHTML=html;
    html=null;
}

//更改商城道具类型
function ChangeItemMallType(id)
{
    var t = id.split("_");
    if(MallItemType!=1)
    $("#MallItem_"+MallItemType+"").css({"color":"black"});
    MallItemType = parseInt(t[1],10);
    Main.GetCommoditysByType(CityID,MallItemType,cb_GetCommoditysByType);
}

//弹出框
function ShowMallPop(id)
{
    var t = id.split("_");
    var buytype = parseInt(t[t.length-1],10);
    var mallindex = parseInt(t[t.length-2],10);
    var gold=CityInteriorInfo.Gold;
    var needgold=MallItemInfo[mallindex].Gold;
    if(gold-needgold>=0)
    {
        var html="";
        var left=GetLeftValue(166)
        $("#otherpopup").css("left",left);
        $("#otherpopup").css("top","257px");
        html+="<div class=\"common_popup\" style=\"height:94px;\">";
        html+="<div class=\"common_popup1\" style=\"height:80px;\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDoMall(\"0\")><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\" style=\"height:58px;\">";
        html+="<ul>";
        html+="<li>"+Lang["Mall_8"]+""+MallItemInfo[mallindex].TypeName+"</li>";
        html+="<li>"+Lang["Mall_9"]+"</li>";
        html+="<li><img src=\"img/4/4.gif\" />"+MallItemInfo[mallindex].Gold+"</li>";
        html+="<ul>";
        html+="</div>";
        html+="<div class=\"popup_button\">";
        html+="<span><a id=\""+id+"\" href=\"#\" onmousedown=BuyMallItem(this.id)>"+Lang["PopUp_1"]+"</a><span>";
        html+="<span style=\"margin-left:10px;\"><a  href=\"#\" onmousedown=PopUpNotDoMall(\"0\")>"+Lang["PopUp_34"]+"</a></span>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("otherpopup");
        tree.innerHTML=html;    
        html=null;
        $("#otherpopup").show();
        $("#otheroverlay").show();
    }
    else
    MallNeedGold();
}

//隐藏弹出层
function PopUpNotDoMall()
{
    $("#otherpopup").hide();
    $("#otheroverlay").hide();
}

//购买道具
function BuyMallItem(id)
{
    var t = id.split("_");
    var buytype = parseInt(t[t.length-1],10);
    var mallindex = parseInt(t[t.length-2],10);
    if(buytype==1)
    {
        var type = parseInt(t[1],10);
        var id = parseInt(t[2],10);
        var index = parseInt(t[3],10);
        Main.BuyItemFromCommodity(CityID,type,id,index,cb_BuyItemFromCommodity);
    }
    else
    {
        var MainType = parseInt(t[1],10);
        var EffType = parseInt(t[2],10);
        Main.UpdatePersistEffectByType(CityID,MainType,EffType,cb_UpdatePersistEffectByType);
    }
}

//购买道具
function cb_BuyItemFromCommodity(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        PopUpMallMessageBox(Lang["Mall_10"]);
        Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息
    }
    else if(result.value==30055)
    PopUpMallMessageBox(Lang["Mall_11"]);
}

//购买持续效果
function cb_UpdatePersistEffectByType(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    PopUpMallMessageBox(Lang["Mall_12"]);
    NeedUpdate=true;
    Main.GetCommoditysByType(CityID,MallItemType,cb_GetCommoditysByType);//再次请求商城道具信息
}

//商城消息对话框
function PopUpMallMessageBox(message)
{
    var html="";
    var left=GetLeftValue(166)
    $("#otherpopup").css("left",left);
    $("#otherpopup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDoMall(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p style=\"text-align:center;\">"+message+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDoMall(\"0\")>"+Lang["PopUp_1"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
    var tree=document.getElementById("otherpopup");
    tree.innerHTML=html;    
    html=null;
    $("#otherpopup").show();
    $("#otheroverlay").show();
}

//商城元宝不足对话框
function MallNeedGold()
{
    var html="";
    var left=GetLeftValue(166);
    $("#otherpopup").css("left",left);
    $("#otherpopup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDoMall(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p>"+Lang["PopUp_48"]+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a target='_blank' href="+ToGold+" onclick=PopUpNotDoMall(this.id)>"+Lang["PopUp_49"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDoMall(this.id)>"+Lang["PopUp_34"]+"</a>";
    //html+="<a id=\""+id+"\" href=\"#\" onmousedown=PopUpNotDo(this.id)>[确定]</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
     //$("#popup").html(html);
    var tree=document.getElementById("otherpopup");
    tree.innerHTML=html;    
    html=null; 
    $("#otherpopup").show();
    $("#otheroverlay").show();
}

//商城购买资源
function BuyMallRes(id)
{
    var t = id.split("_");
    var type = 0;
    var buytype = parseInt(t[1],10);
    var index = parseInt(t[2],10);
    if(buytype==3)
    {
        type=44;
        GetMallResByGold(type,index);
    }
    else if(buytype==4)
    {
        type=42;
        GetMallResByGold(type,index);
    }
    else
    {
        type=43;
        GetMallResByGold(type,index);
    }
}


//元宝兑换资源弹出
function GetMallResByGold(type,index)
{
    var html="";
    var gold=CityInteriorInfo.Gold;
    if(gold>0)
    {
        var src;//存储不同资源图片路径
        var left=GetLeftValue(230);
        $("#otherpopup").css("left",left);
        $("#otherpopup").css("top","224px");
        html+="<div class=\"common_popup\" style=\"width:230px;height:152px;\">";
        html+="<div class=\"common_popup1\" style=\"width:226px;height:138px;\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDoMall(\"0\")><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\" style=\"width:195px;height:113px;margin-left:13px;\">";
        switch(type)
        {
            case 42:
            html+="<p style=\"text-align:center;\">"+Lang["Common_12"]+"</p>";
            src="img/4/1.gif";
            resType=1;
            levelres=MallItemInfo[index].TradeRes.LevelMoney;
            levelper=MallItemInfo[index].TradeRes.MoneyPer;
            break
            case 43:
            html+="<p style=\"text-align:center;\">"+Lang["Common_13"]+"</p>";
            src="img/4/2.gif";
            levelres=MallItemInfo[index].TradeRes.LevelFood;
            levelper=MallItemInfo[index].TradeRes.FoodPer;
            resType=2;
            break
            case 44:
            html+="<p style=\"text-align:center;\">"+Lang["Common_14"]+"</p>";
            src="img/4/3.gif";
            levelres=MallItemInfo[index].TradeRes.LevelMen;
            levelper=MallItemInfo[index].TradeRes.MenPer;
            resType=3;
            break
            default:
            break
        }
        html+="<ul style=\"margin-left:20px;line-height:18px;\">";
        html+="<li>";
        html+="<table width=\"174\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>"
        html+="<td width=\"44\"><input id=\"input_getgold\" class=\"input_getgold\" onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeInputGold()\"  /></td>"
        html+="<td width=\"37\"><img style=\"margin-right:5px;\" src=\"img/4/4.gif\" />=</td>"
        html+="<td width=\"56\"><span id=\"totalres\">0</span></td>"
        html+="<td width=\"37\"><img src=\""+src+"\" /></td></tr>"
        html+="</table>"
        html+="</li>";
        html+="<li>"+Lang["Common_15"]+""+UserLevel[CityInteriorInfo.Level-1]+"</li>";
        html+="<li>"+Lang["Common_16"]+"</li>";
        html+="<li><img style=\"margin-right:5px;\" src=\""+src+"\" /><span id=\"remainres\">0</span></li>";
        html+="</div>";             
        html+="<div class=\"popup_button\">";
        html+="<a href=\"#\" onmousedown=\"QuickGetMallRes("+resType+")\">["+Lang["Common_17"]+"]</a>";
        html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDoMall(this.id)>["+Lang["Common_18"]+"]</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("otherpopup");
        tree.innerHTML=html;    
        html=null;
        var maxnum;
        var num1;
        num1 = Math.floor(levelres/levelper);
        maxnum=Math.min(num1,gold);
        totalres=maxnum*levelper;
        $("#totalres").text(totalres);
        $("#remainres").text(levelres);
        $("#input_getgold").val(maxnum);
        $("#otherpopup").show();
        $("#otheroverlay").show();
        ChangeInputGold();
    }
    else
    MallNeedGold();
}

//购买资源
function QuickGetMallRes(type)
{
    var goldnum=$("#input_getgold").val();
    //调用快速购买资源函数
    Main.GoldBuyRes(CityID,type,goldnum,cb_GoldMallBuyRes); 
    $("#otherpopup").hide();
    $("#otheroverlay").hide(); 
}

function cb_GoldMallBuyRes(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        NeedUpdate=true;
        Main.GetCommoditysByType(CityID,MallItemType,cb_GetCommoditysByType);    
    }
    if(result.value==30121) 
    PopUpMallMessageBox(Lang["Common_19"]); //金钱超过上限
    if(result.value==30123) 
    PopUpMallMessageBox(Lang["Common_20"]); //粮食超过上限
    if(result.value==30125) 
    PopUpMallMessageBox(Lang["Common_21"]); //人口超过上限
}
