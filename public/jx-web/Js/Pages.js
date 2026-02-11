//地图
var ViewNumY=1
var ViewNumX=1
var NextRange1=1;
var NextRange4=4;
var NextRange9=9;
var NextRange6=6;
var NextRange13=13;

var DefenceNum=0;
var AttackTeamState = new Array(Lang["Pages_1"],Lang["Pages_2"],Lang["Pages_3"],Lang["Pages_4"],Lang["Pages_5"],Lang["Pages_6"],Lang["Pages_7"],Lang["Pages_8"],Lang["Pages_59"],Lang["Pages_7"],Lang["Pages_60"],Lang["Pages_61"],Lang["Pages_62"]);
//var AttackTeamState = new Array("出战队列中无侠客","出战队列闲置","出战队列目前正在行军途中","战队列目前正在行军途中","出战队列目前驻守在：","战队列目前正在行军途中","出战队列目前位于：","出战队列正在返回村镇途中","出战队列目前处于战场状态","出战队列目前位于:","出战队列处于亲临攻击途中","出战队列处于亲临支援途中","出战队列目前守擂中:");
var DefenceBlankImg = new Array("img/2/d/14.gif","img/2/d/15.gif","img/2/d/16.gif");
var DefenceResImg = new Array("img/2/d/10.gif","img/2/d/11.gif","img/2/d/12.gif","img/2/d/13.gif");
//擂台坐标
var Arena=[116303,226353,161114,282100,116345,106213,91284,241252,308252,136185];
 
//创建页面
function CreatePage()
{
    $("#mainpic").empty();
    $("#trees").empty();
    switch (PageNum)
    {
        case 1:
             CreateInteriorPage();//创建内政页面
                 
             Main.GetMapUnitInfo(CityID,1,0,cb_GetMapUnitInfo);//请求内政地图单元数据                   
             break;                 
        case 2:
             Main.GetDefenceNum(CityID,cb_GetDefenceNum);//获得当前城防数量  
             break;
        case 3:
             //创建英雄页面
             Main.GetCityCropsState(CityID,cb_GetCityCropsState);//请求指定城市军团信息    
             break;                   
        case 4:
             //物品
             CreateItemPage();//创建物品页面
             FreshItemPage(false);
            break;
        case 5:
             //大地图
             CreateWorldMapPage();
             var pos=(ViewNumY+4-1)*400+ViewNumX+4;         
             Main.GetWorldLandform(CityID,pos,cb_GetWorldLandform);//请求大地图地形
             break;
        case 6:
             //战场
             Main.GetChessboardPos(CityID,2,cb_GetChessPage);
             break;
        case 7:
             //帮会
             CreateUnionPage();
             break;
        case 8:
             //邮件消息
             CreateMailPage();
             FreshMailPage();//请求邮件信息
             break;
        case 9:
             //市场
             CreateMarketPage();
             FreshMarketPage();//请求市场信息
             break;
        case 10:
             CreateTaskPage();
             FreshTaskPage();//请求任务信息
             break;
        case 11:
             //排行榜
             CreateTaxisPage();
             FreshTaxisPage();//请求排行榜信息
             break;
        case 12:
             //竞技 
             if(ChessIsOpen==1)
             FreshWarfarePage();
             else
             CreateBlankWarfarePage(); 
             break;  
        default:
             break;
    }
        
}

//竞技场未开启提示页面
function CreateBlankWarfarePage()
{
   var html="";
   html+="<p style=\"font-size:18px;margin-top:120px;margin-left:150px;font-weight:bold;\">竞技场即将开放，敬请期待！</p>";
   var page=document.getElementById("mainpic");
   page.innerHTML=html;     
   html=null;
   DataTranslateEnd();   
}

//获得当前城防数量
function cb_GetDefenceNum(result)
{
    if(DataValidate(result)==false) return;
    
    DefenceNum=result.value;
    
    CreateDefencePage();//创建城防页面
    Main.GetDefenceLandform(CityID,cb_GetDefenceLandform);//请求城防地形           
}




//获得地图单元信息组
function cb_GetMapUnitInfo(result)
{
    if(DataValidate(result)==false) return;
    
    MapUnitInfo=result.value;
    if(MapUnitInfo!=null && MapUnitInfo[0].ID==-1)
        MapUnitInfo=null; 
        
     switch (PageNum)
    {
        case 1:
             ShowInteriorMap();
             Teacher_Open();
             break;                 
        case 2:
             ShowDefenceMap();
             Teacher_Open();
             break;
        case 5:
             ShowWorldMap();        
             Teacher_Open();      
             break;  
        default:
    }
    
    ChangeViewState=0;
    
    if(PageNum!=5)
        Main.GetValidEvent(CityID,cb_GetValidEvent);//请求事件信息
        
    if(PageNum==5)
        Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息     
     
}


//获得城防地形
function cb_GetDefenceLandform(result)
{
    if(DataValidate(result)==false) return;
    
    LandformInfo=result.value;
        
    CreateLandform();
    
    var pos=(ViewNumY+6-1)*30+ViewNumX+6;
    
         Main.GetMapUnitInfo(CityID,2,pos,cb_GetMapUnitInfo);//请求城防单元
     
}

//获得大地图地形
function cb_GetWorldLandform(result)
{
    if(DataValidate(result)==false) return;
    
    LandformInfo=result.value;
        
    CreateLandform();
    
    var pos=(ViewNumY+4-1)*400+ViewNumX+4;
    
         Main.GetMapUnitInfo(CityID,3,pos,cb_GetMapUnitInfo);//请求大地图单元
     
}


