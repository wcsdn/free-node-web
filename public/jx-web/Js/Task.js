
var TaskInfo;
var TaskNumber;
var TaskNameType = new Array(Lang["Task_1"],Lang["Task_2"],Lang["Task_3"],Lang["Task_4"],Lang["Task_5"],Lang["Task_6"],Lang["Task_7"],Lang["Task_8"]);
var TaskTwoType = 0;//剧情任务=0;日常任务=1;推广任务=2;合成任务=3;名匠任务=4;节日任务=5;交换任务=6;
var TaskNameIndex = 0;
var Resource=["task_0_331_0","task_1_332_0","task_2_333_0","task_3_334_0","task_4_335_0","task_5_336_0"];//6个交换资源
var SubType;
var SubTypeId;
var TypeCss;
var NameCss;
var Storytask;

//创建任务界面
function CreateTaskPage()
{
    var html="";
    html+="<div id=\"task\">";
    html+="    <div id=\"tasktitle\">";
    if(VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="il")
        html+="    <table width=\"430\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    else
        html+="    <table width=\"510\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="            <tr>";
    html+="                <td><a id=\"tasktype_0\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_9"]+"</a></td>";
    html+="                <td><a id=\"tasktype_1\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_10"]+"</a></td>";
    //推广任务
    if(VersionInfo[0]!="sina" && VersionInfo[0]!="kfc" && VersionInfo[0]!="kg" && VersionInfo[0]!="il" && VersionInfo[0]!="pps" && VersionInfo[0]!="tw")
        html+="            <td><a id=\"tasktype_2\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_11"]+"</a></td>";
    html+="                <td><a id=\"tasktype_3\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_12"]+"</a></td>";
    html+="                <td><a id=\"tasktype_4\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\"><span class=\"taskstyle_4\">"+Lang["Task_13"]+"</span></a></td>";
    html+="                <td><a id=\"tasktype_5\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\"><span class=\"taskstyle_5\">"+Lang["Task_14"]+"</span></a></td>";   
    html+="                <td><a id=\"tasktype_6\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_15"]+"</a></td>"; 
    html+="            </tr>";
    html+="        </table>";
    html+="    </div>";
    html+="    <div id=\"taskcontent\">";
    html+="        <div id=\"taskleft\"></div>";
    html+="        <div id=\"taskdetail\">";
    html+="            <p>"+Lang["Task_57"]+"</p>";
    html+="            <p>"+Lang["Task_58"]+"</p>";
    html+="            <p>"+Lang["Task_59"]+"</p>";
    html+="         </div>";
    html+="    </div>";
    html+="    <div id=\"taskfoot\">";
    html+="    </div>";
    html+="</div>";
    var tree=document.getElementById("mainpic");
    tree.innerHTML=html;
    html=null;
}

//创建左侧任务类型
function CreateTaskType()
{
    
    var html="";
    var task;
    var s="#tasktype_"+TaskTwoType;
    //名匠任务
    if(TaskTwoType==4)
        $(".taskstyle_4").css({"font-weight":"bold","text-decoration":"underline"});
    //节日任务
    else if(TaskTwoType==5)
        $(".taskstyle_5").css({"font-weight":"bold","text-decoration":"underline"});
    else
        $(s).css({"font-weight":"bold","text-decoration":"underline"})
    haveNewTask=0;
    //任务类型
    html+="";
    html+="<div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\""+ImgUrl+"o/79.gif\" /></div>";
    html+="    <div id=\"tasktype\">";
    if(TaskInfo!=null)
    {
        html+="    <ul>";
        for(var i=0;i<TaskInfo.length;i++)
        {
            task = TaskInfo[i];
            //未完成任务
            if(task.State==1)
            {
                haveNewTask=1;
                if(task.NameColor==1)//任务名称颜色控制字段<NameColor>0=默认色，1=红色，2=蓝色，3=紫色，4=金黄色
                    html+="<li><a class=\"taskname_3\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==2)
                    html+="<li><a class=\"taskname_4\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==3)
                    html+="<li><a class=\"taskname_5\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==4)
                    html+="<li><a class=\"taskname_6\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else
                    html+="<li><a class=\"taskname_2\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";        
            }
            //已完成任务
            if(task.State==2)
            {
                html+="<li><a class=\"taskname_1\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"FreshTaskName(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
            }
        }
        html+="    </ul>";
    }
    html+="    </div>";
    html+="    <div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\""+ImgUrl+"o/80.gif\" /></div>";
    //任务名称
    html+="    <div id=\"taskname\">";
    html+="    </div>";    
    var tree = document.getElementById("taskleft");
    tree.innerHTML=html;
    
    var html="";
    if(TaskTwoType==4)
    {
        html+="<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<td style=\"padding-left:0px;\" width=\"70\">"
        if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100)
            html+="<a class=\"linkstyle_3\" id=\"task_4_a\" onmousedown=\"GetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='font_green'>"+Lang["Task_38"]+"</span></a>";//寻访名匠
        else
            html+="<a id=\"notask_4_a\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/69.gif\"/></a>";
        html+="</td>";
        html+="<td style=\"padding-left:0px;\" width=\"145\">"    
        if(GetComposeTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100 && CityInteriorInfo.Gold>=1)
            html+="<a class=\"linkstyle_3\" id=\"task_4_b\" onmousedown=\"QuickGetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='needgold'>"+Lang["Task_39"]+"</span></a>";//快速寻访
        else
            html+="<a id=\"notask_4_b\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/70.gif\"/></a>";    
        html+="</td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/37.gif\"/></td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/36.gif\"/></td>";
        html+="<tr></tr></table>";   
    }
    var taskfoot = document.getElementById("taskfoot");
    taskfoot.innerHTML=html;
    var s="#tasktype_"+TaskTwoType;
    $(s).css({"font-weight":"bold","text-decoration":"underline"});
    CreateDefaultDetail();
}

