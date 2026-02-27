
var EventObjType = new Array(Lang["Event_1"],Lang["Event_2"],Lang["Event_3"],Lang["Event_4"],Lang["Event_5"],Lang["Event_6"],Lang["Event_7"]);
//1=建造.2=快速建造.3=升级.4=快速建造.5=拆除.6=寻访 7=恢复.8=离开.9=训练.10=征兵.11=攻击.12=支援.13=返回.14=探索.15=收集任务

var EventActionType = new Array(Lang["Event_8"],Lang["Event_9"],Lang["Event_10"],Lang["Event_11"],Lang["Event_12"],Lang["Event_13"],Lang["Event_14"],Lang["Event_15"],Lang["Event_16"],Lang["Event_17"],Lang["Event_18"],Lang["Event_19"],Lang["Event_20"],Lang["Event_21"],Lang["Event_22"],Lang["Event_23"],Lang["Event_24"],Lang["Event_25"],"","","","",Lang["Event_26"],Lang["Event_27"],Lang["Event_28"],Lang["Event_45"],Lang["Tree_128"],Lang["Tree_137"],"瞬间建造","瞬间升级");

var EventState = new Array(Lang["Event_29"],Lang["Event_30"]);


//事件列表状态 1=展开状态 2=闭合状态
var EventListState = 1;

//事件队列最大数
var EventQueueNum = new Array(2,5,10000);

//军团状态 1=处于攻击/支援/驻守行军途中 2=处于返回状态
var CanReturnSign = 0;

var TargetCityName="";
var CropsNeedTime=0;


//获得事件列表
function cb_GetValidEvent(result)
{
    if(DataValidate(result)==false) return;
        
    EventInfo=result.value;
    if(EventInfo!=null && EventInfo.length > 0 && EventInfo[0].ID==-1)
        EventInfo=null;    
          
    ShowEvent();
    
    ShowEventMapUnit();//显示事件地图布局
      
    UpdateControlTarget();//更新当前控制对象
    
    PageInitState=1;//页面初始化完毕
    
    Main.GetPersistEffectGroup(CityID,cb_GetPersistEffectGroup);
    
    Main.KickUser(); 
    IsFlash==0;
    
    HasCanQuickReturn();
    
    HideTips();
}

//持续状态
function cb_GetPersistEffectGroup(result)
{
    if(DataValidate(result)==false) return false;
    PersistEffectGroupInfo=result.value;
    if(PersistEffectGroupInfo!=null && PersistEffectGroupInfo.length > 0 && PersistEffectGroupInfo[0].EffectID==-1)
    PersistEffectGroupInfo=null;
    if(PersistEffectGroupInfo!=null && PersistEffectGroupInfo.length > 0)
    {
        CreateVipEffect();
    }
    else
    {
        var html="";
        var tree = document.getElementById("vipeffect");
        tree.innerHTML=html; 
    }
    Main.GetOverEffectArray(cb_GetOverEffectArray);
    //Main.GetCityInteriorInfo(CityID,cb_EffectUpdate);
}

//过期状态
function cb_GetOverEffectArray(result)
{
  if(DataValidate(result)==false) return false;
  OverdueEffectFlagInfo=result.value;
  if(OverdueEffectFlagInfo!=null && OverdueEffectFlagInfo.length > 0 && OverdueEffectFlagInfo[0].Flag==-1)
  OverdueEffectFlagInfo=null;
  if(OverdueEffectFlagInfo!=null && OverdueEffectFlagInfo.length > 0)
  ShowOverInfoPop();
  Main.GetCityInteriorInfo(CityID,cb_EffectUpdate);
}

//过期效果弹出提示
function ShowOverInfoPop()
{
    var html="";
    var left=GetLeftValue(208);
    $("#popup").css("left",left);
    $("#popup").css("top","178px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.GIF\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<ul>"; 
    for(var i=0;i<OverdueEffectFlagInfo.length;i++)
    {
        var losttype;
        var losttime;
        losttime=OverdueEffectFlagInfo[i].EndTime;
        losttype=OverdueEffectFlagInfo[i].MainEffectType;
        html+="<li>"+Lang["Event_31"]+"<b>"+MainEffectName[losttype-1]+"</b></li>";
        html+="<li>"+Lang["Event_32"]+" "+losttime+" "+Lang["Event_33"]+"</li>";
    }
    html+="</ul>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a  href=\"#\" onmousedown=PopUpNotDo(\"0\")>["+Lang["Event_34"]+"]</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","208px")
    $(".common_popup").css("height","244px")
    $(".common_popup1").css("width","204px")
    $(".common_popup1").css("height","230px")
    $(".common_popup2").css("width","184px")
    $(".common_popup2").css("height","198px")
    $(".common_popup2").css("margin-left","8px")
    $("#popup").show();
    $("#overlay").show();
}