//创建城防地形
function CreateLandform()
{
    var html=""
    var i=0;
    var pos;
    var pid;
    var id;
    var image;
    var unitSize;
    var width;
    var heigth;
    var mapID="map_"+PageNum;
    
    switch(PageNum)
    {
        case 2 :
            unitSize=DefencePicSize;
            width=DefenceWidth;
            height=DefenceHeight;
            pid="defence_landform_"+PageNum+"_";
            break;
        case 5 :    
            unitSize=WorldPicSize;
            width=WorldWidth;
            hight=WorldHeight;
            pid="world_landform_"+PageNum+"_";
            break;
        default:
            return;
    }	
	while(LandformInfo!=null && LandformInfo[i]!=null)
	{
	    id=pid+i;
	    var left=(i%width)*unitSize;
	    var top=Math.floor(i/width)*unitSize;
	    style="left:"+left+"px;top:"+top+"px;position:absolute;z-index: 1;cursor:pointer;";
	    //城防
	    if(PageNum==2)
	    {
	        if(LandformInfo[i].Type==0)
	        {
	            if(top<=3*unitSize)
	                image=DefenceBlankImg[0];
	            else if(top>3*unitSize && top<(height-2)*unitSize)
	                image=DefenceBlankImg[1];
	            else
	                image=DefenceBlankImg[2];
	        }
	        else
	        {
	            image=DefenceResImg[LandformInfo[i].Index]
	        }         
	        html+=HtmlClickTipsImgStyle(id,style,image,"ClickMap(this.id)");
	    }
	    else
	        html+=HtmlClickTipsImgStyle(id,style,PicPath+LandformInfo[i].Image,"ClickCity(this.id)");
	    i++;	        
	}
	//添加选中框
	if(PageNum==2)
	    html+=HtmlImg("img_select_2","img_select",PicPath+PicSelect2);
	else
	    html+=HtmlImg("img_select_5","img_select",PicPath+PicSelect5);
	     
	var map=document.getElementById(mapID);
	map.innerHTML=html;   
    html=null;         
}


//创建内政页面
function CreateInteriorPage()
{
    var html="";
    var i=0;
    var PicInterBack = UserInfo.CityList[CityNum].BackImg;
    
    //内政背景图
    html+=HtmlImg("botpic_"+PageNum,"botpic_"+PageNum,PicPath+PicInterBack);
    
    //圣诞gif图
    // if(PicInterBack=="/2/b/m/0.jpg")
    // html+="<img id=\"christmas_1\" class=\"christmas_1\" src=\"img/2/b/m/mg2.gif\" />";
    
    //内政建筑区域透明图
    html+="<img id=\"clearpic_"+PageNum+"\" class=\"clearpic_"+PageNum+"\" src=\""+PicPath+PicClarity+"\" usemap=\"#map_"+PageNum+"\" />";
    
    //内政建筑热点 
    html+="<map id=\"map_"+PageNum+"\" name=\"map_"+PageNum+"\" hidefocus=\"true\" >";
    for(i=1;i<=InteriorPosNum;i++)
    {        
        html+=HtmlArea("area_"+PageNum+"_"+i,"poly",InteriorAreaCoords_Empty[i-1]);
    }
    html+="</map>";
        
    //$("#mainpic").html(html); 
     var tree=document.getElementById("mainpic");
       tree.innerHTML=html;    
       html=null;
}

//创建城防页面

function CreateDefencePage()
{
    var html="";  
    html+="<div class=\"num_2\"><span onmouseover=\"ShowTips(event,'common_1_78')\" onmouseout=\"HideTips()\">"+Lang["Pages_9"]+"</span><span class=\"font_bold\" id=\"defence_num\">1</span>/<span class=\"font_bold\" id=\"defence_max_num\">30</span></div>";
	
	html+="<div id=\"map_2\">";
	html+="</div>";
    
    //$("#mainpic").html(html);
    var tree=document.getElementById("mainpic");
       tree.innerHTML=html;    
    
    if(CityInteriorInfo.MaxDefenceBuildNum>DefenceNum)
    {
        html="<span onmouseover=\"ShowTips(event,'common_1_78')\" onmouseout=\"HideTips()\">"+Lang["Pages_9"]+"</span><span class=\"font_bold\" id=\"defence_num\">1</span>/<span class=\"font_bold\" id=\"defence_max_num\">30</span>";   
        CFXZ=0;
    }
    else
    {
        html="<span onmouseover=\"ShowTips(event,'common_1_78')\" onmouseout=\"HideTips()\">"+Lang["Pages_9"]+"</span><span class=\"font_red_blod\" id=\"defence_num\">1</span>/<span class=\"font_red_blod\" id=\"defence_max_num\">30</span>";    
        if(CityInteriorInfo.MaxDefenceBuildNum!=0)
            CFXZ=1;
    }
    
    $(".num_2").html(html);   
    $("#defence_max_num").text(CityInteriorInfo.MaxDefenceBuildNum);
    $("#defence_num").text(DefenceNum);
    
    html=null;        
}


