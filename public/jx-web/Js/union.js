var OrgPrivilege=new Array(Lang["union_1"],Lang["union_2"],Lang["union_3"],Lang["union_4"],Lang["union_5"]);
var ViewUnionType = 0;//0=我的帮派,1=帮众列表,2=帮派列表,3=帮派聊天,4=我的信息,5=帮派物资
var CurPage=1;//当前页数(帮众/申请者)
var MaxCurPage;//最大页数(帮众/申请者)
var UnionPersonState=1;//1=会员，0=申请中
var UnionPersonType=1;//0=申请者,1=帮众
var CurTalkNum=0;
var WorTalkNum=0;
var OrgInfo;//帮派信息    
var MyOrgInfo;//我的帮派            MyOrgInfo=OrgInfo.MyOrganize;   MyMemberInfo=OrgInfo.MyMember;
var MyMemberInfo;//已有帮派
var OrgEffectInfoLevelPer;//帮派资源效果等
var OrgList;//帮派列表
var TheOrgInfo;//单个帮派信息
var MemberList;//帮众列表
var TheMemberInfo;//单个帮众信息
var OrgEventNodeInfo;//指定帮派指定编号后的事件信息
var OrgEventIndex=0;//帮派事件编号
var UnionPersonNum;//当前帮众
var MaxUnionPersonNum;//最大可容纳帮众数量

var UserOrganizeResInfo;//我的帮派res信息
var UserPrestigeInfo;//根据级别获得的声望信息
var NextUserPrestigeInfo;//下一级的声望信息
var UserFameInfo;//根据级别得到的名望信息
var NextUserFameInfo;//下一级名望信息
var NowOrgResourceInfo;//取得当前帮派物资信息
var OrgEffectInfo;//当前级别帮派效果
var NextOrgEffectInfo;//下一级帮派效果
var OrgResPage=1;//当前帮众捐献页
var MaxOrgResPage;//最大页
var OrgMembersResInfo;//帮众捐献信息
var UnionJob=[Lang["union_6"],Lang["union_2"],Lang["union_4"],Lang["union_5"]];
var OrgResName=[Lang["union_7"],Lang["union_8"],Lang["union_9"],Lang["union_10"],Lang["union_11"],Lang["union_12"],Lang["union_13"]];
var OrgResNumber=[];//各种资源数量
var OrgLevelPer;//资源兑换比例
var OrgResType=0;//6:讨伐令,7:玉简

function CreateUnionPage()
{
    //页头标签
    var html="";
    html+="<div id=\"organize\">";
    html+="<div id=\"orgnav\">";
    html+="<table width=\"450\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
    html+="<td><a class=\"linkstyle_3\" id=\"uniontype_0\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_14"]+"</a></td>";
    html+="<td><a class=\"linkstyle_3\" id=\"uniontype_4\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_15"]+"</a></td>";
    if(UserInfo.Organise!="")
        html+="<td><a class=\"linkstyle_3\" id=\"uniontype_1\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_16"]+"</a></td>";
    else
        html+="<td><span style=\"color:gray;\" class=\"linkstyle_3\">"+Lang["union_16"]+"</span></td>";
    if(UserInfo.Organise!="")
    html+="<td><a class=\"linkstyle_3\" id=\"uniontype_5\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_17"]+"</a></td>";
    else
    html+="<td><span style=\"color:gray;\" class=\"linkstyle_3\">"+Lang["union_17"]+"</span></td>";
    html+="<td><a class=\"linkstyle_3\" id=\"uniontype_2\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_20"]+"</a></td>";
    if(UserInfo.Organise!="") 
        html+="<td><a class=\"linkstyle_3\" id=\"uniontype_3\" href=\"#\" onclick=\"ChangeUnionPageType(this.id)\">"+Lang["union_18"]+"</a></td>";
    else
        html+="<td><span style=\"color:gray;\" class=\"linkstyle_3\">"+Lang["union_18"]+"</span></td>";
    html+="</tr></table>";
    html+="</div>";
    html+="<div id=\"mainorg\">";
    html+="</div>";
    html+="</div>";
    
    var page=document.getElementById("mainpic");
    page.innerHTML=html;     
    html=null;
    
    ChangeUnionPageType("uniontype_0");
}
 
 function ChangeUnionPageType(id)
 {
    var t=id.split("_");
    ViewUnionType=parseInt(t[1]);
    CurPage=1;
    
    switch(ViewUnionType)
    {
    case 0:
        CreateMyUnionPage();
        CreateChatRoom();
        break;
    case 1:
        CreateUnionPersonListPage();
        CreateChatRoom();
        break;
    case 2:
        CreateUnionsListPage();
        CreateChatRoom();
        break;
    case 3:
        CreateChatRoom();   
        break;
    case 4:
        CreateMyUnionInfo();
        CreateChatRoom();
        break;
    case 5:
        CreateUnionGoods();
        CreateChatRoom();
        break;
    default:
        break;
    }
    
    Main.ListMessage(CurTalkNum-20,cb_FreshChatRoomPage);
    
    FreshUnionPage();
    
    $("#trees").empty();
 }

//我的帮派页面
function CreateMyUnionPage()
{
    var html="";
    var men=CityInteriorInfo.Men-2000;
    var food=CityInteriorInfo.Food-20000;
    var money=CityInteriorInfo.Money-20000;
    html+="<div class=\"orgnum\"><p>"+Lang["union_19"]+"<span id='man_num'></span>/<span id='maxman_num'></span></p></div>";
	html+="<div id=\"orgcontent\">";
	//			<!--左侧栏信息-->
	html+="	<div id=\"orgleft\">";
	html+="<div class=\"infologo\"></div>";
	html+="<div class=\"infocontent\">";
	html+="<ul>";
	html+="<li>"+Lang["union_21"]+"<a href='#' onclick='ShowMyOrgIntro()'><span class=\"font_green\" id=\"org_name\"></span></a></li>";
	html+="<li>"+Lang["union_22"]+"<span id='org_level'></span></li>";
	html+="<li>"+Lang["union_23"]+"<span id='membership_num'></span>/<span id='maxmembership_num'></span></li>";
	html+="<li>"+Lang["union_24"]+"<span id='official_num'></span>/<span id=\"maxofficial_num\"></span></li>";
	html+="<li>"+Lang["union_25"]+"<span id='boss_name'></span></li>";
	if(UserInfo.Organise!="")
	{
	    html+="<li>"+Lang["union_26"]+"<span id='union_job'></span></li>";
	    html+="<li><img title=\""+Lang["union_27"]+"\" src=\"img/o/45.GIF\" />:<span id='union_addmoney'>0</span>%</li>";
	    html+="<li><img title=\""+Lang["union_28"]+"\" src=\"img/o/46.GIF\" />:<span id='union_addfood'>0</span>%</li>";
	    html+="<li><img title=\""+Lang["union_29"]+"\" src=\"img/o/47.GIF\" />:<span id='union_addmen'>0</span>%</li>";
	    html+="</ul>";
	}
	html+="<ul class=\"orgcontrol\" id='org_menu'>";
	if(UserInfo.Organise!="")
	{
    	html+="					<li><a href=\"#\" onclick=QuitOrg()>["+Lang["union_30"]+"</a></li>";
	}
	else
	{
	    if(CityInteriorInfo.Level>=8 && men>=0 && food>=0 && money>=0)//1:官位满足2:资源满足
	    html+="<li><a href=\"#\" id=\"createorg_"+men+"_"+food+"_"+money+"_"+CityInteriorInfo.Level+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" onclick=\"PopUpBuildUnion()\">"+Lang["union_31"]+"</a></li>";
	    else
	    html+="<li class=\"font_gray\" id=\"createorg_"+men+"_"+food+"_"+money+"_"+CityInteriorInfo.Level+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">"+Lang["union_31"]+"</li>";
	}
	html+="					</ul>";
	html+="				</div>";
	html+="			</div>";
	//			<!--左侧栏信息-->
	//			<!--右侧栏信息-->
	html+="			<div id=\"orgright\">";
	html+="				<div class=\"affichelogo\"></div>";
	html+="				<div class=\"affichecontent\">";
	html+="					<p id='affiche_information'>";
	if(UserInfo.Organise=="")
	{
	    html+=Lang["union_32"];
	}
	html+="					</p>";
	html+="				</div>";
	html+="				<div class=\"eventlogo\"></div>";
	html+="				<div class=\"eventcontent\">";
	html+="					<ul id='eventlist'>";
	//html+="					<li>2008-10-14 00:20:20 北京欢迎您!</li>";
	html+="					</ul>";
	html+="				</div>";
	html+="			</div>"; 
	html+="</div>";
	html+="<div id=\"chatroom\"></div>";

    $("#mainorg").html(html);
    html=null;
}

//帮众列表页面
function CreateUnionPersonListPage()
{
    var html="";
    
    html+="<div class=\"orgnum\"><p>"+Lang["union_19"]+"<span id='man_num'></span>/<span id='maxman_num'></span></p></div>";
	html+="<div id=\"orgcontent\">";
	//			<!--帮众列表-->
	html+="		<div id=\"personlist\">";
	html+="		</div>";
	//			<!--帮众列表翻页-->
	html+="		<div class=\"personlistchange\">";
	html+="			<table width=\"514\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="			  <tr>";
	//html+="			    <td width=\"350\"><a class=\"font_green\" href=\"#\" onclick='MailAll()'>[群发邮件]</a></td>";
    html+="			    <td width=\"70\"><a id=\"unionpersontype_1_1\" class=\"font_green\" href=\"#\" onclick=ChangeUnionPersonType(this.id)>"+Lang["union_33"]+"</a></td>";
    html+="			    <td width=\"318\"><a id=\"unionpersontype_0_0\" class=\"font_green\" href=\"#\" onclick=ChangeUnionPersonType(this.id)>"+Lang["union_34"]+"</a></td>";
    html+="			    <td width=\"45\"><a href=\"#\" onclick='UnionPageUp()'>"+Lang["union_35"]+"</a></td>";
	html+="			    <td width=\"45\"><a href=\"#\" onclick='UnionPageDown()'>"+Lang["union_36"]+"</a></td>";
	html+="			    <td width=\"36\"><span id='page_num'>0</span>/<span id='maxpage_num'></span></td>";
	html+="			  </tr>";
	html+="			</table>";
	html+="		</div>";
	html+="</div>";
	html+="<div id=\"chatroom\"></div>";

    $("#mainorg").html(html);
    html=null;
}

