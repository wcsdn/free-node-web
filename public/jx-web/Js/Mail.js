/*
    邮件页
*/

var ViewMailType = 0;//0=新邮件,1=系统,2=战报,3=消息,4=交易 
var ViewMailPage = 1;
var ViewMailMaxPage = 1;
var CurOpenMailID=-1;
//创建邮件主页面
function CreateMailPage()
{
    var html="";
    
    html+="<div id=\"mailtype\" >"; 
    html+="<ul>";
    html+="<li><a id=\"mailtype_0\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_72')\" onmouseout=\"HideTips()\" onmousedown=\"ChangeMailType(this.id)\" href=\"#\">"+Lang["Mail_1"]+"</a></li>";
	html+="<li><a id=\"mailtype_1\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_73')\" onmouseout=\"HideTips()\" onmousedown=\"ChangeMailType(this.id)\" href=\"#\">"+Lang["Mail_2"]+"</a></li>";
    html+="<li><a id=\"mailtype_2\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_74')\" onmouseout=\"HideTips()\" onmousedown=\"ChangeMailType(this.id)\" href=\"#\">"+Lang["Mail_3"]+"</a></li>";
	html+="<li><a id=\"mailtype_3\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_75')\" onmouseout=\"HideTips()\"  onmousedown=\"ChangeMailType(this.id)\" href=\"#\">"+Lang["Mail_4"]+"</a></li>";
	html+="<li><a id=\"mailtype_4\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_76')\" onmouseout=\"HideTips()\" onmousedown=\"ChangeMailType(this.id)\" href=\"#\">"+Lang["Mail_5"]+"</a></li>";
	//html+="<li><a href=\"#\">[发件箱]</a></li>";
	html+="<li style=\"float:right;margin-right:10px;\"><span class=\"notice\" id=\"unread_mail_count\">0</span>"+Lang["Mail_6"]+"</li>";
	html+="<li style=\"float:right;margin-right:10px;\">"+Lang["Mail_7"]+"<span style=\"font-weight:bold;\" id=\"mail_count\">0</span>"+Lang["Mail_8"]+"</li>";
	html+="</ul>";
	html+="</div>"; 
	html+="<div id=\"mailtitle\">";
	html+="<table width=\"542\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="<tr>";
	html+="<td width=\"21\" height=\"20px;\">";
	html+="<input type=\"checkbox\" name=\"select_all\" onclick=\"checkMailAll(this)\" />"; 
	html+="</td>";
	html+="<td onmouseover=\"ShowTips(event,'common_1_70')\" onmouseout=\"HideTips()\" width=\"25\">"+Lang["Mail_9"]+"</td>";
	html+="<td width=\"137\">"+Lang["Mail_10"]+"</td>";
	if(VersionInfo[0]!="tw")
	{	    
	    html+="<td width=\"205\">"+Lang["Mail_11"]+"</td>";
	    html+="<td width=\"127\">"+Lang["Mail_12"]+"</td>";
	}
	else
	{
	    html+="<td width=\"175\">"+Lang["Mail_11"]+"</td>";
	    html+="<td width=\"157\">"+Lang["Mail_12"]+"</td>";
	}
	html+="<td width=\"27\">"+Lang["Mail_13"]+"</td>";
	html+="</tr>";
	html+="</table>";
	html+="</div>";
	html+="<div id=\"mails\">";
    html+="</div>";
    html+="<div id=\"pagefoot\">";
    html+="</div>";
	
	//$("#mainpic").html(html);
	 var tree=document.getElementById("mainpic");
       tree.innerHTML=html;    
       html=null;
	CreateMailFoot();
}