//创建任务名称
function CreateTaskName(id)
{
    $("#taskdetail").html("");
    $("#taskfoot").html("");
    var html="";
    var task;
    var s="#tasktype_"+TaskTwoType;
    //名匠任务
    if(TaskTwoType==4)
        $(".taskstyle_4").css({"font-weight":"bold","text-decoration":"underline"});
    //节日任务
    else if(TaskTwoType==5)
        $(".taskstyle_5").css({"font-weight":"bold","text-decoration":"underline"});
    else
        $(s).css({"font-weight":"bold","text-decoration":"underline"})
    haveNewTask=0;
    //任务类型
    html+="";
    if(TaskInfo!=null)
    {
        html+="    <ul>";
        for(var i=0;i<TaskInfo.length;i++)
        {
            task = TaskInfo[i];
            var j=document.getElementById("task_"+i+"_"+task.ID+"_"+task.SubType);
            if(i==0 && j != null)//避免剧情任务id重名
            {
                i++;
                Storytask="task_"+i+"_"+task.ID+"_"+task.SubType;
            }
            //未完成任务
            if(task.State==1)
            {
                haveNewTask=1;
                if(task.NameColor==1)//任务名称颜色控制字段<NameColor>0=默认色，1=红色，2=蓝色，3=紫色，4=金黄色
                    html+="<li><a class=\"taskname_3\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==2)
                    html+="<li><a class=\"taskname_4\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==3)
                    html+="<li><a class=\"taskname_5\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else if(task.NameColor==4)
                    html+="<li><a class=\"taskname_6\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
                else
                    html+="<li><a class=\"taskname_2\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";        
            }
            //已完成任务
            if(task.State==2)
            {
                html+="<li><a class=\"taskname_1\" href=\"#\" id=\"task_"+i+"_"+task.ID+"_"+task.SubType+"\" onmousedown=\"CreateTaskDetail(this.id)\"><span>("+TaskNameType[task.NameType-1]+")</span>"+task.Name+"</a></li>";
            }             
        }
        html+="    </ul>";
    } 
    var tree = document.getElementById("taskname");
    tree.innerHTML=html;
    
    var html="";
    if(TaskTwoType==4)
    {
        html+="<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<td style=\"padding-left:0px;\" width=\"70\">"
        if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100)
            html+="<a class=\"linkstyle_3\" id=\"task_4_a\" onmousedown=\"GetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='font_green'>"+Lang["Task_38"]+"</span></a>";//寻访名匠
        else
            html+="<a id=\"notask_4_a\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/69.gif\"/></a>";
        html+="</td>";
        html+="<td style=\"padding-left:0px;\" width=\"145\">"    
        if(GetComposeTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100 && CityInteriorInfo.Gold>=1)
            html+="<a class=\"linkstyle_3\" id=\"task_4_b\" onmousedown=\"QuickGetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='needgold'>"+Lang["Task_39"]+"</span></a>";//快速寻访
        else
            html+="<a id=\"notask_4_b\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/70.gif\"/></a>";    
        html+="</td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/37.gif\"/></td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/36.gif\"/></td>";
        html+="<tr></tr></table>";   
    }
    var taskfoot = document.getElementById("taskfoot");
    taskfoot.innerHTML=html;
    
    var s="#tasktype_"+TaskTwoType;
    $(s).css({"font-weight":"bold","text-decoration":"underline"});
    
    $("#"+TypeCss).css({"font-weight":"normal"});
    TypeCss=id;
    $("#"+TypeCss).css({"font-weight":"bold"});
    if(Storytask!=null)//剧情任务加粗
        $("#"+Storytask).css({"font-weight":"bold"});
    CreateDefaultDetail();
}

//创建首次加载时的内容
function CreateDefaultDetail()
{
    html="";
    html+="<p>"+Lang["Task_57"]+"</p>";
    html+="<p>"+Lang["Task_58"]+"</p>";
    html+="<p>"+Lang["Task_59"]+"</p>";
    var tree = document.getElementById("taskdetail");
    tree.innerHTML=html;
}