//帮派列表页面
function CreateUnionsListPage()
{
    var html="";
    
    html+="<div class=\"orgnum\"></div>";
	html+="<div id=\"orgcontent\">";
	//			<!--帮派列表-->
	html+="			<div id=\"orglist\">";
	html+="			</div>";
	//			<!--帮派搜索和翻页-->
	html+="			<div class=\"orglistsearch\">";
	html+="				<table width=\"304\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="				  <tr>";
	html+="				    <td width=\"91\"><input class=\"input_honour\" onkeydown=\" var e=window.event || arguments[0];if(e.keyCode==13){UnionSearch();}\" id=\"input_search\"/></td>";
	html+="				    <td width=\"52\"><a class=\"linkstyle_1\" href=\"#\" onclick=\"UnionSearch()\">"+Lang["union_37"]+"</a></td>";
	html+="				    <td width=\"54\"><a href=\"#\" onclick=\"UnionPageUp()\">"+Lang["union_35"]+"</a></td>";
	html+="				    <td width=\"53\"><a href=\"#\" onclick=\"UnionPageDown()\">"+Lang["union_36"]+"</a></td>";
	html+="				    <td width=\"54\"><span id=\"pagenumxxx\">0</span>/<span id=\"maxpagenumxxx\"></span></td>";
	html+="				  </tr>";
	html+="				</table>";
	html+="			</div>";					
	html+="</div>";
	html+="<div id=\"chatroom\"></div>";

    $("#mainorg").html(html);
    html=null;
}

//我的信息页面
function CreateMyUnionInfo()
{
    var html="";
    html+="<div class=\"orgnum\"></div>";
    html+="<div id=\"orgcontent\">";
    
    html+="<div id=\"myorgleft\">";
    html+="<div class=\"infologo\"></div>";
    html+="<div class=\"infocontent\">";
    html+="<ul><li>"+Lang["union_38"]+"<span id=\"union_fame\"></span></li>";
    html+="<li>"+Lang["union_39"]+"<span id=\"union_prestige\"></span></li></ul>";
    html+="</div>";
    html+="</div>";
    
    //名望声望信息
    html+="<div id=\"myorgright\">";
    html+="</div>";
    
    html+="<div id=\"myorgbottom\">";
    //我的物资
    html+="<div id=\"myorgmaterial\"></div>";
    html+="</div>";
    
    html+="</div>";
	html+="<div id=\"chatroom\"></div>";
    $("#mainorg").html(html);
    html=null;
}

//帮派物资页面
function CreateUnionGoods()
{
    var html="";
    html+="<div class=\"orgnum\"></div>";
    html+="<div id=\"orgcontent\">";
    html+="<div id=\"orggoods\">";
    //当前帮派物资
    html+="<div id=\"noworggoods\"></div>";
    //帮派升级物资
    html+="<div id=\"orglevelupgoods\"></div>";
    html+="</div>";
    html+="</div>";
	html+="<div id=\"chatroom\"></div>";
    $("#mainorg").html(html);
    html=null;
}

//聊天页面
function CreateChatRoom()
{
    var html="";
	//		<!--聊天窗口--> 
	if(ViewUnionType==3)
	{
		html+="<div class=\"orgnum\"></div>";
	    html+="	<div id=\"mainchatcontent\">";
	}
	else
	    html+="	<div id=\"chatwindow\">";
	html+="<div id=\"messagelist\">";
	if(UserInfo.Organise=="")
	    html+="＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊<br>＊"+Lang["union_40"]+"<br>＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊";
	html+="</div></div>";
	//		<!--输入窗口-->
	html+="		<div id=\"chat_send\">";
	html+="		<input class=\"input_message\" onkeydown=\" return  SendMessageByKey(event)\" type='text' id='input_line'/>";
	html+="		<div class=\"sendchatmessage\"><a href=\"#\" onclick=\"SendMessage()\"><img src=\""+ImgUrl+"o/49.GIF\" /></a></div>";
	html+="		</div>";

    if(ViewUnionType==3)
        $("#mainorg").html(html);
    else
        $("#chatroom").html(html);
    html=null;    
}

function SendMessageByKey(e)
{
    var e=window.event || e;
    if(e.keyCode==13)
    {
        SendMessage();
        return false;
    }        
}

function FreshUnionPage()
{
    switch(ViewUnionType)
    {
    case 0:
        Main.GetMyOrgnizeInfo(cb_FreshMyUnionPage);
        break;
    case 1:
        Main.GetMemberShipCountByState(UserInfo.Organise,UnionPersonState,cb_GetMemberShipCountByState);
        break;
    case 2:
        Main.GetOrganizeCount(cb_GetOrganizeCount);
        //Main.GetOrganizeList("",CurPage,11,cb_FreshUnionsListPage);
        break;
    case 3:
        //if(UserInfo.Organise=="") 
         Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
        //else
            //Main.ListMessage(CurTalkNum-20,cb_FreshChatRoomPage);
        break;
    case 4:
        Main.GetMyOrgResInfo(cb_GetMyOrgResInfo);//请求myorgresinfo
        break;
    case 5:
        Main.GetDBOrgResource(UserInfo.Organise,cb_GetDBOrgResource);//请求帮派当前物资信息
        break;
    default:
        break;
    }
}


function cb_FreshMyUnionPage(result)
{
    if(DataValidate(result)==false) return;
    OrgInfo = result.value; 
    if(OrgInfo.MyOrganize!=null && OrgInfo.MyMember!=null)//有帮派
    {
        MyOrgInfo=OrgInfo.MyOrganize;
        MyMemberInfo=OrgInfo.MyMember;
        OrgEffectInfoLevelPer=OrgInfo.MyOrgEffectInfo;
        var OrgName = OrgInfo.MyOrganize.OrgName;
        UnionPersonNum=OrgInfo.MyOrganize.Membership;
        MaxUnionPersonNum=OrgInfo.MyOrganize.MaxMembership;
        $("#org_name").text(OrgName);
        $("#org_level").text(OrgInfo.MyOrganize.OrgLevel);
        $("#man_num").text(UnionPersonNum);
        $("#maxman_num").text(MaxUnionPersonNum);
        $("#membership_num").text(OrgInfo.MyOrganize.Membership);
        $("#maxmembership_num").text(OrgInfo.MyOrganize.MaxMembership);
        $("#official_num").text(OrgInfo.MyOrganize.OfficialNumber);
        $("#maxofficial_num").text(OrgInfo.MyOrganize.MaxOfficialNumber);
        $("#boss_name").text(OrgInfo.BossName);        
        $("#union_job").text(UnionJob[MyMemberInfo.Privilege-1]);
        $("#union_addmoney").text(OrgEffectInfoLevelPer.AdditionalMoney);
        $("#union_addfood").text(OrgEffectInfoLevelPer.AdditionalGrain);
        $("#union_addmen").text(OrgEffectInfoLevelPer.AdditionalMen);
        $("#affiche_information").text(OrgInfo.MyOrganize.Affiche);
        if(MyMemberInfo.Privilege>=3)
        {
            var html="";        
            if(MyMemberInfo.Privilege==3)
                html+="<li><a href=\"#\" onclick=QuitOrg()>"+Lang["union_30"]+"</a></li>";
            if(MyMemberInfo.Privilege==4)
                html+="<li><a href=\"#\" id=\"union_1\" onclick=UnionPopUp(this.id)>"+Lang["union_41"]+"</a></li>";
    	    html+="<li><a href=\"#\" onclick=PopUpUnionInformation(0)>"+Lang["union_42"]+"</a></li>";
	        html+="<li><a href=\"#\" onclick=PopUpUnionInformation(1)>"+Lang["union_43"]+"</a></li>";
            $("#org_menu").html(html);        
        }
    //获取帮派事件信息
    Main.GetOrgNode(OrgName,OrgEventIndex,cb_GetOrgNode);
    }
    else if(OrgInfo.MyOrganize==null && OrgInfo.MyMember==null)//无帮派
    {
        MyOrgInfo=null;
        MyMemberInfo=null;
        $("#org_name").text(Lang["union_6"]);
    }
    else if(OrgInfo.MyOrganize==null && OrgInfo.MyMember!=null)//申请中
    {
        MyOrgInfo=null;
        MyMemberInfo=null;
        $("#org_name").text(Lang["union_1"]);    
        var html="";        
        html+="<li><a href=\"#\" onclick=\"CancelApplication()\">"+Lang["union_44"]+"</a></li>";
        $("#org_menu").html(html);
    }
        
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    //Main.ListMessage(CurTalkNum-4,cb_FreshChatRoomPage);    
}

//获取帮派事件信息回调
function cb_GetOrgNode(result)
{
    if(DataValidate(result)==false) return;
    OrgEventNodeInfo=result.value;
    if(OrgEventNodeInfo!=null && OrgEventNodeInfo[0].EventID==-1)
    OrgEventNodeInfo=null;
    CreateOrgEventInfo();
}