//建立页脚
function CreateMailFoot()
{
    var html="";
    
    html+="<table width=\"536\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    html+="<tr>";
    if(PageNum==8)
    {   html+="<td width=\"120\" align=\"left\" >" 
        html+="<a href=\"#\" id=\"mail_delete_3\" onmouseover=\"ShowTips(event,'common_1_67')\" onmouseout=\"HideTips()\" onmousedown=\"ShowPopUp(this.id)\">"+Lang["Mail_14"]+"</a>";
        html+="</td>";
        html+="<td width=\"120\" align=\"left\" >" 
        html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_68')\" onmouseout=\"HideTips()\" onmousedown=\"ReplyMailBySelect()\">"+Lang["Mail_15"]+"</a>";
        html+="</td>";
        html+="<td width=\"100\" align=\"left\" >" 
        html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_69')\" onmouseout=\"HideTips()\" onmousedown=\"NewMail(null)\">"+Lang["Mail_16"]+"</a>";
        html+="</td>";
    }
    html+="<td width=\"66\" align=\"right\" >";
    html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_53')\" onmouseout=\"HideTips()\" onmousedown=\"TurnMailPage(true)\">"+Lang["Mail_17"]+"</a>";    
    html+="</td>";
    html+="<td width=\"66\" align=\"right\" >";
    html+="<a href=\"#\" onmouseover=\"ShowTips(event,'common_1_54')\" onmouseout=\"HideTips()\" onmousedown=\"TurnMailPage(false)\">"+Lang["Mail_18"]+"</a>";
    html+="</td>"
    html+="<td width=\"56\" align=\"right\">";
    html+="<span id=\"nowpage\" >0</span>/<span id=\"maxpage\">0<span>";
    html+="</td>";
	html+="</tr>";
	html+="</table>";
	
    //$("#pagefoot").html(html);
     var tree=document.getElementById("pagefoot");
       tree.innerHTML=html;    
       html=null;
    
}

//建立邮件内容列表
function CreateMailList()
{
    //标记当前类型
    var s="#mailtype_"+ViewMailType;
    $(s).css({"font-weight":"bold","text-decoration":"underline"})
   
    var html="";
    var mail;
    var i=0
    html+="<table width=\"542\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    while(MailInfo!=null && MailInfo[i]!=null)
    {
        mail=MailInfo[i];
        var readtag="";
        if(mail.ReadTag==1)
           readtag=Lang["Mail_19"];
        else
           readtag=Lang["Mail_20"];
        html+="<tr>";
	    html+="<td width=\"21px\" height=\"20px\">";
	    html+="<input name=\"select_one\" id=\""+mail.MailID+"\" onclick=\"checkMailOne()\" type=\"checkbox\" />";
	    html+="</td>";
	    html+="<td width=\"25px\">&nbsp;</td>";
	    if(mail.MailType==3)
	        html+="<td width=\"137px\">"+mail.MailFrom+"<span style=\"color:#35c235\";>["+Lang["Mail_21"]+"]</span></td>";
	    else
	        html+="<td width=\"137px\"><span style=\"color:#9D080D;\">"+mail.MailFrom+"</span></td>";
	    if(VersionInfo[0]!="tw")
	    {	     
	        html+="<td width=\"205px\"><a id=\"mail_title_"+i+"_"+mail.MailType+"_"+mail.MailID+"\" href=\"#\" onmouseover=\"ShowTips(event,'common_1_71')\" onmouseout=\"HideTips()\" onmousedown=\"OpenMail(this.id)\"></a></td>";
	        html+="<td width=\"127px\">"+mail.DateTime+"</td>";
	    } 
	    else
	    {
	        html+="<td width=\"175px\"><a id=\"mail_title_"+i+"_"+mail.MailType+"_"+mail.MailID+"\" href=\"#\" onmouseover=\"ShowTips(event,'common_1_71')\" onmouseout=\"HideTips()\" onmousedown=\"OpenMail(this.id)\"></a></td>";
	        html+="<td width=\"157px\">"+mail.DateTime+"</td>"; 
	    }  
	    html+="<td width=\"27px\">"+readtag+"</td>";
	    html+="</tr>";
        i++;
    }
    html+="</table>";
    
    //$("#mails").html(html);
     var tree=document.getElementById("mails");
       tree.innerHTML=html;    
       html=null;
    var i=0;
    while(MailInfo!=null && MailInfo[i]!=null)//显示信件的标题
    {
        mail=MailInfo[i];
        var id="#mail_title_"+i+"_"+mail.MailType+"_"+mail.MailID
        var title=mail.Title
        $(id).text(title);
        i++
    }
       
    Teacher_Open(); 
}

//刷新邮箱页
function FreshMailPage()
{
    //请求获得邮箱信息，包括邮件数，etc.
    Main.GetMailNum(ViewMailType,cb_GetMailNum);    
}

