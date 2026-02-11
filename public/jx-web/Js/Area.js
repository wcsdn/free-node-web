//点击空地的位置
var ControlTarget=1; // 1=事件 2=建筑 3=英雄 4=大地图单元 5=本城攻击军团
var ClickPos=0;
var ClickUnitType=0;
var ClickUnitIndex=-1;
var ClickHeroIndex=-1;
var NodePosInteriorBuilding=1;
var NodeTheInteriorBuilding=2;
var NodeTechnic=3;
var NodePosDefenceBuilding=4;
var NodeTheDefenceBuilding=5;
var NodeCanEenageHero=6;
var NodeCanDefenceHero=7;
var NodeTheHero=8;
var NodeTheItem=9;
var NodeDefenceHero=10;
var NodeCity=11;
var NodeCorps=12;
var NodeBlank=13;
var NodeAttackTeam=14;
var NodeSupportTeam=15;
var NodeTheOrg=16;
var NodeTheMember=17;

var WorldX=400;
var WorldY=400;
var DefenceX=30;
var DefenceX=30;

//点击内政地图
function ClickArea(id)
{  
    var t=id.split("_");
    if(parseInt(t[2],10)<=0 || ClickPos==parseInt(t[2],10))
        return;
    else
        ClickPos=parseInt(t[2],10);
    
    ControlTarget=2;
    EventListState=0;
    
    ShowAreaInfo();
    DataTranslateBegin();            
}



//点击城防地图
function ClickMap(id)
{
    var t=id.split("_");
    var unit;
    ClickUnitIndex=parseInt(t[3],10);
    
    //点空地或者是正在建造的建筑
    if(t[1]=="landform" || t[1]=="build" || t[1]=="sinker")
    {
        unit=LandformInfo[parseInt(t[3],10)];
        ClickUnitType=1
    }
    else
    {
        unit=MapUnitInfo[ClickUnitIndex];   
        //点的是建筑
        if(t[1]=="building")
            ClickUnitType=2;
        //点的是城防
        if(t[1]=="hero")
            ClickUnitType=3;
    }
    var x=(unit.Pos-1)%DefenceWidth;
    var y=Math.floor((unit.Pos-1)/DefenceWidth); 
    if(unit.Pos<=0 || ClickPos==unit.Pos || unit.Type==1 || y<=3 || y>=DefenceHeight-2)
        return;
    else
        ClickPos=unit.Pos;
    
    ControlTarget=2;
    EventListState=0;
    
    ShowAreaInfo();
    DataTranslateBegin();            
}


function ShowAreaInfo()
{
    if(ClickPos>0)
    {
        if(PageNum==1)
        {
            var hasBuilding=HasBuilding(ClickPos);     
            if(hasBuilding>=0)
            {
                Main.GetBuildingByID(CityID,1,MapUnitInfo[hasBuilding].ID,cb_GetBuildingByID);
            }
            else
            {    
                Main.GetBuildingByPos(CityID,1,ClickPos,cb_GetBuildingByPos);           
            }
        }
        if(PageNum==2)
        {
            //显示选中框
            var x=(ClickPos-1)%DefenceWidth;
            var y=Math.floor((ClickPos-1)/DefenceWidth); 
            var left=x*DefencePicSize;
	        var top=y*DefencePicSize;
            $("#img_select_2").css({"left":left,"top":top});
            $("#img_select_2").show();
            
            var hasDefence=HasDefence(ClickPos); 
            if(ClickUnitType==1)
                Main.GetBuildingByPos(CityID,2,ClickPos,cb_GetBuildingByPos);
                    
            else if(ClickUnitType==2)
                Main.GetBuildingByID(CityID,2,MapUnitInfo[hasDefence].ID,cb_GetBuildingByID);
            
            else 
                Main.GetHeroByID(CityID,MapUnitInfo[hasDefence].ID,cb_GetHeroByID);    
        }
    }
    else
    {
        DataTranslateEnd(); 
    }
}

//获得指定英雄信息
function cb_GetHeroByID(result)
{
    if(DataValidate(result)==false) return;
    
    HeroInfo=new Array(result.value);
    
    ShowTreeHero(NodeDefenceHero);
}

//获得内政空地是否有建筑存在,-1=不存在,>=0表示存在
function HasBuilding(pos)
{
    var result=-1;
     
    if(MapUnitInfo!=null)
    {   
        var i=0;
        while(MapUnitInfo[i]!=null)
        {
            if(MapUnitInfo[i].Pos==pos)
            {
                result=i;
                break;
            }
             i++;
        }
    }   
    return result;
}

