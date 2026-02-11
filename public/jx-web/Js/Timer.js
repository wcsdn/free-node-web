var defendTime=0;
//创建服务器计时器
function CreateServerTimer()
{
     ChangeServerTime();  
}

//改变计时器时间
function ChangeServerTime()
{
    var intServerTime = ServerTime;
    var span=Math.floor((Date.parse(Date())-Date.parse(ClientTime))/1000);
    intServerTime=(intServerTime+span)%86400;
    var hour = Math.floor(intServerTime/3600);
    var minute = Math.floor(intServerTime%3600/60);
    var second = Math.floor(intServerTime%3600%60);
    
    var sHour="";
    var sMinute="";
    var sSecton="";
        
    if(hour<10)
        sHour="0"+hour;
    else
        sHour=hour;     
    if(minute<10)
        sMinute="0"+minute;
    else
        sMinute=minute;    
    if(second<10)
        sSecond="0"+second;
    else
        sSecond=second;
            
    var result = sHour+":"+sMinute+":"+sSecond;
    ChangeDefendTime();
    $("#serverTime").text(result); 
    ServerInfo.Time=result;
    serverTimer=setTimeout("ChangeServerTime()",1000);   
}

//改变驻守时间
function ChangeDefendTime()
{
    defendTime++;
    var hour = Math.floor(defendTime/3600);
    var minute = Math.floor(defendTime%3600/60);
    var second = Math.floor(defendTime%3600%60);
    var sHour="";
    var sMinute="";
    var sSecton="";
        
    if(hour<10)
        sHour="0"+hour;
    else
        sHour=hour;     
    if(minute<10)
        sMinute="0"+minute;
    else
        sMinute=minute;    
    if(second<10)
        sSecond="0"+second;
    else
        sSecond=second;
            
    var result = sHour+":"+sMinute+":"+sSecond;
    $("#defendtime").text(result); 
}

//创建资源计时器
function CreateResTimers()
{ 
   ChangeMoney();
   ChangeFood();
   ChangePerson();
}

//改变钱

function ChangeMoney()
{
    var addMoney=0;
    if(CityInteriorInfo!=null)
        addMoney=CityInteriorInfo.MoneySpeed;   
    if(addMoney>0)
    {
        var iMoney=CityInteriorInfo.Money;
        CityInteriorInfo.Money++;
        var moneyRoom=CityInteriorInfo.MoneyRoom;
        if(iMoney>moneyRoom)iMoney=moneyRoom;
        $("#r_money").text(iMoney);
        addMoney=3600000/addMoney;
    }  
    else
        addMoney=50;    
    moneyTimer = setTimeout("ChangeMoney()",addMoney);
    
}

//改变粮食
function ChangeFood()
{
    var addFood=0;
    if(CityInteriorInfo!=null)
        addFood=CityInteriorInfo.FoodSpeed;   
    if(addFood>0)
    {
        var iFood=CityInteriorInfo.Food;
        CityInteriorInfo.Food++;
        var foodRoom=CityInteriorInfo.FoodRoom;
        if(iFood>foodRoom)iFood=foodRoom;
        $("#r_food").text(iFood);
        addFood=3600000/addFood;
    }
    else
        addFood=50;
    foodTimer = setTimeout("ChangeFood()",addFood);    
}

//改变人口
function ChangePerson()
{
    var addMen=0;
    if(CityInteriorInfo!=null)
        addMen=CityInteriorInfo.MenSpeed;   
    if(addMen>0)
    {
        var iMen=CityInteriorInfo.Men;
        CityInteriorInfo.Men++;
        var menRoom=CityInteriorInfo.MenRoom;
        if(iMen>menRoom)iMen=menRoom;
        $("#r_men").text(iMen);
        addMen=3600000/addMen;
    }
    else
        addMen=50;
     personTimer = setTimeout("ChangePerson()",addMen);
}