//更新资源+
function cb_EffectUpdate(result)
{
    if(DataValidate(result)==false) return;
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
    // 刷新用户战勋值 - 使用全局变量 UserInfo
    if (UserInfo && UserInfo.Insignia !== undefined) {
        $("#userIns").html(UserInfo.Insignia.toString());
    }
    DataTranslateEnd();//数据传输完毕;
}

//创建vip效果html
function CreateVipEffect()
{
    var html="";
    var effect;
    var i=0;
    while(PersistEffectGroupInfo!=null && PersistEffectGroupInfo[i]!=null)
    {
        effect=PersistEffectGroupInfo[i];
        if(effect.MainEffectType==6)
        html+="<img style=\"cursor:pointer;\" id=\"effect_"+i+"_"+effect.MainEffectType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips(this.id)\" onmousedown=\"PopUpCancelEffect(this.id)\" src=\"img/"+effect.Image+"\" />";
        else
        html+="<img id=\"effect_"+i+"_"+effect.MainEffectType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips(this.id)\" src=\"img/"+effect.Image+"\" />";
        
        if(effect.MainEffectType==1)
           IamVIP=true;
        
        i++;
    }
    var tree = document.getElementById("vipeffect");
    tree.innerHTML=html;     
}

//显示事件
function ShowEvent()
{                  
    $("#eventinfo").empty();
    $("#trees").empty(); 
    ShowEventTitle();
    ShowEventList();
}

//显示时间列表头
function ShowEventTitle()
{
    var html="";
    if(EventInfo!=null && EventInfo[0]!=null)
    {
       
        var eventCount= AddZero(EventInfo.length,3);
        var pic;
        if(EventInfo.length==1)
        {
            pic=PicPath+PicReduce;
           // html+="<img id=\"eventControl\" class=\"event_control\" src=\""+pic+"\" onmousedown=\"EventControl()\"/>"
        }
        else
        { 
            pic=PicPath+PicPlus;
           // html+="<img id=\"eventControl\" class=\"event_control\" src=\""+pic+"\" onmousedown=\"EventControl()\" title=\"展开\"/>"
        }
        html+=HtmlClickTipsImgControl("eventControl","event_control",pic,"EventControl()");
        html+="<div class=\"event_count\" id=\"eventCount\">["+eventCount+"]</div>"
        html+=HtmlEvent(0);   
    }
    //$("#eventinfo").html(html);
    var tree=document.getElementById("eventinfo");
    tree.innerHTML=html;
    html=null;     
}
//显示EventList
var EventImgTwo = "common_1_57";
function ShowEventList()
{  
    if(EventInfo!=null && EventInfo.length>1 && ControlTarget==1)
    {
        var html="";
        var i=1;
        while(EventInfo[i]!=null)
        {       
            html+=HtmlEvent(i);
            i++;              
        } 
        $("#trees").html(html); 
        EventListState=1;
        $("#eventControl").attr("src",PicPath+PicReduce);
       // $("#eventControl").attr("title","收起");
       //$("#eventControl").attr("onmouseover","ShowTips(event,'common_1_57')");
        EventImgTwo = "common_1_57";
       // alert(EventImgTwo);
        ClickPos=0;
        ClickHeroIndex=-1;
        html=null;
    }
 
}

//空地是否有事件
function HasEventBuilding(pos)
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].EventType==PageNum && EventInfo[i].EventPos==pos)
            {   
                eventIndex=i;
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//英雄是否有事件
function HasEventHero(id)
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ObjID==id && EventInfo[i].ObjType==4)
            {   
                eventIndex=i;
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//是否有召回军团事件
function HasEventReturn()
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==13)
            {   
                eventIndex=i;
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//判断军团是否有进攻/支援/驻守/返回事件
function HasCanQuickReturn()
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==11 || EventInfo[i].ActionType==12 || EventInfo[i].ActionType==16 || EventInfo[i].ActionType==28 )
            {   
                eventIndex=i;
                CanReturnSign=1;//是否显示取消军团事件标志
                break;
            }
            if(EventInfo[i].ActionType==13)
            {
                eventIndex=i;
                CanReturnSign=2;//是否显示快速召回标志
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//闭关修炼侠客事件index
function HasAutoExp()
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==23 && EventInfo[i].ObjID==TheHeroInfo.ID)
            {   
                eventIndex=i;
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//是否已经有搜索事件
function HasEventSerach()
{
    var eventIndex=-1;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==14)
            {   
                eventIndex=i;
                break;
            }
            i++;
        }
    }   
    return eventIndex;
}