//显示事件信息
function CreateOrgEventInfo()
{
    var html="";
    if(OrgEventNodeInfo!=null)
    {
        for(var i=0;i<OrgEventNodeInfo.length;i++)
        {
            if(OrgEventNodeInfo[i].Flag==1 || OrgEventNodeInfo[i].Flag==2 || OrgEventNodeInfo[i].Flag==3)//区分事件颜色显示
            html+="<li><span>"+OrgEventNodeInfo[i].Time+"</span> <span class=\"style1\">"+OrgEventNodeInfo[i].Node+"!</span></li>";
            else
            html+="<li><span>"+OrgEventNodeInfo[i].Time+"</span> <span class=\"style2\">"+OrgEventNodeInfo[i].Node+"!</span></li>";
        }
       // OrgEventIndex=OrgEventNodeInfo[OrgEventNodeInfo.length-1].EventID;//记录最后一位事件编号
    }
    var tree=document.getElementById("eventlist");
    tree.innerHTML=html;
    html=null; 
}


function cb_GetMemberShipCountByState(result)
{
    if(DataValidate(result)==false) return;
    MaxCurPage = result.value;
    $("#man_num").text(UnionPersonNum);
    $("#maxman_num").text(MaxUnionPersonNum);
    //$("#apply_man_num_num1").text();
    $("#page_num").text(CurPage);
    $("#maxpage_num").text(MaxCurPage);
    Main.GetMyOrgnizeInfo(cb_FreshUnionPersonSum);
}

function cb_FreshUnionPersonSum(result)
{
    if(DataValidate(result)==false) return;
    OrgInfo=result.value;
    MyOrgInfo=OrgInfo.MyOrganize;
    MyMemberInfo=OrgInfo.MyMember;
    Main.GetMemberShipList(UserInfo.Organise,UnionPersonType ,CurPage,18,cb_FreshUnionPersonListPage);
}

function cb_FreshUnionPersonListPage(result)
{
    //if(DataValidate(result)==false) return;

    var html="";
    MemberList = result.value;
    html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="<thead>";
	html+="<tr>";
	html+="  <td width=\"123\">"+Lang["union_45"]+"</td>";
	html+="  <td width=\"123\">"+Lang["union_46"]+"</td>";
	html+="  <td width=\"61\">"+Lang["union_47"]+"</td>";
	html+="  <td width=\"70\">"+Lang["union_48"]+"</td>";
	html+="  <td width=\"52\">"+Lang["union_49"]+"</td>";
	html+="  <td width=\"70\">"+Lang["union_50"]+"</td>";
	html+="  <td width=\"39\"></td>";
	html+="  </tr>";
	html+="  </thead>";

    var x;
    var y;
    if(MemberList!=null)
    {
        for(var i=0;i<MemberList.length;i++)
        {
            x=Math.floor(MemberList[i].CityPosition%400);
            if(x==0)x=400;
            y=(Math.floor((MemberList[i].CityPosition-1)/400)+1);

	 	    html+="<tr>";
	        html+="    <td class=\"font_green\"><a href='#' onclick=SelectOrgPerson("+i+")><span class=\"font_green\">"+MemberList[i].UserName+"</span></a></td>";
	        html+="    <td>"+MemberList[i].CityName+"</td>";
	        html+="    <td>"+x+","+y+"</td>";
	        html+="    <td>"+UserLevel[MemberList[i].UserLevel-1]+"</td>";
	        html+="    <td>"+MemberList[i].Prosperity+"</td>";
	        html+="    <td>"+OrgPrivilege[MemberList[i].Privilege]+"</td>";
	        html+="    <td><a href=\"#\" class=\"font_green\"  onclick=NewMail('"+MemberList[i].UserName+"')>"+Lang["union_51"]+"</a></td>";
	        html+="</tr>";
        }    
    }
    
  	html+="</table>";
    $("#personlist").html(html);
    html=null;
    
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    //Main.ListMessage(CurTalkNum-4,cb_FreshChatRoomPage);
}

function cb_GetOrganizeCount(result)
{
    if(DataValidate(result)==false) return;
    MaxCurPage = result.value;
    $("#pagenumxxx").text(CurPage);
    $("#maxpagenumxxx").text(MaxCurPage);
    Main.GetOrganizeList("",CurPage,11,cb_FreshUnionsListPage);
}

function cb_FreshUnionsListPage(result)
{
    if(DataValidate(result)==false) return;

    OrgList = result.value;
    var html="";
   	html+="				<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="				  <thead>";
	html+="				  <tr>";
	html+="				    <td width=\"35\">"+Lang["union_52"]+"</td>";
	html+="				    <td width=\"88\">"+Lang["union_53"]+"</td>";
	html+="				    <td width=\"70\">"+Lang["union_54"]+"</td>";
	html+="				    <td width=\"70\">"+Lang["union_55"]+"</td>";
	html+="				    <td width=\"123\">"+Lang["union_5"]+"</td>";
	html+="				    <td width=\"79\">"+Lang["union_56"]+"</td>";
	html+="				    <td width=\"73\">"+Lang["union_57"]+"</td>";
	html+="				  </tr>";
	html+="				  </thead>";
    
    for(var i=0;i<OrgList.length;i++)
    {
       	html+="<tr>";
	    html+="   <td>"+((CurPage-1)*11+i+1)+"</td>";
	    html+="   <td><a href='#' onclick='SelectOrg("+i+")'><span class=\"font_green\">"+OrgList[i].OrgName+"</span></a></td>";
	    html+="   <td>"+OrgList[i].OrgLevel+"</td>";
	    html+="   <td>"+OrgList[i].Membership+"</td>";
	    html+="   <td><a href='#' onclick=NewMail('"+OrgList[i].Boss+"')>"+OrgList[i].Boss+"</a></td>";
	    html+="   <td>"+OrgList[i].CreateDateStr+"</td>";
	    if(UserInfo.Organise=="")
	        html+="<td><a href='#' onclick=ApplyJoin('"+OrgList[i].OrgName+"')>"+Lang["union_58"]+"</a></td>";
	    else
	        html+="<td></td>";
	    html+="</tr>";
    }
    html+="</table>";
    $("#orglist").html(html);
    html="";
     Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    //Main.ListMessage(CurTalkNum-4,cb_FreshChatRoomPage);
}

function ChatRoomBottom()
{
    var k;
    if(ViewUnionType==3)
        k = document.getElementById("mainchatcontent");
    else
        k = document.getElementById("chatwindow");
    k.scrollTop += k.offsetHeight+655350;
}

function cb_FreshChatRoomPage(result)
{
    //if(DataValidate(result)==false) return;
    var list = result.value;
    
    if(list==null)
    {
        DataTranslateEnd();
        return;
    }

    var type;
    var html=$("#messagelist").html();    
    for(var i=0;i<list.length;i++)
    {
        if(list[i].JuntaType)
            type=1;
        else
            type=0;
        html+=Message2Text(type,list[i].UserName,list[i].Words,list[i].LastTalkTime);
        CurTalkNum=list[i].TalkNum;
    }
    $("#messagelist").html(html);    
    html=null;

    ChatRoomBottom();    
}

function CreateOrg()
{
   var orgname=$("#input_org_name").val();
   var orgintro=$("#input_org_intro").val();

   HidePopUp();
         
   if(orgname=="" || orgintro=="")
        ShowMessageBox(Lang["union_59"]);
   else
        Main.CreateOrg(CityID, orgname, orgintro,cb_CreateOrg);
}

function cb_CreateOrg(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        Main.GetUserInfo(cb_GetUserOrgInfo);
    }
    else
    {
        var error_text;
        switch(result.value)
        {
            case 519:
                error_text=Lang["union_60"];
                break;
            case 518:
                error_text=Lang["union_61"];
                break;
            case 520:
                error_text=Lang["union_62"];
                break;
            case 521:
                error_text=Lang["union_63"];
                break;
            default:
                error_text=Lang["union_64"];
                break;
        }
        ShowMessageBox(error_text);
    }
}

//解散帮派
function DisbandOrg()
{
    var orgname=MyMemberInfo.OrgName;
    Main.DisbandOrg(orgname,cb_DisbandOrg);
}

//解散后要干的
function cb_DisbandOrg(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    Main.GetUserInfo(cb_GetUserOrgInfo);
}

function cb_GetUserOrgInfo(result)
{
    if(DataValidate(result)==false) return;
    UserInfo=result.value;
    if(UserInfo.Organise!="")
        $("#userUnit").html(UserInfo.Organise);
    else
        $("#userUnit").html(Lang["union_6"]);
    CreateUnionPage();
}

//退出帮派
function QuitOrg()
{
    Main.QuitOrganize(UserInfo.Organise,cb_QuitOrg);
}

function cb_QuitOrg(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        ShowMessageBox(Lang["union_65"]);
        Main.GetUserInfo(cb_GetUserOrgInfo);
    }
    else
    {
        var error_text;
        switch(result.value)
        {
            case 527:
                error_text=Lang["union_66"];
                break;
            default:
                error_text=Lang["union_67"]+result.value;
                break;
        }
        ShowMessageBox(error_text);
    }
}

function ModifyOrgInformation(type)
{
    var affiche=$("#input_org_information").val();
    
    HidePopUp();
    
    if(type==0)
        Main.ModifyOrgIntro(UserInfo.Organise, affiche,cb_ModifyOrgInformation);
    else
        Main.ModifyOrgAffiche(UserInfo.Organise, affiche,cb_ModifyOrgInformation);
}

function cb_ModifyOrgInformation(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
        FreshUnionPage();
    else
    {
        var error_text;
        switch(result.value)
        {
            case 525:
                error_text=Lang["union_68"];
                break;
            default:
                error_text=Lang["union_67"]+result.value;
                break;
        }
        ShowMessageBox(error_text);
    }
}

function Message2Text(type,who,message,time)
{
    var html="<dl class=\"msg\">";
    switch(type)
    {
       case 0:
         html+="<dt>"+Lang["union_69"]+"</dt>"; 
         break;
       case 1:
         html+="<dt>"+Lang["union_70"]+"</dt>"; 
         break;
       case 2:
         html+="<dt>"+Lang["union_71"]+"</dt>"; 
         who="";
         break;
       default:
         break;
    }
    if(UserInfo.Organise!="")
	html+="<dd><b>"+who+"</b>"+Lang["union_72"]+""+message+" <span style=\"font-size:10px;color:gray;\">["+time+"]</span></dd>";
	else
	html+="<dd><b>"+who+"</b>"+Lang["union_72"]+""+message+"</dd>";
	html+="</dl>";
	    
    return html;
}