//创建大地图页面 
function CreateWorldMapPage()
{
    var html="";
    html+="<div class=\"findcity\">";
    html+="<table width=\"285\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr>";
    html+="<td width=\"8\"><b>X</b></td>";
    html+="<td width=\"47\">";
	html+="<input class=\"input_num\" type=\"text\" onkeydown=\"OnlyNum(event)\" onfocus=this.value=\"\" maxlength=\"3\" id = \"WorldMapX\" />";
    html+="</td>";
    html+="<td width=\"8\"><b>Y</b></td>";
    html+="<td width=\"47\">";
	html+="<input class=\"input_num\" type=\"text\" onkeydown=\"OnlyNum(event)\" onfocus=this.value=\"\" maxlength=\"3\" id = \"WorldMapY\" />";
	html+="</td>";
	html+="<td width=\"45\">";
	html+="<a href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_64')\" onmouseout=\"HideTips()\" onmousedown=\"JumpToRange()\">"+Lang["Pages_10"]+"</a>";
	html+="</td>";
	html+="<td width=\"65\">";
	html+="<a href=\"#\" id=\"pop_107\" class=\"linkstyle_3\" onmouseover=\"ShowTips(event,'common_1_89')\" onmouseout=\"HideTips()\" onmousedown=\"SubordinateCity(this.id)\">"+Lang["Pages_66"]+"</a>";
	html+="</td>";
	html+="<td width=\"65\">";
	html+="<a href=\"#\" class=\"linkstyle_3\" onmouseover=\"ShowTips(event,'common_1_65')\" onmouseout=\"HideTips()\" onmousedown=\"BackCity()\">"+Lang["Pages_11"]+"</a>";
	html+="</td>";
	html+="</tr>";
	html+="</table>";
	html+="</div>";		   
    html+="<div class=\"topnumber_5\">";
	html+="<table width=\"420\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    html+="<tr>";
  	for(var i=0;i<9;i++)
  	{
	   html+="<td id=\"top_"+i+"\" align=\"center\">"+AddZero(i+ViewNumX,3)+"</td>";	    			
  	}
  	html+="</tr>";
	html+="</table>";
	html+="</div>";
	html+="<div class=\"leftnumber_5\">";
	html+="<table width=\"20\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	for(var i=0;i<9;i++)
    {
        html+="<tr><td id=\"left_"+i+"\" >"+AddZero(i+ViewNumY,3)+"</td></tr>";
	}		 
	html+="</table>";
	html+="</div>";
	html+="<div id=\"map_5\">";
	html+="</div>";
	html+="<div class=\"botsign_5\">";
	html+="<img onmousedown=\"NextRange(3,NextRange9)\" onmouseover=\"ShowTips(event,'common_1_34')\" onmouseout=\"HideTips()\" src=\"img/o/14.GIF\" />";
	html+="<img onmousedown=\"NextRange(3,NextRange4)\" onmouseover=\"ShowTips(event,'common_1_33')\" onmouseout=\"HideTips()\" src=\"img/o/13.GIF\" />";
	html+="<img onmousedown=\"NextRange(3,NextRange1)\" onmouseover=\"ShowTips(event,'common_1_32')\" onmouseout=\"HideTips()\" src=\"img/o/12.GIF\" />";
	html+="<img onmousedown=\"NextRange(4,NextRange1)\" onmouseover=\"ShowTips(event,'common_1_35')\" onmouseout=\"HideTips()\" src=\"img/o/15.GIF\" />";
	html+="<img onmousedown=\"NextRange(4,NextRange4)\" onmouseover=\"ShowTips(event,'common_1_36')\" onmouseout=\"HideTips()\" src=\"img/o/16.GIF\" />";
	html+="<img onmousedown=\"NextRange(4,NextRange9)\" onmouseover=\"ShowTips(event,'common_1_37')\" onmouseout=\"HideTips()\" src=\"img/o/17.GIF\" />";
	html+="</div>";
	html+="<div class=\"rigsign_5\">";
	html+="<img onmousedown=\"NextRange(1,NextRange9)\" onmouseover=\"ShowTips(event,'common_1_28')\" onmouseout=\"HideTips()\" src=\"img/o/8.GIF\" />";
	html+="<img onmousedown=\"NextRange(1,NextRange4)\" onmouseover=\"ShowTips(event,'common_1_27')\" onmouseout=\"HideTips()\" src=\"img/o/7.GIF\" />";
	html+="<img onmousedown=\"NextRange(1,NextRange1)\" onmouseover=\"ShowTips(event,'common_1_26')\" onmouseout=\"HideTips()\" src=\"img/o/6.GIF\" />";
	html+="<img onmousedown=\"NextRange(2,NextRange1)\" onmouseover=\"ShowTips(event,'common_1_29')\" onmouseout=\"HideTips()\" src=\"img/o/9.GIF\" />";
	html+="<img onmousedown=\"NextRange(2,NextRange4)\" onmouseover=\"ShowTips(event,'common_1_30')\" onmouseout=\"HideTips()\" src=\"img/o/10.GIF\" />";
	html+="<img onmousedown=\"NextRange(2,NextRange9)\" onmouseover=\"ShowTips(event,'common_1_31')\" onmouseout=\"HideTips()\" src=\"img/o/11.GIF\" />";
	html+="</div>";
	
	//$("#mainpic").html(html);
	var tree=document.getElementById("mainpic");
    tree.innerHTML=html;    
    html=null;
	$("#WorldMapX").val(ViewNumX + 4);	
	$("#WorldMapY").val(ViewNumY + 4);	
}

//创建战斗页面                  
function CreateBattlePage()
{
   var html="";
   html+="<img src=\""+ImgUrl+"o/72.jpg\" />";
   var page=document.getElementById("mainpic");
   page.innerHTML=html;     
   html=null;
   Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
}

//显示内政地图
function ShowInteriorMap()
{
    var html="";
    var areaID="";
    if(MapUnitInfo==null)
        return false;
    
    JYTLevel=MapUnitInfo[0].Level;
    TangCount=0;
    GZFLevel=0;
    haveKJ=0;
    haveMK=0;
    haveYWC=1;
    var i=0
    while(MapUnitInfo[i]!=null)
    {
        unit=MapUnitInfo[i];
        html+=HtmlImg("img_"+PageNum+"_"+unit.Pos,"img_"+PageNum+"_"+unit.Pos,PicPath+unit.Image);
        
        //改变热点范围
        areaID="#area_"+PageNum+"_"+unit.Pos;
        $(areaID).attr("coords",InteriorAreaCoords_Full[unit.Pos-1]);        
        //统计
        if(unit.Type==0)
        {
            if(unit.Index>=12 && unit.Index<=21)
                TangCount++;
            else if(unit.Index==9)
                GZFLevel=unit.Level;
            else if(unit.Index==10)
                haveKJ=1;
            else if(unit.Index==8)
                haveMK=1;
            else if(unit.Index==11)
                haveYWC=1;
        }
        
        i++;
    }
    $("#mainpic").append(html);
    html=null;
    
    ShowInteriorFlag();
}