//收集日常任务事件个数
function GetTaskEventNum()
{
    var num=0;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==15 && EventInfo[i].RemainTime>0)
            {   
                num++;
            }
            i++;
        }
    }   
    return num;
}

//寻访名匠任务个数 
function GetComposeTaskEventNum()
{
    var num=0;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==24 && EventInfo[i].RemainTime>0)
            {   
                num++;
            }
            i++;
        }
    }   
    return num;
}

function HasCropsEvent()
{
    var num=0;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ObjType==5)
            {   
                num++;
            }
            i++;
        }
    }   
    return num;
}

//隐藏EventList
function HideEventList()
{
    if(EventInfo!=null && EventInfo.length>1)
    {
        DeleteEventList();
        EventListState=0;
        $("#eventControl").attr("src",PicPath+PicPlus);
        //$("#eventControl").attr("title","展开");
        //$("#eventControl").attr("onmouseover","ShowTips(event,'common_1_56')");
         EventImgTwo = "common_1_56";
        // alert(EventImgTwo);
    }
}

function DeleteEventList()
{
    if(ControlTarget==1)
        $("#trees").empty();
}

//控制EventList
function EventControl()
{  
    ControlTarget=1;  
    
    if(EventListState==1)
        HideEventList();
    
    else  
        ShowEventList();    
}


//创建单个event
function HtmlEvent(eventIndex)
{
     var html="";  
     if(EventInfo!=null && EventInfo[eventIndex]!=null)
     { 
        var eventObj=EventInfo[eventIndex];

        if(eventIndex==0)
            html+="<ul class=\"event_ul_title\" id=\"event_ul_"+eventIndex+"\">";
        else
            html+="<ul class=\"event_ul_list\" id=\"event_ul_"+eventIndex+"\">";
                
        if(eventObj.TargetCity==UserInfo.CityList[CityNum].Pos)
        {
            if(eventObj.ActionType==11 || eventObj.ActionType==12 || eventObj.ActionType==28 || eventObj.ActionType==21 || eventObj.ActionType==22)//征服玩家
            {
                html+="<li><span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span><span class=\"font_bold\">"+eventObj.FromCityName+"</span> "+Lang["Event_35"]+""+EventActionType[eventObj.ActionType-1]+""+Lang["Event_36"]+"</li>";
                html+="<li class=\"event_li\">"+Lang["Event_37"]+"<span class=\"font_bold\" id=\"remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span>　"+Lang["Event_38"]+" <span class=\"font_bold\">"+eventObj.OverTime+"</span> "+Lang["Event_39"]+""; 
            }
            else if(eventObj.ActionType==14)
            {
                html+="<li><span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span><span class=\"font_bold\">"+eventObj.FromCityName+"</span>"+Lang["Event_40"]+""+EventActionType[eventObj.ActionType-1]+""+Lang["Event_36"]+"</li>";
                html+="<li class=\"event_li\">"+Lang["Event_37"]+"<span class=\"font_bold\" id=\"remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span>　"+Lang["Event_38"]+" <span class=\"font_bold\">"+eventObj.OverTime+"</span> "+Lang["Event_41"]+""; 
            }
            else if(eventObj.ActionType==13)
            {
                html+="<li><span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span>"+Lang["Event_42"]+""+EventActionType[eventObj.ActionType-1]+""+Lang["Event_36"]+"</li>";
                html+="<li class=\"event_li\">"+Lang["Event_37"]+"<span class=\"font_bold\" id=\"remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span> "+Lang["Event_38"]+"<span class=\"font_bold\">"+eventObj.OverTime+"</span> "+Lang["Event_41"]+""; 
                html+="<img style=\"cursor:pointer\" src=\"img/5/1.GIF\" id=\"devent_"+eventObj.ActionType+"\" onmousedown=\"CannelEventNeedGold(this.id)\" />"; 
            }
        }        
        else　    
        {    
            if(eventObj.ActionType==14)
            {
                var x=Math.floor(eventObj.TargetCity%400);
                if(x==0)x=400;
                var y=(Math.floor((eventObj.TargetCity-1)/400)+1); 
                html+="<li>"+"<span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span>"+EventState[eventObj.State-1]+EventActionType[eventObj.ActionType-1]+" <span class=\"font_bold\">"+eventObj.ObjName+"</span>("+x+","+y+")";
            }
            else if(eventObj.ActionType==15 || eventObj.ActionType==24)
            {
                //html+="<li>"+EventObjType[eventObj.ObjType-1]+EventState[2]+EventActionType[eventObj.ActionType-1]+" <span class=\"font_bold\">"+eventObj.ObjName+"</span>";
                html+="<li>"+"<span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span>"+""+EventState[eventObj.State-1]+""+EventActionType[eventObj.ActionType-1]+"";
            }
            else if(eventObj.ActionType==13)
            {
                html+="<li>"+"<span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span>"+""+Lang["Event_42"]+""+EventActionType[eventObj.ActionType-1]+""+Lang["Event_36"]+"</li>";
            }
            else
            {
                html+="<li>"+"<span class=\"eventtype_"+eventObj.ObjType+"\">"+EventObjType[eventObj.ObjType-1]+"</span>"+EventState[eventObj.State-1]+EventActionType[eventObj.ActionType-1]+" <span class=\"font_bold\">"+eventObj.ObjName+"</span>";
                if(eventObj.ObjLevel>0)
                    html+=" "+eventObj.ObjLevel+""+Lang["Event_43"]+""+"</li>";
                else 
                    html+"</li>";
            }
            html+="<li class=\"event_li\">"+Lang["Event_37"]+"<span class=\"font_bold\" id=\"remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span> "+Lang["Event_38"]+"<span class=\"font_bold\">"+eventObj.OverTime+"</span> "+Lang["Event_41"]+"";  
            if(eventObj.State==2)
                html+=HtmlClickTipsImgCss("event_a_"+eventIndex+"_"+"1"+"_2","event_delete",PicPath+PicDelete,"ShowPopUp(this.id)");
            if(eventObj.ActionType==11 || eventObj.ActionType==12 || eventObj.ActionType==16 || eventObj.ActionType==13 || eventObj.ActionType==28)//征服玩家
                html+="<img style=\"cursor:pointer\" id=\"devent_"+eventObj.ActionType+"\" onmousedown=\"CannelEventNeedGold(this.id)\" src=\"img/5/1.GIF\" />";                 
        }
        html+="</li></ul>";    
     }
     return html;       
}