//创建任务主体
function CreateTaskDetail(id)
{   
    var html="";
    var t = id.split("_");
    TaskNameIndex = parseInt(t[1]);
    if(TaskInfo[TaskNameIndex]==null)
        return;
    TaskNumber = parseInt(t[2]);
    var x=Math.floor(TaskInfo[TaskNameIndex].ConditonTargetPos%400);
        if(x==0)
            x=400;
        var y=(Math.floor((TaskInfo[TaskNameIndex].ConditonTargetPos-1)/400)+1); 
        html+="<div class=\"tasklogo\">";
        html+="<p class=\"font_bold\">"+TaskInfo[TaskNameIndex].Name+"</p>";
        html+="</div>";
        html+="<table class=\"table_task\" width=\"366\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<tr><td class=\"font_bold\" width=\"65\" valign=\"top\">"+Lang["Task_17"]+"</td>";
        html+="<td valign=\"top\">"+TaskInfo[TaskNameIndex].BeginDes+"</td></tr><tr>";
        html+="<td class=\"font_bold\" valign=\"top\">"+Lang["Task_18"]+"</td>";
        if(TaskInfo[TaskNameIndex].ConditionTarget==0)
            html+="<td>"+TaskInfo[TaskNameIndex].ActionDes+"</td></tr><tr>";
        else
            html+="<td>"+TaskInfo[TaskNameIndex].ConditonTargetName+"("+x+","+y+")"+TaskInfo[TaskNameIndex].ActionDes+"</td></tr><tr>";  
          
        html+="<td class=\"taskline_2\" valign=\"top\">"+Lang["Task_19"]+"</td>";
        
        //任务目标
        if(TaskInfo[TaskNameIndex].Type!=2)
        {
            var TaskObjType = TaskInfo[TaskNameIndex].NeedObjType;
            switch(TaskObjType)
            {   
                case 0:
                html+="<td class=\"taskline_2\"><p>"+TaskInfo[TaskNameIndex].TaskItemName+""+" "+"("+TaskInfo[TaskNameIndex].HasTaskItemNum+"/"+TaskInfo[TaskNameIndex].TaskItemNum+")";
                break;
                case 1:
                case 2:
                case 3:
                if(TaskInfo[TaskNameIndex].MainIndex==3)
                {
                    html+="<td class=\"taskline_2\"><p>"+TaskInfo[TaskNameIndex].NeedObjName+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")"; 
                }
                else
                {
                    html+="<td class=\"taskline_2\"><p>"+TaskInfo[TaskNameIndex].NeedObjName+" "+TaskInfo[TaskNameIndex].NeedObjValue+Lang["Task_20"];
                }
                case 4:
                if(TaskInfo[TaskNameIndex].ID==11)
                {
                    html+="<td class=\"taskline_2\"><p>"+Lang["Task_21"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                }
                if(TaskInfo[TaskNameIndex].ID==14)
                {
                    html+="<td class=\"taskline_2\"><p>"+Lang["Task_22"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                }
                break;
                case 5:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_23"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                break;
                case 6:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_24"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                break;
                case 7:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_25"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                break;
                case 8:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_26"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"%/"+TaskInfo[TaskNameIndex].NeedObjValue+"%)";
                break;
                case 9:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_27"]+""+" "+UserLevel[TaskInfo[TaskNameIndex].NeedObjValue-1];
                break;
                case 10:
                html+="<td class=\"taskline_2\"><img title=\""+Lang["Task_28"]+"\" src=\"img/4/1.gif\"/><span>("+CityInteriorInfo.Money+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")</span>";
                break;
                case 11:
                html+="<td class=\"taskline_2\"><img title=\""+Lang["Task_29"]+"\" src=\"img/4/2.gif\"/><span>("+CityInteriorInfo.Food+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")</span>";
                break;
                case 12:
                html+="<td class=\"taskline_2\"><img title=\""+Lang["Task_30"]+"\" src=\"img/4/3.gif\"/><span>("+CityInteriorInfo.Men+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")</span>";
                break;
                case 13:
                html+="<td class=\"taskline_2\"><img title=\""+Lang["Task_31"]+"\" src=\"img/4/4.gif\"/><span>("+CityInteriorInfo.Gold+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")</span>";
                break;
                case 15:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_32"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                break;
                case 16:
                html+="<td class=\"taskline_2\"><p>"+Lang["Task_33"]+""+" "+"("+TaskInfo[TaskNameIndex].HasCondition+"/"+TaskInfo[TaskNameIndex].NeedObjValue+")";
                break;
            }
            if(TaskInfo[TaskNameIndex].State==2)
            {
                html+="( <span class=\"font_red\">"+Lang["Task_34"]+"</span> )</p></td></tr>";
            }
            else if(TaskInfo[TaskNameIndex].State==1)
            {
                html+="( <span class=\"font_gray\">"+Lang["Task_35"]+"</span> )</p></td></tr>";
            }
        }
        
        //如果是交换任务
        else
        {
            html+="<td class=\"taskline_2\">";
            var j=0;
            while(TaskInfo[TaskNameIndex].CostItemList!=null && TaskInfo[TaskNameIndex].CostItemList[j]!=null && TaskInfo[TaskNameIndex].CostItemStateList!=null)
            {
                html+="<div>";
                html+="<img id='taskcostitem_"+TaskNameIndex+"_"+j+"' onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" class='task_item' src='"+PicPath+TaskInfo[TaskNameIndex].CostItemList[j].Icon+"'/>"
                html+="<span><font class=\"hquality_"+TaskInfo[TaskNameIndex].CostItemList[j].Quality+"\">"+TaskInfo[TaskNameIndex].CostItemList[j].Name+"</font>("+TaskInfo[TaskNameIndex].CostItemStateList[j]+"/1)</span>";
                html+="</div>";
                j++;
            }
            if((TaskInfo[TaskNameIndex].CostMoney+TaskInfo[TaskNameIndex].CostFood+TaskInfo[TaskNameIndex].CostMen+TaskInfo[TaskNameIndex].CostGold+TaskInfo[TaskNameIndex].CostInsignia)>0)
            {
                if(TaskInfo[TaskNameIndex].CostMoney>0)
                    html+="<div><img title=\""+Lang["Task_28"]+"\" src=\"img/4/1.gif\"/><span> "+TaskInfo[TaskNameIndex].CostMoney+"</span></div>";
                if(TaskInfo[TaskNameIndex].CostFood>0)
                    html+="<div><img title=\""+Lang["Task_29"]+"\" src=\"img/4/2.GIF\"/><span> "+TaskInfo[TaskNameIndex].CostFood+"</span></div>";
                if(TaskInfo[TaskNameIndex].CostMen>0)
                    html+="<div><img title=\""+Lang["Task_30"]+"\" src=\"img/4/3.GIF\"/><span> "+TaskInfo[TaskNameIndex].CostMen+"</span></div>";
                if(TaskInfo[TaskNameIndex].CostGold>0)
                    html+="<div><img title=\""+Lang["Task_31"]+"\" src=\"img/4/4.GIF\"/><span style='color:#710abf'> "+TaskInfo[TaskNameIndex].CostGold+"</span></div>";
                if(TaskInfo[TaskNameIndex].CostInsignia>0)
                    html+="<div><img title=\""+Lang["Task_54"]+"\" src=\"img/o/76.GIF\"/><span> "+TaskInfo[TaskNameIndex].CostInsignia+"</span></div>";
            }
            html+="<div>";
            if(TaskInfo[TaskNameIndex].State==2)
            {
                html+="( <span class=\"font_red\">"+Lang["Task_34"]+"</span> )</p></td></tr>";
            }
            else if(TaskInfo[TaskNameIndex].State==1)
            {
                html+="( <span class=\"font_gray\">"+Lang["Task_35"]+"</span> )</p></td></tr>";
            }
            html+="</div>";
            html+="</td>";
        }
        html+="<tr><td class=\"font_bold\" style=\"padding-top:10px;\" valign=\"top\">"+Lang["Task_36"]+"</td>";
        html+="<td style=\"padding-top:10px;\">";
        //任务奖励
        if((TaskInfo[TaskNameIndex].GetMoney+TaskInfo[TaskNameIndex].GetFood+TaskInfo[TaskNameIndex].GetMen)>0)
        {
            html+="<p id=\"taskprize\">";
            if(TaskInfo[TaskNameIndex].GetMoney>0)
                html+="<img title=\""+Lang["Task_28"]+"\" src=\"img/4/1.gif\"/><span>"+TaskInfo[TaskNameIndex].GetMoney+"</span>";
            if(TaskInfo[TaskNameIndex].GetFood>0)
                html+="<img title=\""+Lang["Task_29"]+"\" src=\"img/4/2.GIF\"/><span>"+TaskInfo[TaskNameIndex].GetFood+"</span>";
            if(TaskInfo[TaskNameIndex].GetMen>0)
                html+="<img title=\""+Lang["Task_30"]+"\" src=\"img/4/3.GIF\"/><span>"+TaskInfo[TaskNameIndex].GetMen+"</span>";
            html+="</p>";
        }
        if(TaskInfo[TaskNameIndex].GetItem!=null)
        {
            html+=HtmlTipsImg("taskitem_"+TaskNameIndex+"_"+TaskInfo[TaskNameIndex].GetItem.ItemType+"","",PicPath+TaskInfo[TaskNameIndex].GetItem.Icon);
        }
        if(TaskInfo[TaskNameIndex].State==2)
        {
            html+="<p style=\"margin-top:10px;\">"+TaskInfo[TaskNameIndex].EndDes+"</p>"; 
        }
        html+="</td></tr></table>";

    var tree = document.getElementById("taskdetail");
    tree.innerHTML=html;
    html=null;
    
    //任务尾部
    var dhtml="";
    dhtml+="<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    dhtml+="<tr>";
    if(TaskInfo!=null && TaskTwoType==0)
    {
        if(TaskInfo[TaskNameIndex].State==2)
        dhtml+="<td width=\"528\" align=\"center\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"GetTaskGoods()\" href=\"#\">"+Lang["Task_37"]+"</a></td>";
        else if(TaskInfo[TaskNameIndex].State==1)
        dhtml+="<td width=\"528\" align=\"center\"><a><img src=\""+ImgUrl+"o/37.gif\"/></a></td>";
    }
    if(TaskInfo!=null && (TaskTwoType==2 || TaskTwoType==3 || TaskTwoType==5))
    {
        if(TaskInfo[TaskNameIndex].State==2)
	    {
        	dhtml+="<td width=\"528\" align=\"center\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"GetOtherTaskGoods('"+id+"')\" href=\"#\">"+Lang["Task_37"]+"</a></td>";
        }
	    else if(TaskInfo[TaskNameIndex].State==1)
            dhtml+="<td width=\"528\" align=\"center\"><a><img src=\""+ImgUrl+"o/37.gif\"/></a></td>";
    }
    //交换资源
    if(TaskInfo!=null && TaskTwoType==6)
    {
        if(TaskInfo[TaskNameIndex].State==2)
	    {
        	dhtml+="<td width=\"528\" align=\"center\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"GetOtherTaskGoods('"+id+"')\" href=\"#\">"+Lang["Task_37"]+"</a></td>";
        }
	    else if(TaskInfo[TaskNameIndex].State==1)
            dhtml+="<td width=\"528\" align=\"center\"><a><img src=\""+ImgUrl+"o/37.gif\"/></a></td>";
    }
    if(TaskInfo!=null && (TaskTwoType==1 || TaskTwoType==4))
    {
        if(TaskTwoType==1)
            dhtml+="<td style=\"padding-left:25px;\" width=\"190\"><a><img id=\"notask_1\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) src=\""+ImgUrl+"o/35.gif\"/></a></td>";
        if(TaskTwoType==4)
        {
            dhtml+="<td style=\"padding-left:0px;\" width=\"70\">"
            if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100)
                dhtml+="<a class=\"linkstyle_3\" id=\"task_4_a\" onmousedown=\"GetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='font_green'>"+Lang["Task_38"]+"</span></a>";
            else
                dhtml+="<a id=\"notask_4_a\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/69.gif\"/></a>";
            dhtml+="</td>";
            dhtml+="<td style=\"padding-left:0px;\" width=\"145\">"    
            if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100 && CityInteriorInfo.Gold>=1)
                dhtml+="<a class=\"linkstyle_3\" id=\"task_4_b\" onmousedown=\"QuickGetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='needgold'>"+Lang["Task_39"]+"</span></a>";
            else
                dhtml+="<a id=\"notask_4_b\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/70.gif\"/></a>";    
            dhtml+="</td>";
            
        }
        if(TaskInfo[TaskNameIndex].State==2)
            dhtml+="<td width=\"129\"><a class=\"linkstyle_3\" style=\"color:#35c235;\" onmousedown=\"GetOtherTaskGoods('"+id+"')\" href=\"#\">"+Lang["Task_37"]+"</a></td>";
        else if(TaskInfo[TaskNameIndex].State==1)
            dhtml+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/37.gif\"/></td>";
                        
        dhtml+="<td><a class=\"linkstyle_3\" onmousedown=\"DeleteTask()\" href=\"#\">"+Lang["Task_40"]+"</a></td>";
    }
 
    dhtml+="</tr>";
    dhtml+="</table>";
        
    var tree = document.getElementById("taskfoot");
    tree.innerHTML=dhtml;
    dhtml=null;
    $("#"+NameCss).css({"font-weight":"normal"});
    NameCss=id;
    $("#"+id).css({"font-weight":"bold"});
}


