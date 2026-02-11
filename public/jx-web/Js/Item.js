/*
    物品页
    (包含实现部分市场页功能)
*/
var FreshCII;
var ViewItemType = 0;//0=消耗品 1=武器 2=防具 3=饰品,4=材料
var ViewItmeTypeName = new Array(Lang["Item_1"],Lang["Item_2"],Lang["Item_3"],Lang["Item_4"],Lang["Item_5"],Lang["Item_6"],"战场道具"); 
var ViewItmeStatus =new Array(Lang["Item_7"],Lang["Item_8"],Lang["Item_9"],Lang["Item_10"],Lang["Item_11"],"出战携带","防守携带");
var ViewItemPage = 1;
var ItemNum=0;
var GetMoney=0;
var GetFood=0;
var GetMen=0;
var GetGold=0;
var GetValue=0;//使用道具获得经验
var GetMessage=""; 

function CreateItemPage()
{
    InChoiceItem=false;

    var html="";
    html+="<div id=\"itemtype\" >";       
    html+="<table width=\"536\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    html+="<tr>";
    html+="<td class=\"table_pad\" width=\"60\" height=\"29\"><a id=\"itemtype_0\" onmouseover=\"ShowTips(event,'common_1_49')\" onmouseout=\"HideTips()\" class=\"linkstyle_2\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_1"]+"</a></td>";
    html+="<td width=\"48\"><a id=\"itemtype_1\" onmouseover=\"ShowTips(event,'common_1_50')\" onmouseout=\"HideTips()\" class=\"linkstyle_1\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_2"]+"</a></td>";
    html+="<td width=\"48\"><a id=\"itemtype_2\" onmouseover=\"ShowTips(event,'common_1_51')\" onmouseout=\"HideTips()\" class=\"linkstyle_1\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_3"]+"</a></td>";
    html+="<td width=\"48\"><a id=\"itemtype_3\" onmouseover=\"ShowTips(event,'common_1_52')\" onmouseout=\"HideTips()\" class=\"linkstyle_1\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_4"]+"</a></td>";
    html+="<td width=\"48\"><a id=\"itemtype_4\" class=\"linkstyle_1\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_5"]+"</a></td>";
    if(PageNum==4)
    {
        html+="<td class=\"table_pad\" width=\"70\"><a id=\"itemtype_5\" class=\"linkstyle_3\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">"+Lang["Item_6"]+"</a></td>";
        //html+="<td width=\"129\">&nbsp;</td>";
    }
    if(ChessIsOpen==1 && PageNum==4)
    html+="<td class=\"table_pad\" width=\"70\"><a id=\"itemtype_6\" class=\"linkstyle_3\" onmousedown=\"ChangeItemType(this.id)\" href=\"#\">战场道具</a></td>";
    if(PageNum==9)
    {
        html+="<td width=\"133\">";
        html+="<input id=\"item_findword\" type=\"text\" onkeydown=\"var e=window.event || arguments[0];if(e.keyCode==13){SearchMarketItem();}\" maxlength=\"20\" class=\"input_searchitem\"/>";	
        html+="</td>";
        html+="<td width=\"48\"><a href=\"#\" class=\"linkstyle_1\" onmousedown=\"SearchMarketItem()\">"+Lang["Item_12"]+"</a></td>";
    }
    else
    {
        html+="<td width=\"130\" align=\"right\">"+Lang["Item_13"]+":</td>";
        html+="<td width=\"50\" align=\"center\"><div id=\"item_num\"><span class=\"font_bold\" id=\"item_num\">0</span>/<span class=\"font_bold\">"+CityInteriorInfo.MaxItemNum+"</span></div></td>";
    }
    html+="</tr>";
    html+="</table>";
    html+="</div>";
    html+="<div id=\"itemtitle\" >";
    html+="</div>"
    html+="<div id=\"items\">";
    html+="</div>";
    html+="<div id=\"pagefoot\">";
    html+="</div>"
    
    //$("#mainpic").html(html);
    var tree=document.getElementById("mainpic");
    tree.innerHTML=html;
        
    html=null;
    CreateItemFoot();               
}


