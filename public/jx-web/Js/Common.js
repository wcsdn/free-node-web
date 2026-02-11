
//特定图片路径
var PicPath="Img";
var PicClarity = "/2/b/m/22.gif"; 
var PicPlus = "/o/2.gif";
var PicReduce = "/o/3.gif";
var PicSinker = new Array("/2/b/o/22.gif","/2/d/0.gif");
var PicDelete= "/5/1.gif";
var PicBlankLandform = "/2/d/14.gif";
var PicHeroList = new Array("/o/21.gif","/o/19.gif","/o/20.gif");
var PicFlag = "/2/b/o/23.gif";
var PicSelect2="/2/d/23.gif"; 
var PicSelect5="/2/m/0.gif"
var PicSelect4="/2/i/0.gif"

var PicMoney="/4/1.GIF";
var PicFood="/4/2.GIF";
var PicMen="/4/3.GIF";
var PicGold="/4/4.GIF";

var PicNewMail="/o/33.gif";

//侠客经验
var PicHeroExp="/2/h/h/7e.gif";
var PicHeroExpBack="/2/h/h/7g.gif";
var PicHeroExpMultiples;//侠客经验倍数

//鼠标位置对象
var MousePos; 



////获得鼠标位置
//$(document).mousemove(function (ev){
//    ev = ev || window.event;
//    MousePos = mousePos(ev);
//});

$(document).mousedown(function (){
   Teacher_Close();
});
 
function mousePos(ev)
{
    if(ev.pageX || ev.pageY)
    {
        return {x:ev.pageX, y:ev.pageY};
    }
    return {x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,y:ev.clientY + document.body.scrollTop  - document.body.clientTop};

}

//三位数补0
function AddZero(v,n) {  
    var sv=v;
    if(v<10)
        sv="0"+sv;
    if(v<100 && n==3)
        sv="0"+sv;
    return sv;        
}

//数字转化为时间
function IntToTime(sec){
    var result="";
    if(sec<=0)
        result="00:00:00"
            
    else{    
        var hour = Math.floor(sec/3600);
        var minute = Math.floor(sec%3600/60);
        var second = Math.floor(sec%3600%60);
    
        if(hour<10)hour="0"+hour;
        if(minute<10)minute="0"+minute;
        if(second<10)second="0"+second;
        result = hour+":"+minute+":"+second; 
    }
    return result;
    
}
 
//Ajax数据返回验证
function DataValidate(result)
{
    //如果获取数据错误,定位到错误页面
    if(result.error!=null)
    { 
        DataTranslateEnd(); 
        return false;
    }
     
    //如果session过期,返回登陆页面...
    else if(result.value==null || result.value==-100)
    { 
        var msg="";
        alert(Lang["Common_1"]);
        window.location=ToMain;                
        DataTranslateEnd();
        return false;
    }    
    else 
        return true;
}

//创建<area>
function HtmlArea(id,shape,coords)
{
    var area="<area id=\""+id+"\" shape=\""+shape+"\" coords=\""+coords+"\" onclick=\"\" onmousedown=\"ClickArea(this.id)\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" href=\"#\" hidefocus=\"true\" />"
    return area;
}

//创建战场可点击图
function HtmlDivChess(id,style)
{
    var div="<div id=\""+id+"\" style=\""+style+"\" onmouseup=\"ClickChessArea(event,this.id)\" ></div>";
    return div;
}

//创建普通<img>
function HtmlImg(id,css,src)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" />"
    return img;
}

//创建普通<img>
function HtmlTipsImgStyle(id,style,src)
{
    var img="<img id=\""+id+"\" style=\""+style+"\" src=\""+src+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" />"
    return img;
}

//创建普通<img>
function HtmlTipsImg(id,css,src)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" />"
    return img;
}

//创建普通<img>
function HtmlImgStyle(id,style,src)
{
    var img="<img id=\""+id+"\" style=\""+style+"\" src=\""+src+"\" />"
    return img;
}

//创建可点击得<img>
function HtmlClickImg(id,css,src,click)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" onmousedown=\""+click+"\" />"
    return img;
}

//创建可点击得带Tips的<img>
function HtmlClickTipsImg(id,css,src,click)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" onmousedown=\""+click+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" />"
    return img;
}

//创建可点击得<img>
function HtmlClickImgStype(id,style,src,click)
{
    var img="<img id=\""+id+"\" style=\""+style+"\" src=\""+src+"\" onmousedown=\""+click+"\" />"
    return img;
}

//创建可点击得带Tips的<img>
function HtmlClickTipsImgStyle(id,style,src,click)
{
    var img="<img id=\""+id+"\" style=\""+style+"\" src=\""+src+"\" onmousedown=\""+click+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" />"
    return img;
}

//取消事件tooltips
function HtmlClickTipsImgCss(id,css,src,click)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" onmousedown=\""+click+"\" onmouseover=\"ShowTips(event,'common_1_55')\" onmouseout=\"HideTips()\" />"
    return img;
}

//事件展开伸缩图片
function HtmlClickTipsImgControl(id,css,src,click)
{
    var img="<img id=\""+id+"\" class=\""+css+"\" src=\""+src+"\" onmousedown=\""+click+"\" onmouseover=\"ShowTipsh()\" onmouseout=\"HideTips()\"/>"
    return img;
}