//显示内政旗子
function ShowInteriorFlag()
{
    var html="";
    if(CityInteriorInfo!=null)
    {
        var buildingLevel=CityInteriorInfo.InteriorBuildingLevel;
    }
    else
        return;
        
    if(buildingLevel[0]>=1 && buildingLevel[1]==0)
        html+=HtmlImg("img_flag_14","img_flag_14",PicPath+PicFlag);       
    if(buildingLevel[0]>=1 && buildingLevel[2]==0)
        html+=HtmlImg("img_flag_3","img_flag_3",PicPath+PicFlag);
    if(buildingLevel[0]>=1 && buildingLevel[3]==0)
        html+=HtmlImg("img_flag_11","img_flag_11",PicPath+PicFlag);
    if(buildingLevel[1]>=1 && buildingLevel[4]==0)
        html+=HtmlImg("img_flag_13","img_flag_13",PicPath+PicFlag);
    if(buildingLevel[2]>=1 && buildingLevel[5]==0)
        html+=HtmlImg("img_flag_12","img_flag_12",PicPath+PicFlag); 
    if(buildingLevel[3]>=1 && buildingLevel[6]==0)
        html+=HtmlImg("img_flag_8","img_flag_8",PicPath+PicFlag);
    if(buildingLevel[0]>=2 && buildingLevel[17]==0 && buildingLevel[18]==0)
        html+=HtmlImg("img_flag_1","img_flag_1",PicPath+PicFlag);
    if(buildingLevel[0]>=2 && buildingLevel[15]==0 && buildingLevel[16]==0)
        html+=HtmlImg("img_flag_2","img_flag_2",PicPath+PicFlag);
    if(buildingLevel[0]>=2 && buildingLevel[19]==0 && buildingLevel[20]==0)
        html+=HtmlImg("img_flag_4","img_flag_4",PicPath+PicFlag);  
    if(buildingLevel[0]>=2 && buildingLevel[13]==0 && buildingLevel[14]==0)
        html+=HtmlImg("img_flag_6","img_flag_6",PicPath+PicFlag);  
    if(buildingLevel[0]>=2 && buildingLevel[11]==0 && buildingLevel[12]==0)
        html+=HtmlImg("img_flag_7","img_flag_7",PicPath+PicFlag);
    if(buildingLevel[0]>=3 && buildingLevel[8]==0)
        html+=HtmlImg("img_flag_15","img_flag_15",PicPath+PicFlag);  
    if(buildingLevel[0]>=4 && buildingLevel[9]==0)
        html+=HtmlImg("img_flag_9","img_flag_9",PicPath+PicFlag);
    if(buildingLevel[0]>=4 && buildingLevel[7]==0)
        html+=HtmlImg("img_flag_5","img_flag_5",PicPath+PicFlag);    
    if(buildingLevel[0]>=5 && buildingLevel[10]==0)
        html+=HtmlImg("img_flag_16","img_flag_16",PicPath+PicFlag);                
             
    $("#mainpic").append(html);
    html=null;     
}

//显示城防地图
function ShowDefenceMap()
{
    var html="";
    if(MapUnitInfo==null)
        return false;
    
    var i=0
    var id;
    var style;
    var click;
    
    CFCount=0;
    
    while(MapUnitInfo[i]!=null)
    {
        unit=MapUnitInfo[i];
        
        var x=(unit.Pos-1)%DefenceWidth;
        var y=Math.floor((unit.Pos-1)/DefenceWidth);
        var left=x*DefencePicSize;
	    var top=y*DefencePicSize;
	    
        if(unit.Type==2)
        {
            id="defence_building_"+PageNum+"_"+i;
            click="ClickMap(this.id)";
            style="left:"+left+"px;top:"+top+"px;position:absolute;z-index: 2;cursor:pointer;";
            CFCount++;
        }
        if(unit.Type==3)
        {
            id="defence_hero_"+PageNum+"_"+i;
            click="ClickMap(this.id)";
            style="left:"+left+"px;top:"+top+"px;position:absolute;z-index: 3;cursor:pointer;";
        }
        
        html+=HtmlClickTipsImgStyle(id,style,PicPath+MapUnitInfo[i].Image,click);      
          
	    i++;	        
    }
    $("#map_2").append(html); 
    html=null;  
}

function ShowWorldMap()
{
    var html="";
    if(MapUnitInfo==null)
        return false;
    
    var i=0
    var id;
    var style;
    var click;
    var ifseif=false; 
    var selectIndex=0; 
    while(MapUnitInfo[i]!=null)
    {
        var unit=MapUnitInfo[i];
        if(unit.ID==CityID)
        { 
            selectIndex=i;
            ifseif=true;
        }
        var x=Math.floor(unit.Pos%400);
        if(x==0)x=400;
        var y=(Math.floor((unit.Pos-1)/400)+1); 
        var left=(x-ViewNumX)*46;
	    var top=(y-ViewNumY)*46;
        id="world_city_"+PageNum+"_"+i;
        style="left:"+left+"px;top:"+top+"px;position:absolute;z-index: 2;cursor:pointer;";
        click="ClickCity(this.id)";
            
        html+=HtmlClickTipsImgStyle(id,style,PicPath+MapUnitInfo[i].Image,click);
                 	  
	    i++;	        
    }
    $("#map_5").append(html); 
    html=null; 
    if(ifseif && WorldIndex=="")
    {
        ClickCity("world_city_5_"+selectIndex); 
    } 
}