//显示事件单元布局
function ShowEventMapUnit()
{
                 
     var i=0;
     while(EventInfo!=null && EventInfo[i]!=null)
     {
         AddEventMapUnit(i)           
         i++;
     }      
}

var SinkerID="";
//根据事件添加地图单元
function AddEventMapUnit(eventIndex)
{  
    if(EventInfo!=null && EventInfo[eventIndex]!=null && EventInfo[eventIndex].EventType==PageNum)
    {
        var eventObj=EventInfo[eventIndex];
        var html="";
        if((eventObj.ActionType==1 || eventObj.ActionType==2 || eventObj.ActionType==29) && eventObj.ObjImg!=null)
        {         
            if(PageNum==1)
            {      
                var imgID="img_"+PageNum+"_"+eventObj.EventPos;
                var img="#"+imgID;
                html=HtmlImg(imgID,imgID,PicPath+eventObj.ObjImg);
                $(img).remove();
                $("#mainpic").append(html);           
                var areaID="#area_"+PageNum+"_"+eventObj.EventPos;
                $(areaID).attr("coords",InteriorAreaCoords_Full[eventObj.EventPos-1]);
               
            }
            if(PageNum==2)
            {
                var index=eventObj.EventPos-1;
                var left=((eventObj.EventPos-1)%DefenceWidth)*DefencePicSize;
                var top=Math.floor((eventObj.EventPos-1)/DefenceWidth)*DefencePicSize;                
                var id="defence_build_"+PageNum+"_"+index;
                var sId="#"+"defence_build_"+PageNum+"_"+index;
                var style="left:"+left+"px;top:"+top+"px;position:absolute;z-index:2;cursor:pointer;";
                var click="ClickMap(this.id)";
                html=HtmlClickTipsImgStyle(id,style,PicPath+eventObj.ObjImg,click);
                $(sId).remove();
                $("#map_2").append(html);
            }     
        }        
        //添加锤子...       
        if(eventObj.State==1 && ((eventObj.ObjType==1 && eventObj.ActionType!=6 && eventObj.ActionType!=27) || eventObj.ObjType==3))
        {
                                    
            if(PageNum==1)
            {
                SinkerID="#img_sinker";
                var css="img_sinker_"+eventObj.EventPos;
                html=HtmlImg("img_sinker",css,PicPath+PicSinker[PageNum-1]); 
                $(SinkerID).remove(SinkerID); 
                $("#mainpic").append(html);
               
            }
            if(PageNum==2)
            {                 
                 var index=eventObj.EventPos-1;
                 var id="defence_sinker_"+PageNum+"_"+index;
                 SinkerID="#"+id;                
                 var left=((eventObj.EventPos-1)%DefenceWidth)*DefencePicSize;
                 var top=Math.floor((eventObj.EventPos-1)/DefenceWidth)*DefencePicSize;      
                 var style="left:"+left+"px;top:"+top+"px;position:absolute;z-index:15;cursor:pointer;";
                 var click="ClickMap(this.id)";
                 html=HtmlClickTipsImgStyle(id,style,PicPath+PicSinker[PageNum-1],click);
                 $(SinkerID).remove(SinkerID); 
                 $("#map_2").append(html);                               
            }          
        }               
    }
    html=null;
}