function SendMessage()
{
    var message=$("#input_line").val();
    //$("#input_line").val("");
     
    if(UserInfo.Organise=="")
    {
        var message_text=Message2Text(2,UserInfo.Name,Lang["union_73"]);
        $("#messagelist").html(message_text);
    }
    else if(message!="")
    {
        Main.SendMessage("",message,cb_SendMessage);
       // var message_text=Message2Text(0,UserInfo.Name,message);
       // $("#messagelist").html($("#messagelist").html()+message_text);
       // ChatRoomBottom();
    }
}

function cb_SendMessage(result)
{
   if(DataValidate(result)==false) return;
   switch(result.value)
   {
    case 0:
        $("#input_line").val("");
        Main.ListMessage(CurTalkNum,cb_FreshChatRoomPage);
       break;
    case 30107:
        alert(Lang["union_74"]);
        break;
    case 3:
        ShowMessageBox(Lang["union_75"]);
        break;
    default:
        ShowMessageBox(Lang["union_76"]+result.value);
        break;
   }        
}

function UnionSearch()
{
    UnionSearchWord=$("#input_search").val();
    CurPage=1;
    var reg = /^(\w|[\u4E00-\u9FA5])*$/;
    if(!UnionSearchWord.match(reg))
    {
        ShowMessageBox(Lang["union_133"]);
        return false;
    }  
    Main.GetOrganizeList(UnionSearchWord,CurPage,11,cb_FreshUnionsListPage);
}

//后翻
function UnionPageUp()
{
    if(CurPage<=1)
    return;    
    CurPage--;
    FreshUnionPage();
}

//前翻
function UnionPageDown()
{
    if(CurPage>=MaxCurPage)
    return;
    CurPage++;
    FreshUnionPage();
}

function ChangeUnionPersonType(id)
{
    var t = id.split("_"); 
    UnionPersonType=parseInt(t[1]);
    UnionPersonState=parseInt(t[2]);
    CurPage=1;
    FreshUnionPage();
}

function MailAll()
{
    
}

function ShowMyOrgIntro()
{
    if(MyOrgInfo==null)
        return;
    var html=HtmlTreeNode(MyOrgInfo,NodeTheOrg,0);
    HideEventList();
    var tree=document.getElementById("trees");
    tree.innerHTML=html;    
    html=null;
    //更新树节点操作按钮的状态 
    UpdateTreeHandleState(NodeTheOrg);
    $("#unionintro").text(MyOrgInfo.Intro);       
    //开启第1个标签
    OpenTheFirstNode(); 
}

function SelectOrgPerson(index)
{
    if(MemberList!=null && MemberList[index]!=null)
    {
        //window.alert("aaaa");

        TheMemberInfo=MemberList[index];
       
        //显示选中框
        var left=10;
	    var top=53;
        $("#img_select_4").css({"left":left,"top":top});
        $("#img_select_4").show();

        var html=HtmlTreeNode(TheMemberInfo,NodeTheMember,0);

        HideEventList();
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        html=null;
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(NodeTheMember);
            
        //开启第1个标签
        OpenTheFirstNode();
    }
}

//点击帮派名称
function SelectOrg(index)
{
    if(OrgList!=null && OrgList[index]!=null)
    {
        TheOrgInfo=OrgList[index];
        Main.GetOrgInfo(TheOrgInfo.OrgName,cb_SelectOrg);
    }
}

function cb_SelectOrg(result)
{
    if(DataValidate(result)==false) return;

    if(TheOrgInfo!=null)
    {
        TheOrgInfo.Intro=result.value;

        var html=HtmlTreeNode(TheOrgInfo,NodeTheOrg,0);

        HideEventList();
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        html=null;
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(NodeTheOrg);
        
        $("#unionintro").text(TheOrgInfo.Intro);    
        //开启第1个标签
        OpenTheFirstNode();
    }
}

function ApplyJoin(orgname)
{
    Main.ApplyJoinUnion(CityID, orgname,cb_ApplyJoin);
}

function cb_ApplyJoin(result)
{
    if(result.value==0)
         ShowMessageBox(Lang["union_77"]);
    else
    {
        var error_text;
        switch(result.value)
        {
            case 523:
                error_text=Lang["union_78"];
                break;
            case 522:
                error_text=Lang["union_79"];
                break;        
            case 518:
                error_text=Lang["union_80"];
                break;
            case 520:
                error_text=Lang["union_81"];
                break;
            default:
                error_text=Lang["union_76"]+result.value;
                break;
        }
        ShowMessageBox(error_text);
    }
}

function BossFunc(type,to_username)
{
    Main.BossFunc(UserInfo.Organise,type,to_username,cb_BossFunc);
}

function cb_BossFunc(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        ShowMessageBox(Lang["union_82"]);
        FreshUnionPage();
        $("#trees").empty();
    }
    else
    {
        var error_text="";
        switch(result.value)
        {
        case 523:
            error_text=Lang["union_83"];
            break;
        case 522:
            error_text=Lang["union_84"];
            break;
        case 518:
            error_text=Lang["union_85"];
            break;
        case 520:
            error_text=Lang["union_86"];
            break;
        case 525:
            error_text=Lang["union_87"];
            break;
        default:
            error_text=Lang["union_67"]+result.value;
            break;
        }
        ShowMessageBox(error_text);    
    }
}