function cb_GetMailNum(result)
{
    if(DataValidate(result)==false) return;
    
    //刷新邮件页邮件数量信息
    $("#mail_count").text(result.value[0]);//邮件总数
    $("#unread_mail_count").text(result.value[1]);//未读邮件数
    if(parseInt(result.value[1],10)>0)
        $("#new_mail").show();//显示有新邮件标志
    else
        $("#new_mail").hide();//隐藏标志
        
    if(parseInt(result.value[1],10)>0)
    {
        $("#p_8").css("color","red");//有新邮件"消息"样式
        haveNewMail=1;
    }
    else
    {
        $("#p_8").css("color","black");//没有新邮件样式
        haveNewMail=0;
    }
             
    ViewMailMaxPage=result.value[2];
    $("#nowpage").text(ViewMailPage);//当前所在邮件页面值(初始此值为1)
    $("#maxpage").text(ViewMailMaxPage);//邮件页面总数
    
    //请求获得邮件列表
    if(ViewMailType==0)//新邮件时（初始值为0，用于进入消息页面或点击未读时，默认显示未读邮件）
        Main.GetNewMail(ViewMailPage,cb_GetMailList);
    else               //如果不为新邮件，根据类型获得邮件
        Main.GetMailByType(ViewMailType,ViewMailPage,cb_GetMailList);
}

function cb_GetMailList(result)
{
    if(DataValidate(result)==false) return;
    
    MailInfo=result.value;
    
    if(MailInfo!=null && MailInfo[0].MailID==-1)
        MailInfo=null;
    
  
    
        Main.GetValidEvent(CityID,cb_GetValidEvent);//请求事件信息    
            
    CreateMailList();//邮件主体html
}


//打开邮件
function OpenMail(id)
{ 
    var t = id.split("_");
    var MailType = parseInt(t[3],10);
    var id = parseInt(t[t.length-1],10);    
    if(MailType==2)
    {
        DataTranslateBegin();
        Main.GetFightMailByID(id,cb_OpenFightMail);
        ShowWarpaperBox();    
    }
    else if(MailType==5)//竞技战报
    {
        DataTranslateBegin();
        ShowWarpaperBox(); 
        Main.GetMailByID(id,cb_GetChessMail);
    }  
    else
    {
        Main.GetMailByID(id,cb_OpenMail);
        ShowPopUp("mail_36");
    }
}

//竞技战报展示
function cb_GetChessMail(result)
{
    if(DataValidate(result)==false) return;
    var ChessMail=result.value;
    CreateChessLogLogo(ChessMail);
    CreateChessLogTop(ChessMail);
    CreateChessLogCenter(ChessMail); 
    CreateChessLogSupport(ChessMail);
    CreateChessLogBottom(ChessMail);  
    if(ViewMailType==0)
    FreshMailPage();
    else
    DataTranslateEnd();  
}

function cb_OpenFightMail(result)
{
    if(DataValidate(result)==false) return;
    FightInfo = result.value;
    CreateWarLogo();
    CreateTopMail();
    CreateMiddleMail();
    CreateSupportMail();
    CreateBottomMail();
    CurOpenMailID=result.value.MailID;
    UnCheckMailAll();
    if(ViewMailType==0)
    FreshMailPage();
    else
    DataTranslateEnd();  
}


function cb_OpenMail(result)
{
    if(DataValidate(result)==false) return;
    var mailname="";
    mailname=""+result.value.MailFrom+"["+Lang["Mail_21"]+"]";
    $("#popup_mail_title").val(result.value.Title);
    if(result.value.MailType==3)
    {
        $("#popup_mail_from").val(mailname);
        $("#popup_mail_from").css("color","#35c235");
    }
    else
    $("#popup_mail_from").val(result.value.MailFrom);
    if(result.value.MailType==4 || result.value.MailType==1)
        $(".readbox").html(result.value.Text);
    else
    {
        var mailtext="";
        mailtext="<p class=\"font_red\">"+Lang["Mail_22"]+"</p>"+result.value.Text+"";
        $(".readbox").html(mailtext);//返回text
    }
    
    if(result.value.MailType!=3)
        $("#mail_rp").hide();  //如果信件类型不是书信，那么隐藏回复标签.  
    //$("#popup_delete_mailid").attr("id",result.value.MailID);//无效,所以换用CurOpenMailID作为参数传递
    CurOpenMailID=result.value.MailID;
    
    UnCheckMailAll();
     
    //当处于新邮件页面时,每次要刷新,因为每次打开邮件,此邮件将成为旧邮件
    if(ViewMailType==0)
        FreshMailPage();
    else
    DataTranslateEnd();      
}
 