//请求取消事件
var CanceledEventIndex=0;
function CancelEvent(id)
{
    DataTranslateBegin();
    var t=id.split("_");
    var i=parseInt(t[2],10);
    CanceledEventIndex=i;
    if(EventInfo!=null && EventInfo[i]!=null)
    {
        var eventObj=EventInfo[i];
        
        IsFlash=EventNeedFlash(eventObj.ObjType);    
        
        Main.DeleteEvent(CityID,eventObj.ID,cb_DeleteEvent)
        
        DataTranslateBegin();
    }
     
}


//获得取消事件结果
function cb_DeleteEvent(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {       
        DeleteTheEvent(CanceledEventIndex);
        
        if(IsFlash==0)
            Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);           
        else
            Main.GetCityInteriorInfo(CityID,cb_EventUpdate); 
    } 
    else
    {
        DataTranslateEnd();
        //window.location.reload(); 
    }     
}

function cb_EventUpdate(result)
{
    if(DataValidate(result)==false) return;

    CityInteriorInfo=result.value;
    if(CityInteriorInfo!=null)
    {
        $("#area").html(CityInteriorInfo.Area.toString());
        $("#areaRoom").html(CityInteriorInfo.AreaRoom.toString());
        $("#child").html(CityInteriorInfo.Child.toString());
        $("#bloom").html(CityInteriorInfo.Bloom.toString()); 
        $("#childRate").html(CityInteriorInfo.ChildRate.toString());
        $("#gold").html(CityInteriorInfo.Gold.toString());
        $("#money").html(CityInteriorInfo.Money.toString());
        $("#moneyRoom").html(CityInteriorInfo.MoneyRoom.toString());
        $("#food").html(CityInteriorInfo.Food.toString());
        $("#foodRoom").html(CityInteriorInfo.FoodRoom.toString());
        $("#men").html(CityInteriorInfo.Men.toString());
        $("#menRoom").html(CityInteriorInfo.MenRoom.toString());
        $("#moneySpeed").html(CityInteriorInfo.MoneySpeed.toString());
        $("#foodSpeed").html(CityInteriorInfo.FoodSpeed.toString());
        $("#menSpeed").html(CityInteriorInfo.MenSpeed.toString());
        $("#userLevel").html(UserLevel[CityInteriorInfo.Level-1]);     
    }
    
    Main.GetValidEvent(CityID,cb_GetValidEvent);       
}

//删除指定事件
function DeleteTheEvent(eventIndex)
{
     if(EventInfo!=null && EventInfo[eventIndex]!=null)
     {
        var eventObj=EventInfo[eventIndex];
        
        //删除事件相关地图单元
        DeleteEventMapUnit(eventObj);
        EventInfo.splice(eventIndex,1);
        DeleteEventList();          
     }
          
}

//根据事件删除地图单元
function DeleteEventMapUnit(eventObj)
{
    var pos=eventObj.EventPos;
    var state=eventObj.State;
    var actionType=eventObj.ActionType;
    
    if(actionType==1 || actionType==2 || actionType==5)
    {
        if(PageNum==1)
        {
            var sImg="#img_"+PageNum+"_"+pos;
            $(sImg).remove(); 
            //恢复区域热点
            var areaID="#area_"+PageNum+"_"+pos;
            $(areaID).attr("coords",InteriorAreaCoords_Empty[pos-1]);
        }
        else
        {
            var index=((Math.floor(eventObj.EventPos/30)-ViewNumY+1)*13+((eventObj.EventPos%30)-ViewNumX));
            var left=((eventObj.EventPos%30)-ViewNumX)*32;
	        var top=(Math.floor(eventObj.EventPos/30)-ViewNumY+1)*32;
            var id="#defence_build_"+PageNum+"_"+index;
            $(id).remove(); 
        }
    }
                         
    $("#SinkerID").remove();   
}

//添加事件
function AddBuildingEvent(actionType,objType,objID,pos)
{
    DataTranslateBegin(); 
    Main.AddBuildingEvent(CityID,actionType,objType,objID,pos,cb_AddEvent);
}

//添加快寻事件
function AddVisitEvent(actionType,objType,objID,pos,goldFlag)
{
    DataTranslateBegin(); 
    Main.AddVisitEvent(CityID,actionType,objType,objID,pos,goldFlag,cb_AddVisitEvent);
}