//创建帮派弹出框
function PopUpBuildUnion()
{
    var html="";
    var team;
    var left=GetLeftValue(428)
    $("#popup").css("left",left);
    $("#popup").css("top","142px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div id=\"buildunion\">";       
    html+="<p>"+Lang["union_88"]+"</p><ul>"; 
    html+="<li>"+Lang["union_89"]+"<input class=\"input_orgname\" id='input_org_name' maxlength='10'/></li>"; 
    html+="<li class=\"orgleft font_small\">"+Lang["union_90"]+"</li>"; 
    html+="<li class=\"orgleft font_small\">"+Lang["union_91"]+"</li>"; 
    html+="<li class=\"headfont\">"+Lang["union_92"]+"</li>"; 
    html+="<li><textarea id='input_org_intro'  maxlength='600'></textarea></li>"; 
    html+="<li class=\"font_small\">"+Lang["union_90"]+"</li>"; 
    html+="<li class=\"font_small\">"+Lang["union_93"]+"</li>"; 
    html+="<li class=\"headfont\">"+Lang["union_94"]+"</li><li>"; 
    html+="<table width=\"248\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>"; 
    html+="<td width=\"22\"><img src=\"img/4/1.gif\" /></td>"; 
    html+="<td width=\"46\">20000</td>"; 
    html+="<td width=\"22\"><img src=\"img/4/2.gif\" /></td>";
    html+="<td width=\"46\">20000</td>"; 
    html+="<td width=\"22\"><img src=\"img/4/3.gif\" /></td>";
    html+="<td width=\"38\">2000</td>";
    html+="<td width=\"22\"><img src=\"img/4/4.gif\" /></td>";
    html+="<td width=\"27\">0</td> </tr></table></li></ul>";
    html+="<ul id=\"orgbutton\">";
    html+="<li><a href=\"#\" onmousedown=CreateOrg()>"+Lang["union_95"]+"</a></li>";
    html+="<li><a href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["union_96"]+"</a></li></ul>";
    html+="</div>"; 
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
     var tree=document.getElementById("popup");
     tree.innerHTML=html;    
     html=null;
    $(".common_popup").css("width","428px")
    $(".common_popup").css("height","316px")
    $(".common_popup1").css("width","424px")
    $(".common_popup1").css("height","302px")
   $("#popup").show();
   $("#overlay").show();
}


//发布公告弹出框
function PopUpUnionInformation(type)
{
    var html="";
    var team;
    var left=GetLeftValue(428)
    $("#popup").css("left",left);
    $("#popup").css("top","142px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(\"0\")><img src=\"img/o/22.gif\"/></a>";
    html+="<div id=\"releasemessage\">";       
    html+=(type==0?"<p>"+Lang["union_97"]+"</p>":"<p>"+Lang["union_97"]+"</p>");
    html+="<ul><li></li>";
    html+="<li><textarea  id='input_org_information'  maxlength='600'></textarea></li>";
    html+="<li class=\"font_small\">"+Lang["union_90"]+"</li>";
    html+="<li class=\"font_small\">"+Lang["union_98"]+"</li></ul>";
    html+="<ul id=\"orgbutton\">";
    html+="<li><a href=\"#\" onclick=ModifyOrgInformation("+type+")>"+Lang["union_99"]+"</a></li>";
    html+="<li><a href=\"#\" onmousedown=PopUpNotDo(\"0\")>"+Lang["union_96"]+"</a></li>";
    html+="</ul>";
    html+="</div>"; 
    html+="</div>";
    html+="</div>";
    //$("#popup").html(html);
     var tree=document.getElementById("popup");
     tree.innerHTML=html;    
     html=null;
    $(".common_popup").css("width","428px")
    $(".common_popup").css("height","316px")
    $(".common_popup1").css("width","424px")
    $(".common_popup1").css("height","302px")
    if(type==1)
        $("#input_org_information").text($("#affiche_information").html());
   $("#popup").show();
   $("#overlay").show();
}

//取消申请入会
function CancelApplication()
{
    var orgname=OrgInfo.MyMember.OrgName;
    Main.QuitOrganize(orgname,cb_CancelApplication);
}

function cb_CancelApplication(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        ShowMessageBox(Lang["union_100"]);
        Main.GetUserInfo(cb_GetUserOrgInfo);
    }
}

//任命副帮主
function AppointLeader()
{
    var bossName=MyMemberInfo.UserName;
    var orgName=MyMemberInfo.OrgName;
    var deputyName=TheMemberInfo.UserName;
    Main.Promotion(bossName,orgName,deputyName,cb_Promotion);
}

function cb_Promotion(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();//再次请求信息
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

//解除副帮主
function RelieveLeader()
{
    var bossName=MyMemberInfo.UserName;
    var orgName=MyMemberInfo.OrgName;
    var deputyName=TheMemberInfo.UserName;
    Main.Demotion(bossName,orgName,deputyName,cb_RelieveLeader);
}

function cb_RelieveLeader(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();//再次请求信息
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}


//帮派确认框
function UnionPopUp(id)
{
    var html="";
    var t=id.split("_");
    var index=parseInt(t[1]);
    var left=GetLeftValue(166);
    $("#popup").css("left",left);
    $("#popup").css("top","257px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    if(index==1)
    html+="<p>"+Lang["union_101"]+"</p>";
    else if(index==2)
    html+="<p>"+Lang["union_102"]+"</p>";
    else if(index==3)
    html+="<p>"+Lang["union_103"]+"</p>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" id=\"Union_"+index+"\" onmousedown=\"UnionPopUpDo(this.id)\">"+Lang["union_99"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["union_96"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $("#popup").show();
    $("#overlay").show();
}

//确定执行
function UnionPopUpDo(id)
{
   var t=id.split("_");
   var index=parseInt(t[1]);
   if(index==1)
   DisbandOrg();
   else if(index==2)
   AbdicateAtUnion();
   else if(index==3)
   AbdicateAtUnion1();
   HidePopUp();
}

//帮助让位
function AbdicateAtUnion()
{
    var orgName=MyMemberInfo.OrgName;
    var haeresName=TheMemberInfo.UserName;
    Main.Abdication(orgName,haeresName,cb_Abdication);
}

//副帮主退位
function AbdicateAtUnion1()
{
    var orgName=MyMemberInfo.OrgName;
    var haeresName=null;
    Main.Abdication(orgName,haeresName,cb_Abdication);
}

function cb_Abdication(result)
{
    if(result.value==0)
    FreshUnionPage();
    $("#trees").empty();
}


//请求orgresinfo
function cb_GetMyOrgResInfo(result)
{
    if(DataValidate(result)==false) return;
    UserOrganizeResInfo=result.value;
    if(UserOrganizeResInfo!=null)
    {
        $("#union_prestige").text(UserOrganizeResInfo.PrestigeName);
        $("#union_fame").text(UserOrganizeResInfo.FameName);
        CreateOrgResNumber();//存储各类资源数量
        CreateMyOrgMaterial();//创建我的物资信息
        var PrestigeLevel = UserOrganizeResInfo.PrestigeLevel+1;
        if(PrestigeLevel>20)
        PrestigeLevel=20;
        Main.GetSDUserPrestige(PrestigeLevel,cb_NextGetSDUserPrestige);//获得声望信息
    }
}

//存储各类资源数量
function CreateOrgResNumber()
{
    OrgResNumber[0]=UserOrganizeResInfo.Pearl;
    OrgResNumber[1]=UserOrganizeResInfo.Crystal;
    OrgResNumber[2]=UserOrganizeResInfo.Agate;
    OrgResNumber[3]=UserOrganizeResInfo.WBowlder;
    OrgResNumber[4]=UserOrganizeResInfo.BBowlder;
    OrgResNumber[5]=UserOrganizeResInfo.Crusade;
    OrgResNumber[6]=UserOrganizeResInfo.JadeBook;
}

//我的信息-我的物资页面
function CreateMyOrgMaterial()
{
    var html="";
    html+="<div class=\"materiallogo\"></div>";
    html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"47\">"+Lang["union_104"]+"</td><td width=\"110\">"+Lang["union_105"]+"</td><td width=\"110\">"+Lang["union_106"]+"</td>";
    html+="<td width=\"79\">"+Lang["union_107"]+"</td><td width=\"63\">"+Lang["union_108"]+"</td><td width=\"63\">&nbsp;</td><td width=\"66\">&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_7"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FamePearl+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigePearl+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributePearl+"</td>";
    html+="<td>"+UserOrganizeResInfo.Pearl+"</td>";
    if(UserOrganizeResInfo.Pearl>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_1\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td>&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_8"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameCrystal+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeCrystal+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeCrystal+"</td>";
    html+="<td>"+UserOrganizeResInfo.Crystal+"</td>";
    if(UserOrganizeResInfo.Crystal>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_2\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td>&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_9"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameAgate+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeAgate+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeAgate+"</td>";
    html+="<td>"+UserOrganizeResInfo.Agate+"</td>";
    if(UserOrganizeResInfo.Agate>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_3\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td>&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_10"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameWBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeWBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeWBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.WBowlder+"</td>";
    if(UserOrganizeResInfo.WBowlder>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_4\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td>&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_11"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameBBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeBBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeBBowlder+"</td>";
    html+="<td>"+UserOrganizeResInfo.BBowlder+"</td>";
    if(UserOrganizeResInfo.BBowlder>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_5\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td>&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_12"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameCrusade+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeCrusade+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeCrusade+"</td>";
    html+="<td>"+UserOrganizeResInfo.Crusade+"</td>";
    if(UserOrganizeResInfo.Crusade>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_6\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    //html+="<td><a href=\"#\" id=\"utype_6\" onmousedown=\"GetOrgResByGold(this.id)\">获取物资</a></td>";
    html+="<td></td>";
    html+="<tr><td>"+Lang["union_13"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameJadeBook+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeJadeBook+"</td>";
    html+="<td>"+UserOrganizeResInfo.ContributeJadeBook+"</td>";
    html+="<td>"+UserOrganizeResInfo.JadeBook+"</td>";
    if(UserOrganizeResInfo.JadeBook>0 && UserInfo.Organise!="")
    html+="<td><a href=\"#\" id=\"type_7\" onmousedown=\"ContributeRes(this.id)\">"+Lang["union_109"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_110"]+"\">"+Lang["union_109"]+"</span></td>";
    html+="<td><a href=\"#\" id=\"utype_7\" onmousedown=\"GetOrgResByGold(this.id)\">"+Lang["union_111"]+"</a></td>";
    html+="</table>";
    var tree=document.getElementById("myorgmaterial");
    tree.innerHTML=html;   
    html=null;
}

//获得下一级声望信息
function cb_NextGetSDUserPrestige(result)
{
    if(DataValidate(result)==false) return;
    NextUserPrestigeInfo=result.value;
    var FameLevel = UserOrganizeResInfo.FameLevel+1;
    if(FameLevel>20)
    FameLevel = 20;
    Main.GetSDUserFame(FameLevel,cb_NextGetSDUserFame);//获得名望信息
}

//获得下级名望信息
function cb_NextGetSDUserFame(result)
{
    if(DataValidate(result)==false) return;
    NextUserFameInfo=result.value;
    CreateMyOrgRightPage();
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

//我的信息-名望声望页面
function CreateMyOrgRightPage()
{
    var html="";
    html+="<div class=\"honorlogo\"></div>";
    html+="<table width=\"414\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
    html+="<td width=\"54\">&nbsp;</td>";
    html+="<td width=\"36\">"+Lang["union_112"]+"</td>";
    html+="<td width=\"72\">"+Lang["union_113"]+"</td>";
    html+="<td width=\"108\">"+Lang["union_114"]+"</td>";
    html+="<td width=\"54\">"+Lang["union_115"]+"</td>";
    html+="<td width=\"36\">"+Lang["union_13"]+"</td>";
    html+="<td width=\"54\">&nbsp;</td></tr><tr>";
    html+="<td>"+Lang["union_116"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameLevel+"</td>";
    html+="<td>"+UserOrganizeResInfo.FameName+"</td>";
    html+="<td>"+UserOrganizeResInfo.AdditionalDefence+"%</td>";
    html+="<td>"+UserOrganizeResInfo.Fame+"</td>";
    html+="<td>"+UserOrganizeResInfo.JadeBook+"</td>";
    
    if(VersionInfo[0]=="51wan" || VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="pps")
        html+="<td><a href=\"fruition_help_CN.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="tw")
        html+="<td><a href=\"fruition_help_TW.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="il")
        html+="<td><a href=\"fruition_help_MY.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="vina")
        html+="<td><a href=\"fruition_help_VN.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    
    html+="<td>"+Lang["union_118"]+"</td>";
    if(UserOrganizeResInfo.FameLevel<20)
    {
        html+="<td>"+NextUserFameInfo.Level+"</td>";
        html+="<td>"+NextUserFameInfo.Name+"</td>";
        html+="<td>"+NextUserFameInfo.AdditionalDefence+"%</td>";
        html+="<td>"+NextUserFameInfo.NeedFame+"</td>";
        html+="<td>"+NextUserFameInfo.NeedJadeBook+"</td>";
    }
    else
    {
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
    }
    if((UserOrganizeResInfo.Fame-NextUserFameInfo.NeedFame)>=0 && (UserOrganizeResInfo.JadeBook-NextUserFameInfo.NeedJadeBook)>=0 && UserOrganizeResInfo.FameLevel<20)
    html+="<td><a href=\"#\" onmousedown=\"UpgradeFameLevel()\">"+Lang["union_119"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_120"]+"\">"+Lang["union_119"]+"<span></td>";
    html+="</tr></table>";
    html+="<div class=\"famelogo\"></div>";
    html+="<table width=\"414\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
    html+="<td width=\"54\">&nbsp;</td>";
    html+="<td width=\"36\">"+Lang["union_112"]+"</td>";
    html+="<td width=\"72\">"+Lang["union_113"]+"</td>";
    html+="<td width=\"108\">"+Lang["union_132"]+"</td>";
    html+="<td width=\"54\">"+Lang["union_121"]+"</td>";
    html+="<td width=\"36\">"+Lang["union_13"]+"</td>";
    html+="<td width=\"54\">&nbsp;</td></tr><tr>";
    html+="<td>"+Lang["union_116"]+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeLevel+"</td>";
    html+="<td>"+UserOrganizeResInfo.PrestigeName+"</td>";
    html+="<td>"+UserOrganizeResInfo.AdditionalAttack+"%</td>";
    html+="<td>"+UserOrganizeResInfo.Prestige+"</td>";
    html+="<td>"+UserOrganizeResInfo.JadeBook+"</td>";
    
    if(VersionInfo[0]=="51wan" || VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="pps")
        html+="<td><a href=\"fruition_help_CN.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="tw")
        html+="<td><a href=\"fruition_help_TW.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="il")
        html+="<td><a href=\"fruition_help_MY.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    else if(VersionInfo[0]=="vina")
        html+="<td><a href=\"fruition_help_VN.html\" target=_blank>"+Lang["union_117"]+"</a></td></tr><tr>";
    
    html+="<td>"+Lang["union_118"]+"</td>";
    if(UserOrganizeResInfo.PrestigeLevel<20)
    {
        html+="<td>"+NextUserPrestigeInfo.Level+"</td>";
        html+="<td>"+NextUserPrestigeInfo.Name+"</td>";
        html+="<td>"+NextUserPrestigeInfo.AdditionalAttack+"%</td>";
        html+="<td>"+NextUserPrestigeInfo.NeedPrestige+"</td>";
        html+="<td>"+NextUserPrestigeInfo.NeedJadeBook+"</td>";
    }
    else
    {
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>"; 
    }
     if((UserOrganizeResInfo.Prestige-NextUserPrestigeInfo.NeedPrestige)>=0 && (UserOrganizeResInfo.JadeBook-NextUserPrestigeInfo.NeedJadeBook)>=0 && UserOrganizeResInfo.PrestigeLevel<20)
    html+="<td><a href=\"#\" onmousedown=\"UpgradePrestigeLevel()\">"+Lang["union_119"]+"</a></td>";
    else
    html+="<td><span class=\"font_gray\" title=\""+Lang["union_120"]+"\">"+Lang["union_119"]+"<span></td>";
    html+="</tr></table>";
    var tree=document.getElementById("myorgright");
    tree.innerHTML=html;   
    html=null;
}

//请求当前帮派物资信息
function cb_GetDBOrgResource(result)
{
    if(DataValidate(result)==false) return;
    NowOrgResourceInfo=result.value;
    CreateNowOrgResPage();
    var orglevel = MyOrgInfo.OrgLevel;
    Main.GetSDOrgEffectByLevel(orglevel,cb_GetSDOrgEffectByLevel);//获得指定级别帮派效果
}

//取得当前级别下级帮派效果
function cb_GetSDOrgEffectByLevel(result)
{
    if(DataValidate(result)==false) return;
    OrgEffectInfo = result.value;
    var orglevel = MyOrgInfo.OrgLevel+1;
    if(orglevel>60)
    orglevel=60;
    Main.GetSDOrgEffectByLevel(orglevel,cb_NextGetSDOrgEffectByLevel);//获得下一级别帮派效果
}

//下级帮派效果
function cb_NextGetSDOrgEffectByLevel(result)
{
    if(DataValidate(result)==false) return;
    NextOrgEffectInfo = result.value;
    CreateOrgEffectInfoPage();
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}


//当前帮派物资显示 
function CreateNowOrgResPage()
{
    var html="";
    html+="<div class=\"orggoodslogo\"></div>";
    html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"68\">"+Lang["union_17"]+"</td><td width=\"59\">"+Lang["union_7"]+"</td><td width=\"59\">"+Lang["union_8"]+"</td><td width=\"59\">"+Lang["union_9"]+"</td>";
    html+="<td width=\"59\">"+Lang["union_10"]+"</td><td width=\"59\">"+Lang["union_11"]+"</td><td width=\"59\">"+Lang["union_12"]+"</td><td width=\"59\">"+Lang["union_13"]+"</td><td width=\"57\">&nbsp;</td> </tr><tr>";
    html+="<td>"+Lang["union_122"]+"</td>";
    html+="<td>"+NowOrgResourceInfo.Pearl+"</td>";
    html+="<td>"+NowOrgResourceInfo.Crystal+"</td>";
    html+="<td>"+NowOrgResourceInfo.Agate+"</td>";
    html+="<td>"+NowOrgResourceInfo.WBowlder+"</td>";
    html+="<td>"+NowOrgResourceInfo.BBowlder+"</td>";
    html+="<td>"+NowOrgResourceInfo.Crusade+"</td>";
    html+="<td>"+NowOrgResourceInfo.JadeBook+"</td>";    
    
    if(VersionInfo[0]=="51wan" || VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="pps")
        html+="<td><a href=\"fruition_help_CN.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="tw")
        html+="<td><a href=\"fruition_help_TW.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="il")
        html+="<td><a href=\"fruition_help_MY.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="vina")
        html+="<td><a href=\"fruition_help_VN.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    
    html+="</table>";
    var tree=document.getElementById("noworggoods");
    tree.innerHTML=html;   
    html=null;
}

//帮派当前级别/下一级效果资源显示
function CreateOrgEffectInfoPage()
{
    var html="";
    html+="<div class=\"orglevelup\"></div>";
    html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"55\">"+Lang["union_17"]+"</td><td width=\"48\">"+Lang["union_7"]+"</td><td width=\"48\">"+Lang["union_8"]+"</td><td width=\"48\">"+Lang["union_9"]+"</td>";
    html+="<td width=\"48\">"+Lang["union_10"]+"</td><td width=\"48\">"+Lang["union_11"]+"</td><td width=\"48\">"+Lang["union_13"]+"</td><td width=\"20\">&nbsp;</td><td width=\"27\">&nbsp;</td>";
    html+="<td width=\"20\">&nbsp;</td><td width=\"27\">&nbsp;</td><td width=\"20\">&nbsp;</td><td width=\"27\">&nbsp;</td><td width=\"54\">&nbsp;</td></tr><tr>";
    html+="<td>"+Lang["union_116"]+"</td>";
    html+="<td>"+NowOrgResourceInfo.Pearl+"</td>";
    html+="<td>"+NowOrgResourceInfo.Crystal+"</td>";
    html+="<td>"+NowOrgResourceInfo.Agate+"</td>";
    html+="<td>"+NowOrgResourceInfo.WBowlder+"</td>";
    html+="<td>"+NowOrgResourceInfo.BBowlder+"</td>";
    html+="<td>"+NowOrgResourceInfo.JadeBook+"</td>";
    html+="<td><img title=\""+Lang["union_27"]+"\" src=\"img/o/45.GIF\" /></td><td>"+OrgEffectInfo.AdditionalMoney+"%</td>";
    html+="<td><img title=\""+Lang["union_28"]+"\" src=\"img/o/46.GIF\" /></td><td>"+OrgEffectInfo.AdditionalGrain+"%</td>";
    html+="<td><img title=\""+Lang["union_29"]+"\" src=\"img/o/47.GIF\" /></td><td>"+OrgEffectInfo.AdditionalMen+"%</td>";
    
    if(VersionInfo[0]=="51wan" || VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="pps")
        html+="<td><a href=\"fruition_help_CN.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="tw")
        html+="<td><a href=\"fruition_help_TW.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="il")
        html+="<td><a href=\"fruition_help_MY.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    else if(VersionInfo[0]=="vina")
        html+="<td><a href=\"fruition_help_VN.html#l7\" target=_blank>"+Lang["union_117"]+"</a></td></tr>";
    
    html+="<tr><td>"+Lang["union_118"]+"</td>";
    if(MyOrgInfo.OrgLevel<60)
    {
        html+="<td>"+NextOrgEffectInfo.NeedPearl+"</td>";
        html+="<td>"+NextOrgEffectInfo.NeedCrystal+"</td>";
        html+="<td>"+NextOrgEffectInfo.NeedAgate+"</td>";
        html+="<td>"+NextOrgEffectInfo.NeedWBowlder+"</td>";
        html+="<td>"+NextOrgEffectInfo.NeedBBowlder+"</td>";
        html+="<td>"+NextOrgEffectInfo.NeedJadeBook+"</td>";
    }
    else
    {
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
        html+="<td>-</td>";
    }
    html+="<td><img title=\""+Lang["union_27"]+"\" src=\"img/o/45.GIF\" /></td><td>"+NextOrgEffectInfo.AdditionalMoney+"%</td>";
    html+="<td><img title=\""+Lang["union_28"]+"\" src=\"img/o/46.GIF\" /></td><td>"+NextOrgEffectInfo.AdditionalGrain+"%</td>";
    html+="<td><img title=\""+Lang["union_29"]+"\" src=\"img/o/47.GIF\" /></td><td>"+NextOrgEffectInfo.AdditionalMen+"%</td>";
    var s=GetConditionAboutOrg();
    if(s=="" && MyMemberInfo.Privilege>=3 && MyOrgInfo.OrgLevel<60)
    html+="<td><a href=\"#\" onmousedown=\"OrgLevelUp()\">"+Lang["union_119"]+"</a></td></tr>";
    else if(MyMemberInfo.Privilege<3)
    html+="<td></td>";
    else
    html+="<td><span class=\"font_gray\">"+Lang["union_119"]+"</span></td>";
    html+="</table>	";
    html+="<div class=\"orgtechnic\"></div>";
    html+="<div><table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td width=\"60\">科技名称</td><td width=\"275\">科技说明</td><td width=\"149\">当前效果</td><td width=\"54\">&nbsp;</td></tr>";
    html+="<tr><td>"+Lang["union_135"]+"</td><td>"+Lang["union_136"]+"</td><td>"+Lang["union_137"]+":95%</td><td>"+Lang["union_117"]+"</td></tr></table></div>";
    html+="<div class=\"changegoodspage\">";
    html+="<span><a href=\"#\" id=\"UnionResType_1\" onmousedown=\"ChangeUnionResType(this.id)\">"+Lang["union_123"]+"</a></span>";
    html+="<span style=\"padding-left:10px;\"><a href=\"#\" id=\"UnionResType_2\" onmousedown=\"ChangeUnionResType(this.id)\">"+Lang["union_124"]+"</a></span>";
    html+="<span style=\"padding-left:10px;\"><span title=\""+Lang["union_140"]+"\" style=\"color:gray;\">"+Lang["union_141"]+"</span></span>";
    html+="</div>";
    var tree=document.getElementById("orglevelupgoods");
    tree.innerHTML=html;   
    html=null;
}

//帮派物资/帮派捐献切换
function ChangeUnionResType(id)
{
    var UnionResType;
    var t = id.split("_");
    UnionResType=parseInt(t[1]);
    if(UnionResType==1)
    {
        ChangeUnionPageType("uniontype_5");//帮派物资
    }
    else
    {
        CreateOrgPersonResPage();//创建帮众捐献页面
        Main.GetMemberShipCountByStateOther(UserInfo.Organise,1,cb_GetMemberCountByState);
    }

}

//帮众捐献页面
function CreateOrgPersonResPage()
{
    var html="";
    html+="<div id=\"orgpersongoodslist\">";
    html+="</div>";
    html+="<div id=\"changeorgrestype\">";
    html+=" <table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
    html+=" <td width=\"75\"><span><a href=\"#\" id=\"UnionResType_1\" onmousedown=\"ChangeUnionResType(this.id)\">"+Lang["union_123"]+"</a></span></td>";
    html+="<td width=\"75\"><span><a href=\"#\" id=\"UnionResType_2\" onmousedown=\"ChangeUnionResType(this.id)\">"+Lang["union_124"]+"</a></span></td>";
    html+="<td width=\"75\"><span title=\""+Lang["union_140"]+"\" style=\"color:gray;\">"+Lang["union_141"]+"</span></td>";
    html+="<td width=\"148\">&nbsp;</td>";
    html+="<td width=\"60\"><a href=\"#\" onmousedown=\"UnionResPageUp()\">"+Lang["union_35"]+"</a></td>";
    html+="<td width=\"60\"><a href=\"#\" onmousedown=\"UnionResPageDown()\">"+Lang["union_36"]+"</a></td>";
    html+="<td width=\"45\"><span id=\"NowOrgResPage\">1</span>/<span id=\"MaxOrgResPage\">1</span></td>";
    html+="</tr></table>";
    html+="</div>";
    var tree=document.getElementById("orgcontent");
    tree.innerHTML=html;   
    html=null;                     
}

//帮众捐献页数
function cb_GetMemberCountByState(result)
{
    if(DataValidate(result)==false) return;
    MaxOrgResPage=result.value;
    $("#NowOrgResPage").text(OrgResPage);
    $("#MaxOrgResPage").text(MaxOrgResPage);
    var orgname=MyMemberInfo.OrgName;
    Main.GetOrgMembersRes(orgname,OrgResPage,15,cb_GetOrgMembersRes);
}

//获得帮众捐献信息
function cb_GetOrgMembersRes(result)
{
    if(DataValidate(result)==false) return;
    OrgMembersResInfo=result.value;
    if(OrgMembersResInfo==null && OrgMembersResInfo[0].State==-1)
    OrgMembersResInfo=null;
    if(OrgMembersResInfo!=null)
    CreateOrgPersonResContentPage();
}

//创建帮众捐献内容页面
function CreateOrgPersonResContentPage()
{
    var html="";
    html+="<div class=\"goodslistlogo\"></div>";
    html+="<table width=\"538\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr><td width=\"119\">"+Lang["union_45"]+"</td><td width=\"59\">"+Lang["union_7"]+"</td><td width=\"59\">"+Lang["union_8"]+"</td><td width=\"59\">"+Lang["union_9"]+"</td>";
    html+="<td width=\"59\">"+Lang["union_10"]+"</td><td width=\"59\">"+Lang["union_11"]+"</td><td width=\"59\">"+Lang["union_12"]+"</td><td width=\"65\">"+Lang["union_13"]+"</td></tr>";
    for (var i=0;i<OrgMembersResInfo.length;i++)
    {
        html+="<tr><td>"+OrgMembersResInfo[i].UserName+"</td>";
        html+="<td>"+OrgMembersResInfo[i].Pearl+"</td>";
        html+="<td>"+OrgMembersResInfo[i].Crystal+"</td>";
        html+="<td>"+OrgMembersResInfo[i].Agate+"</td>";
        html+="<td>"+OrgMembersResInfo[i].WBowlder+"</td>";
        html+="<td>"+OrgMembersResInfo[i].BBowlder+"</td>";
        html+="<td>"+OrgMembersResInfo[i].Crusade+"</td>";
        html+="<td>"+OrgMembersResInfo[i].JadeBook+"</td></tr>";
    }
    html+="</table>";
    var tree=document.getElementById("orgpersongoodslist");
    tree.innerHTML=html;   
    html=null;   
}

//后翻
function UnionResPageUp()
{
    if(OrgResPage<=1)
    return;    
    OrgResPage--;
    Main.GetMemberShipCountByStateOther(UserInfo.Organise,1,cb_GetMemberCountByState);
}

//前翻
function UnionResPageDown()
{
    if(OrgResPage>=MaxOrgResPage)
    return;
    OrgResPage++;
    Main.GetMemberShipCountByStateOther(UserInfo.Organise,1,cb_GetMemberCountByState);
}

//晋级名望
function UpgradeFameLevel()
{
    Main.UpgradeFameLevel(cb_UpgradeFameLevel);
}

//晋级名望
function cb_UpgradeFameLevel(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();
}

//晋级声望
function UpgradePrestigeLevel()
{
    Main.UpgradePrestigeLevel(cb_UpgradePrestigeLevel);
}

//晋级声望
function cb_UpgradePrestigeLevel(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();
}

//捐献物资
function ContributeRes(id)
{
    var type;
    var t = id.split("_");
    type=parseInt(t[1]);
    var html="";
    var left=GetLeftValue(232);
    $("#popup").css("left",left);
    $("#popup").css("top","238px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p style=\"text-align:center;\">"+Lang["union_109"]+"</p>";
    html+="<ul style=\"line-height:18px;\">";
    html+="<li><span>"+OrgResName[type-1]+"</span><input id=\"input_sendorgres\" class=\"input_sendorgres\" onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeSendOrgResInputGold("+type+")\"  />/"+OrgResNumber[type-1]+"</li>";
    html+="<li>"+Lang["union_125"]+"</li>";
    html+="<li>"+Lang["union_126"]+"</li>";
    html+="</ul>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=\"GetContributeRes("+type+")\">"+Lang["union_99"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["union_96"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","232px")
    $(".common_popup").css("height","124px")
    $(".common_popup1").css("width","228px")
    $(".common_popup1").css("height","110px")
    $(".common_popup2").css("width","198px")
    $(".common_popup2").css("height","86px")
    $(".common_popup2").css("margin-left","13px")
    var maxnum;
    maxnum=OrgResNumber[type-1];
    $("#input_sendorgres").val(maxnum);
    ChangeSendOrgResInputGold(type);
    $("#popup").show();
    $("#overlay").show();
}

//输入改变信息
function ChangeSendOrgResInputGold(type)
{
    var input=document.getElementById('input_sendorgres');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#input_sendorgres").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0;     
    var maxnum;
    maxnum=OrgResNumber[type-1];
    if(inputNum<0)
        inputNum=0;    
    if(inputNum>=maxnum)
        inputNum=maxnum;
    $("#input_sendorgres").val(inputNum);
}

//捐献物资
function GetContributeRes(type)
{
    var resnum=$("#input_sendorgres").val();
    var orgname=MyMemberInfo.OrgName;
    Main.ContributeRes(orgname,type,resnum,cb_ContributeRes);
    HidePopUp();
}

//捐献物资
function cb_ContributeRes(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();
}

//购买物资
function GetOrgResByGold(id)
{
    var t=id.split("_");
    OrgResType=parseInt(t[1]);
    Main.ResToGoldRateOfExchange(OrgResType,cb_ResToGoldRateOfExchange);
}

//购买资源
function cb_ResToGoldRateOfExchange(result)
{
    if(DataValidate(result)==false) return;
    OrgLevelPer=result.value;
    var PerNeedGold=0;//单个资源消耗元宝
    var gold=CityInteriorInfo.Gold;
    PerNeedGold = Math.round((1*OrgLevelPer)/100);
    if(gold-PerNeedGold>=0);
    BuyOrgResGold();
    if(gold-PerNeedGold<0)
    ShowPopUp("pop_25");
}

//购买资源
function BuyOrgResGold()
{
    var html="";
    var PerNeedGold=0;//单个资源消耗元宝
    var gold=CityInteriorInfo.Gold;
    PerNeedGold = Math.round((1*OrgLevelPer)/100);
    var left=GetLeftValue(228);
    $("#popup").css("left",left);
    $("#popup").css("top","223px");
    html+="<div class=\"common_popup\">";
    html+="<div class=\"common_popup1\">";
    html+="<a class=\"closepic\" href=\"#\" onmousedown=PopUpNotDo(this.id)><img src=\"img/o/22.gif\"/></a>";
    html+="<div class=\"common_popup2\">";
    html+="<p style=\"text-align:center;\">"+Lang["union_111"]+"</p>";
    html+="<p style=\"text-align:center;\"><input id=\"input_getorgres\" class=\"input_getorgres\" onkeydown=\"OnlyNum(event)\" onkeyup=\"ChangeGetOrgResInputGold()\"  /></p>";
    html+="<ul>";
    html+="<li>"+Lang["union_127"]+""+OrgResName[OrgResType-1]+""+Lang["union_128"]+"</li>";
    html+="<li><img style=\"margin-right:10px;\" src=\"img/4/4.gif\"/>"+PerNeedGold+"</li>";
    html+="<li>"+Lang["union_129"]+"</li>";
    html+="<li><img style=\"margin-right:10px;\" src=\"img/4/4.gif\"/><span id=\"totalorgresgold\"></span></li>";
    html+="</ul>";
    html+="</div>";
    html+="<div class=\"popup_button\">";
    html+="<a href=\"#\" onmousedown=\"GetContributeResSuc()\">"+Lang["union_99"]+"</a>";
    html+="<a style=\"margin-left:30px;\" href=\"#\" onmousedown=PopUpNotDo(this.id)>"+Lang["union_96"]+"</a>";
    html+="</div>";
    html+="</div>";
    html+="</div>";
    var tree=document.getElementById("popup");
    tree.innerHTML=html;    
    html=null;
    $(".common_popup").css("width","228px")
    $(".common_popup").css("height","154px")
    $(".common_popup1").css("width","224px")
    $(".common_popup1").css("height","140px")
    $(".common_popup2").css("width","194px")
    $(".common_popup2").css("height","114px")
    $(".common_popup2").css("margin-left","13px")
    var maxnum=1;
    $("#input_getorgres").val(maxnum);
    $("#totalorgresgold").text(PerNeedGold);
    $("#popup").show();
    $("#overlay").show();
    ChangeGetOrgResInputGold();
}

//购买资源输入
function ChangeGetOrgResInputGold()
{
    var PerNeedGold=0;//单个资源消耗元宝
    var gold=CityInteriorInfo.Gold;
    PerNeedGold = Math.round((1*OrgLevelPer)/100);
    var input=document.getElementById('input_getorgres');
    input.value=input.value.replace(/\D+/g,'');
    var s=$("#input_getorgres").val();
    var inputNum;
    if(s!="")
        inputNum=parseInt(s,10);
    else
        inputNum=0;     
    var maxnum;
    maxnum=Math.floor(gold/PerNeedGold);
    if(inputNum<0)
        inputNum=0;    
    if(inputNum>=maxnum)
        inputNum=maxnum;
     var gold1=0;
     gold1=inputNum*PerNeedGold;
    $("#input_getorgres").val(inputNum);
    $("#totalorgresgold").text(gold1);
}

//购买帮会升级资源
function GetContributeResSuc()
{
    var resnum=$("#input_getorgres").val();
    Main.BuyOrgRes(OrgResType,resnum,cb_BuyOrgRes);
    HidePopUp();
}

//购买资源
function cb_BuyOrgRes(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    FreshUnionPage();
}

//帮派升级资源条件判断
function GetConditionAboutOrg()
{
    var OrgConditionState = new Array();
    var result="";
    OrgConditionState[0] = NowOrgResourceInfo.Pearl-NextOrgEffectInfo.NeedPearl;
    OrgConditionState[1] = NowOrgResourceInfo.Crystal-NextOrgEffectInfo.NeedCrystal;
    OrgConditionState[2] = NowOrgResourceInfo.Agate-NextOrgEffectInfo.NeedAgate;
    OrgConditionState[3] = NowOrgResourceInfo.WBowlder-NextOrgEffectInfo.NeedWBowlder;
    OrgConditionState[4] = NowOrgResourceInfo.BBowlder-NextOrgEffectInfo.NeedBBowlder;
    OrgConditionState[5] = NowOrgResourceInfo.JadeBook-NextOrgEffectInfo.NeedJadeBook;
    for(var i=0;i<OrgConditionState.length;i++)
    {
        if(OrgConditionState[i]<0)
        return Lang["union_130"];
    }
    return result;
}

//帮会升级
function OrgLevelUp()
{
    Main.OrganizeUpgrade(UserInfo.Organise,cb_OrganizeUpgrade);
}

//帮会升级
function cb_OrganizeUpgrade(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    Main.GetMyOrgnizeInfo(cb_OrgLevelUp);
}

//帮会升级
function cb_OrgLevelUp(result)
{
    if(DataValidate(result)==false) return;
    OrgInfo=result.value;
    MyOrgInfo=OrgInfo.MyOrganize;
    MyMemberInfo=OrgInfo.MyMember;
    FreshUnionPage();
}

//世界聊天
function WorChatShow(){
    if($("#main").css("display")=="none")
    {
	    $("#main").show();
	    //CreateWorChat2RoomTimer();
	    Main.GetserverChatWords(WorTalkNum-20,cb_GetserverChatWords);
	}
	else
	{
        $("#main").hide();
        var html="";
        $("#ChatMessageList").html(html);
        //clearTimeout(worchatroomTimer);
    }
}

function ChatRoomBottom2(){
    var k;
    k = document.getElementById("ChatContent");
    k.scrollTop += k.offsetHeight+655350;  
}

function SendWorMessageByKey(e)
{
    var e=window.event || e;
    if(e.keyCode==13)
    {
        SendWorMessage();
        return false;
    }        
}

var wormessage = "";
function SendWorMessage()
{
    wormessage=$("#input_line_wor").val();
    //$("#input_line_wor").val("");
    if(wormessage!=""){
        Main.AddServerChatWords(wormessage,cb_AddServerChatWords);
    }
}

////显示聊天
//function cb_GetserverChatWords(result){
//    var list = result.value;
//    if(list==null)
//    {
//        DataTranslateEnd();
//        return;
//    }
//    var type = 1;
//    var html=$("#ChatMessageList").html();    
//    for(var i=0;i<list.length;i++)
//    {
//        html+=Message3Text(type,list[i].UserName,list[i].ChatWord);
//        WorTalkNum=list[i].NodeID;
//    }
//    var tree=document.getElementById("ChatMessageList");
//    tree.innerHTML=html;   
//    html=null;
//    ChatRoomBottom2(); 
//}

//显示聊天
function cb_GetserverChatWords(result){
    var list = result.value;
    if(list==null)
    {
        DataTranslateEnd();
        return;
    }
    
    var html="";
    //var html=$("#ChatMessageList").html();    
    for(var i=0;i<list.length;i++)
    {
        html=Message3Text(list[i].ChatType,list[i].UserName,list[i].ChatWord);
        WorTalkNum=list[i].NodeID;
        $("#ChatMessageList").append(html);
    }
//    var tree=document.getElementById("ChatMessageList");
//    tree.innerHTML=html;   
    html=null;
    ChatRoomBottom2(); 
}

//添加世界聊天
function cb_AddServerChatWords(result){
    if(DataValidate(result)==false) return;
    switch(result.value)
    {
        case 0:
            $("#input_line_wor").val("");
            worchatsign=1;
            Main.GetserverChatWords(WorTalkNum,cb_GetserverChatWords);
            break;
        case 546:
            alert(Lang["union_74"]);
            break;
        case 70010:
            alert(Lang["union_147"]);
            break;
        default:
            ShowMessageBox(Lang["union_76"]+result.value);
            break;
    }   
    worchatsign=0;  
}

function Message3Text(type,who,message)
{
    var html="<dl class=\"msg\">";
    //说话类型 0:玩家 1:系统 2:公告 3:招募 4:征服 5:脱离 6:宝箱 7:任务
    switch(type)
    {
        case 0:
            html+="<dt>"+Lang["union_70"]+"</dt>";//世界
            break;
        case 1:
            html+="<dt>"+Lang["union_71"]+"</dt>";//系统
            break;
        case 3:
            html+="<dt style=\"color:red;\">"+Lang["union_146"]+"</dt>";//招募
            break;
        case 4:
            html+="<dt style=\"color:red;\">"+Lang["union_143"]+"</dt>";//征服
            break;
        case 5:
            html+="<dt style=\"color:red;\">"+Lang["union_144"]+"</dt>";//脱离
            break;
        default:
            break;
    }

    if(type==0 && who==UserInfo.Name)//用户自身
        html+="<dd><b><span style=\"color:#F16F06\">"+Lang["union_131"]+" </span></b>"+Lang["union_72"]+" <span style=\"color:#0a6372;\">"+message+"</span></dd>";
    else if(type==0 && who!=UserInfo.Name)//其他用户
        html+="<dd><b>"+who+" </b>"+Lang["union_72"]+" <span style=\"color:#0a6372;\">"+message+"</span></dd>";
    else if(type==1)//系统
        html+="<dd><b><span style=\"color:red;\">"+Lang["union_71"]+" </span></b>: <span style=\"color:red;\">"+message+"</span></dd>";
    else if(type==3)//招募
    {
        var str1="<font style=\'color:#E04501;font-weight:bold;\'>[";
        var str2="]</font>";
        var str3="<font style=\'color:#72008b;font-weight:bold;\'>[";
        var str4="]</font>";
        //第二个参数中的 g 表示全部匹配,i表示忽略大小写
        var rega = new RegExp("{a}","gi");
        var regb = new RegExp("{b}","gi");
        var regc = new RegExp("{c}","gi");
        var regd = new RegExp("{d}","gi");
        message=message.replace(rega,str1); //全部替换
        message=message.replace(regb,str2); //全部替换
        message=message.replace(regc,str3); //全部替换
        message=message.replace(regd,str4); //全部替换
        html+="<dd><span style=\"color:red\">"+message+"</span></dd>";
    }
    else if(type==4 || type==5)//征服 || 脱离
    {
        var str1="<font style=\'color:#E04501;font-weight:bold;\'>[";
        var str2="]</font>";
        //第二个参数中的 g 表示全部匹配,i表示忽略大小写
        var rega = new RegExp("{a}","gi");
        var regb = new RegExp("{b}","gi");
        message=message.replace(rega,str1); //全部替换
        message=message.replace(regb,str2); //全部替换
        html+="<dd><span style=\"color:red\">"+message+"</span></dd>";
    }
    html+="</dl>";
	
    return html;
}