//点击不同任务类型标签后执行
function ChangeTaskType(id)
{
    $("#taskdetail").html("");
    $("#taskfoot").html("");
    var s="#tasktype_"+TaskTwoType;
    if(TaskTwoType==4)
        $(".taskstyle_4").css({"font-weight":"normal","text-decoration":"none"});
    else if(TaskTwoType==5)
        $(".taskstyle_5").css({"font-weight":"normal","text-decoration":"none"});
    else
        $(s).css({"font-weight":"normal","text-decoration":"none"})
    var t = id.split("_");
    TaskTwoType = parseInt(t[1]);
    FreshTaskPage();
}

//请求任务信息
function FreshTaskPage()
{
    switch(TaskTwoType)
    {
        case 0:
            Main.GetTask(CityID,cb_GetTask);
            break;
        case 1:
        case 2:
            Main.GetOtherTaskSimple(CityID,TaskTwoType,cb_GetTask);
            break;
        case 3:
            Main.GetHeChengTaskSimple(CityID,cb_GetTask);
            break;
        case 4:
            Main.GetOtherTaskSimple(CityID,TaskTwoType,cb_GetTask);
            break;
        case 5:
            Main.GetFeastDayMissionSimple(CityID,cb_GetTask);
            break;
        case 6:
            Main.GetResExchangeMissionSimple(CityID,cb_GetTask);
            break;
    }
    DataTranslateBegin();   
}