//添加军团事件
function AddCorpsEvent(actionType,objType,objID,pos)
{ 
    DataTranslateBegin(); 
    EventPopTemp=actionType+"_"+objType+"_"+objID+"_"+pos;
    if(actionType==11 || actionType==12 ||actionType==39 || actionType==48 || actionType==55 || actionType==59)
    {
        Main.GetCityNameByPos(pos,cb_GetCityNameByPos);//攻击/支援/驻守/搜索秘道/攻擂目标名字             
    }
    if(actionType==13)        
        Main.AddCorpsEvent(CityID,actionType,objType,objID,pos,cb_AddEvent);//返回
    if(actionType==57)//占领山寨
        Main.AddAppendantNPC(CityID,pos,cb_AddAppendantNPC);
    if(actionType==58)//放弃占领
        Main.DelAppendantNPC(pos,cb_DelAppendantNPC);
}

function cb_AddAppendantNPC(result)
{
    if(DataValidate(result)==false) return false;
    if(result.value==0)
    {
        // 刷新用户战勋值 - 使用全局变量 UserInfo
        if (UserInfo && UserInfo.Insignia !== undefined) {
            $("#userIns").html(UserInfo.Insignia.toString());
        }
        Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息
    }    
    else if(result.value==30086)
        ShowMessageBox(Lang["PopUp_48"]);
    else if(result.value==30175)
        ShowMessageBox(Lang["PopUp_216"]);
    DataTranslateEnd(); 
}

function cb_DelAppendantNPC(result)
{
    if(DataValidate(result)==false) return false;
    if(result.value==0)
        Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息
}


//获得攻击目标返回
function cb_GetCityNameByPos(result)
{ 
    if(DataValidate(result)==false) return false;
    
    var t=EventPopTemp.split("_");
    var actionType=parseInt(t[0],10);
    var objType=parseInt(t[1],10);
    var objID=parseInt(t[2],10);
    var pos=parseInt(t[3],10);
        
    if(result.value!="")
    {
        TargetCityName=result.value
        Main.GetCropsNeedTime(CityID,pos,actionType,cb_GetCropsNeedTime)
    } 
    else
    {
        //无效的目标
        ShowMessageBox(Lang["Event_44"]);
        DataTranslateEnd(); 
    }  
}

//获得攻击时间返回
function cb_GetCropsNeedTime(result)
{
     if(DataValidate(result)==false) return false;
     var t=EventPopTemp.split("_");
     var actionType=parseInt(t[0],10);
     var objType=parseInt(t[1],10);
     var objID=parseInt(t[2],10);
     var pos=parseInt(t[3],10);
     
     if(result.value>=0)
     {
        CropsNeedTime=result.value
        if(actionType==11)//攻击
            ShowPopUp("pop_29");
        else if(actionType==12)//支援
            ShowPopUp("pop_30");
        else if(actionType==48)//搜索秘道
            ShowPopUp("pop_92");
        else if(actionType==55)//攻擂
            ShowPopUp("pop_94");
        else if(actionType==59)//征服
            ShowPopUp("pop_110");
        else
            ShowPopUp("pop_82"); 
     }
     
     DataTranslateEnd();
}

//添加攻击/增援事件
function AddAttackEvent()
{ 
    DataTranslateBegin(); 
    var t=EventPopTemp.split("_");
    var actionType=parseInt(t[0],10);
    var objType=parseInt(t[1],10);
    var objID=parseInt(t[2],10);
    var pos=parseInt(t[3],10);
    var gold=CityInteriorInfo.Gold;
    var Insignia=UserInfo.Insignia;
    
    if(actionType==39)
        actionType=16;
    if(actionType==48)
        actionType=25;
    if(actionType==55)
        actionType=26;
    if(actionType==59)
        actionType=28;
    
    switch (actionType) {
        case 28 :
        {
            var speed_3=document.getElementById("speed_3").checked;
            var speed_4=document.getElementById("speed_4").checked;
            
            if(speed_3)
                SpeedFlag[1]=0;
            else
                SpeedFlag[1]=1;
            
            if(SpeedFlag[0]==0 && SpeedFlag[1]==0 && Insignia-3500>=0)
            {
                Main.AddCorpsEventExtend(CityID,actionType,objType,objID,pos,SpeedFlag,cb_AddEvent);
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                HidePopUp();
            }
            else if(SpeedFlag[0]==0 && SpeedFlag[1]==1 && gold-10>=0)
            {
                Main.AddCorpsEventExtend(CityID,actionType,objType,objID,pos,SpeedFlag,cb_AddEvent);
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                HidePopUp();
            }
            else if(SpeedFlag[0]==1 && SpeedFlag[1]==0 && Insignia-3500>=0 && gold-20>=0)
            {
                Main.AddCorpsEventExtend(CityID,actionType,objType,objID,pos,SpeedFlag,cb_AddEvent);
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                HidePopUp();
            }
            else if(SpeedFlag[0]==1 && SpeedFlag[1]==1 && gold-30>=0)
            {
                Main.AddCorpsEventExtend(CityID,actionType,objType,objID,pos,SpeedFlag,cb_AddEvent);
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                HidePopUp();
            }
            else if(Insignia-3500<0 && SpeedFlag[1]==0)
            {
                ShowMessageBox(Lang["PopUp_216"]);
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                DataTranslateEnd();
            }
            else
            {
                ShowPopUp("pop_25");
                SpeedFlag[0]=0;
                SpeedFlag[1]=0;
                DataTranslateEnd();
            }
        }
            break;
        default :
        {
            if(SpeedFlag[0]==0 || (SpeedFlag[0]==1 && gold-20>=0) || (SpeedFlag[0]==2 && gold-50>=0))
            {
                Main.AddCorpsEventExtend(CityID,actionType,objType,objID,pos,SpeedFlag,cb_AddEvent);
                SpeedFlag[0] = 0;
                HidePopUp();
            }
            else
            {
                ShowPopUp("pop_25");
                SpeedFlag[0]=0;
                DataTranslateEnd();
            }
        }
            break;
    }
}