function ShowTipsh()
{
    ShowTips(event,EventImgTwo);
}
//关于图片闪烁的解决方案
document.execCommand("BackgroundImageCache", false, true);

//只允许输入数字
function OnlyNum(e)
{
    if ($.browser.msie) 
    {   
        if ( !((event.keyCode > 47 && event.keyCode < 58) || (event.keyCode == 8) || (event.keyCode>=96 && event.keyCode<=105) || (event.keyCode == 16) )) 
            event.returnValue=false;    
    } 
    else 
    {   
        if ( !((e.which > 47 && e.which < 58) || (e.which == 8) || (e.which > 96 && e.which < 105) || (e.which == 16) ))   
            return false;   
    }   
}

//替换不是数字
function OnlyNumReplace(id)
{

    var input=document.getElementById(id);
    input.value=input.value.replace(/\D+/g,'');   
} 

//检查输入框的字符数 
function CheckMaxInput(obj,maxLen)
{
    var m=obj.value.length;
    var n=m;
    var j=0; 
    for (var i=0;i<m;i++)
    {
        if (obj.value.charCodeAt(i)<0||obj.value.charCodeAt(i)>161)
        {
            n++;
            if (i<maxLen/2)
               j++;
        }
    }
 
    if (n>maxLen)
        obj.value=obj.value.substring(0,maxLen-j);
}

//判断是否是数字
function IsInteger(str)    
{      
     if(str.length!=0)
     {   
        reg=/^[-+]?\d*$/;    
        if(!reg.test(str))
        {   
            return 1;  
        }
        else
            return 0;   
     }
     else
        return 2;        
}   

//按键执行操作
function KeyDo(e)
{
    if(window.event) // IE
    {
    var keynum = e.keyCode;
    }
    else if(e.which) // Netscape/Firefox/Opera
    {
    var keynum = e.which
    }
    //回车按下
    if(keynum==13)
    {
        if(CanEnterPop==1)
        {
            CanEnterPop=0;
            HidePopUp();
        }
    }
    //ESC按下
    if(keynum==27)
    {
        //ChessEscDown();
    }
    //数字键按下
    if(keynum>=48 && keynum<=57)
    {
        //ChessNumDown(keynum);
    }
    
}

function GetMyInfo()
{
    if(UserSubInfo==null || UserSubInfo.UserName!=UserInfo.Name || UserSubInfo.Bloom==1)
        UserSubInfo=Main.GetUserSub(UserInfo.Name).value; 
    PopUpSeeUserInfo();
}

