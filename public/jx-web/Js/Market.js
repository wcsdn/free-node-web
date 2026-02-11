/*
    市场页
    借用物品页的已有函数
*/

var FindWord="";
var OrderBy=0;
var OrderType=0; 

function CreateMarketPage()
{
    CreateItemPage();
}

//搜索
function SearchMarketItem()
{
    ViewItemPage=1;
    FindWord=$("#item_findword").val();
    FreshMarketPage();
}

//刷新市场页
function FreshMarketPage()
{
    if(FindWord=="")
        Main.GetSellItemNum(ViewItemType+1,cb_GetMarketItemNum);
    else
        Main.GetSellItemNumByItemName(ViewItemType+1,FindWord,cb_GetMarketItemNum);
}

function cb_GetMarketItemNum(result)
{
    if(DataValidate(result)==false) return;
    
    //刷新物品页物品数量信息
    //$("#item_count").text(result.value[0]);
    ViewItemMaxPage=result.value[1];
    $("#nowpage").text(ViewItemPage);
    $("#maxpage").text(ViewItemMaxPage);
    
    //请求获得物品列表
    if(FindWord=="")
        Main.GetSellItemByType(ViewItemType+1,ViewItemPage, OrderBy, OrderType,cb_GetItemByType);
    else
        Main.GetSellItemByItemName(ViewItemType+1,ViewItemPage, FindWord, OrderBy, OrderType,cb_GetItemByType)         
}

function ItemSeller()
{
    NewMail(TheItemInfo.UserName);
}

function ItemBuy()
{
     ShowPopUp("market_35");
     $("#item_buy_pay").text(TheItemInfo.Price);
}

function ChangeOrderBy(by)
{
    DataTranslateBegin();
    ViewItemPage=1;
    OrderBy=by;
    if(OrderType==0)
        OrderType=1;
    else
        OrderType=0; 
    if(PageNum==9)       
        FreshMarketPage();
    else
        FreshItemPage(false);    
}

//更换内政背景图
function ChangeBackgroundImg(id)
{
    var gold=CityInteriorInfo.Gold;
    var t=id.split("_");
    var index=parseInt(t[1]);
    if(gold-100<0 && index!=1)
    {
        ShowPopUp("pop_25");
    }
    else
    {
        DataTranslateBegin();
        Main.UpdateBackImage(CityID,index,cb_UpdateBackImage);
    }
}

function cb_UpdateBackImage(result)
{
    if(DataValidate(result)==false) return false;
    if(result.value==0)
    {   
        HidePopUp(); 
        //Main.GetMapUnitInfo(CityID,1,0,cb_GetMapUnitInfo);//请求内政地图单元数据
        window.location.reload();             
    }
    else if(result.value=30116)
    {
        ShowMessageBox(Lang["Market_1"]);
        DataTranslateEnd(); 
    }
    else
    DataTranslateEnd(); 
}