//添加擂台或占领山寨列表回填事件
function AddListXY(id)
{
    var t=id.split("_");
    //坐标是为擂台坐标
    var bool=isArena(t[0],t[1])
    if(bool==true)
    {
        $("#target_x")[0].value =t[0];
	    $("#target_y").val(t[1]);
    }
    else
    {
        $("#WorldMapX")[0].value =t[0];
	    $("#WorldMapY").val(t[1]);
    }
	HidePopUp();
}

var EventPopTemp="";

//添加英雄事件
function AddHeroEvent(actionType,objType,objID)
{
    
    var sunjoin=0;
    if(actionType==9)
    {
        DataTranslateBegin(); 
        Main.AddHeroEvent(CityID,actionType,objType,objID,sunjoin,cb_AddEvent);
    }
    else if(actionType==40)//快速训练
    {
        actionType=17;
        //EventPopTemp=actionType+"_"+objType+"_"+objID;
        //ShowPopUp("pop_103");
        Main.AddHeroEvent(CityID,actionType,objType,objID,sunjoin,cb_AddEvent)
    }
    else if(actionType==41)//快速招募
    {
        actionType=18;
        EventPopTemp=actionType+"_"+objType+"_"+objID;
        ShowPopUp("pop_83");  
    }
    else if(actionType==45)//闭关修炼
    {
        actionType=23;
        EventPopTemp=actionType+"_"+objType+"_"+objID;
        ShowPopUp("pop_84");
    }
    else if(actionType==46)//查看闭关
    {
        Main.GetHeroAutoExpBreak(CityID,objID,cb_GetHeroAutoExpBreak);
        //ShowPopUp("pop_85");
    }
    else
    {
        EventPopTemp=actionType+"_"+objType+"_"+objID;
        ShowPopUp("pop_31");      
    }     
}

//获得闭关数据
function cb_GetHeroAutoExpBreak(result)
{
    if(DataValidate(result)==false) return false;
    AutoExpInfo = result.value;
    ShowPopUp("pop_85");
}

//添加征兵事件
function AddConscribeEvent()
{
    DataTranslateBegin(); 
    IsFastConscription=false;
    var t=EventPopTemp.split("_");
    var actionType=parseInt(t[0],10);
    var objType=parseInt(t[1],10);
    var objID=parseInt(t[2],10);
    var sunjoin=parseInt($("#input_child").val());
    Main.AddHeroEvent(CityID,actionType,objType,objID,sunjoin,cb_AddEvent);
    HidePopUp();
}




//添加事件返回
function cb_AddEvent(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {
        var t=EventPopTemp.split("_");
        var objType=parseInt(t[1],10);
        if((objType==5 || objType==4) && PageNum==3)   
            Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);
        else
            Main.GetCityInteriorInfo(CityID,cb_EventUpdate);               
    }
    else
    {
         DataTranslateEnd(); 
    }
}
 
function cb_AddVisitEvent(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {
        var t=EventPopTemp.split("_");
        var objType=parseInt(t[1],10);
        if((objType==5 || objType==4) && PageNum==3)   
            Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);
        else
            Main.GetCityInteriorInfo(CityID,cb_EventUpdate);
    }
    else
    {
         DataTranslateEnd(); 
    }     
}