//强化用户信息弹出
function PopUpSeeUserInfo()
{
    var html="";
    var user;
    var key=0;     
    if(UserSubInfo!=null)
    {
        user = UserSubInfo;
        if(user.UserName!=UserInfo.Name)
            key=1;  
        var left=GetLeftValue(528);
        $("#popup").css("left",left);
        if(key==0) 
            $("#popup").css("top","50px");  
        else
            $("#popup").css("top","150px");         
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>"; 
        html+="<div style=\"padding-top:5px;\">";
        html+="<div style=\"text-align:center;\"><img src=\""+ImgUrl+"o/48b.GIF\"/></div>";
         
        html+="<div style=\"margin-left:27px;margin-top:10px;width:470px;\">"; 
        html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48c.GIF\"/></span>"; 
        html+="<span style=\"background-color:#c4caa6;text-align:center;width:455px;display:block; float:left;height:12px;color:#882D01;font-weight:bold\">"+Lang["PopUp_254"]+"</span>"; 
        html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48d.GIF\"/></span>"; 
        html+="</div>"; 
         
        html+="<div style=\"margin-left:34px;clear:both;width:455px;background-color:#dcdedb;height:auto;\">";
        html+="<table style=\"width:400px;margin-top:10px;margin-bottom:10px;margin-left:26px;\">";
        html+="<tr height=\"12px\" align=\"left\">";
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["Taxis_4"]+"</td>";
        html+="<td width=\"170px\"><b>"+user.UserName+"</b></td>"; 
        html+="<td width=\"70px\" class=\"info_title\">&nbsp;</td>";
        html+="<td width=\"90px\">&nbsp;</td>";
        html+="</tr>"
        html+="<tr height=\"12px\" align=\"left\">";
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["PopUp_255"]+"</td>"; 
        var vipKey=false; 
        if(PersistEffectGroupInfo!=null)
        {
             for(var i=0;i<PersistEffectGroupInfo.length;i++)
             {
                if(PersistEffectGroupInfo[i]!=null)
                {
                    var per=PersistEffectGroupInfo[i]; 
                    if(per.MainEffectType==1) //vip
                    {
                        vipKey=true;
                        break;
                    }
                 }
              }
        }  
        if(key==0 && vipKey) 
            html+="<td width=\"170px\">"+user.CityName+"<a id=\"name_2\" onmousedown=\"ChangeName(this.id)\" href=\"#\" style=\"color:#009311\">["+Lang["PopUp_256"]+"]<a></td>"; 
        else
            html+="<td width=\"170px\">"+user.CityName+"</td>";  
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["union_49"]+"</td>";
        html+="<td width=\"90px\"><b>"+user.Bloom+"</b></td>";
        html+="</tr>";
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["PopUp_237"]+"</td>";
        
        var x,y;
        x=Math.floor(user.CityPos%400);
        if(x==0)x=400;
        y=(Math.floor((user.CityPos-1)/400)+1)%400; 
         
        html+="<td width=\"170px\"><b>"+x+"&nbsp;"+y+"</b></td>";          
        html+="<td width=\"70px\" class=\"info_title\"><a href=\"#\" style=\"color:#882D01;\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_0')\">"+Lang["union_52"]+"</a></td>";
        html+="<td width=\"90px\"><b>"+user.Place+"</b></td>";
        html+="</tr>"; 
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["PopUp_280"]+"</td>";
        if(user.DepBrief=="") 
            html+="<td width=\"170px\">"+Lang["PopUp_279"]+"</td>"; 
        else
            html+="<td width=\"170px\">"+user.DepBrief+Lang["Tree_138"]+"</td>";  
        NextLevel=UserLevel[user.Title];  
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_1')\">"+Lang["PopUp_238"]+"</a></td>";        
        html+="<td width=\"90px\">"+UserLevel[user.Title-1]+"</td>";             
        html+="</tr>";
        html+="<tr height=\"12px\" align=\"left\"><td colspan=\"4\">&nbsp;</td></tr>"; 
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["PopUp_239"]+"</td>";
        if(user.UnionName!="") 
            html+="<td width=\"170px\">"+user.UnionName+"</td>"; 
        else
            html+="<td width=\"170px\">"+Lang["union_6"]+"</td>";   
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_4')\">"+Lang["PopUp_240"]+"</a></td>";
        html+="<td width=\"90px\"><b>"+user.Insignia+"</b></td>";
        html+="</tr>"  
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\">"+Lang["union_50"]+"</td>";
        if(user.UnionJob!=0) 
            html+="<td width=\"170px\">"+UnionJob[user.UnionJob-1]+"</td>";
        else
            html+="<td width=\"170px\">"+Lang["union_6"]+"</td>";  
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_5')\">"+Lang["PopUp_241"]+"</a></td>";
        html+="<td width=\"90px\"><b>"+user.Cachet+"</b></td>";
        html+="</tr>";
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_2')\">"+Lang["Taxis_39"]+"</a></td>";
        html+="<td width=\"170px\">"+GetFameByFameLevel(user.Fame)+"</td>"; 
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_7')\">"+Lang["PopUp_242"]+"</a></td>";
        html+="<td width=\"90px\"><b>"+user.ManorNum+"</b></td>"; 
        html+="</tr>"; 
        html+="<tr height=\"12px\" align=\"left\">"; 
        html+="<td width=\"70px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_3')\">"+Lang["Taxis_44"]+"</a></td>";
        html+="<td width=\"170px\">"+GetPrestigeByPrestigeLevel(user.Credit)+"</td>"; 
        //html+="<td width=\"70px\" class=\"info_title\"><a href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_6')\">"+Lang["PopUp_243"]+"</a></td>";
        //html+="<td width=\"90px\"><b>"+user.ChessPoint+"</b></td>";
        html+="<td width=\"70px\" class=\"info_title\">&nbsp;</td>";
        html+="<td width=\"90px\">&nbsp;</td>"; 
        html+="</tr>";     
        html+="</table>";  
        if(key==0)  
            html+="<div style=\"width:400px;text-align:left;margin-left:26px;padding-bottom:10px\"><font color=\"#882D01\">"+Lang["PopUp_244"]+"</font>&nbsp;&nbsp;&nbsp;&nbsp;<b>"+Lang["PopUp_245"]+"</b><br/><a onmousedown=\"alert('"+Lang["PopUp_245"]+"')\" style=\"color:#009311\">["+Lang["PopUp_256"]+"]<a></div>"; 
        else
            html+="<div style=\"width:400px;text-align:left;margin-left:26px;padding-bottom:10px\"><font color=\"#882D01\">"+Lang["PopUp_244"]+"</font>&nbsp;&nbsp;&nbsp;&nbsp;<b>"+Lang["PopUp_245"]+"</b></div>";   
        html+="</div>";        
       
        if(key==0)
        {
            html+="<div style=\"margin-left:27px;margin-top:10px;width:470px;\">";
            html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48c.GIF\"/></span>"; 
            html+="<span style=\"background-color:#c4caa6;text-align:center;width:455px;display:block; float:left;height:12px;color:#882D01;font-weight:bold\">"+Lang["PopUp_246"]+"</span>"; 
            html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48d.GIF\"/></span>"; 
            html+="</div>"; 
             
            html+="<div style=\"margin-left:34px;clear:both;width:455px;background-color:#dcdedb;height:auto;\">";
            html+="<table style=\"margin-left:26px;width:400px;margin-top:10px;margin-bottom:10px;\">";
            var moneyAdd=0;//铜钱加成
            var foodAdd=0;//粮食加成
            var populaceAdd=0;//人口加成
            var expAdd=0;   //经验加成
            var insigniaAdd=0;//战勋加成
            var marchCareerAdd=0;//行军速度加成
            var preventAdd=0;//防守实力加成
            var attackAdd=0;//进攻实力加成
            if(PersistEffectGroupInfo!=null)
            {
                 for(var i=0;i<PersistEffectGroupInfo.length;i++)
                 {
                    if(PersistEffectGroupInfo[i]!=null)
                    {
                        var per=PersistEffectGroupInfo[i]; 
                        if(per.MainEffectType==1) //vip
                        {
                            moneyAdd+=per.PersistEffectArray[2].Value;
                            foodAdd+=per.PersistEffectArray[1].Value;
                            populaceAdd+=per.PersistEffectArray[0].Value;
                            expAdd+=per.PersistEffectArray[3].Value;
                            attackAdd+=per.PersistEffectArray[4].Value;
                            preventAdd+=per.PersistEffectArray[5].Value;
                            insigniaAdd+=30;
                        }
                        if(per.MainEffectType==2) //召集令
                        {
                            populaceAdd+=per.PersistEffectArray[0].Value;
                        }
                        if(per.MainEffectType==3) //账房先生
                        {
                            moneyAdd+=per.PersistEffectArray[0].Value;
                        }
                        if(per.MainEffectType==4) //购买农具
                        {
                            foodAdd+=per.PersistEffectArray[0].Value;
                        }
                        if(per.MainEffectType==5) //白驹丸
                        {
                            expAdd+=per.PersistEffectArray[0].Value;
                        }
                        if(per.MainEffectType==7) //兵贵神速
                        {
                            marchCareerAdd+=per.PersistEffectArray[0].Value;
                        }
                    } 
                 }
            }  
            TechnicInfo=Main.GetTechnicByBuilding(CityID,11).value;
            //令行禁止科技 
            if(TechnicInfo!=null && TechnicInfo[3]!=null)     
                marchCareerAdd=100-TechnicInfo[3].CurrEff*(1-marchCareerAdd/200); 
               
            //帮派加成 
            OrgInfo=Main.GetMyOrgnizeInfo().value;
            if(OrgInfo!=null && OrgInfo.MyOrganize!=null && OrgInfo.MyMember!=null)//有帮派
            {
                OrgEffectInfoLevelPer=OrgInfo.MyOrgEffectInfo; 
                moneyAdd+=OrgEffectInfoLevelPer.AdditionalMoney;
                foodAdd+=OrgEffectInfoLevelPer.AdditionalGrain;
                populaceAdd+=OrgEffectInfoLevelPer.AdditionalMen; 
            } 
                
            preventAdd+=GetAddByLevel(user.Fame); 
            attackAdd+=GetAddByLevel(user.Credit);  
                
            html+="<tr height=\"12px\" align=\"left\">";
            html+="<td width=\"90px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_8')\">"+Lang["union_27"]+"</a></td>";
            html+="<td width=\"150px\"><b>"+moneyAdd+"%</b></td>"; 
            html+="<td width=\"90px\" class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_12')\">"+Lang["PopUp_247"]+"</a></td>";
            html+="<td width=\"70px\"><b>"+insigniaAdd+"%</b></td>";
            html+="</tr>";
            html+="<tr height=\"12px\" align=\"left\">";
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_9')\">"+Lang["union_28"]+"</a></td>";
            html+="<td><b>"+foodAdd+"%</b></td>"; 
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_13')\">"+Lang["PopUp_248"]+"</a></td>";
            html+="<td><b>"+marchCareerAdd+"%</b></td>";
            html+="</tr>";
            html+="<tr height=\"12px\" align=\"left\">";
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_10')\">"+Lang["union_29"]+"</a></td>";
            html+="<td><b>"+populaceAdd+"%</b></td>"; 
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_14')\">"+Lang["PopUp_249"]+"</a></td>";
            html+="<td><b>"+preventAdd+"%</b></td>";
            html+="</tr>";
            html+="<tr height=\"12px\" align=\"left\">";
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_11')\">"+Lang["PopUp_250"]+"</a></td>";
            html+="<td><b>"+expAdd+"%</b></td>"; 
            html+="<td class=\"info_title\"><a style=\"color:#882D01;\" href=\"#\" onmouseout=\"HideTips()\" onmouseover=\"ShowTips(event,'userInfo_15')\">"+Lang["PopUp_251"]+"</a></td>";
            html+="<td><b>"+attackAdd+"%</b></td>";
            html+="</tr>";
            html+="</table>";         
            html+="</div>"; 
           
            html+="<div style=\"margin-left:27px;margin-top:10px;width:470px;\">"; 
            html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48c.GIF\"/></span>"; 
            html+="<span style=\"background-color:#c4caa6;text-align:center;width:455px;display:block; float:left;height:12px;color:#882D01;font-weight:bold\">"+Lang["PopUp_252"]+"</span>"; 
            html+="<span style=\"display:block; float:left;\"><img src=\"img/o/48d.GIF\"/></span>"; 
            html+="</div>";  
            
            html+="<div style=\"margin-left:34px;clear:both;width:455px;background-color:#dcdedb;height:120px;overflow:auto\">";
            html+="<table style=\"margin-left:26px;width:410px;margin-top:10px;\">";
            html+="<tr height=\"13px\" align=\"left\">";
            html+="<td width=\"240px\" class=\"info_title\">"+Lang["Tree_129"]+"</td>";
            html+="<td width=\"170px\" class=\"info_title\">"+Lang["PopUp_253"]+"</td>";
            html+="</tr>";  
            html+="</table>";      
            html+="<table style=\"width:410px;margin-left:26px;\">";
            
            AppendantNpcInfos=Main.GetAllAppendantNpcInfo().value;           
            
            var length=0;
            if(AppendantNpcInfos!=null && user.DepList!=null) 
                length=Math.max(AppendantNpcInfos.length,user.DepList.length);
            else if(AppendantNpcInfos==null && user.DepList!=null) 
                length=Math.max(0,user.DepList.length);
            else if(AppendantNpcInfos!=null && user.DepList==null) 
                length=Math.max(AppendantNpcInfos.length,0); 
            for(var i=0;i<length;i++)
            {   
                html+="<tr height=\"12px\" align=\"left\">";
                if(AppendantNpcInfos!=null && AppendantNpcInfos[i]!=null)
                {
                    x=Math.floor(AppendantNpcInfos[i].NpcPos%400);
                    if(x==0)x=400;
                    y=(Math.floor((AppendantNpcInfos[i].NpcPos-1)/400)+1)%400;  
                    html+="<td width=\"240px\"><table width=\"240px\"><tr><td width=\"120px\">"+AppendantNpcInfos[i].NpcName+"</td><td width=\"120px\">["+x+","+y+"]</td></tr></table></td>";
                } 
                else
                    html+="<td width=\"240px\">&nbsp;</td>"; 
                if(user.DepList!=null && user.DepList[i]!=null)
                {               
                    x=Math.floor(user.DepList[i].DependencyPos%400);
                    if(x==0)x=400;
                    y=(Math.floor((user.DepList[i].DependencyPos-1)/400)+1)%400;         
                    html+="<td width=\"170px\"><table width=\"170px\"><tr><td width=\"120px\">"+user.DepList[i].DependencyCity+"</td><td width=\"50px\">["+x+","+y+"]</td></tr></table></td>";
                }  
                else
                    html+="<td width=\"170px\">&nbsp;</td>";                     
                html+="</tr>"  
            } 
             
            html+="</table>";    
            html+="</div>";   
        } 
         
        html+="</div>"; 
        html+="<div style=\"margin-top:20px;\" class=\"popup_button\">";
        html+="<a href=\"#\" onmousedown=PopUpNotDo(\"0\")>["+Lang["Common_11"]+"]</a>";
        html+="</div>";          
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        if(key==0) 
        {
            $(".common_popup").css("width","528px");
            $(".common_popup").css("height","558px");
            $(".common_popup1").css("width","524px");
            $(".common_popup1").css("height","544px");
        } 
        else
        {
            $(".common_popup").css("width","528px");
            $(".common_popup").css("height","308px");
            $(".common_popup1").css("width","524px");
            $(".common_popup1").css("height","294px"); 
        }
        $("#popup").show();
        $("#overlay").show();
    }
}