//创建侠客页面
function CreateHeroPage()
{
    var html=""
    InChoiceHero=false; //非选择英雄页
    UseExpItemSign=false;//非使用经验道具
    UseSkillBookSign=false;//使用经验书
    UseSkillPillSign=false;//技能药丸
    UseSkillExpSign=false;//技能经验
    
    html+="<div id=\"citycorps\">";
    html+="<table width=\"310\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
	html+="<tr>";
	html+="<td width=\"40\">"+Lang["Pages_12"]+"</td>";
	html+="<td width=\"54\"><b>X</b><input class=\"input_num\" type=\"text\"  maxlength=\"3\" onkeydown=\"OnlyNum(event)\" id=\"target_x\" type=\"text\"/></td>";
	html+="<td width=\"55\"><b>Y</b><input class=\"input_num\" type=\"text\"  maxlength=\"3\" onkeydown=\"OnlyNum(event)\" id=\"target_y\" type=\"text\"/></td>";
	html+="<td width=\"54\"><a id=\"corps_45\" href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_61')\" onmouseout=\"HideTips()\" onmousedown=CorpsCommand(this.id)>"+Lang["Tree_121"]+"</a></td>";
	html+="<td width=\"54\"><a id=\"corps_1\" href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_61')\" onmouseout=\"HideTips()\" onmousedown=CorpsCommand(this.id)>"+Lang["Pages_13"]+"</a></td>";
    html+="<td width=\"54\"><a id=\"corps_2\" href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_62')\" onmouseout=\"HideTips()\" onmousedown=CorpsCommand(this.id)>"+Lang["Pages_14"]+"</a></td>";
    html+="<td width=\"40\"><a id=\"corps_29\" href=\"#\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_82')\" onmouseout=\"HideTips()\" onmousedown=CorpsCommand(this.id)>"+Lang["Pages_15"]+"</a></td>";
    html+="</tr>";
    html+="</table>";
    html+="<div id=\"heroteam\">";
//    if(MyCorpsPos!="")
//    {
//        html+="<table width=\"236\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
//        html+="<tr>";
//        html+="<td width=\"78\">支援队伍位于</td>";
//        html+="<td class=\"font_bold\" width=\"118\">"+MyCorpsPos+"</td>";
//        html+="<td width=\"40\"><a id=\"corps_3\" class=\"linkstyle_1\" onmouseover=\"ShowTips(event,'common_1_63')\" onmouseout=\"HideTips()\" href=\"#\" onmousedown=\"CallCorpsBack()\">召回</a></td>"
//        html+="</tr>";
//        html+="</table>";
//    }
//    else
//    {
        if(CityInteriorInfo!=null)
        html+="<p>"+Lang["Pages_16"]+""+CityInteriorInfo.EngageHeroNum+"/"+CityInteriorInfo.MaxEngageHeroNum+"</p>";
//    }
    html+="</div>";
    html+="</div>";
    html+="<div id=\"heros\">";
    html+="</div>";   
    html+="<div id=\"othercorps\">";
    html+="<div id=\"attackteam\"></div>";
    html+="<div id=\"supportteam\"></div>";
    html+="</div>";
	
	//$("#mainpic").html(html);
	 var tree=document.getElementById("mainpic");
       tree.innerHTML=html;    
       html=null; 
}


