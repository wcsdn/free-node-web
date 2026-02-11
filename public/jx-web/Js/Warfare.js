function StringBuffer(){
    this._string_=new Array;
}
//连接字符串
StringBuffer.prototype.append=function (str){
    this._string_.push(str);
}
StringBuffer.prototype.toString=function (){
    return this._string_.join("");
}

// JScript 文件
var currWarfareType=1;  //1个人竞技 2组队竞技 3帮派竞技
var currWarfareModel=1;  //1 决战模式 2夺旗模式 3竞速模式
var currWarfareArea=0; //所要报名的区域ID
//竞技类型数组
var WarfareTypes=new Array(Lang["Task_60"],Lang["Task_61"],Lang["Task_62"]);
//竞技模式数组
var WarfareModels=new Array(Lang["Task_63"],Lang["Task_65"],Lang["Task_64"]);
//等待区别数组
var Waitings=new Array(Lang["Task_80015"],Lang["Task_80016"],Lang["Task_80017"],Lang["Task_80018"],Lang["Task_80019"],Lang["Task_80020"],Lang["Task_80021"],Lang["Task_80022"],Lang["Task_80023"],Lang["Task_80024"]);

//创建竞技页面
function CreateWarfarePage()
{
    var html=new StringBuffer();
    html.append("<div id=\"task\">");
    html.append("    <div id=\"tasktitle\">");
    html.append("    <table width=\"250\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">");
    html.append("            <tr>");
    if(WarfareTypes!=null)
    {
        for(var i=0;i<WarfareTypes.length;i++)
        {
             if(eval(i+1)==currWarfareType)
                html.append("           <td><a id=\"warfaretype_"+eval(i+1)+"\" class=\"linkstyle_3\" href=\"#\"><b>"+WarfareTypes[i]+"</b></a></td>");
             else 
                html.append("           <td><a id=\"warfaretype_"+eval(i+1)+"\" onmousedown=\"ChangeWarfareType("+eval(i+1)+")\" class=\"linkstyle_3\" href=\"#\">"+WarfareTypes[i]+"</a></td>");
        }
    }
    html.append("            </tr>");
    html.append("        </table>");
    html.append("    </div>");
    html.append("    <div id=\"taskcontent\">");
    html.append("        <div id=\"taskleft\"></div>");
    html.append("        <div id=\"taskdetail\"></div>");
    html.append("    </div>");
    html.append("    <div id=\"taskfoot\"></div>");
    html.append("</div>");
    $("#mainpic").html(html.toString());
    html=null;
}

//创建左侧竞技模式
function CreateWarfareModels()
{
    var html=new StringBuffer();
    html.append("<div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\"img/o/94.gif\" alt=\"竞技模式\" /></div>");
    html.append("    <div id=\"tasktype\">");
    if(WarfareModels!=null)
    {
        html.append("    <ul style=\"text-align:center\">");
        if(currWarfareType==1)  //个人竞技
             html.append("    <li><a class=\"taskname_2\" href=\"#\" id=\"warfaremodel_1\"><b>"+WarfareModels[0]+"</b></a></li>");
        else{
            for(var i=0;i<WarfareModels.length;i++)
            {
                 if(eval(i+1)==currWarfareModel) 
                  html.append("    <li><a class=\"taskname_2\" href=\"#\" id=\"warfaremodel_"+eval(i+1)+"\"><b>"+WarfareModels[i]+"</b></a></li>"); 
                 else
                  html.append("    <li><a class=\"taskname_2\" href=\"#\" id=\"warfaremodel_"+eval(i+1)+"\" onmousedown=\"ChangeWarfareModel("+eval(i+1)+")\">"+WarfareModels[i]+"</a></li>");
            }
        }    
        html.append("     </ul>");
    }
    html.append("    </div>");
    html.append("    <div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\"img/o/95.gif\" alt=\"竞技区域\" /></div>");
    //竞技区域
    html.append("    <div id=\"taskname\">");
    html.append("    </div>");    
    $("#taskleft").html(html.toString());
    html=null;
}

//请求竞技区域
function FreshWarfareArea()
{
    Main.GetWarfareArea(currWarfareType,currWarfareModel,cb_FreshWarfareArea);
}

function cb_FreshWarfareArea(result)
{
    var html=new StringBuffer();
    if(DataValidate(result)==false) return;
    if(result.value!="" && result.value!=null)
    {
         html.append("    <ul style=\"text-align:center\">");
         var areas=result.value.split("_");
         for(var i=0;i<areas.length;i++)
         {
              if(areas[i]!="")
              {
                   var area=eval('('+areas[i]+')');
                   var areaname=area.Area; 
                   html.append("<li><a class=\"taskname_2\" href=\"#\" id=\"area_"+area.ID+"\" onmousedown=\"CreateWarfareDetail("+area.ID+")\">"+areaname+"</a></li>"); 
              }
         } 
         html.append("    </ul>");
    }
    $("#taskname").html(html.toString());
    html=null;
}

//请求竞技页面信息
function FreshWarfarePage()
{
    $("#mainpic").empty();
    $("#trees").empty();
    $("#taskdetail").empty(); 
    CreateWarfarePage();
    CreateWarfareModels();
    FreshWarfareArea();
    DataTranslateEnd();
    if(currWarfareArea==0)
    {
         if(currWarfareType==1 && currWarfareModel==1) 
            CreateWarfareDetail(1);   
         if(currWarfareType==2 && currWarfareModel==1) 
            CreateWarfareDetail(6); 
         if(currWarfareType==2 && currWarfareModel==2) 
            CreateWarfareDetail(7); 
         if(currWarfareType==2 && currWarfareModel==3) 
            CreateWarfareDetail(8);   
         if(currWarfareType==3 && currWarfareModel==1) 
            CreateWarfareDetail(9); 
         if(currWarfareType==3 && currWarfareModel==2) 
            CreateWarfareDetail(10);
         if(currWarfareType==3 && currWarfareModel==3) 
            CreateWarfareDetail(11);   
    }  
     
}

//改变显示竞技类型
function ChangeWarfareType(type){currWarfareType=type;currWarfareModel=1;currWarfareArea=0;FreshWarfarePage();}

//改变显示竞技模式
function ChangeWarfareModel(model){currWarfareModel=model;currWarfareArea=0;FreshWarfarePage();}

function CreateDetail() {
    var html=new StringBuffer();
    html.append("<div id=\"tasklogo\" class=\"tasklogo\">");
    html.append("</div>");  
    html.append("<div id=\"WarfareDetail\" class=\"WarfareDetail\">"); 
    html.append("</div>"); 
    html.append("<hr style=\"BORDER-BOTTOM-STYLE: dotted; BORDER-LEFT-STYLE: dotted; BORDER-RIGHT-STYLE: dotted; BORDER-TOP-STYLE: dotted;color:#D1D1D1;size:1px;\">");   
    html.append("<div id=\"WarfareWaitingInfo\" class=\"WarfareWaitingInfo\">");
    html.append("</div>");   
    html.append("<hr style=\"BORDER-BOTTOM-STYLE: dotted; BORDER-LEFT-STYLE: dotted; BORDER-RIGHT-STYLE: dotted; BORDER-TOP-STYLE: dotted;color:#D1D1D1;size:1px;\">"); 
    html.append("<div id=\"MyWarfare\" class=\"MyWarfare\">");
    html.append("</div>");      
    $("#taskdetail").html(html.toString());  
    CreateMyWarfare();
}

//等待列表
function CreateWaitingInfo()
{
    var warea=GetAthleticsType();
    Main.GetWaitingInfo(currWarfareType,warea,cb_CreateWaitingInfo);
}

function cb_CreateWaitingInfo(result) 
{
    if(DataValidate(result)==false) return;
    var chessNum=1;
    if(currWarfareArea<=5)
        chessNum=currWarfareArea;  
    chessNum=chessNum*2; 
    var html=new StringBuffer();
    html.append("<table width=\"350px\">");
    html.append("<tr height=\"20px\"><td colspan=\"3\"><b>"+Lang["Task_80014"]+"</b></td></tr>"); 
    for(var i=1;i<result.value.length;i++)
    {
         if(parseInt(result.value[i])==chessNum)
            html.append("<tr height=\"16px\"><td width=\"100px\">"+i+"</td><td width=\"150px\">"+Waitings[i-1]+"</td><td width=\"100px\">0/"+chessNum+"</td></tr>"); 
         else
            html.append("<tr height=\"16px\"><td width=\"100px\">"+i+"</td><td width=\"150px\">"+Waitings[i-1]+"</td><td width=\"100px\">"+result.value[i]+"/"+chessNum+"</td></tr>"); 
    }      
    html.append("</table>");  
    $("#WarfareWaitingInfo").html(html.toString()); 
}

//个人的报名等竞技状态
function CreateMyWarfare()
{
    var pos=UserInfo.CityList[CityNum].Pos; 
    Main.GetUserBattleInfo(pos,cb_CreateMyWarfare); 
}

function cb_CreateMyWarfare(result) 
{
    if(DataValidate(result)==false) return;
    var t=result.value.split("_");
    var html=new StringBuffer();
    var warfareType;
    var warfareModel;
    var warfareArea;  
    if(t[0]!=0)
    {
        switch(parseInt(t[1],10))
        { 
            case 1:
                warfareType=Lang["Task_60"];
                warfareModel=Lang["Task_63"];                
                if(t[2]==1)
                   warfareArea=Lang["Task_80001"]; 
                else if(t[2]==2)
                   warfareArea=Lang["Task_80002"];
                else if(t[2]==3)
                   warfareArea=Lang["Task_80003"];
                else if(t[2]==4)
                   warfareArea=Lang["Task_80004"];
                else if(t[2]==5)
                    warfareArea=Lang["Task_80005"];
                break;
            case 2:
                warfareType=Lang["Task_61"];
                if(t[2]==1)
                { 
                    warfareModel=Lang["Task_63"];
                    warfareArea=Lang["Task_80006"]; 
                }
                else if(t[2]==2)
                { 
                    warfareModel=Lang["Task_65"];
                    warfareArea=Lang["Task_80007"];
                }
                else if(t[2]==3)
                { 
                    warfareModel=Lang["Task_64"];
                    warfareArea=Lang["Task_80008"];
                }
                break;
            case 3:
                warfareType=Lang["Task_62"];
                if(t[2]==1)
                { 
                    warfareModel=Lang["Task_63"];
                    warfareArea=Lang["Task_80009"]; 
                }
                else if(t[2]==2)
                { 
                    warfareModel=Lang["Task_65"];
                    warfareArea=Lang["Task_80010"];
                }
                else if(t[2]==3)
                { 
                    warfareModel=Lang["Task_64"];
                    warfareArea=Lang["Task_80011"];
                }
                break;   
            default:
                break;    
         }  
    }  
    if(t[0]==1)
    {
        html.append("<table width=\"350px\">");
        html.append("<tr height=\"20px\"><td><b>"+Lang["Task_80012"]+"</b></td></tr>"); 
        html.append("<tr height=\"20px\"><td>&nbsp;&nbsp;&nbsp;&nbsp;【"+warfareType+"-"+warfareModel+"&nbsp;&nbsp;"+warfareArea+"】</td></tr>");  
        html.append("</table>");          
    }
    else if(t[0]==2)
    {
        html.append("<table width=\"350px\">");
        html.append("<tr height=\"20px\"><td><b>"+Lang["Task_80013"]+"</b></td></tr>"); 
        html.append("<tr height=\"20px\"><td>&nbsp;&nbsp;&nbsp;&nbsp;【"+warfareType+"-"+warfareModel+"&nbsp;&nbsp;"+warfareArea+"】</td></tr>");   
        html.append("</table>"); 
    }  
    $("#MyWarfare").html(html.toString());  
}

//获取竞技详细介绍
function CreateWarfareDetail(id)
{
    Main.GetWarfareDetail(id,cb_CreateWarfareDetail);
}

function cb_CreateWarfareDetail(result)
{
     currWarfareArea=0;
     var html=new StringBuffer();
     var b=false; 
     $("#taskdetail").html("");  
     $("#taskfoot").html(""); 
     CreateDetail();  
     if(DataValidate(result)==false) return;
     //显示竞技介绍 
     if(result.value!="" && result.value!=null)
     {
         var de=result.value.split("________");
         currWarfareArea=parseInt(de[2]);
         var areaname=de[0]; 
         $("#tasklogo").html("<p class=\"font_bold\">"+areaname+"</p>");                              
         html.append("<table class=\"table_task\" width=\"366\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">");
         html.append("<tr><td class=\"font_bold\">"+Lang["Task_66"]+"</td></tr>");
         html.append("<tr><td valign=\"top\" style=\"line-height:16px;font-weight:500\">"+de[1]+"</td></tr>");
         html.append("</table>");                        
         $("#WarfareDetail").html(html.toString()); 
         html=null; 
         b=true; 
     }
     //显示底部信息 
     if(b) 
    {
         Main.GetCityHero(CityID,cb_CreateWarfareFoot);//请求侠客信息
    }     
    CreateWaitingInfo();  
}

//创建底部信息
function cb_CreateWarfareFoot(result)
{   
    if(DataValidate(result)==false)return;
    HeroInfo=result.value;
    var b=true;  //是否有资格报名
    //var existsWait=false;//是否已经报名
    var pos=UserInfo.CityList[CityNum].Pos; 
    //if(existsWait)b=false;
    var level=GetMaxLevel();//获取出战队列中最大级别
    //个人战只允许参加决战模式
    if(currWarfareType==1 && currWarfareModel!=1)
         b=false;
    //1.报名者村镇内必须有侠客处于出战队列中
    if(HeroInfo==null || HeroInfo[0].ID==-1 || HeroInfo[0]==null || level==0)
         b=false;         
    //3.出战队列中有侠客处于“重伤状态”时无法报名。出战队列在外时无法报名
    if(GetOutQueueState(2) || GetOutQueueState(5) || GetOutQueueState(7))
         b=false;
    //帮派战  由帮派帮主、副帮主报名
    var res=Main.IsBoss();
    var orgName=res.value;
    if(currWarfareType==3 && (orgName=="" || orgName==undefined))
         b=false;
    var dhtml=new StringBuffer();
    dhtml.append("<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">");
    dhtml.append("<tr>");
    dhtml.append("<td width=\"318\" align=\"right\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"SignWarfare("+b+");\" href=\"#\">"+Lang["Task_67"]+"</a></td>");
    dhtml.append("<td align=\"center\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"CancelWarfare();\" href=\"#\">"+Lang["Task_68"]+"</a></td>");
    dhtml.append("<tr></table>");
    $("#taskfoot").html(dhtml.toString());
    dhtml=null;
}

//判断出战队列中状态
function GetOutQueueState(state)
{
    var b=false;
    var heroList = new Array();
    var i=0;
    while(HeroInfo!=null && HeroInfo[i]!=null && HeroInfo[i].ID!=-1)
    {
        if(HeroInfo[i].ListType==2)
            heroList.push(HeroInfo[i]); 
        i++;
    }
    for(var j=0;j<heroList.length;j++)
    {
        if(heroList[j].State==state)
        {
              b=true;
              break;  
        }
    }
    return b;
}

//取消报名
function CancelWarfare()
{
    var pos=UserInfo.CityList[CityNum].Pos; 
    var res=Main.Ys_CancelBattle(pos,CityID);
    if(DataValidate(res)==false)return;
    if(res.value==0)
    { 
        CreateWarfareDetail(currWarfareArea);  
        MessageText=Lang["PopUp_260"];
    } 
    else
        MessageText=Lang["PopUp_261"];
    ShowPopUp("pop_0");
}

//报名
function SignWarfare(b)
{
    if(!b)
    {
        MessageText=Lang["PopUp_257"];
        ShowPopUp("pop_0");
        return;
    }
    var warea=GetAthleticsType();
    var pos=UserInfo.CityList[CityNum].Pos; 
    var res=Main.Ys_SelectBattle(warea,currWarfareType,CityID,pos);
    if(DataValidate(res)==false)return;
    if(res.value==0)
    {         
        CreateWarfareDetail(currWarfareArea);  
        MessageText=Lang["PopUp_258"];
    } 
    else
        MessageText=Lang["PopUp_259"];
    ShowPopUp("pop_0");
}

function GetAthleticsType()
{
    var warea=currWarfareArea;
    if (currWarfareType == 2)
   {
       switch (currWarfareArea)
       { 
           case 6:
               warea=1;
               break;
           case 7:
               warea=2;
               break;
           case 8:
               warea=3;
               break;
           default:
               break;
       }
   }
  if (currWarfareType == 3)
   {
       switch (currWarfareArea)
       { 
           case 9:
               warea=1;
               break;
           case 10:
               warea=2;
               break;
           case 11:
               warea=3;
               break;
           default:
               break;
       }
   } 
   return warea;
}