//根据任务信息，组成任务界面
function cb_GetTask(result)
{
    if(DataValidate(result)==false) return;
        TaskInfo = result.value;
    if(TaskInfo!=null && TaskInfo[0].ID==-1)
        TaskInfo=null;
    if(TaskInfo!=null)
    {
        CreateTaskType();
    }
    else
    {
        CreateNullTask();
    }
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
    Teacher_Open();
}


//请求任务信息
function FreshTaskName(id)
{
    var t = id.split("_");
    SubType=parseInt(t[3]);
    SubTypeId=id;
    switch(TaskTwoType)
    {
        case 0:
            Main.GetTaskByType(CityID,SubType,cb_GetTaskName);
            break;
        case 1:
        case 2:
            Main.GetOtherTaskByType(CityID,TaskTwoType,SubType,cb_GetTaskName);
            break;
        case 3:
            Main.GetHeChengTaskByType(CityID,SubType,cb_GetTaskName);
            break;
        case 4:
            Main.GetOtherTaskByType(CityID,TaskTwoType,SubType,cb_GetTaskName);
            break;
        case 5:
            Main.GetFeastDayMissionByType(CityID,SubType,cb_GetTaskName);
            break;
        case 6:
            Main.GetResExchangeMissionByType(CityID,SubType,cb_GetTaskName);
            break;
    }
}