function HasDefence(pos)
{
    var result=-1;
    
    ClickUnitType=1;
     
    if(MapUnitInfo!=null)
    {   
        var i=0;
        while(MapUnitInfo[i]!=null)
        {
            if(MapUnitInfo[i].Pos==pos)
            {
                result=i;              
                if(ClickUnitType==1 || (ClickUnitType==2 && MapUnitInfo[i].Type==3))
                    ClickUnitType=MapUnitInfo[i].Type
                if(ClickUnitType==3)
                break;    
            }
             i++;
        }
    }   
    return result;
}

//获得城防地图指定格子状态
function DefenceArea(pos)
{
   if(MapUnitInfo!=null)
    {   
        var i=0;
        while(MapUnitInfo[i]!=null)
        {
            if(MapUnitInfo[i].Pos==pos)
            {
                
                if(ClickUnitType==0 || ClickUnitType==1 || (ClickUnitType==2 && MapUnitInfo[i].Type==3))
                    ClickUnitType=MapUnitInfo[i].Type
                break;
            }
             i++;
        }
    }   
}


//获得指定建筑信息
function cb_GetBuildingByID(result)
{
    if(DataValidate(result)==false) return;
    
    TheBuildingInfo=result.value;
    if(TheBuildingInfo.ID==-1)
        TheBuildingInfo=null;
        
    ShowTheBuilding();   
}

//显示指定建筑信息
function ShowTheBuilding()
{   
    if(TheBuildingInfo!=null)
    {
        var html="";
        var nodeType;
        if(PageNum==1)
            nodeType=NodeTheInteriorBuilding;
        if(PageNum==2)
            nodeType=NodeTheDefenceBuilding;
            
        html+=HtmlTreeNode(TheBuildingInfo,nodeType,0);
        html+="<div id=\"tree_appand\"></div>";
        HideEventList();
        
        var tree=document.getElementById("trees");
        tree.innerHTML=html;
        //$("#trees").html(html);
        html=null;
          
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
        
        //展开第1个节点
        OpenTheFirstNode(); 
         
        //请求指定建筑科技信息
        
        if(PageNum==1)
        {
            
            
            if((TheBuildingInfo.Index>=12 && TheBuildingInfo.Index<=21))
                Main.GetCanEenageHero(CityID,TheBuildingInfo.Index-11,cb_GetCanEenageHero);
            else
                Main.GetTechnicByBuilding(CityID,TheBuildingInfo.Index,cb_GetTechnicByBuilding);     
        }
        if(PageNum==2)
        {
            Main.GetDefencePosHero(CityID,cb_GetDefencePosHero);
        }                          
     }
     else
     {
        DataTranslateEnd(); 
     }    
}


//获得指定建筑的科技信息
function cb_GetTechnicByBuilding(result)
{
    if(DataValidate(result)==false) return;
    
    TechnicInfo=result.value;
    if(TechnicInfo!=null && TechnicInfo[0].ID==-1)
       TechnicInfo=null;
                
    ShowTechnic();    
}


//获得指定建筑的待雇佣侠客信息
function cb_GetCanEenageHero(result)
{
    if(DataValidate(result)==false) return;
    
    HeroInfo=result.value;
    if(HeroInfo!=null && HeroInfo[0].ID==-1)
       HeroInfo=null;
                
    ShowTreeHero(NodeCanEenageHero);    
}


//显示可雇佣英雄
function ShowTreeHero(nodeType)
{    
    if(HeroInfo!=null)
    {
        var i=0;
        var html="";
        while(HeroInfo[i]!=null)
        {        
            html+=HtmlTreeNode(HeroInfo[i],nodeType,i)
            i++;
        }
        //HideEventList();
        if(nodeType==10)
        {
           //$("#trees").html(html);        
           var tree=document.getElementById("trees");
           tree.innerHTML=html;         
           OpenTheFirstNode();
        }
        else   
           $("#tree_appand").html(html);
               
        //更新树节点操作按钮的状态        
        UpdateTreeHandleState(nodeType);        
                   
        html=null;
    }
    DataTranslateEnd();    
}

//显示科技
function ShowTechnic()
{    
    if(TechnicInfo!=null)
    {
        var i=0;
        var html="";
        var nodeType=NodeTechnic;
        while(TechnicInfo[i]!=null)
        {        
            html+=HtmlTreeNode(TechnicInfo[i],nodeType,i)
            i++;
        }
       //HideEventList();
        $("#tree_appand").html(html);
       //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);        
        html=null;            
    }
    DataTranslateEnd();    
}