//获得城市侠客信息
function cb_GetCityHero(result)
{
    if(DataValidate(result)==false) return;
    
    HeroInfo=result.value;
    if(HeroInfo!=null && HeroInfo[0]!=null && HeroInfo[0].ID==-1)
        HeroInfo=null;
    
    if(PageNum==3 || PageNum==4)
    {
        CreateHeros();
        if(PageNum==3)
        {
           Main.GetCityOtherCorps(CityID,cb_GetCityOtherCorps);//请求支援队列信息
        }
    }
    else if(PageNum==5)
    {
       
            Main.GetValidEvent(CityID,cb_GetValidEvent);//请求事件信息           
    }
    else
    {
        DataTranslateEnd();
    }           
}
var HeroStateName = new Array(Lang["Pages_17"],Lang["Pages_18"],Lang["Pages_19"],Lang["Pages_20"],Lang["Pages_21"],Lang["Pages_22"],Lang["Pages_23"],Lang["Pages_24"],"战场攻击","战场等待","战场防守","战场协防");
var HeroSpcStateTips = new Array(Lang["Pages_25"],Lang["Pages_26"],Lang["Pages_27"],Lang["Pages_28"],Lang["Pages_29"],"",Lang["Pages_30"],Lang["Pages_31"]);
function CreateHeros()
{
    var html="";
    var i=0;
    var hero;
    HeroCount=0;
    haveHeroCZ=0;
    haveHeroZS=0;
    HeroHight=0;
    
    if(UseExpItemSign==true && TheItemInfo.LostRate!=null && TheItemInfo.LostRate!=0)
    {
         var HeroInfoTemp=new Array(); 
         var z=0; 
         if(HeroInfo!=null)
         {
              for(var j=0;j<HeroInfo.length;j++)
              {
                   if(HeroInfo[j]!=null && HeroInfo[j].Level>=50 && HeroInfo[j].State==1 && HeroInfo[j].CorpsID==0)
                   { 
                         HeroInfoTemp[z]=HeroInfo[j];
                         z++; 
                   } 
              } 
         } 
         HeroInfo=HeroInfoTemp;
    }  
    
    while(i<10)
    {
        
        if(HeroInfo!=null && HeroInfo[i]!=null)
        {
            hero=HeroInfo[i];
            
            if(InChoiceHero==true)
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"PouUpChoiceHeroOK("+i+")\" class=\"herobox\">";
            else if(UseExpItemSign==true)
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"PouUpUseExpItem("+i+")\" class=\"herobox\">";
            else if(UseSkillBookSign==true)
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"PouUpUseSkillBook("+i+")\" class=\"herobox\">";
            else if(UseSkillPillSign==true)
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"PouUpUseSkillPill("+i+")\" class=\"herobox\">";
            else if(UseSkillExpSign==true)
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"PouUpUseSkillExp("+i+")\" class=\"herobox\">";
            else
            html+="<div id=\"hero_box_"+i+"\" onmousedown=\"ClickHero(this.id)\" class=\"herobox\">";
            html+="<div id=\"hero_top_"+i+"\" class=\"top\">";
            html+="<img id=\"heroimg_"+i+"\" class=\"heroicon\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" src=\""+PicPath+hero.Icon+"\" />";
            //html+=HtmlImg("heroicon","heroicon",PicPath+hero.Icon);
            html+="<ul>";
            html+="<li><span class=\"hquality_"+hero.Quality+"\">"+hero.Name+"</span></li>";
            html+="<li>"+UnionName[hero.Junta]+"</li>";
            html+="<li><span class=\""+WuXingFontStyle[hero.Junta]+"\">"+UnionWuXing[hero.Junta]+"</span>"+" "+hero.Level+""+Lang["Pages_32"]+"</li>";
            html+="</ul>";
            html+="</div>";
            html+="<div class=\"hero_exp_div\">";
            var wE=Math.ceil(86*(hero.LevelExp/hero.LevelExpStatic));
            if(wE>86)
                wE=86;
            var wB=86-wE;
            var styleE="height:3px;width:"+wE+"px;";
            var styleB="height:3px;width:"+wB+"px;";
            html+=HtmlTipsImgStyle("heroexp_e_"+i,styleE,PicPath+PicHeroExp);
            html+=HtmlTipsImgStyle("heroexp_b_"+i,styleB,PicPath+PicHeroExpBack);
            html+="</div>";
            html+="<div id=\"hero_bottom_"+i+"\" class=\"bottom\">";
            html+="<table width=\"85\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
            html+="<tr>";
            html+="<td width=\"18\" id=\"heroattack_"+i+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_33"]+"</td>";
            html+="<td class=\"hero_span_value\" width=\"24\">"+hero.Attack+"</td>";
            html+="<td width=\"18\" id=\"herodefence_"+i+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_34"]+"</td>";
            html+="<td class=\"hero_span_value\" width=\"25\">"+hero.Defence+"</td>";
            html+="</tr>";
            html+="<tr>";
            html+="<td onmouseover=\"ShowTips(event,'common_1_40')\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_35"]+"</td>";
            html+="<td class=\"hero_span_value\">"+hero.Dodge+"</td>";
            html+="<td onmouseover=\"ShowTips(event,'common_1_41')\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_36"]+"</td>";
            html+="<td class=\"hero_span_value\">"+hero.CrushBlow+"</td>";
            html+="</tr>";
            html+="<tr>";
            html+="<td onmouseover=\"ShowTips(event,'common_1_42')\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_37"]+"</td>";
            html+="<td class=\"hero_span_value\">"+RangeEff[hero.MoveRange-1]+"</td>";
            html+="<td onmouseover=\"ShowTips(event,'common_1_43')\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_38"]+"</td>";
            html+="<td class=\"hero_span_value\">"+RangeEff[hero.AttackRange-1]+"</td>";
            html+="</tr>";
            html+="<tr>";
            html+="<td class=\"hero_span_des\">"+Lang["Pages_39"]+"</td>";
            if(hero.SkillList!=null && hero.SkillList[0]!=null)
            {
                if(hero.NoSkillReason==0)
                    html+="<td id=\"heroskill_"+i+"\" class=\"hero_span_value\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" colspan=\"3\">"+hero.SkillList[0].Name+"</td>";
                else
                    html+="<td id=\"heroskill_"+i+"\" class=\"hero_span_value\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" colspan=\"3\"><span class='font_gray'>"+hero.SkillList[0].Name+"</span></td>"; 
            }
            html+="</tr>";
            html+="</table>";
            html+="<table width=\"93\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
            html+="<tr>";
            html+="<td onmouseover=\"ShowTips(event,'common_1_45')\" onmouseout=\"HideTips()\" class=\"hero_span_des\">"+Lang["Pages_40"]+"</td>";
            html+="<td class=\"hero_span_value\">"+hero.PrenticeNum+"/"+hero.MaxPrenticeNum+"["+hero.Training+"%]</td>";
            html+="</tr>";
            html+="</table>";
            html+="<div style=\"line-height:17px;\">";
            html+=HtmlTipsImg("herostate_"+hero.ListType,"",PicPath+PicHeroList[hero.ListType-1]);
            html+="<span id=\"herospcstate_"+hero.State+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">["+HeroStateName[hero.State-1]+"]</span>";
            html+="</div>";
            html+="</div>";
            html+="</div>";
            
            HeroCount++;
            
            if(hero.ListType==2)
                haveHeroCZ=1;
            if(hero.State==2)
                haveHeroZS=1;
            if(hero.Level>1)
                HeroHight=1;
        }
        else
        {
            html+="<div id=\"hero_+"+i+"\" class=\"herobox\">";
            //html+=HtmlImg("heroicon","heroicon",PicPath+"/2/h/h/3.gif");
            html+="<img id=\"heroicon\" class=\"heroicon\" onmouseover=\"ShowTips(event,'common_1_60')\" onmouseout=\"HideTips()\" src=\"img/2/h/h/3.GIF\"/>";
            html+="</div>"; 
        }
        i++;
    }
     if(HeroInfo!=null && HeroInfo[i]!=null)
        CreateHerosTeam();
     var tree=document.getElementById("heros");
     tree.innerHTML=html;    
     $("#img_select_hero").show();
     html=null;
     
    Teacher_Open();
}

//出战队列回调
function cb_GetCityCropsState(result)
{
    if(DataValidate(result)==false) return;
    ClientCropsStateInfo=result.value;
    if(ClientCropsStateInfo!=null && ClientCropsStateInfo.State==-1)
    ClientCropsStateInfo=null;
    CreateHeroPage();
    if( ClientCropsStateInfo!=null)
    CreateAttackCorps();
    Main.GetCityHero(CityID,cb_GetCityHero);//请求侠客信息  
}

//点击出战队列图标
function ClickFightTeam()
{
    if(ControlTarget==5)
    return;
    Main.GetCityCropsState(CityID,cb_GetFightCropsState);//点击图标在此请求本城军团相关信息
}