//根据任务信息，组成任务界面
function cb_GetTaskName(result)
{
    if(DataValidate(result)==false) return;
        TaskInfo = result.value;
    if(TaskInfo!=null && TaskInfo[0].ID==-1)
        TaskInfo=null;
    if(TaskInfo!=null)
    {
        CreateTaskName(SubTypeId);
        if(TaskInfo[TaskNameIndex]!=null)
            CreateTaskDetail("task_"+TaskNameIndex+"_"+TaskInfo[TaskNameIndex].ID+"_0"); 
        else
            CreateTaskDetail("task_0_"+TaskInfo[0].ID+"_0");
    }
}


//领取任务奖励
function GetTaskGoods()
{
    DataTranslateBegin(); 
    Main.GetTaskGoods(CityID,TaskNumber,cb_GetTaskGoods);  
}

function cb_GetTaskGoods(result)
{
      if(DataValidate(result)==false) return;
      if(result.value==0)
      {
          ShowMessageBox(Lang["Task_37"]);
          Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//领取奖励后请求内政信息  
      }
      else
      {   
          if(result.value==30055)
             ShowMessageBox(Lang["Task_41"]);
          DataTranslateEnd(); 
      }  
}

//日常任务数量
function GetNormalTaskNum()
{
    var num=0;
    if(TaskInfo!=null)
    {
        var i=0;
        while(TaskInfo[i]!=null)
        {
            if(TaskInfo[i].NameType==4)
            {   
                num++;
            }
            i++;
        }
    }   
    return num;
}

//名匠任务数量
function GetComposeTaskNum()
{
    var num=0;
    num=Main.GetComposeTaskNums(CityID,TaskTwoType).value;
    return num;
}

//领取日常任务
function GetNormalTask()
{
    HideTips();   
    //获得任务事件个数
    var eventNum=GetComposeTaskEventNum()+GetTaskEventNum();
    //获得已经存在日常任务数量
    var taskNum=GetNormalTaskNum();
    if(eventNum==0 && taskNum==0)
    {
        var html="<a id=\"notask_1\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/35.gif\"/></a>";
        $("#NormalTask").html(html);
        Main.AddDailyTaskEvent(CityID,cb_AddEvent);
    }
    else
    {
        if(eventNum>0)
            ShowMessageBox(Lang["Task_42"]);
        if(taskNum>0)
            ShowMessageBox(Lang["Task_43"]);
        
        if(taskNum==0)
            CreateNullTask();         
    }
}

//寻访名匠
function GetComposeTask()
{
    HideTips();   
    //获得任务事件个数
    var eventNum=GetComposeTaskEventNum()+GetTaskEventNum();
    //获得已经存在日常任务数量
    var taskNum=GetComposeTaskNum();
    if(eventNum==0 && taskNum<4)
    {
        DataTranslateBegin(); 
        Main.AddComposeTaskEvent(CityID,cb_AddEvent);
    }
    else
    {
        if(eventNum>0)
            ShowMessageBox(Lang["Task_42"]);
        if(taskNum>=3)
            ShowMessageBox(Lang["Task_44"]);
        
        if(taskNum==0)
            CreateNullTask();          
    }
}

//快速寻访名匠
function QuickGetComposeTask()
{
    HideTips();   
    //获得任务事件个数
    var eventNum=GetComposeTaskEventNum();
    //获得已经存在日常任务数量
    var taskNum=GetComposeTaskNum();
    if(eventNum==0 && taskNum<4)
    {
        DataTranslateBegin(); 
        Main.QuickGetComposeTask(CityID,cb_QuickGetComposeTask);
    }
    else
    {
        if(eventNum>0)
            ShowMessageBox(Lang["Task_42"]);
        if(taskNum>=3)
            ShowMessageBox(Lang["Task_44"]);
        
        if(taskNum==0)
            CreateNullTask();        
    }
}

function cb_QuickGetComposeTask(result)
{
    if(DataValidate(result)==false) return;
    
    if(result.value==0)
    {
        FreshTaskPage();
    }
    else 
    {
        DataTranslateEnd();
    }    
    
    displayTask();
}


