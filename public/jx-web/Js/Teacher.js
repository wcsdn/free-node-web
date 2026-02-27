// JScript 文件
var last_teacher_content=new Array("","","","","","","","","","","","");
var teacher_content = {     
	"c1_1": Lang["Teacher_1"],
	"c1_2": Lang["Teacher_2"],
	"c1_3": Lang["Teacher_3"],
	"c1_4": Lang["Teacher_4"],
	"c1_5": '',
	"c1_6": Lang["Teacher_5"],
	"c1_7": Lang["Teacher_6"],
	"c1_8": Lang["Teacher_7"],
	"c1_9": Lang["Teacher_8"],
	"c1_10": Lang["Teacher_9"],
	"c1_11": Lang["Teacher_10"],
	"c1_12": Lang["Teacher_11"],
	"c2_1": Lang["Teacher_12"],
	"c2_2": Lang["Teacher_13"],
	"c2_3": Lang["Teacher_14"],
	"c2_4":Lang["Teacher_15"],
	"c2_5": Lang["Teacher_16"],
	"c2_6": Lang["Teacher_17"],
	"c2_7": Lang["Teacher_18"],
	"c3_1": Lang["Teacher_19"],
	"c3_2": Lang["Teacher_20"],
	"c3_3": Lang["Teacher_21"],
	"c3_4": Lang["Teacher_22"],
	"c3_5": Lang["Teacher_23"],
	"c3_6": Lang["Teacher_24"],
	"c3_7": Lang["Teacher_25"],
	"c3_8": Lang["Teacher_26"],
	"c3_9": Lang["Teacher_27"],
	"c4_1": Lang["Teacher_28"],
	"c4_2": Lang["Teacher_29"],
	"c4_3": Lang["Teacher_30"],
	"c4_4": Lang["Teacher_31"],
	"c5_1": Lang["Teacher_32"],
	"c5_2_1": Lang["Teacher_33"],
	"c5_2_2": Lang["Teacher_34"],
    "c5_3": Lang["Teacher_35"],
	"c5_4": '',
	"c5_5": Lang["Teacher_36"],
	"c5_6": Lang["Teacher_37"],
	"c5_7": Lang["Teacher_38"],
	"c5_8": Lang["Teacher_39"],
	"c5_9": Lang["Teacher_40"],
	"c5_10": Lang["Teacher_41"],
	"c5_11": Lang["Teacher_49"],
	"c5_12":Lang["Teacher_49"],
	"c8_1": Lang["Teacher_42"],
	"c10_1": Lang["Teacher_43"],
	"c10_2": Lang["Teacher_44"],
	"c10_3": Lang["Teacher_45"],
	"c11_1": Lang["Teacher_46"],
	"c0_0":Lang["Teacher_47"],
	"c0_1":Lang["Teacher_48"]
};