//再次请求信息回调
function cb_GetFightCropsState(result)
{
    if(DataValidate(result)==false) return;
    ClientCropsStateInfo=result.value;
    if(ClientCropsStateInfo!=null && ClientCropsStateInfo.State==-1)
    ClientCropsStateInfo=null;
    HasCanQuickReturn();
    CreateAttackTeamTree();
}

//点击本城攻击军团树显示
function CreateAttackTeamTree()
{
    var html="";
    ControlTarget=5;
    HasCanQuickReturn();
    var nodeType=NodeAttackTeam;
    if(ClientCropsStateInfo!=null)
    html+=HtmlTreeNode(ClientCropsStateInfo,nodeType,0);
    var tree=document.getElementById("trees");
    tree.innerHTML=html; 
    OpenTheFirstNode(); 
    html=null;
}

//支援队列回调
function cb_GetCityOtherCorps(result)
{
    if(DataValidate(result)==false) return;
    
    CorpsInfo=result.value;
    if(CorpsInfo!=null && CorpsInfo[0].CorpsID==-1)
        CorpsInfo=null;
    
    CreateSupportCorps();
    
    Main.GetValidEvent(CityID,cb_GetValidEvent);//请求事件信息   
       
}

//点击支援队列图标树显示
function CreateSupportTeamTree()
{
    var nodeType=NodeSupportTeam;
    ControlTarget=6;
    var html="";
    if(CorpsInfo!=null)
    {
        var i=0;
        while(CorpsInfo[i]!=null)
        {
            html+=HtmlTreeNode(CorpsInfo[i],nodeType,i);
            i++;
        }
        var tree=document.getElementById("trees");
        tree.innerHTML=html; 
        OpenTheFirstNode(); 
        html=null;
    }
    else
    {
        ShowMessageBox(Lang["Pages_41"]);
    }
}

//创建本城本城攻击队列状态
function CreateAttackCorps()
{
    var html="";
    if(ClientCropsStateInfo!=null)
    {
        var team;
        team = ClientCropsStateInfo;
        var TeamState = team.State;
        switch(TeamState)
        {
            case 1:
            case 2:
            case 3:
            case 4:
            case 6:
            case 8:
            case 9:
            case 11:
            case 12:
            html+="<a onmousedown=\"ClickFightTeam()\" href=\"#\"><img src=\"img/2/h/h/7.GIF\" /></a><span>"+AttackTeamState[team.State-1]+"</span>";
            break
            case 5:
            case 13:
            html+="<a onmousedown=\"ClickFightTeam()\" href=\"#\"><img src=\"img/2/h/h/7.GIF\" /></a><span>"+AttackTeamState[team.State-1]+"<font class=\"font_bold\">"+team.Npcname+"</font></span>";
            break
            case 7:
            case 10:
            html+="<a onmousedown=\"ClickFightTeam()\" href=\"#\"><img src=\"img/2/h/h/7.GIF\" /></a><span>"+AttackTeamState[team.State-1]+"<font class=\"font_bold\">"+team.Npcname+"</font></span>";
            break
        }
    }
    var tree=document.getElementById("attackteam");
    tree.innerHTML=html;  
    html=null;
}  

//创建支援队列状态
function CreateSupportCorps()
{   
    var html="";
    if(CorpsInfo==null)
    html+="<a onmousedown=\"CreateSupportTeamTree()\" href=\"#\"><img src=\"img/2/h/h/8.GIF\" /></a><span>"+Lang["Pages_42"]+"</span>";
    else
    html+="<a onmousedown=\"CreateSupportTeamTree()\" href=\"#\"><img src=\"img/2/h/h/8.GIF\" /></a><span>"+Lang["Pages_43"]+""+CorpsInfo.length+""+Lang["Pages_58"]+"</span>";
    var tree=document.getElementById("supportteam");
    tree.innerHTML=html;    
    html=null;
}

//军团攻击和增援操作
var CorpsHandleType=11;
var CorpsTarget=0;
function CorpsCommand(id)
{
    var t=id.split("_");
    CorpsHandleType=parseInt(t[1],10)+10; 
    var pos=0;
    var s=CanAttack();
    if(s=="")
    {
        var x=$("#target_x").val();
        var y=$("#target_y").val();
        x=x.replace(/\D+/g,'');
        y=y.replace(/\D+/g,'');
        //如果为攻擂
        if(CorpsHandleType==55)
        {
            if(x=="" || y=="" || parseInt(x,10)<1 || parseInt(x,10)>400 || parseInt(y,10)>400 || parseInt(y,10)<1)
            {
                ShowPopUp("pop_105");
            }
            else
            {
                //坐标是为擂台坐标
                var bool=isArena(x,y)
                if(bool==true)
                {
                    pos=(parseInt(y,10)-1)*400+parseInt(x,10);
                    CorpsTarget=pos;
                    Main.GetArena(pos,cb_GetArena)
                }
                else
                {
                    ShowPopUp("pop_105");
                }
            }
        }
        else
        {
            if(x=="" || y=="" || parseInt(x,10)<1 || parseInt(x,10)>400 || parseInt(y,10)>400 || parseInt(y,10)<1)
                ShowMessageBox(Lang["Pages_44"]); 
            else
            {          
                pos=(parseInt(y,10)-1)*400+parseInt(x,10);
                CorpsTarget=pos;
                //驻守
                if(CorpsHandleType==39)
                    Main.GetMapInfoByPos(pos,cb_GetMapInfoByPos);
                //出征或支援
                else
                    Main.GetWorldPosState(CityID,pos,cb_GetWorldPosState);
            }
        }
    } 
    else
        ShowMessageBox(s);     
}