//获得指定位置可建造建筑信息
function cb_GetBuildingByPos(result)
{
    if(DataValidate(result)==false) return;
    
    PosBuildingInfo=result.value;
    if(PageNum==1)
    {
        var hasEvent = HasEventBuilding(ClickPos);
        if(hasEvent>=0)
        {
            if(EventInfo!=null && EventInfo[hasEvent]!=null)
            {    
                var index=EventInfo[hasEvent].ObjID;
                var i=0
                while(PosBuildingInfo!=null && PosBuildingInfo[i]!=null)
                {
                    if(PosBuildingInfo[i].Index!=index)
                        PosBuildingInfo.splice(i,1);
                    i++;
                }
            }
            
        } 
    }
              
    ShowPosBuilding();
        
    if(PageNum==2)
        Main.GetDefencePosHero(CityID,cb_GetDefencePosHero)
}

//获得指定位置可布防侠客信息
function cb_GetDefencePosHero(result)
{
    if(DataValidate(result)==false) return;
    
    HeroInfo=result.value;
    if(HeroInfo!=null && HeroInfo[0].ID==-1)
       HeroInfo=null;
   
    ShowTreeHero(NodeCanDefenceHero);
}


//显示空地可建建筑
function ShowPosBuilding()
{    
    if(PosBuildingInfo!=null)
    {
        var i=0;
        var html="";
        var nodeType;
        if(PageNum==1)
            nodeType=NodePosInteriorBuilding;
        if(PageNum==2)
            nodeType=NodePosDefenceBuilding;   
        while(PosBuildingInfo[i]!=null)
        {        
            html+=HtmlTreeNode(PosBuildingInfo[i],nodeType,i)
            i++;
        }
        HideEventList();
        html+="<div id=\"tree_appand\"></div>";
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
        
        //开启第1个标签
        OpenTheFirstNode();            
        html=null;
    }
    
    DataTranslateEnd();    
}

//点击英雄卡片
function ClickHero(id)
{
    var t=id.split("_");
    var index=parseInt(t[2],10);

    if(ClickHeroIndex==index)
        return;
     
    ClickHeroIndex=index;
    ShowClickHero();
    
    ControlTarget=3;
    EventListState=0;

}

//显示英雄卡片
function ShowClickHero()
{
    if(ClickHeroIndex>=0)
    {
        SelectHero(ClickHeroIndex);
        var html="";
        var nodeType=NodeTheHero;
        if(HeroInfo!=null && HeroInfo[ClickHeroIndex]!=null)
        {
            TheHeroInfo=HeroInfo[ClickHeroIndex];
            html+=HtmlTreeNode(HeroInfo[ClickHeroIndex],nodeType,0);
        }
        HideEventList();
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
        
        //开启第1个标签
        OpenTheFirstNode();    
        html=null;
    }
    DataTranslateEnd();
}

//点击支援的军团
function ClickCorps(id)
{
    var t=id.split("_");
    var index=parseInt(t[1],10);
    if(CorpsInfo!=null && CorpsInfo[index]!=null)
    {
        var i=0;
        var html="";
        
        TheCorpsInfo=CorpsInfo[index];
        var nodeType=NodeCorps;
        html+=HtmlTreeNode(TheCorpsInfo,nodeType,i)
        
        HideEventList();
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
        
        //开启第1个标签
        OpenTheFirstNode()                          
        html=null;
    }
    DataTranslateEnd();    
}


var WorldIndex="";
//点击大地图
function ClickCity(id)
{
    var t=id.split("_");
    var index=parseInt(t[3],10);
    var unit;
    var userName;
    WorldIndex=id;   
    ControlTarget=4;
    TwoEffectInfo = null;
    if(t[1]=="landform")
    {
        if(LandformInfo!=null && LandformInfo[index]!=null)
        {
            unit=LandformInfo[index];
            
            //显示选中框
            var x=Math.floor(unit.Pos%400);
            if(x==0)x=400;
            var y=(Math.floor((unit.Pos-1)/400)+1); 
            var left=(x-ViewNumX)*46;
	        var top=(y-ViewNumY)*46;
            $("#img_select_5").css({"left":left,"top":top});
            $("#img_select_5").show();
            
            CreateTreeBlank(NodeBlank,index);
        }
    }
    else
    {
        if(MapUnitInfo!=null && MapUnitInfo[index]!=null)
        {
            unit=MapUnitInfo[index];
            var citypos = unit.Pos;
            //显示选中框
            var x=Math.floor(unit.Pos%400);
            if(x==0)x=400;
            var y=(Math.floor((unit.Pos-1)/400)+1); 
            var left=(x-ViewNumX)*46;
	        var top=(y-ViewNumY)*46;
            var left=(x-ViewNumX)*46;
	        var top=(y-ViewNumY)*46;
            $("#img_select_5").css({"left":left,"top":top});
            $("#img_select_5").show();  
           
            if(unit.Type==5)
            {
                userName=unit.UserName;
                Main.GetUserSub(userName,cb_GetUserSub);
            }
            if(unit.Type==6 || unit.Type==7 || unit.Type==4 || unit.Type==8)
            {
                Main.GetDefenceNpcCorps(citypos,cb_GetDefenceNpcCorps);
            }

        }
    }
            
}