//领取其他类型任务奖励
function GetOtherTaskGoods(id)
{
    DataTranslateBegin();
    if(TaskTwoType==3)
        Main.GetHeChengGoods(CityID,TaskNumber,cb_GetOtherTaskGoods);
    else if(TaskTwoType==5)
        Main.FeastDayMissionPrize(CityID,TaskNumber,cb_GetOtherTaskGoods);
    else if(TaskTwoType==6)
    {
        //6个资源类型
        var bool=isResource(id);
        if(bool)
        {
            ShowPopUp("pop_106");
            DataTranslateEnd();
        }
        else
            Main.ResExchangeMissionPrize(CityID,TaskNumber,cb_GetOtherTaskGoods);
    }
    else 
        Main.GetOtherTaskGoods(CityID,TaskNumber,cb_GetOtherTaskGoods);
        
}

function cb_GetOtherTaskGoods(result)
{
      if(DataValidate(result)==false) return;
      if(result.value==0)
      {
          
      
          if(TaskTwoType==3 || TaskTwoType==4 || TaskTwoType==5)
          {
              ShowMessageBox(Lang["Task_45"]);
          }
          else
              ShowMessageBox(Lang["Task_37"]);      
          Main.GetUserInfo(cb_GetUserTaskInfo);
      }
      else
      {   
          if(result.value==30055)
              ShowMessageBox(Lang["Task_41"]);
          DataTranslateEnd(); 
      }
      
      //显示下拦中的任务
      displayTask();
}

function cb_GetUserTaskInfo(result)
{
    if(DataValidate(result)==false) return;
        UserInfo=result.value;
    $("#userIns").text(UserInfo.Insignia);
    Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//领取奖励后请求内政信息  
}

//放弃任务
function DeleteTask()
{
   ShowPopUp("task_99");
}

function cb_DeleteTask(result)
{   
    if(result.value==0)
    {
        FreshTaskPage();
    }
    else
    {
        DataTranslateEnd();
    }    
    
    displayTask();
}