//创事件计时器
function CreateEventTimer()
{
     ChangeEventTime();
       
}
//事件计时控制
function ChangeEventTime(){
    
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo!=null && EventInfo[i]!=null)
        {
             var tID="#remainTime_"+EventInfo[i].ID;
             var tIDTree=".tree_remainTime_"+EventInfo[i].ID;            
             if(EventInfo[i].RemainTime<=-1)
             {
                ProcessOverdueEvent(i);
                DataTranslateBegin();

             }
             var time=EventInfo[i].RemainTime--;                   
             var stime=IntToTime(time);
             $(tID).text(stime);
             $(tIDTree).each(function() {   
             if ($(this).is(':visible'))
                $(this).text(stime);});
             i++;
        }
    
    }
    eventTimer=setTimeout("ChangeEventTime()",1000);
}

//聊天室刷新器
function CreateChat2RoomTimer()
{
    GetChatMessageList();
}

function GetChatMessageList()
{
    if(PageNum==7)
        Main.ListMessage(CurTalkNum,cb_FreshChatRoomPage);
    chatroomTimer=setTimeout("GetChatMessageList()",3000);
}

//世界聊天刷新器
function CreateWorChat2RoomTimer(){
    GetWorChatMessageList();
}

var worchatroomTimer;
var worchatsign=0;
function GetWorChatMessageList(){
    if($("#main").css("display")=="block" && UserInfo!=null && worchatsign==0)
    {
        Main.GetserverChatWords(WorTalkNum,cb_GetserverChatWords);
    }
    worchatroomTimer=setTimeout("GetWorChatMessageList()",6000);   
}


var ChessAtcTimer;
//创建攻击战场开启计时器/*chess*/
function CreateAttChessTimer()
{
    GetAttChessState();
}

//获取攻击战场状态/*chess*/
function GetAttChessState()
{
    if(CityInAttChessSign==0)
        Main.GetChessboardPos(CityID,2,cb_GetAttChessState);
    ChessAtcTimer = setTimeout("GetAttChessState()",3000);
}

/*chess*/
function cb_GetAttChessState(result)
{
    if(DataValidate(result)==false) return;
    if(result.value!=0)
    $("#attack_chess").show();
}
//获得新邮件数量
function CreateNewMailTimer()
{
    GetNewMail();
}

function GetNewMail()
{
    Main.GetNewMailNum(cb_GetNewMailNum); 
    mailTimer=setTimeout("GetNewMail()",600000);
}

function cb_GetNewMailNum(result)
{
    if(DataValidate(result)==false) return;
    
    if(result.value>=0)
    {
        if(result.value>0)
            $("#new_mail").show();
        else
            $("#new_mail").hide();
            
        if(result.value>0)
            $("#p_8").css("color","red");
        else
            $("#p_8").css("color","black");        
    }
    EventNeedMail=0;
    Main.UpdateUserOnline(cb_UpdateUserOnline);  
}

function cb_UpdateUserOnline(result)
{
    if(DataValidate(result)==false) return;
}

//同步服务器时间
function CreateUpdateTimer()
{
    Main.GetServerTimeNow(cb_UpdateClientTime);
    updateTimer=setTimeout("CreateUpdateTimer()",3600000);
}

function cb_UpdateClientTime(result)
{
    if(DataValidate(result)==false) return;    
    $("#serverTime").text(result.Value); 
}

//转换时间格式
function ChangeTimeFormat(time)
{
    var hour = Math.floor(time/3600);
    var minute = Math.floor(time%3600/60);
    var second = Math.floor(time%3600%60);
    
    var sHour="";
    var sMinute="";
    var sSecton="";
        
    if(hour<10)
        sHour="0"+hour;
    else
        sHour=hour;     
    if(minute<10)
        sMinute="0"+minute;
    else
        sMinute=minute;    
    if(second<10)
        sSecond="0"+second;
    else
        sSecond=second;         
    var result = sHour+":"+sMinute+":"+sSecond;
    return result;    
}