//新建邮件
function NewMail(to)
{ 
    ShowPopUp("mail_34");
    
    if(to!=null && to!="")
    {
        $("#popup_mail_to").val(to);
    }
    if(PageNum==8)
        UnCheckMailAll();
}

function cb_NewMail(result)
{
    if(DataValidate(result)==false) return;
    
    //显示邮件已发送对话框
    if(result.value==0)
        ShowMessageBox(Lang["Mail_23"]);
    else
        ShowMessageBox(Lang["Mail_24"]);
        //window.location.reload(); 
    
}

//回复邮件
function ReplyMailBySelect()
{
    var index;
    var num=0;
    var select = document.getElementsByName("select_one");
    for (var i=0; i<select.length; i++)
    {
        if(select[i].checked==true)
        {
            index=i;
            num++;
        }
    }
    if(num==0)
        ShowMessageBox(Lang["Mail_25"]);
    else if(num>1)
        ShowMessageBox(Lang["Mail_26"]);
    else 
        NewMail(MailInfo[index].MailFrom);     
}

//删除邮件
function DeleteMail(id)
{ 
    var mails= new Array();
    mails[0]=id;
    Main.DeleteMails(mails,cb_DeleteMails);
}

function DeleteMailsBySelect()
{ 
    var select = document.getElementsByName("select_one");
    var mails= new Array();
    var have_select=false;
    for (var i=0; i<select.length; i++)
    {
        if(select[i].checked==true)
        {
            mails[i]=select[i].id;
            have_select=true;
        }
    }
    if(have_select==true)
        Main.DeleteMails(mails,cb_DeleteMails);     
}

function checkMailAll(e)
{
    //全选，将当前页的列表项checkbox全选或全消
    var aa = document.getElementsByName("select_one");
    for (var i=0; i<aa.length; i++)
      aa[i].checked = e.checked;
}

function checkMailOne()
{
    var a = document.getElementsByName("select_all");
    a[0].checked = false;
}
function UnCheckMailAll()
{
    //全消
    var a = document.getElementsByName("select_all");
    a[0].checked = false;
    var aa = document.getElementsByName("select_one");
    for (var i=0; i<aa.length; i++)
      aa[i].checked = false;
}

function cb_DeleteMails(result)
{
    if(DataValidate(result)==false) return;
    
    //刷新显示邮件列表
    FreshMailPage();
    UnCheckMailAll();
    
    if(result.value!=0)
        ShowMessageBox(Lang["Mail_27"]);
        //window.location.reload(); 
}

//改变列表类型
function ChangeMailType(id)
{ 
    //取消标记之前类型
    var s="#mailtype_"+ViewMailType;
    $(s).css({"font-weight":"normal","text-decoration":"none"})
    
    var t=id.split("_");
    ViewMailType=parseInt(t[1],10);
    
    ViewMailPage=1;
    //刷新显示邮件列表
    FreshMailPage();
    UnCheckMailAll();
}

//翻页
function TurnMailPage(forward)
{
    if(forward==true)
    {
        //向左翻
        if(ViewMailPage<=1)
            return;
        UnCheckMailAll();    
        ViewMailPage--;
    }
    else
    {
        //向右翻
        if(ViewMailPage>=ViewMailMaxPage)
            return;
        UnCheckMailAll();    
        ViewMailPage++;
    }

    //刷新显示邮件列表
    FreshMailPage();
    
}
//支援队列发消息
function WriteLetter(id)
{
    var t = id.split("_");
    var index = parseInt(t[1]);
    NewMail(CorpsInfo[index].UserName);
}

//大地图发消息
function SendMessageMap()
{
    NewMail(UserSubInfo.UserName);
}