function CreateItemFoot()
{
    var html="";
    
    html+="<table width=\"536\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    html+="<tr>";
    html+="<td width=\"100\" align=\"left\" valign=\"middle\" >"
    {
        html+="<td width=\"20\">"+Lang["Item_14"]+"</td>";
        html+="<td width=\"20\">";
        html+="<input id=\"gotopagenum\" type=\"text\" maxlength=\"4\" style=\"width:40px; height: 12px;\" />";	
        html+="</td>";
        html+="<td width=\"20\">"+Lang["Item_15"]+"</td>";
        html+="<td width=\"80\"><a href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_66')\" onmouseout=\"HideTips()\" onmousedown=\"GotoItemPage()\">"+Lang["Item_16"]+"</a></td>";
    }
    html+="</td>"; 
    html+="<td width=\"136\" align=\"right\" valign=\"middle\" >";
    html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_53')\" onmouseout=\"HideTips()\" onmousedown=\"TurnItemPage(true)\">"+Lang["Item_17"]+"</a>";    
    html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_54')\" onmouseout=\"HideTips()\" onmousedown=\"TurnItemPage(false)\">"+Lang["Item_18"]+"</a></td>";
    html+="</td>"
    html+="<td width=\"100\" align=\"right\">";
    html+="<span id=\"nowpage\" >0</span>/<span id=\"maxpage\">0<span>";
    html+="</td>";
	html+="</tr>";
	html+="</table>";
	
    //$("#pagefoot").html(html);
    var tree=document.getElementById("pagefoot");
    tree.innerHTML=html;    
    html=null;
}

function CreateItemTitle()
{
   
   //标记当前类型
   var s="#itemtype_"+ViewItemType;
   $(s).css({"font-weight":"bold","text-decoration":"underline"})
    
   var html="";
   
   html+="<table height=\"23px\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
   html+="<tr>"; 
   html+="<td width=\"48px\" align=\"center\" valign=\"middle\">"+ViewItmeTypeName[ViewItemType]+"</td>";
   if(PageNum==4)
   html+="<td width=\"170px\" align=\"center\" valign=\"middle\">"+Lang["Item_19"]+"</td>";
   else
   html+="<td width=\"110px\" align=\"center\" valign=\"middle\">"+Lang["Item_19"]+"</td>";
   if(PageNum==3)
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_20"]+"</td>";
   else    
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\"><a style=\"color:#35c235\" href=\"#\" onmousedown=\"ChangeOrderBy(1)\">"+Lang["Item_20"]+"</a></td>";
   if(ViewItemType==2)
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_21"]+"</td>";
   if(ViewItemType==1 || ViewItemType==2)
       html+="<td width=\"60px\" align=\"center\" valign=\"middle\">"+Lang["Item_22"]+"</td>";        
   if(ViewItemType==1 || ViewItemType==2 || ViewItemType==3)
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_23"]+"</td>";
   if(ViewItemType==1)     
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_24"]+"</td>";
   if(ViewItemType==2)
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_25"]+"</td>";
   if(ViewItemType==3)
   {
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_26"]+"</td>";
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_27"]+"</td>";
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_28"]+"</td>";
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+Lang["Item_29"]+"</td>";
   }
   if(PageNum==4)
       html+="<td width=\"48px\" align=\"center\" valign=\"middle\">"+Lang["Item_30"]+"</td>";
   if(PageNum==9)
   {    
       html+="<td width=\"100px\" align=\"center\" valign=\"middle\">"+Lang["Item_31"]+"</td>";
       html+="<td width=\"40px\" align=\"center\" valign=\"middle\"><a style=\"color:#35c235\" href=\"#\" onmousedown=\"ChangeOrderBy(2)\">"+Lang["Item_32"]+"</a></td>" 
   }
   html+="</tr>";
   html+="</table>";
   //$("#itemtitle").html(html);
   var tree=document.getElementById("itemtitle");
   tree.innerHTML=html;
   html=null;    
}