//强化用户信息显示调用
function cb_GetUserSub(result)
{
    if(DataValidate(result)==false) return;
        UserSubInfo=result.value;
    if(UserSubInfo!=null && UserSubInfo.Age==-1)
        UserSubInfo=null;
    var userName = UserSubInfo.UserName;
    Main.GetPerSistEffectFlags(userName,cb_GetPerSistEffectFlags);
}

//玩家的效果标记
function cb_GetPerSistEffectFlags(result)
{   
    if(DataValidate(result)==false) return;
    TwoEffectInfo=result.value;
    if(TwoEffectInfo!=null && TwoEffectInfo[0]==0)
    TwoEffectInfo=null;
    var t=WorldIndex.split("_");
    var index=parseInt(t[3],10);
    if(MapUnitInfo!=null && MapUnitInfo[index]!=null)
    {
        unit=MapUnitInfo[index];
        if(unit.Type==5 && unit.ID==CityID)
        {
             CreateTreeCity(NodeCity,index);
        }
        if(unit.Type==5 && unit.ID!=CityID)
        {
            CreateTreeCity(NodeCity,index);  
        } 
    }
}

//获得驻守NPC侠客信息回调
function cb_GetDefenceNpcCorps(result)
{
    if(DataValidate(result)==false) return;
        DefendHeroInfo=result.value;
    if(DefendHeroInfo!=null && DefendHeroInfo.State==-1)
        DefendHeroInfo=null;
    var t=WorldIndex.split("_");
    var index=parseInt(t[3],10);
    if(MapUnitInfo!=null && MapUnitInfo[index]!=null)
    {
        CreateTreeCity(NodeCity,index); 
    }
}

//显示城市信息
function CreateTreeCity(nodeType,index)
{
    if(MapUnitInfo!=null && MapUnitInfo[index]!=null)
    {
        var i=0;
        var html="";
        
        CityInfo=MapUnitInfo[index];
        html+=HtmlTreeNode(CityInfo,nodeType,0)
        
        HideEventList();
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;    
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);
        
        //开启第1个标签
        OpenTheFirstNode()       
        html=null;           
    }
    DataTranslateEnd();    
}

//显示大地图空地信息
function CreateTreeBlank(nodeType,index)
{
    if(LandformInfo!=null && LandformInfo[index]!=null)
    {
        var i=0;
        var html="";
        
        CityInfo=LandformInfo[index];
        html+=HtmlTreeNode(CityInfo,nodeType,0)
        
        HideEventList();
        //$("#trees").html(html);
        var tree=document.getElementById("trees");
        tree.innerHTML=html;
            
        //更新树节点操作按钮的状态 
        UpdateTreeHandleState(nodeType);        
        //开启第1个标签
        OpenTheFirstNode()       
        html=null;           
    }
    DataTranslateEnd();    
}

var LastSelectHero=-1;
//显示选中英雄的框
function SelectHero(index)
{
    var box="";
    var top="";
    var bottom="";
    if(LastSelectHero>=0)
    {
        box="#hero_box_"+LastSelectHero;
        top="#hero_top_"+LastSelectHero;
        bottom="#hero_bottom_"+LastSelectHero;
        $(box).removeClass();
        $(box).addClass("herobox");
        $(top).removeClass();
        $(top).addClass("top");
        $(bottom).removeClass();
        $(bottom).addClass("bottom");       
    }
    box="#hero_box_"+index;
    top="#hero_top_"+index;
    bottom="#hero_bottom_"+index;
    $(box).removeClass();
    $(box).addClass("herobox_s");
    $(top).removeClass();
    $(top).addClass("top_s");
    $(bottom).removeClass();
    $(bottom).addClass("bottom_s");      
    
    LastSelectHero=index;   
}