function Teacher_Open()
{
    var content="";
    if(HeroInfo!=null && haveWaitHero) 
    {
        //事件相关
        content=teacher_content.c0_1;
    }
    else
    {
        switch (PageNum)
        {
            case 1://内政
                 if(MapUnitInfo.length==1) content=teacher_content.c1_1;                               
                 else if(JYTLevel==1 && MapUnitInfo.length>=3) content=teacher_content.c1_2;    
                 else if(JYTLevel==2 && TangCount==0) content=teacher_content.c1_3;             
                 else if(JYTLevel==2 && TangCount>0 && HeroCount==0) content=teacher_content.c1_4;
                 //else if(HeroInfo!=null) content=teacher_content.c1_5;
                 else if(JYTLevel==2 && GZFLevel==0) content=teacher_content.c1_6;
                 else if(JYTLevel==3 && GZFLevel==0) content=teacher_content.c1_7;
                 else if(JYTLevel==3 && GZFLevel>0) content=teacher_content.c1_8;
                 else if(JYTLevel==4 && haveKJ==0) content=teacher_content.c1_9;
                 else if(JYTLevel==4 && haveMK==0) content=teacher_content.c1_10;
                 else if(JYTLevel==4 && haveMK==1) content=teacher_content.c1_11;
                 else if(JYTLevel==5 && haveYWC==0) content=teacher_content.c1_12;
                 break;                
            case 2://城防
                 if(MapUnitInfo==null && HeroCount==0) content=teacher_content.c2_1;
                 else if(MapUnitInfo==null && HeroCount>0) content=teacher_content.c2_2;
                 else if(CFCount==0 && GZFLevel==0 && MapUnitInfo!=null) content=teacher_content.c2_3;
                 else if(CFCount==0 && MapUnitInfo!=null) content=teacher_content.c2_4;
                 else if(CFCount>0 && GZFLevel==1 && MapUnitInfo!=null) content=teacher_content.c2_5;
                 else if(CFXZ==1) content=teacher_content.c2_6;
                 else if(GZFLevel==2 && FSHeroCount<2) content=teacher_content.c2_7;
                 break;
            case 3://英雄
                 if(HeroInfo==null) content=teacher_content.c3_1;
                 else if(HeroInfo.length==1 && HeroInfo[0].PrenticeNum==1) content=teacher_content.c3_2;
                 else if(HeroInfo.length==1 && HeroInfo[0].Training<50) content=teacher_content.c3_3;
                 else if(HeroInfo.length==1 && (HeroInfo[0].PrenticeNum==HeroInfo[0].MaxPrenticeNum) && HeroInfo[0].Training==100) content=teacher_content.c3_4;
                 else if(HeroInfo.length==1) content=teacher_content.c3_5;
                 else if(HeroInfo.length==2 && TangCount==1) content=teacher_content.c3_6;
                 else if(HeroInfo.length<4 && haveHeroCZ==0) content=teacher_content.c3_7;
                 else if(HeroInfo.length<4 && haveHeroZS==1) content=teacher_content.c3_8;
                 else if(HeroInfo.length<4 && HeroHight==0) content=teacher_content.c3_9;
                 break;                   
            case 4://物品
                 if(ItemInfo==null) content=teacher_content.c4_1;
                 else if(ItemNum>=1 && ItemNum<=9 && haveZPItem==0) content=teacher_content.c4_2;
                 else if(ItemNum>=10 && ItemNum<=12) content=teacher_content.c4_3;
                 else if(haveXLItem) content=teacher_content.c4_4;
                break;
            case 5://大地图
                 if(CityInteriorInfo.Level<10)
                 {
                    if(CityInteriorInfo.Level==2)
                    {
                        if(UserInfo.State==3)
                            content=eval("teacher_content.c5_"+(CityInteriorInfo.Level)+"_1");
                        else
                            content=eval("teacher_content.c5_"+(CityInteriorInfo.Level)+"_2");
                    }
                    else
                        content=eval("teacher_content.c5_"+(CityInteriorInfo.Level));
                 }
                 break;
            case 6://战场
                 break;
            case 7://帮会
                 break;
            case 8://邮件消息
                 if(haveNewMail) content=teacher_content.c8_1;
                 break;
            case 9://市场
                 break;
            case 10://任务
                 if(TaskTwoType==0 && haveNewTask==1) content=teacher_content.c10_1;
                 else if(TaskTwoType==1 && haveNewTask==0) content=teacher_content.c10_2;
                 else if(TaskTwoType==2 && haveNewTask==0) content=teacher_content.c10_3;
                 break;   
            case 11://排行榜
                 if(TaxisType==1 && TaxisSign==false && FindTaxisWord=="" && PlayerTaxisInfo==null) content=teacher_content.c11_1;
                 break;           
            default:
                 break;
        }
    }
    //占领玩家
    if(CityInteriorInfo.IsLord==1)
    {
        content=eval("teacher_content.c5_12");
        $("#Teacher_img").attr("src","img/h/t/13b.GIF");
        $("#Teacher_simg").attr("src","img/h/t/14b.GIF");
    }
    else
    {
        $("#Teacher_img").attr("src","img/h/t/13.GIF");
        $("#Teacher_simg").attr("src","img/h/t/14.GIF");
    }
    
    //显示
    if(content!="")
    {
        var teacher=document.getElementById("teacher_content").innerHTML=content;
        if(1)//content!=last_teacher_content[PageNum])
        {
            Teacher_Reshow();
            last_teacher_content[PageNum]=content;
        }
        else
            Teacher_Close();
    }
    else
    {
        var teacher=document.getElementById("teacher_content").innerHTML=teacher_content.c0_0;
        Teacher_Close();
    } 
}

function Teacher_Reshow()
{
    $("#teacher").show();
    $("#teacher_icon").hide();
    $("#mm_img_icon2").css({"right":"325px"});
}

function Teacher_Close()
{
    $("#teacher").hide();
    $("#teacher_icon").show();
    $("#mm_img_icon2").css({"right":"52px"});
    Teacher_Status=0;
}

function Teacher_Detail()
{
    Teacher_Close();
    //到帮助信息
    //window.open("interior_help.html","helpwindow","alwaysRaised=yes,z-look=yes");
}
  function gs(d){var t=document.getElementById(d);if (t){return t.style;}else{return null;}}
  function gs2(d,a){
    if (d.currentStyle){ 
      var curVal=d.currentStyle[a]
    }else{ 
      var curVal=document.defaultView.getComputedStyle(d, null)[a]
    } 
    return curVal;
  }
  function ChatClose(){
    gs("main").display = "none";
    //clearTimeout(worchatroomTimer);
    var html="";
    $("#ChatMessageList").html(html);  
  }

  if (document.getElementById){
    (
      function(){
        if (window.opera){ document.write("<input type='hidden' id='Q' value=' '>"); }
      
        var n = 500;
        var dragok = false;
        var y,x,d,dy,dx;
        
        function move(e)
        {
          if (!e) e = window.event;
          if (dragok){
            d.style.left = dx + e.clientX - x + "px";
            d.style.top  = dy + e.clientY - y + "px";
            return false;
          }
        }
        
        function down(e){
          if (!e) e = window.event;
          var temp = (typeof e.target != "undefined")?e.target:e.srcElement;
          if (temp.tagName != "HTML"|"BODY" && temp.className != "dragclass"){
            temp = (typeof temp.parentNode != "undefined")?temp.parentNode:temp.parentElement;
          }
          if('TR'==temp.tagName){
            temp = (typeof temp.parentNode != "undefined")?temp.parentNode:temp.parentElement;
            temp = (typeof temp.parentNode != "undefined")?temp.parentNode:temp.parentElement;
            temp = (typeof temp.parentNode != "undefined")?temp.parentNode:temp.parentElement;
          }
        
          if (temp.className == "dragclass"){
            if (window.opera){ document.getElementById("Q").focus(); }
            dragok = true;
            temp.style.zIndex = n++;
            d = temp;
            dx = parseInt(gs2(temp,"left"))|0;
            dy = parseInt(gs2(temp,"top"))|0;
            x = e.clientX;
            y = e.clientY;
            document.onmousemove = move;
            return false;
          }
        }
        
        function up(){
          dragok = false;
          document.onmousemove = null;
        }
        
        document.onmousedown = down;
        document.onmouseup = up;
      
      }
    )();
  }