//获得NPC状态回调
function cb_GetMapInfoByPos(result)
{
    if(DataValidate(result)==false) return;
    PosNpcInfo=result.value;
    if(PosNpcInfo!=null && PosNpcInfo.State==-1)
        PosNpcInfo=null;
    var level =PosNpcInfo.Level-CityInteriorInfo.Level;
    //已有玩家驻守在此处
    if(PosNpcInfo.State==1)
        ShowMessageBox(Lang["Pages_45"]);
    //此地不能驻防
    else if(PosNpcInfo.Type!=6)
        ShowMessageBox(Lang["Pages_46"]);
    //实力不足，不能驻守此山寨
    else if(level>0)
        ShowMessageBox(Lang["Pages_47"]);
    else
        Main.GetWorldPosState(CityID,CorpsTarget,cb_GetWorldPosState);
}

function cb_GetArena(result)
{
    if(DataValidate(result)==false)return;
    else
    {
        var clientArenaState=result.value;
        //获取出战队列侠客最高等级
        var level=GetMaxLevel();
        if(clientArenaState.IsTime==0)
        {
            var time=Main.GetArenaTimes().value;
            ShowMessageBox(Lang["Pages_64"]+time[0]+"-"+time[1]);
        }
        //else if(level==clientArenaState.NpcLevel&&level==100)
        //{
            //Main.GetWorldPosState(CityID,CorpsTarget,cb_GetWorldPosState);
	    //}
        else if(level>clientArenaState.NpcLevel)
        {
            ShowMessageBox(Lang["Pages_65"]+clientArenaState.NpcLevel+Lang["PopUp_130"]);
            $("#target_x")[0].value ="";
	        $("#target_y").val("");
	    }
        else
            Main.GetWorldPosState(CityID,CorpsTarget,cb_GetWorldPosState);
    }
}


function cb_GetWorldPosState(result)
{
     if(DataValidate(result)==false)return;
       
     else
     {   
       var MeHasPeace;
       if(PersistEffectGroupInfo!=null)
       {
           for(var i=0;i<PersistEffectGroupInfo.length;i++)
           {
                 if(PersistEffectGroupInfo[i].MainEffectType==6)
                 MeHasPeace=true;
           }
       }
        var objType=5;
        var objID=0; 
        if((result.value==2 && UserInfo.State==1 && MeHasPeace!=true && result.value!=6 && result.value!=7) || (result.value==1 && CorpsHandleType==11) || (result.value==1 && CorpsHandleType==39) || (result.value==10116 && CorpsHandleType==55) || (result.value==30131 && CorpsHandleType==12) || (result.value==30132 && CorpsHandleType==12)) 
            AddCorpsEvent(CorpsHandleType,objType,objID,CorpsTarget);
        //NPC不能被增援
        else if(result.value==1 && CorpsHandleType==12)
            ShowMessageBox(Lang["Pages_48"]);
        //您处于免战状态不可以攻击或增援其他玩家
        else if(MeHasPeace==true)
            ShowMessageBox(Lang["Pages_49"]);
        //对方处于免战状态，你不可以攻击或增援
        else if(result.value==6)
            ShowMessageBox(Lang["Pages_50"]);
        //在新手保护时间内不能攻击其它玩家
        else if(UserInfo.State==3)
            ShowMessageBox(Lang["Pages_51"]);            
        //目标是空地
        else if(result.value==0)
            ShowMessageBox(Lang["Pages_52"]);
        //目标在新手保护状态
        else if(result.value==4)
            ShowMessageBox(Lang["Pages_53"]);
        //今天您已经攻击他两次了，冷静下，休息休息。来日方长嘛。
        else if(result.value==30131)
            ShowMessageBox(Lang["Pages_54"]);
        //这个村镇今天已被反复掠夺,没什么油水了,还是换个地方吧。
        else if(result.value==30132)
            ShowMessageBox(Lang["Pages_55"]);
        //此地不能攻击!
        else if(result.value==10116)
            ShowMessageBox(Lang["Pages_63"]);
        //操作无效
        else 
            ShowMessageBox(Lang["Pages_56"]);        
     }
}


//判断是否为擂台坐标
function isArena(x,y)
{
    var ar=x+y;
    var i=0;
    var bool=false;
    while(Arena[i]!=null)
    {
        if(Arena[i]==ar)
        {
            bool=true;
            break;
        }
        i++;
    }
    return bool;
}


//军团召回操作
function CallCorpsBack()
{
    var handleType=13;
    var objType=5;
    var objID=0;
    var pos=UserInfo.CityList[CityNum].Pos;
    if(PageNum==3)
    Main.CallCorpsBack(CityID,cb_CallCorpsBack); 
    else
    Main.CallCorpsBack(CityID,cb_CallCorpsBack)    
    DataTranslateBegin();
}

//军团特殊召回操作
function SpecialCallCorpsBack()
{
    HidePopUp();
    if(CanReturnSign==1)//取消军团事件
    {   
        var gold=CityInteriorInfo.Gold;
        if(gold-1<0)
        ShowPopUp("pop_25");
        else
        {
            actionType=20;
            var pos=UserInfo.CityList[CityNum].Pos;
            Main.AddCorpsEvent(CityID,actionType,5,0,pos,cb_AddEvent);
        }
    }
    if(CanReturnSign==2)//特殊快速召回
    {
        var index = HasCanQuickReturn();
        var gold=CityInteriorInfo.Gold;
        if(gold-5<0)
        ShowPopUp("pop_25");
        else if(EventInfo[index].RemainTime<60)
        ShowMessageBox(Lang["Pages_57"]);
        else
        {
            actionType=19;
            var pos=UserInfo.CityList[CityNum].Pos;
            Main.AddCorpsEvent(CityID,actionType,5,0,pos,cb_AddEvent);
        }
    }
}

//侠客页面回调
function cb_CallCorpsBack(result)
{
    if(DataValidate(result)==false) return;
    
    if(result.value==0)
    {    
         if(PageNum==3)//侠客页面
         Main.GetCityCropsState(CityID,cb_GetCityCropsState);
         if(PageNum==5)//大地图页面
         Main.GetValidEvent(CityID,cb_GetValidEvent);//请求事件信息
    }
    else
    {
        DataTranslateEnd();
    }
}