function CreateItemList()
{
    var html="";
    var item;
    var item_title;
    var i=0;
    haveZPItem=0;
    haveXLItem=0;
    //DataTranslateEnd();
    if(ItemInfo==null)
    {
        if(PageNum==3)
            html+="<br><br><span class=\"no_item\">"+Lang["Item_33"]+"</span>";
        else
            html+="<br><br><span class=\"no_item\">"+Lang["Item_34"]+"</span>";
    }
    if(ItemInfo!=null)
    {
        html+="<table height=\"25px\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
        while(ItemInfo[i]!=null)
        {
            item=ItemInfo[i];
        
            html+="<tr class=\"tr_item\" >"; 
//            if(item.UseUnion>0)
//            {
//                item_title="["+UnionName[item.UseUnion]+"]";
//            }
//            else
            item_title="";
            item_title+=item.Name;
            if(InChoiceItem==true)
            {
                html+="<td width=\"48px\" height=\"40px\" align=\"center\" valign=\"middle\"><img id=\"itemimage_"+item.ID+"\" class=\"item_image\" src=\""+PicPath+item.Image+"\" width=\"36\" height=\"36\"  onmousedown=\"PouUpChoiceItemOK("+i+")\" /></td>"
                html+="<td width=\"110px\" align=\"center\" valign=\"middle\"><a id=\"itemname_"+item.ID+"\" class=\"hquality_"+item.Quality+"\" href=\"#\" onmousedown=\"PouUpChoiceItemOK("+i+")\">"+item_title+"</a></td>";
            }
            else
            {
                html+="<td width=\"48px\" height=\"40px\" align=\"center\" valign=\"middle\"><img id=\"itemimage_"+item.ID+"\" class=\"item_image\" src=\""+PicPath+item.Image+"\" width=\"36\" height=\"36\"  onmousedown=\"OpenItem("+i+")\" /></td>"
                if(PageNum==4)
                {
                    if(item.SellFlag==0)
                    html+="<td width=\"170px\" align=\"center\" valign=\"middle\"><a id=\"itemname_"+item.ID+"\" href=\"#\" class=\"hquality_"+item.Quality+"\" onmousedown=\"OpenItem("+i+")\">"+item_title+"</a></td>";
                    else
                    html+="<td width=\"170px\" align=\"center\" valign=\"middle\"><a id=\"itemname_"+item.ID+"\" href=\"#\" class=\"hquality_"+item.Quality+"\" onmousedown=\"OpenItem("+i+")\">"+item_title+"(<span class=\"font_black\">"+Lang["Item_35"]+"</span>)</a></td>";
                }
                else
                html+="<td width=\"110px\" align=\"center\" valign=\"middle\"><a id=\"itemname_"+item.ID+"\" href=\"#\" class=\"hquality_"+item.Quality+"\" onmousedown=\"OpenItem("+i+")\">"+item_title+"</a></td>";
            }
            if(ViewItemType==0)
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.Level+"</td>";
            else
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.UseLevel+"</td>";
            if(ViewItemType==2)
            {
                var sex_name=Lang["Item_36"];
                if(item.UseSex==1)
                    sex_name=Lang["Item_37"];
                if(item.UseSex==2)
                    sex_name=Lang["Item_38"];      
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+sex_name+"</td>";
            }
            if(ViewItemType==1 || ViewItemType==2)
            {
                html+="<td width=\"60px\" align=\"center\" valign=\"middle\">"+UnionName[item.UseUnion]+"</td>";
            }
            if(ViewItemType==1 || ViewItemType==2 || ViewItemType==3)
            {
                if(item.Durability==0)
                    html+="<td width=\"40px\" align=\"center\" valign=\"middle\"><span class=\"font_red\">"+item.Durability+"/"+item.HitPoint+"</span></td>";
                else
                    html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.Durability+"/"+item.HitPoint+"</td>";
            }       
            if(ViewItemType==1)     
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.Attack+"</td>";
            if(ViewItemType==2)
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.Defence+"</td>";
            if(ViewItemType==3)
            {
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.LR+"</td>";
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.FR+"</td>";
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.CR+"</td>";
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.DR+"</td>";
            }
            if(PageNum==4)
            {            
                html+="<td width=\"48px\" align=\"center\" valign=\"middle\">"+ViewItmeStatus[item.State-1]+"</td>";
            }
            if(PageNum==9)
            {
                html+="<td width=\"100px\" align=\"center\" valign=\"middle\">"+item.UserName+"</td>";
                html+="<td width=\"40px\" align=\"center\" valign=\"middle\">"+item.Price+"</td>" 
            }   
            html+="</tr>";
        
            if(item.m_heroID!=0)
                haveZPItem=1;
            if(item.HitPoint!=item.Durability)                
                haveXLItem=1;
            i++;
        }
        html+="</table>"; 
        html+=HtmlImg("img_select_4","img_select",PicPath+PicSelect4);
    
       if(PageNum==3 && (ItemInfo.length>=10 || ViewItemPage>1))
        {
          html+="<table width=\"360\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
          html+="<tr>";
          html+="<td width=\"260\" align=\"right\" valign=\"middle\" >";
          html+="</td>"
          html+="<td width=\"50\" align=\"right\">";
          if(ViewItemPage>1)
              html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_54')\" onmouseout=\"HideTips()\" onmousedown=\"TurnHeroItemPage(1)\">"+Lang["Item_39"]+"</a></td>";
          html+="</td>";
          html+="<td width=\"50\" align=\"right\">";
          if(ItemInfo.length>=10)
              html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_54')\" onmouseout=\"HideTips()\" onmousedown=\"TurnHeroItemPage(2)\">"+Lang["Item_40"]+"</a></td>";
          html+="</td>";
	      html+="</tr>";
	      html+="</table>";
        }
    }
    
    //$("#items").html(html);
    var tree=document.getElementById("items");
    tree.innerHTML=html;
    html=null;    
    Teacher_Open();   
}