//创建没任务时页面
function CreateNullTask()
{
    var html="";
    html+="<div id=\"task\">";
    html+="    <div id=\"tasktitle\">";
    if(VersionInfo[0]=="sina" || VersionInfo[0]=="kfc" || VersionInfo[0]=="kg" || VersionInfo[0]=="il")
        html+="    <table width=\"430\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    else
        html+="    <table width=\"510\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="            <tr>";
    html+="                <td><a id=\"tasktype_0\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_9"]+"</a></td>";
    html+="                <td><a id=\"tasktype_1\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_10"]+"</a></td>";
    //推广任务
    if(VersionInfo[0]!="sina" && VersionInfo[0]!="kfc" && VersionInfo[0]!="kg" && VersionInfo[0]!="il" && VersionInfo[0]!="pps" && VersionInfo[0]!="tw")
        html+="            <td><a id=\"tasktype_2\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_11"]+"</a></td>";
    html+="                <td><a id=\"tasktype_3\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_12"]+"</a></td>";
    html+="                <td><a id=\"tasktype_4\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\"><span class=\"taskstyle_4\">"+Lang["Task_13"]+"</span></a></td>";
    html+="                <td><a id=\"tasktype_5\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\"><span class=\"taskstyle_5\">"+Lang["Task_14"]+"</span></a></td>";   
    html+="                <td><a id=\"tasktype_6\" onmousedown=\"ChangeTaskType(this.id)\" class=\"linkstyle_3\" href=\"#\">"+Lang["Task_15"]+"</a></td>"; 
    html+="            </tr>";
    html+="        </table>";
    html+="    </div>";        
    html+="    <div id=\"taskcontent\">";
    html+="        <div id=\"taskleft\">";
    html+="            <div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\""+ImgUrl+"o/79.gif\" alt=\"任务类型\" /></div>";
    html+="            <div id=\"taskname\"></div>";
    html+="            <div style=\"background:#E5F0F6; padding:3px 0;border-bottom:1px #808080 dashed;\"><img src=\""+ImgUrl+"o/80.gif\" alt=\"任务名称\" /></div>";
    html+="            <div id=\"tasktype\"></div>";    
    html+="        </div>";

    html+="        <div id=\"taskdetail\">";
    //你没有该类型的任务或该类型的任务已完成!
    if(TaskTwoType==0)
        html+="<p style=\"margin-top:20px;margin-left:10px;\">"+Lang["Task_46"]+"</p>";
    //说明
    //在游戏窗口左侧点击“没资源点我”获得推广链接，你的朋友使用你的推广链接注册帐号进入游戏后，当他的官位分别达到户长、里胥、里正、主簿、推官、判官、县丞、县令、知州、府尹时，你和你的朋友都可以获得一次推广奖励。每位玩家最多邀请3位朋友，次数有限，请谨慎使用，只邀请最好的朋友一起玩。
    if(TaskTwoType==2)
    {
        html+="<b>"+Lang["Task_51"]+"</b>";
        html+="<p>"+Lang["Task_47"]+"</p>";
    }
    //请点击“收集任务”获得一个日常任务!
    if(TaskTwoType==1 && GetTaskEventNum()==0)
        html+="<p style=\"margin-top:20px;margin-left:10px;\">"+Lang["Task_48"]+"</p>";
    //正在进行任务收集...
    if(TaskTwoType==1 && GetTaskEventNum()>0)
         html+="<p style=\"margin-top:20px;margin-left:10px;\">"+Lang["Task_49"]+"</p>";
    //点击下方“寻访名匠”按钮获得名匠任务,名匠可以打造蓝色品质的道具!     
    if(TaskTwoType==4 && GetComposeTaskNum()==0)
        html+="<p style=\"margin-top:20px;margin-left:10px;\">"+Lang["Task_50"]+"</p>";
    //正在进行名匠寻访...
    if(TaskTwoType==4 && GetComposeTaskEventNum()>0)
         html+="<p style=\"margin-top:20px;margin-left:10px;\">"+Lang["Task_52"]+"</p>";      
    html+="</div>";
    html+="</div>";
    html+="<div id=\"taskfoot\">";
    if(TaskTwoType==1)
    {
        html+="<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetNormalTaskNum()==0 && CityInteriorInfo.Men>=50)
            html+="<td id=\"NormalTask\" style=\"padding-left:25px;\" onmousedown=\"GetNormalTask()\" width=\"190\"><a class=\"linkstyle_3\" id=\"task_1\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='font_green'>"+Lang["Task_53"]+"</span></a></td>";//收集任务
        else
            html+="<td style=\"padding-left:25px;\" width=\"190\"><a id=\"notask_1\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/35.gif\"/></a></td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/37.gif\"/></td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/36.gif\"/></td>";
        html+="<tr></tr></table>";   
    }
    
    if(TaskTwoType==4)
    {
        html+="<table width=\"528\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
        html+="<td style=\"padding-left:0px;\" width=\"70\">"
        if(GetComposeTaskEventNum()+GetTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100)
            html+="<a class=\"linkstyle_3\" id=\"task_4_a\" onmousedown=\"GetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='font_green'>"+Lang["Task_38"]+"</span></a>";//寻访名匠
        else
            html+="<a id=\"notask_4_a\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/69.gif\"/></a>";
        html+="</td>";
        html+="<td style=\"padding-left:0px;\" width=\"145\">"    
        if(GetComposeTaskEventNum()==0 && GetComposeTaskNum()<4 && CityInteriorInfo.Men>=100 && CityInteriorInfo.Gold>=1)
            html+="<a class=\"linkstyle_3\" id=\"task_4_b\" onmousedown=\"QuickGetComposeTask()\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id) href=\"#\"><span class='needgold'>"+Lang["Task_39"]+"</span></a>";//快速寻访
        else
            html+="<a id=\"notask_4_b\" onmouseout=HideTips(this.id) onmouseover=ShowTips(event,this.id)><img src=\""+ImgUrl+"o/70.gif\"/></a>";    
        html+="</td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/37.gif\"/></td>";
        html+="<td width=\"129\"><a><img src=\""+ImgUrl+"o/36.gif\"/></td>";
        html+="<tr></tr></table>";   
    }
    
    html+="</div>";
    html+="</div>";
    var tree = document.getElementById("mainpic");
    tree.innerHTML=html;
    var s="#tasktype_"+TaskTwoType;
    $(s).css({"font-weight":"bold","text-decoration":"underline"})
}


//判断是否为6个资源交换
function isResource(id)
{
    var i=0;
    var bool=false;
    while(Resource[i]!=null)
    {
        if(Resource[i]==id)
        {
            bool=true;
            break;
        }
        i++;
    }
    return bool;
}

//输入倍数后完成资源转换
function ResourceTask()
{
    var input=document.getElementById('input_presource');
    input.value=input.value.replace(/\D+/g,'');
    var inputNum=$("#input_presource").val();
    if(inputNum!="" && inputNum>=1 && inputNum<=100)
    {
        inputNum=parseInt(inputNum,10);
        Main.ResExchangeMissionPrizeByNum(CityID,TaskNumber,inputNum,cb_ResourceTask);
    }
    else
        ShowMessageBox(Lang["Task_55"]);
        
    displayTask();
}


function cb_ResourceTask(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
        ShowMessageBox(Lang["Task_37"]);
    else
        ShowMessageBox(Lang["Task_56"]);
    Main.GetUserInfo(cb_GetUserTaskInfo);
}

function displayTask()
{
      switch(TaskTwoType)
      {
        case 1:
        case 2:
            Main.GetOtherTaskByType(CityID,TaskTwoType,SubType,cb_GetTaskName);
            break;
        case 3:
            Main.GetHeChengTaskByType(CityID,SubType,cb_GetTaskName);
            break;
        case 4:
            Main.GetOtherTaskByType(CityID,TaskTwoType,SubType,cb_GetTaskName);
            break;
        case 5:
            Main.GetFeastDayMissionByType(CityID,SubType,cb_GetTaskName);
            break;
        case 6:
            Main.GetResExchangeMissionByType(CityID,SubType,cb_GetTaskName);
            break;
      }
}