//请求事件完成
var IsFlash=0;//是否刷新
var EventNeedMail=0;//是否需要刷新邮件
var DefChessSign = 0;//作为防守方战场标志
var AttChessSign = 0;//作为攻击方战场标志
function ProcessOverdueEvent(index)
{
    if(EventInfo!=null && EventInfo[index]!=null)
    {
        var eventObj=EventInfo[index];
        var eventID=eventObj.ID;
        
        IsFlash=EventNeedFlash(eventObj.ObjType);
        //需要立刻显示有新邮件
        if(eventObj.ActionType==11 || eventObj.ActionType==14 || eventObj.ActionType==25 || eventObj.ActionType==28)
            EventNeedMail=1;     
        if(eventObj.ActionType==21 && eventObj.TargetCity!=UserInfo.CityList[CityNum].Pos)
            AttChessSign=1;//作为攻击方战场攻击事件完成
        if(eventObj.ActionType==21 && eventObj.TargetCity==UserInfo.CityList[CityNum].Pos)
            DefChessSign=1;//作为被攻击放战场攻击事件完成  
        DeleteEventMapUnit(eventObj);
        
        Main.ProcessOverdueEvent(CityID,eventID,cb_ProcessOverdueEvent);
    }
    else
    {
        DataTranslateEnd();
    }
}

//事件完成刷新范围控制
function EventNeedFlash(objType)
{
    switch(objType)
    {
        case 1:
            if(PageNum==1 ||PageNum==10)
                return 0;
            else
                return 1;    
        case 2:
            if(PageNum==10)
                return 0;
            else    
                return 1;
        case 3:
            if(PageNum==2 || PageNum==10)
                return 0;
            else
                return 1;    
        case 4:
            if(PageNum==3 || PageNum==10)
                return 0;
            else 
                return 1;    
        case 5:
            if(PageNum==3 || PageNum==2 ||PageNum==10 || PageNum==5)
                return 0;
            else
                return 1;    
    }
    return false;
}

//事件处理完毕数据返回
function cb_ProcessOverdueEvent(result)
{
    if(DataValidate(result)==false) return false;
             
    if(result.value==0)
    {        
         if(IsFlash==0)
             Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);
         else
             Main.GetCityInteriorInfo(CityID,cb_EventUpdate);
         
         if(EventNeedMail==1)
             Main.GetNewMailNum(cb_GetNewMailNum);
        if(DefChessSign==1 || AttChessSign==1)
        {
            $("#attack_chess").show();
            AttChessSign=0;
            DefChessSign=0;
        }
    }
    else if(result.value==2)
    {
         //if(DefChessSign==1)
           //  {
             //   $("#defence_chess").show();
               // DefChessSign=0;
             //}
         //if(AttChessSign==1)
           // {
             //   $("#attack_chess").show();
              //  AttChessSign=0;
            //} 
        if(DefChessSign==1 || AttChessSign==1)
        {
            $("#attack_chess").show();
            AttChessSign=0;
            DefChessSign=0;
        }
        Main.GetCityInteriorInfo(CityID,cb_EventUpdate);  
    }
    else
    {
         EventNeedMail=0;
         AttChessSign=0;
         DefChessSign=0;
         if(result.value==1)
            Main.GetValidEvent(CityID,cb_GetValidEvent);
         else if(result.value==2)
            Main.GetCityInteriorInfo(CityID,cb_EventUpdate);
         else   
            DataTranslateEnd();   
//            window.location.reload();            
//             //alert(result.value);    
    }
     
}


//更新当前控制目标状态
function UpdateControlTarget()
{
    if(ControlTarget==2 && ClickPos>0)
        ShowAreaInfo();
    if(ControlTarget==3 && ClickPos>=0)
        ShowClickHero();
    if(ControlTarget==4 && WorldIndex!="")
    {
        Main.GetCityHero(CityID,cb_WorldMapNeedHero);//请求侠客信息        
    }
    if(ControlTarget==5)
    {
        CreateAttackTeamTree();
    }
    if(ControlTarget==6)
    {
        CreateSupportTeamTree();
    }
    if(ControlTarget==7)
    {
        SelectOrgPerson(index);
    }
}
function cb_WorldMapNeedHero(result)
{
    if(DataValidate(result)==false) return;
    
    HeroInfo=result.value;
    if(HeroInfo!=null && HeroInfo[0]!=null && HeroInfo[0].ID==-1)
        HeroInfo=null;
    
    ClickCity(WorldIndex);
}

//获得行军时间
function GetCorpsNeedTime(cPos,tPos)
{
    var x1=Math.floor(cPos%400);
    if(x1==0)x1=400;
    var y1=(Math.floor((cPos-1)/400)+1); 
    
    var x2=Math.floor(tPos%400);
    if(x2==0)x2=400;
    var y2=(Math.floor((tPos-1)/400)+1); 
        
    var x=Math.abs(x1-x2);
    var y=Math.abs(y1-y2);
    var t=(210+Math.floor(Math.pow((x*x+y*y),0.5)*18)*5)*TimePercent/100;
    var time=IntToTime(t);
    return time;    
}