//刷新物品页
function FreshItemPage(all)
{
    FreshCII=all;
    if(PageNum==9)
    {
        FreshMarketPage();
    }
    else
    {
        Main.GetItemNum(CityID,ViewItemType+1,cb_GetItemNum);
    }
}

function cb_GetItemNum(result)
{
    if(DataValidate(result)==false) return;
    
    //刷新物品页物品数量信息
    ItemNum=result.value[0];
    var MaxItemNum=CityInteriorInfo.MaxItemNum;
    if(ItemNum<MaxItemNum)
        var html="<span class=\"font_bold\">"+ItemNum+"</span>/<span class=\"font_bold\">"+MaxItemNum+"</span>";
    else
        var html="<span class=\"font_red_blod\">"+ItemNum+"</span>/<span class=\"font_red_blod\">"+MaxItemNum+"</span>"; 
    $("#item_num").html(html);
    ViewItemMaxPage=result.value[1];
    $("#nowpage").text(ViewItemPage);
    $("#maxpage").text(ViewItemMaxPage);
    
    //请求获得物品列表
    Main.GetItemByType(CityID,ViewItemType+1,ViewItemPage,OrderBy,OrderType,cb_GetItemByType);
}

function cb_GetItemByType(result)
{
    if(DataValidate(result)==false) return;
    
    ItemInfo=result.value;
    if(ItemInfo!=null && ItemInfo[0].ID==-1)
        ItemInfo=null;
    
    CreateItemTitle();
    CreateItemList();  

    if(FreshCII)
    {
        FreshCII=false;
        
            Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);
    }
    else
    {
        
            Main.GetValidEvent(CityID,cb_GetValidEvent);
    }
}

//改变列表类型
function ChangeItemType(id)
{ 
    //取消标记之前类型
    var s="#itemtype_"+ViewItemType;
    $(s).css({"font-weight":"normal","text-decoration":"none"})
    
    //取消关键字搜索
    FindWord="";
    $("#item_findword").val("");
    
    var t=id.split("_");
    ViewItemType=parseInt(t[1]);
    ViewItemPage=1;
    
    //刷新显示物品列表
    FreshItemPage(false);
}