var levelres;//存储可兑换资源数
var levelper;//存储对应资源比率
var totalres;//存储根据输入数计算的资源数
var remainres;//存储剩余可兑换资源数
//元宝兑换资源弹出
function GetResByGold(type)
{
    
    var html="";
    var gold=CityInteriorInfo.Gold;
    if(gold>0)
    {
        var src;//存储不同资源图片路径
        var left=GetLeftValue(230);
        $("#popup").css("left",left);
        $("#popup").css("top","224px");
        html+="<div class=\"common_popup\">";
        html+="<div class=\"common_popup1\">";
        html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
        html+="<div class=\"common_popup2\">";
        switch(type)
        {
            case 42:
            html+="<p style=\"text-align:center;\">"+Lang["Common_12"]+"</p>";
            src="img/4/1.gif";
            resType=1;
            levelres=TheBuildingInfo.TradeRes.LevelMoney;
            levelper=TheBuildingInfo.TradeRes.MoneyPer;
            break
            case 43:
            html+="<p style=\"text-align:center;\">"+Lang["Common_13"]+"</p>";
            src="img/4/2.gif";
            levelres=TheBuildingInfo.TradeRes.LevelFood;
            levelper=TheBuildingInfo.TradeRes.FoodPer;
            resType=2;
            break
            case 44:
            html+="<p style=\"text-align:center;\">"+Lang["Common_14"]+"</p>";
            src="img/4/3.gif";
            levelres=TheBuildingInfo.TradeRes.LevelMen;
            levelper=TheBuildingInfo.TradeRes.MenPer;
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
        html+="<a href=\"#\" onmousedown=\"QuickGetRes("+resType+")\">["+Lang["Common_17"]+"]</a>";
        html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>["+Lang["Common_18"]+"]</a>";
        html+="</div>";
        html+="</div>";
        html+="</div>";
        var tree=document.getElementById("popup");
        tree.innerHTML=html;    
        html=null;
        $(".common_popup").css("width","230px")
        $(".common_popup").css("height","152px")
        $(".common_popup1").css("width","226px")
        $(".common_popup1").css("height","138px")
        $(".common_popup2").css("width","195px")
        $(".common_popup2").css("height","113px")
        $(".common_popup2").css("margin-left","13px")
        var maxnum;
        var num1;
        num1 = Math.floor(levelres/levelper);
        maxnum=Math.min(num1,gold);
        totalres=maxnum*levelper;
        $("#totalres").text(totalres);
        $("#remainres").text(levelres);
        $("#input_getgold").val(maxnum);
        $("#popup").show();
        $("#overlay").show();
        ChangeInputGold();
    }
    else
    ShowPopUp("pop_25");
}

//输入改变信息
function ChangeInputGold()
{
    var input=document.getElementById('input_getgold');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#input_getgold").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0;     
    var maxnum;
    var num1;
    var gold=CityInteriorInfo.Gold;
    num1 = Math.floor(levelres/levelper);
    maxnum=Math.min(num1,gold);
    if(inputNum<0)
        inputNum=0;    
    if(inputNum>=maxnum)
        inputNum=maxnum;
    $("#input_getgold").val(inputNum);
    $("#totalres").text(inputNum*levelper);
    $("#remainres").text(levelres);
}

//快速跟换资源更改倍数
function ChangeResource()
{
    var input=document.getElementById('input_presource');
    input.value=input.value.replace(/\D+/g,'');
    
    var inputNum=$("#input_presource").val();
    if(inputNum!="")
        inputNum=parseInt(inputNum,10);
    else
        inputNum=0;
    var mon=$("#mon").text();
    if(mon!="")
    {
        mon=parseInt(mon,10);
        $("#mon").text(inputNum*TaskInfo[TaskNameIndex].CostMoney);
    }    
    var summon=$("#summon").text();
    if(summon!="")
    {
        summon=parseInt(summon,10);
        $("#summon").text(inputNum*TaskInfo[TaskNameIndex].GetMoney);
    }
    var food=$("#food").text();
    if(food!="")
    {
        food=parseInt(food,10);
        $("#food").text(inputNum*TaskInfo[TaskNameIndex].CostFood);
    }
    var sumfood=$("#sumfood").text();
    if(sumfood!="")
    {
        sumfood=parseInt(sumfood,10);
        $("#sumfood").text(inputNum*TaskInfo[TaskNameIndex].GetFood);
    }
    var man=$("#man").text();
    if(man!="")
    {
        man=parseInt(man,10);
        $("#man").text(inputNum*TaskInfo[TaskNameIndex].CostMen);
    }   
    var summan=$("#summan").text();
    if(summan!="")
    {
        summan=parseInt(summan,10);
        $("#summan").text(inputNum*TaskInfo[TaskNameIndex].GetMen);
    }
    $("#input_getgold").val(inputNum);  
}

//快速购买资源
function QuickGetRes(type)
{
    var goldnum=$("#input_getgold").val();
    //调用快速购买资源函数
    Main.GoldBuyRes(CityID,type,goldnum,cb_GoldBuyRes); 
    HidePopUp();
    $("#otherpopup").hide();
    $("#otheroverlay").hide();
}

//快速购买资源回调
function cb_GoldBuyRes(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//领取奖励后请求内政信息
    if(result.value==30121) 
    ShowMessageBox(Lang["Common_19"]); //金钱超过上限
    if(result.value==30123) 
    ShowMessageBox(Lang["Common_20"]); //粮食超过上限
    if(result.value==30125) 
    ShowMessageBox(Lang["Common_21"]); //人口超过上限
}

//取消军团事件/快速召回功能
function CannelEventNeedGold(id)
{
    var html="";
    var type;
    var t=id.split("_");
    type=parseInt(t[1]);
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if(type==11 || type==12 || type==16 || type==25 || type==28)//征服玩家
    {
        html+="<p>"+Lang["Common_22"]+"？</p>";
        html+="<p><img style=\"padding-right:10px;\" src=\"img/4/4.gif\" />1</p>";
    }
    else if(type==13)
    {
        html+="<p>"+Lang["Common_23"]+"？</p>";
        html+="<p><img style=\"padding-right:10px;\" src=\"img/4/4.gif\" />5</p>";
    }
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=\"SpecialCallCorpsBack()\">["+Lang["Common_17"]+"]</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>["+Lang["Common_18"]+"]</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $("#popup").show();
    $("#overlay").show();
}

//推广链接复制
function copyCode(){
	//var testCode=document.getElementById(id).value;
	var testCode=$("#extendurl").text();
	if(copy2Clipboard(testCode)!=false){
	    HidePopUp();
		alert(Lang["Common_24"]);
	}
}
function copy2Clipboard(txt){
	if(window.clipboardData){
		window.clipboardData.clearData();
		window.clipboardData.setData("Text",txt);
	}
	else if(navigator.userAgent.indexOf("Opera")!=-1){
		window.location=txt;
	}
	else if(window.netscape){
		try{
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		}
		catch(e){
		    HidePopUp();
			alert(Lang["Common_25"]);
			return false;
		}
		var clip=Components.classes['@mozilla.org/widget/clipboard;1'].createInstance(Components.interfaces.nsIClipboard);
		if(!clip)return;
		var trans=Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
		if(!trans)return;
		trans.addDataFlavor('text/unicode');
		var str=new Object();
		var len=new Object();
		var str=Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		var copytext=txt;str.data=copytext;
		trans.setTransferData("text/unicode",str,copytext.length*2);
		var clipid=Components.interfaces.nsIClipboard;
		if(!clip)return false;
		clip.setData(trans,null,clipid.kGlobalClipboard);
	}
}

//战报内给攻击方发送信件
function WriteLetterToAttack()
{
    HidePopUp();
    NewMail(FightInfo.AttackCity.UserName);
}

//竞技战报内给玩家发送信件
function WriteLetterToChess(uname)
{
    HidePopUp();
    NewMail(uname);
}

//给防守方发送信件
function WriteLetterToDefence()
{
    HidePopUp();
    NewMail(FightInfo.DefenceCity.UserName);
}

//闭关修炼弹出窗口
function PopUpAutoExp(id)
{
    PicHeroExpMultiples=Main.GetAutoExpPercent().value;
    AutoExpFlag=0;
    var html="";
    var left=GetLeftValue(264);
    $("#popup").css("left",left);
    $("#popup").css("top","164px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<div id=\"autoexp\">";
    html+="<p style=\"text-align:center;\">"+Lang["Common_26"]+"</p>";
    html+="<ul>";
    html+="<li>"+Lang["Common_27"]+"</li>";
    html+="<li>"+Lang["Common_28"]+"</li>";
    html+="<li><span class=\"purple\">"+Lang["Common_29"]+PicHeroExpMultiples+Lang["Common_42"]+"</span></li>";
    html+="<li><p class=\"p1\">"+Lang["Common_30"]+"</p></li>";
    html+="<li><p class=\"p1 p2\">"+Lang["Common_31"]+"<input id=\"AutoExpHours\" onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeAutoExpHour()\" class=\"input_getgold settingtime_input\" type=\"text\" onkeydown=\"OnlyNum(event)\" maxlength=\"3\" />"+Lang["Common_32"]+"<span class=\"font_settingnumber\">"+Lang["Common_33"]+"</span></p></li>";
    html+="<li><p style=\"margin-left:53px;\"><input id=\"ChangeAutoExp\" onclick=\"ChangeAutoExpType(this.id)\" type=\"checkbox\" name=\""+Lang["Common_34"]+"\" /> <span class=\"purple\">"+Lang["Common_35"]+"</span><p></li>";
    html+="<li>"+Lang["Common_36"]+"</li>";
    html+="<li><div id=\"HideRes\"><table width=\"200\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td><img src=\"img/4/1.gif\" /></td><td><span id=\"AutoNeedMoneyNum\">0</span></td><td><img src=\"img/4/2.GIF\" /></td><td><span id=\"AutoNeedFoodNum\">0</span></td>";
    html+="<td><img src=\"img/4/3.GIF\" /></td><td><span id=\"AutoNeedMenNum\">0</span></td></tr></table></div></li>";
    html+="<li><span id=\"AutoNeedGold\" style=\"display:none;\"><img src=\"img/4/4.gif\" /><span id=\"AutoNeedGoldNum\">0</span></span></li>";
    html+="<li>"+Lang["Common_37"]+"<span id=\"AutoGetExp\"></span></li>";
    html+="</ul></div>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=AutoExp()>["+Lang["Common_17"]+"]</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>["+Lang["Common_18"]+"]</a>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","264px")
    $(".common_popup").css("height","272px")
    $(".common_popup1").css("width","260px")
    $(".common_popup1").css("height","258px")
    $(".common_popup2").css("width","232px")
    $(".common_popup2").css("height","232px")
    $(".common_popup2").css("margin-left","13px")
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var gold=CityInteriorInfo.Gold;
    var needMoney=TheHeroInfo.AutoExpResMoney;
    var needFood=TheHeroInfo.AutoExpResFood;
    var needMen=TheHeroInfo.AutoExpResMen;
    var Nmoney=Math.floor(money/needMoney);
    var Nfood=Math.floor(food/needFood);
    var Nmen=Math.floor(men/needMen);
    var MaxNum;
    MaxNum=Math.min(Nmoney,Nfood,Nmen);
    $("#AutoExpHours").val(MaxNum);
    ChangeAutoExpHour();
}

//更改闭关输入时间
function ChangeAutoExpHour()
{
    $("#AutoNeedGoldNum").css("color","black")
    var input=document.getElementById('AutoExpHours');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#AutoExpHours").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0; 
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var gold=CityInteriorInfo.Gold;
    var needMoney=TheHeroInfo.AutoExpResMoney;
    var needFood=TheHeroInfo.AutoExpResFood;
    var needMen=TheHeroInfo.AutoExpResMen;
    var needGold=TheHeroInfo.AutoExpGold;
    var GetExpCount=TheHeroInfo.AutoExpCount;
    var Nmoney=Math.floor(money/needMoney);
    var Nfood=Math.floor(food/needFood);
    var Nmen=Math.floor(men/needMen);
    var Ngold=Math.floor(gold/needGold);
    var MaxNum;
    if(document.getElementById("ChangeAutoExp").checked==true)
    MaxNum=Ngold;
    else
    MaxNum=Math.min(Nmoney,Nfood,Nmen);
    if(MaxNum>8)
        MaxNum=8;
    if(inputNum<0)
        inputNum=0;
    if(inputNum>=MaxNum)
        inputNum=MaxNum; 
    var FinalyGold = needGold*inputNum;
    if(gold-FinalyGold>=0)
    AutoExpSign=true;
    else
    $("#AutoNeedGoldNum").css("color","red")
    $("#AutoExpHours").val(inputNum);
    $("#AutoNeedMoneyNum").text(needMoney*inputNum);
    $("#AutoNeedFoodNum").text(needFood*inputNum);
    $("#AutoNeedMenNum").text(needMen*inputNum);
    $("#AutoNeedGoldNum").text(needGold*inputNum);
    if(document.getElementById("ChangeAutoExp").checked==true)
    $("#AutoGetExp").text(GetExpCount*inputNum*PicHeroExpMultiples);
    else
    $("#AutoGetExp").text(GetExpCount*inputNum);
}

//更改闭关修炼方式
function ChangeAutoExpType(id)
{
    if(document.getElementById("ChangeAutoExp").checked==true)
    {
        AutoExpFlag=1;
        $("#AutoNeedGold").show();
        $("#HideRes").hide();
        ChangeAutoExpHour();
    }
    else
    {
        AutoExpFlag=0;
        $("#AutoNeedGold").hide();
        $("#HideRes").show();
        ChangeAutoExpHour();
    }
}

//添加闭关修炼事件
function AddAutoExpEvent()
{
    DataTranslateBegin(); 
    AutoExpSign=false;
    var t=EventPopTemp.split("_");
    var actionType=parseInt(t[0],10);
    var objType=parseInt(t[1],10);
    var objID=parseInt(t[2],10);
    var sunjoin=parseInt($("#AutoExpHours").val());
    Main.AddHeroEventEx(CityID,actionType,objType,objID,sunjoin,AutoExpFlag,cb_AddEvent);
    HidePopUp();
}

//闭关修炼
function AutoExp()
{
    if(AutoExpSign==true || document.getElementById("ChangeAutoExp").checked==false)
        AddAutoExpEvent();
    else
    {
        AutoExpFlag=0;
        ShowPopUp("pop_25");
    }
}

//查看闭关修炼
function PopUpLookAutoExp(id)
{
    PicHeroExpMultiples=Main.GetAutoExpPercent().value;
    var html="";
    var left=GetLeftValue(264);
    $("#popup").css("left",left);
    $("#popup").css("top","164px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<div id=\"autoexp\">";
    html+="<p style=\"text-align:center;\">"+Lang["Common_26"]+"</p>";
    html+="<ul>";
    html+="<li>"+Lang["Common_27"]+"</li>";
    html+="<li>"+Lang["Common_28"]+"</li>";
    html+="<li><span class=\"purple\">"+Lang["Common_29"]+PicHeroExpMultiples+Lang["Common_42"]+"</span></li>";
    html+="<li><p class=\"p1\">"+Lang["Common_30"]+"</p></li></ul>";
    html+="<ul style=\"margin-top:20px;\">";
    html+="<li>"+Lang["Common_38"]+""+AutoExpInfo.Time+"</li>";
    html+="<li>"+Lang["Common_39"]+""+AutoExpInfo.AllExp+"</li>";
    html+="<li>"+Lang["Common_40"]+""+AutoExpInfo.Exp+"</li>";
    html+="</ul></div>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a id=\""+id+"\" href=\"#\" onmousedown=ExitAutoExp()>["+Lang["Common_41"]+"]</a>";
    html+="<a id=\""+id+"\" href=\"#\" style=\"margin-left:30px;\" onmousedown=PopUpNotDo(this.id)>["+Lang["Common_18"]+"]</a>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","264px")
    $(".common_popup").css("height","272px")
    $(".common_popup1").css("width","260px")
    $(".common_popup1").css("height","258px")
    $(".common_popup2").css("width","232px")
    $(".common_popup2").css("height","232px")
    $(".common_popup2").css("margin-left","13px")
}

//终止闭关
function ExitAutoExp()
{
    DataTranslateBegin();
    var eventindex = HasAutoExp();
    if(EventInfo!=null && EventInfo[eventindex]!=null)
    {
        var eventObj=EventInfo[eventindex];
        
        IsFlash=EventNeedFlash(eventObj.ObjType);    
        
        Main.DeleteEvent(CityID,eventObj.ID,cb_DeleteAutoExpEvent)
        
        DataTranslateBegin();
    }
    HidePopUp();  
}

//获得取消事件结果
function cb_DeleteAutoExpEvent(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {       
        var eventindex = HasAutoExp();
        
        DeleteTheEvent(eventindex);
        
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

//返回出战队列中级别的最大值
function GetMaxLevel()
{
    
    var heroList = new Array();
    
    var i=0;
    var level = 0;
    while(HeroInfo!=null && HeroInfo[i]!=null)
    {
        if(HeroInfo[i].ListType==2)
            heroList.push(HeroInfo[i]); 
        i++;
    }
    for(var j=0;j<heroList.length;j++)
    {
        if(heroList[j].Level>level)
        level = heroList[j].Level;
    }
    return level;
}