//翻页
function TurnItemPage(forward)
{
    DataTranslateBegin();
    if(forward==true)
    {
        //向左翻
        if(ViewItemPage<=1)
        {
            DataTranslateEnd();
            return;
        }
        ViewItemPage--;
    }
    else
    {
        //向右翻
        if(ViewItemPage>=ViewItemMaxPage)
        {
            DataTranslateEnd();
            return;
        }
        ViewItemPage++;
    }

    //刷新显示物品列表
    FreshItemPage(false);
}

//跳页
function GotoItemPage()
{
    var page=$("#gotopagenum").val();
    var r=IsInteger(page);
    if(r!=0)
    {
        if(r==1)
            ShowMessageBox(Lang["Item_41"]);
        else
            ShowMessageBox(Lang["Item_42"]);
        return;
    }
    if(page>=1 && page<=ViewItemMaxPage)
    {
        ViewItemPage=page;
        //刷新显示物品列表
        FreshItemPage(false);
    }   
     $("#gotopagenum").val("");
}

//打开物品
function OpenItem(index)    //修改为从内存列表中获得信息,取消之前的网络信息请求指令
{
    var html="";
   
    if(ItemInfo!=null && ItemInfo[index]!=null)
    {
        //显示选中框
        var left=10;
	    var top=53+index*40;
        $("#img_select_4").css({"left":left,"top":top});
        $("#img_select_4").show();
        var nodeType=NodeTheItem;
        TheItemInfo=ItemInfo[index];
        html+=HtmlTreeNode(TheItemInfo,nodeType,0);

        HideEventList();
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        html=null;
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
            
        //开启第1个标签
        OpenTheFirstNode();
        var userName = ItemInfo[index].UserName;
        Main.GetUserSub(userName,cb_GetUserSubFromItem);
    }
}

function cb_GetUserSubFromItem(result)
{
    if(DataValidate(result)==false) return;
    UserSubInfo=result.value;
    if(UserSubInfo!=null && UserSubInfo.Age==-1)
    UserSubInfo=null;  
}

function ItemTake()
{
     InChoiceHero=true;
     ShowPopUp("item_38");
     //Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息
     Main.GetCanUseHero(CityID,TheItemInfo.UseLevel,TheItemInfo.UseSex,TheItemInfo.UseUnion,cb_GetCityHero);
}
         
function ItemUsed()
{
     if(TheItemInfo.UseType==2)
     {   
        ShowPopUp("item_37");  
        $("#item_name").text(TheItemInfo.Name);
        $("#item_use_pay").text(TheItemInfo.UseGold);
     }
     else if(TheItemInfo.UseType==4)
     {
        ShowPopUp("item_101");  
        $("#feastitem_name").text(TheItemInfo.Name);
        $("#feastitem_use_pay").text(TheItemInfo.UseGold);
     }
     else if(TheItemInfo.UseType==3)
     {
        DataTranslateBegin();
        GetMoney=TheItemInfo.GetMoney;
        GetFood=TheItemInfo.GetFood;
        GetMen=TheItemInfo.GetMen;
        GetGold=TheItemInfo.GetGold;
        GetMessage=Lang["Item_43"];//获得资源
        Main.UseItemRes(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
     } 
     else if(TheItemInfo.UseType==5 || TheItemInfo.UseType==15)
     {
         UseExpItemSign=true;
         ShowPopUp("item_38");
         GetValue=TheItemInfo.GetValue;
         if(GetValue==0)
         GetValue=1;
         GetMessage=Lang["Item_44"];//获得经验
         Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息
     }
     else if(TheItemInfo.UseType==6)
     {
         UseSkillBookSign=true;
         ShowPopUp("item_38");
         GetMessage=Lang["Item_45"];//获得技能
         Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息
     }
     else if(TheItemInfo.UseType==7)
     {
         UseSkillPillSign=true;
         ShowPopUp("item_38");
         Main.GetHeroBySkillLevel(CityID,TheItemInfo.Level,cb_GetCityHero);//请求可使用此道具(药丸)侠客信息
     }
     else if(TheItemInfo.UseType==8)
     {
        UseSkillExpSign=true;
        ShowPopUp("item_38");
        GetValue=TheItemInfo.GetValue;
        GetMessage=Lang["Item_46"];//获得技能经验
        Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息
     }
     else if(TheItemInfo.UseType==14)//战勋道具
     {
        UseSkillExpSign=true;
        GetMessage=Lang["PopUp_225"];
        Main.UseItemInsignia(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
     }
     else
        ShowMessageBox(Lang["Item_47"]);  
}

function ItemSell()
{
     ShowPopUp("item_32"); 
}

function ItemRepair()
{
    //Main.RepairItem(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
    ShowPopUp("item_42");
}

function CommonItemRepair()
{
    Main.RepairItemGeneral(CityID,TheItemInfo.ID,cb_PouUpItemCommand)
}

function ItemTakeOff()
{
    ShowPopUp("item_43");
}
function ItemDonate()
{
     ShowPopUp("item_33"); 
     
     $("#item_name").text(TheItemInfo.Name);
     $("#item_sell_money").text(TheItemInfo.SellMoney);
     $("#item_sell_food").text(TheItemInfo.SellFood);
}
function ItemCancleSell()
{
     Main.CancleSellItem(CityID,TheItemInfo.ID,cb_ItemOptReturn);
}

function cb_ItemOptReturn()
{
     FreshItemPage(false);
}

function TurnHeroItemPage(type)
{
    var page=ViewItemPage;
    if(type==1 && ViewItemPage<=1)
        return;
    else if(type==1)    
        page--;
    else
        page++;    
    
    ViewItemPage=page;
    
    DataTranslateBegin();
    Main.GetItemCanUse(CityID,ViewItemType+1,TheHeroInfo.Level,TheHeroInfo.Sex,TheHeroInfo.Junta,ViewItemPage,cb_GetItemByType);
   
}
var NumName = new Array(Lang["Item_48"],Lang["Item_49"],Lang["Item_50"],Lang["Item_51"],Lang["Item_52"],Lang["Item_53"],Lang["Item_54"],Lang["Item_55"],Lang["Item_56"],Lang["Item_57"]);
var DatumName = new Array(Lang["Item_58"],Lang["Item_59"],Lang["Item_60"]);

//道具分解
function ItemDecompose()
{
    ShowPopUp("item_47");
    $("#item_name").text(TheItemInfo.Name);
    var s="";
    s=TheItemInfo.DisassembleName;
    /*
    if(TheItemInfo.SellFlag==1)
    {
        s=NumName[TheItemInfo.Level-1]+Lang["Item_61"]+DatumName[TheItemInfo.Quality-2]
    }
    else
        s=Lang["Item_62"];
    */
    $("#item_get_name").text(s);
}

//侠客归隐
function HeroToExp(itemId) {
    var result=Main.HeroExpToItem(CityID,TheHeroInfo.ID,itemId);
    if(DataValidate(result)==false) return; 
    if(result.value!=0)
    {
        PopUpNotDoMall();        
        if(result.value==-2)
            ShowMessageBox(Lang["Tips_331"]);                     
        else 
            ShowMessageBox(Lang["PopUp_80003"]);
        $(".common_popup").css("width","200px");
        $(".common_popup").css("height","96px");
        $(".common_popup1").css("width","196px");
        $(".common_popup1").css("height","82px");
        $(".common_popup2").css("width","169px");
        $(".common_popup2").css("height","59px");
        $(".common_popup2").css("margin-left","13px");
    }
    else
    {  
         PopUpNotDoMall();
         HidePopUp();
         //刷新物品列表
         FreshItemPage(true);
         var res=Main.GetItemName(itemId);
         if(DataValidate(res)==false) return;
         if (res.value!="") {
            ShowMessageBox(Lang["PopUp_80001"].replace("ITEMNAME",res.value));  
         }
    }
}