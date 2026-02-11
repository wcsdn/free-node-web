//handletype...1=建造,2=快速建造.3=升级,4=快速升级,5=拆除,6=寻访,
//7=恢复,8=离开,9=训练,10=征兵,11=攻击,12=增援,13=返回,14=更换图片,
//15=雇佣,16=聘请,17=遣散,18=布防,19=撤防,20=出战,21=防守,22=后备,23=拆卸所有装备,24,解雇
//25=装备，26=使用，27=出售，28=回收,29=取消出售,30=卸下,31=卖家,32=购买,33=进入,34=遣返,
//35=快速恢复,36=特殊修理,37=修理,38=探索,39=驻守,40=快速训练，41=快速招募
//42=兑换铜钱，43=收购粮食，44=召集人口,45=闭关修炼,46=查看修炼,47=分解,48=搜索秘道,49=授功归隐
//50=亲临攻击,51=亲临支援，52=出战携带，53=防守携带，54=取消携带，55=攻擂，56=快速寻访,57=占领山寨
//58=放弃占领,59=征服,60=赎身,61=瞬间建造,62=瞬间升级
//nodetype...1=内政空地,2=内政指定建筑,3=科技.4=城防空地,5=指定城防建筑,6=待雇佣侠客,7=可布防英雄,8=指定英雄,9=操作物品,10=已布防的英雄,11=大地图城市,12=他城军团,13=大地图空地,14=军团图标

//节点操作项
var TreeHandleTypeList = new Array(Lang["Tree_1"],Lang["Tree_2"],Lang["Tree_3"],Lang["Tree_4"],Lang["Tree_5"],Lang["Tree_6"],Lang["Tree_7"],
Lang["Tree_8"],Lang["Tree_9"],Lang["Tree_10"],Lang["Tree_11"],Lang["Tree_12"],Lang["Tree_13"],Lang["Tree_14"],Lang["Tree_15"],Lang["Tree_16"],Lang["Tree_17"],Lang["Tree_18"],Lang["Tree_19"],
Lang["Tree_20"],Lang["Tree_21"],Lang["Tree_22"],Lang["Tree_23"],Lang["Tree_24"],Lang["Tree_25"],Lang["Tree_26"],Lang["Tree_27"],Lang["Tree_28"],Lang["Tree_29"],Lang["Tree_30"],
Lang["Tree_31"],Lang["Tree_32"],Lang["Tree_33"],Lang["Tree_34"],Lang["Tree_35"],Lang["Tree_36"],Lang["Tree_37"],Lang["Tree_38"],Lang["Tree_39"],Lang["Tree_40"],Lang["Tree_41"],Lang["Tree_42"],Lang["Tree_43"],Lang["Tree_44"],
Lang["Tree_45"],Lang["Tree_46"],Lang["Tree_47"],Lang["Tree_48"],Lang["Tree_49"],Lang["Tree_116"],Lang["Tree_117"],Lang["Tree_118"],Lang["Tree_119"],Lang["Tree_120"],Lang["Tree_121"],Lang["Tree_128"],Lang["Tree_129"],
Lang["Tree_131"],Lang["Tree_137"],Lang["Tree_133"],Lang["Tree_134"],Lang["Tree_135"]);

var Element = new Array(Lang["Tree_50"],Lang["Tree_51"],Lang["Tree_52"],Lang["Tree_53"],Lang["Tree_54"]);
//产生树节点
function HtmlTreeNode(nodeObj,nodeType,index)
{
    var html="";
    html+="<div class=\"container\">";
    html+=HtmlNodeTitle(nodeObj,nodeType,index);
    html+="<ul id=\"tree_ul_"+nodeType+"_"+index+"\">";
    html+=HtmlNodeContent(nodeObj,nodeType,index);
    html+="</ul>";
    html+="</div>"
    return html;
}

//树节点的标题
function HtmlNodeTitle(nodeObj,nodeType,index)
{
    var html="";
    var cssType=1;
    if(nodeType==3)
        cssType=2;
    if(nodeType==4 || nodeType==5)
        cssType=3;
    if(nodeType==9)
        cssType=3;      
    if(nodeObj!=null)
    {
        //生成折叠图标
        html+=HtmlClickImg("tree_control_"+nodeType+"_"+index,"node_control",PicPath+PicPlus,"NodeControl(this.id)");

        if((nodeType>=1 && nodeType<=5) || nodeType==8 || nodeType==9)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,PicPath+nodeObj.Icon,"NodeControl(this.id)");         
        if(nodeType==6 || nodeType==7 || nodeType==10)            
             html+=HtmlClickTipsImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,PicPath+nodeObj.Icon,"NodeControl(this.id)");
        //大地图城市图标
        if(nodeType==11 && nodeObj.IsLord==1)//征服大图标
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,PicPath+nodeObj.Image,"NodeControl(this.id)");
        if(nodeType==11 && nodeObj.IsLord!=1)//占领山寨大图标
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,PicPath+nodeObj.Image,"NodeControl(this.id)");
        //大地图空地图标
        if(nodeType==13)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,PicPath+nodeObj.Image,"NodeControl(this.id)");
        if(nodeType==12)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,"img/2/b/o/24.gif","NodeControl(this.id)"); 
        if(nodeType==14)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,"img/2/h/h/7.gif","NodeControl(this.id)"); 
        if(nodeType==15)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,"img/2/h/h/8.gif","NodeControl(this.id)"); 
        if(nodeType==16)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,"img/o/56.gif","NodeControl(this.id)"); 
        if(nodeType==17)
            html+=HtmlClickImg("tree_icon_"+nodeType+"_"+index,"node_icon_"+cssType,"img/2/m/u2.gif","NodeControl(this.id)"); 
        if(nodeType==12)
            html+="<span class=\"node_title_span\">"+nodeObj.CorpsName+Lang["Tree_55"];
        
        //生成大地图城市的名称及相关属性
        else if(nodeType==11)
        {
            var m = 1;
            if(nodeObj.Level>1)
            m=(nodeObj.Level-1)*5;
            if(nodeObj.Type==5)//nodeObj.Type= 4:少林寺npc 5:玩家 6:普通npc 7:分层NPC
            {
                if(TwoEffectInfo!=null)//玩家效果标记不为空
                {
                    html+="<span class=\"node_title_span\">"+nodeObj.Name;
                    for(var i=0;i<TwoEffectInfo.length;i++) 
                    {
                        if(TwoEffectInfo[i]==1)
                            html+="<img onmouseover=\"ShowTips(event,'common_1_80')\" onmouseout=\"HideTips()\" src=\"img/o/42.gif\" />";//vip
                        if(TwoEffectInfo[i]==6)
                            html+="<img onmouseover=\"ShowTips(event,'common_1_81')\" onmouseout=\"HideTips()\" src=\"img/o/43.gif\" />";//免战
                    }
                }
                else
                    html+="<span class=\"node_title_span\">"+nodeObj.Name;
                if(nodeObj.State==3)
                    html+=Lang["Tree_56"];//新手保护状态
                if(nodeObj.IsAppendantNPC!=1 && nodeObj.IsLord ==1)//征服小图标
                    html+="<a id=\"tree_handle_"+nodeType+"_-59_"+index+"\" onmouseout=\"HideTips(this.id)\" onmouseover=\"ShowTips(event,this.id)\" href=\"#\"><img style=\"padding-left:5px;\" src=\"img/o/zl.gif\" /></a>";
            }
            else if(nodeObj.Type!=4 && nodeObj.Type!=5 && nodeObj.EspecialType!=1)
            {
                html+="<span class=\"node_title_span\">"+nodeObj.Name+" "+m+Lang["Tree_57"];
                var pos = nodeObj.ImageIndex%4;
                switch(pos)
                {
                    case 0:
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/3.gif\" />";
                        break;
                    case 1:
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/2.gif\" />";
                        break;
                    case 2:
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/1.gif\" />";
                        break;
                    case 3:
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/1.gif\" />";
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/2.gif\" />";
                        html+="<img style=\"padding-left:5px;\" src=\"img/4/3.gif\" />";
                        break;
                }
                if(nodeObj.IsAppendantNPC==1 && nodeObj.IsLord!=1)//占领小图标
                    html+="<a id=\"tree_handle_"+nodeType+"_-57_"+index+"\" onmouseout=\"HideTips(this.id)\" onmouseover=\"ShowTips(event,this.id)\" href=\"#\"><img style=\"padding-left:5px;\" src=\"img/o/zl.gif\" /></a>";
            }
            
            else if(nodeObj.EspecialType==1)
            {
                html+="<span class=\"node_title_span\">"+nodeObj.Name+" "+m+Lang["Tree_57"];
                html+="<img style=\"padding-left:5px;\" src=\"img/o/76.gif\" />";
            }
            else
            {
                html+="<span class=\"node_title_span\">"+nodeObj.Name+" "+m+Lang["Tree_57"]; 
            }
        }
        else if(nodeType==13)
            html+="<span class=\"node_title_span\">"+Lang["Tree_58"]+"";
        else if(nodeType==9 &&　nodeObj.ItemType!=1)
            html+="<span class=\"iquality_"+nodeObj.Quality+"\">"+nodeObj.Name+" "+nodeObj.UseLevel+Lang["Tree_57"];
        else if(nodeType==14)
            html+="<span class=\"node_title_span\">"+Lang["Tree_59"]+"";
        else if(nodeObj.Quality!=null)
            html+="<span class=\"iquality_"+nodeObj.Quality+"\">"+nodeObj.Name+" "+nodeObj.Level+Lang["Tree_57"];
        else if(nodeType==15)
        {
            var x=Math.floor(nodeObj.CityPos%400);
            if(x==0)x=400;
            var y=(Math.floor((nodeObj.CityPos-1)/400)+1); 
            html+="<span class=\"node_title_span\">"+nodeObj.CorpsName+"("+x+","+y+")";
        }
        else if(nodeType==16)
            html+="<span class=\"node_title_span\">"+nodeObj.OrgName+" "+nodeObj.OrgLevel+Lang["Tree_57"];
        else if(nodeType==17)
            html+="<span class=\"node_title_span\">"+nodeObj.UserName+"["+UserLevel[nodeObj.UserLevel-1]+"]";
        else
            html+="<span class=\"node_title_span\">"+nodeObj.Name+" "+nodeObj.Level+Lang["Tree_57"];
         
        if((nodeType>=1 && nodeType<=3) && nodeObj.Area>0)
            html+=Lang["Tree_60"]+nodeObj.Area;
        html+="</span>";    
 
    }
    return html;   
}

//树节点可隐藏部分的内容
function HtmlNodeContent(nodeObj,nodeType,index)
{
    var html="";    
    var effect;    
    if(nodeType!=11 && nodeType!=12 && nodeType!=13 && nodeType!=14 && nodeType!=15 && nodeType!=16  && nodeType!=17)
        html+="<li>"+nodeObj.Des+"</li>";
     
    //门派建筑的无行属性
    if((nodeType==1 || nodeType==2) && nodeObj.Index>=12 && nodeObj.Index<=21)
    {
        html+="<li>"+Lang["Tree_61"]+""+Element[Math.floor((nodeObj.Index-12)/2)]+"</li>";
    }

    var effPrefix="";
    var effPostfix="";
                
    if((nodeType==2 || nodeType==3) & nodeObj.EffID>=0)
    {
        if(nodeType==2)
        {
            effPostfix=InteriorBuildingTipsPostfix[nodeObj.EffID];
            effPrefix=InteriorBuildingTipsPrefix[nodeObj.EffID];
        }
        if(nodeType==3)
        {
            effPrefix=TechnicTipPrefix[nodeObj.EffID];
            effPostfix=TechnicTipPostfix[nodeObj.EffID];
        }
        if(nodeObj.CurrentEff>0)
            html+="<li>"+nodeObj.Level+Lang["Tree_57"]+effPrefix+nodeObj.CurrentEff+effPostfix+"</li>"     
    }
    if(nodeType==4 || nodeType==5)
    {
        if(nodeObj.Index>=3 && nodeObj.Index<=6)
            html+="<li>"+nodeObj.Level+Lang["Tree_132"]+nodeObj.Attack+"</li>";
        else
            html+="<li>"+nodeObj.Level+Lang["Tree_62"]+nodeObj.Attack+"</li>";
        if(nodeObj.HitPoint>=1) //用最大耐久判断
            html+="<li>"+nodeObj.Level+Lang["Tree_63"]+nodeObj.HitPoint+"</li>"; 
    }
    //大地图城市
    if(nodeType==11)
    {
        if(nodeObj.Type==5 && nodeObj.ID==CityID && nodeObj.IsLord==1)//属地
            html+="<li class=\"boldred\">"+nodeObj.OccupationInfo.Brief+"</li>";//属地
            
        if(nodeObj.Type==5 && nodeObj.ID==CityID)
            html+="<li>"+Lang["Tree_64"]+"</li>";//自己的城
            
        if(nodeObj.Type==5 && nodeObj.ID!=CityID && nodeObj.IsLord==1)//征服状态
        {
            html+="<li class=\"boldred\">"+nodeObj.OccupationInfo.Brief+"</li>";//属地
        }
        
        if(nodeObj.Type==5 && nodeObj.ID!=CityID)//其他玩家
        {
            html+="<li><a href=\"#\" onmousedown=\"PopUpSeeUserInfo()\">"+nodeObj.UserName+"</a></li>";
        }
        
        if(nodeObj.Type==5 && nodeObj.ID!=CityID) 
        {
            html+="<li>"+Lang["Tree_65"]+""+UserLevel[nodeObj.Level-1]+"</li>";//官位
            if(nodeObj.JuntaName!=null)
                html+="<li>"+Lang["Tree_66"]+""+nodeObj.JuntaName+"</li>";//帮派
            else
                html+="<li>"+Lang["Tree_67"]+"</li>";//帮派:无
        }
        var x=Math.floor(nodeObj.Pos%400);
        if(x==0) x=400;
        var y=(Math.floor((nodeObj.Pos-1)/400)+1);
        html+="<li>"+Lang["Tree_68"]+"("+x+","+y+")</li>";//位置
        if(DefendHeroInfo!=null)
        {
            if((nodeObj.Type==6 || nodeObj.Type==7) && DefendHeroInfo.CityID==CityID)
                html+="<li>"+Lang["Tree_69"]+"</li>";//出战队列目前驻守在此处
            if(nodeObj.Type==8 && DefendHeroInfo.CityID==CityID)
                html+="<li>"+Lang["Tree_122"]+"</li>";//出战队列目前在此守擂
        }
        if((nodeObj.Type==6 || nodeObj.Type==7) && DefendHeroInfo!=null)
            html+="<li>"+Lang["Tree_70"]+""+DefendHeroInfo.CorpsName+"</li>";
        if(nodeObj.Type==8)
        {
            if(DefendHeroInfo!=null)
                html+="<li>"+Lang["Tree_123"]+"<span style=\"font-weight:bold;color:#35c235\">"+DefendHeroInfo.CorpsName+"</span></li>";
            else
                html+="<li>"+Lang["Tree_123"]+"<span style=\"font-weight:bold;color:#35c235\">"+Lang["union_6"]+"</span></li>";
        }
        if(nodeObj.IsAppendantNPC==1)//您占领了此山寨
            html+="<li class=\"font_green\">"+Lang["Tree_130"]+"</li>";
    }
    if(nodeType==14)
    {
        if(nodeObj.State==7 || nodeObj.State==5 || nodeObj.State==13)
            html+="<li>"+AttackTeamState[nodeObj.State-1]+"<font class=\"font_bold\">"+nodeObj.Npcname+"</font></li>";
        else
            html+="<li>"+AttackTeamState[nodeObj.State-1]+"</li>";
        if(nodeObj.State==5 || nodeObj.State==7 || nodeObj.State==13)
        {
            var x;
            var y;
            x=Math.floor(nodeObj.Pos%400);
            if(x==0)x=400;
            y=(Math.floor((nodeObj.Pos-1)/400)+1); 
            html+="<li>"+Lang["Tree_68"]+"("+x+","+y+")</li>";
        }
    }
    if(nodeType==15)
    {
        html+="<li><a id=\"support_"+index+"\" onmousedown=\"WriteLetter(this.id)\" href=\"#\">"+Lang["Tree_71"]+"</a></li>";
        html+="<li><a id=\"support_"+index+"\" onmousedown=\"SeeHeroInfo(this.id)\" href=\"#\">"+Lang["Tree_72"]+"</a></li>";
        html+="<li><a id=\"support_"+index+"\" onmousedown=\"ReturnSupportTeam(this.id)\" href=\"#\">"+Lang["Tree_73"]+"</a></li>";
    }
    if(nodeType==16)
    {
        html+="<li id=\"unionintro\"></li>";
        if(OrgInfo.MyOrganize==null && OrgInfo.MyMember!=null && nodeObj.OrgName==OrgInfo.MyMember.OrgName)
        html+="<li><a href=\"#\" onmousedown=\"CancelApplication()\">"+Lang["Tree_74"]+"</a></li>";
    }
    if(nodeType==17)
    {
        if(MyMemberInfo.Privilege>=3)
        {
            if(nodeObj.Privilege==0)//如果无权限
            {
                html+="<li><a id=\"support_"+index+"\" onmousedown=BossFunc(0,"+"'"+nodeObj.UserName+"'"+") href=\"#\">"+Lang["Tree_75"]+"</a></li>";
                html+="<li><a id=\"support_"+index+"\" onmousedown=BossFunc(1,"+"'"+nodeObj.UserName+"'"+") href=\"#\">"+Lang["Tree_76"]+"</a></li>";
            }
            if(nodeObj.Privilege!=4 && MyMemberInfo.Privilege>nodeObj.Privilege && nodeObj.Privilege!=0)//我的等级大于节点等级操作对象非帮主且在帮中
                html+="<li><a id=\"support_"+index+"\" onmousedown=BossFunc(2,"+"'"+nodeObj.UserName+"'"+") href=\"#\">"+Lang["Tree_77"]+"</a></li>"; 
            if(MyMemberInfo.Privilege==3 && MyMemberInfo.UserName==nodeObj.UserName)//副帮主且操作对象为自己
                html+="<li><a href=\"#\" id=\"union_3\" onmousedown=\"UnionPopUp(this.id)\">"+Lang["Tree_78"]+"</a></li>";
            if(MyMemberInfo.Privilege==4 && nodeObj.Privilege==3)
                html+="<li><a href=\"#\" id=\"union_2\" onmousedown=\"UnionPopUp(this.id)\">"+Lang["Tree_79"]+"</a></li>";
            if(MyMemberInfo.Privilege==4 && nodeObj.Privilege==1 && MyOrgInfo.OfficialNumber<MyOrgInfo.MaxOfficialNumber)//是帮主且操作对象为普通帮众/满足官员数量
                html+="<li><a href=\"#\" onmousedown=\"AppointLeader()\">"+Lang["Tree_80"]+"</a></li>";
            if(MyMemberInfo.Privilege==4 && nodeObj.Privilege==3)//是帮主且操作对象为副帮主
                html+="<li><a href=\"#\" onmousedown=\"RelieveLeader()\">"+Lang["Tree_81"]+"</a></li>";
        }
    }
    if(nodeType==13)
    {
        var x=Math.floor(nodeObj.Pos%400);
        if(x==0)x=400;
            var y=(Math.floor((nodeObj.Pos-1)/400)+1);   
        html+="<li>"+Lang["Tree_68"]+"("+x+","+y+")</li>";
    }

    if(nodeType==9)
    {
        html+="<table width=\"150\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";	    
        if(nodeObj.GetMoney>0)
            html+="<tr><td width=\"30\" height=\"24\">"+HtmlImg("t_money","",PicPath+PicMoney)+"</td><td>"+nodeObj.GetMoney+"</td></tr>";
        if(nodeObj.GetFood>0)
            html+="<tr><td width=\"30\" height=\"24\">"+HtmlImg("t_food","",PicPath+PicFood)+"</td><td>"+nodeObj.GetFood+"</td></tr>";
        if(nodeObj.GetMen>0)
            html+="<tr><td width=\"30\" height=\"24\">"+HtmlImg("t_men","",PicPath+PicMen)+"</td><td>"+nodeObj.GetMen+"</td></tr>";
        if(nodeObj.GetGold>0)
            html+="<tr><td width=\"30\" height=\"24\">"+HtmlImg("t_gold","",PicPath+PicGold)+"</td><td>"+nodeObj.GetGold+"</td></tr>";
        html+="</table>";                                          
    }
    //html+="<li><a href=\"interior_help.html#b\" class=\"linkstyle\">[详情]</a></li>";
    //内政帮助链接
    if (nodeType==1 || nodeType==2)
        html+="<li><a href=\"interior_help_"+ServerInfo.Lang+".html#b"+nodeObj.Index+"\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    if (nodeType==3)
        html+="<li><a href=\"interior_help_"+ServerInfo.Lang+".html#t"+nodeObj.Index+"\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    //城防帮助链接
    if (nodeType==4 || nodeType==5)
        html+="<li><a href=\"defence_help_"+ServerInfo.Lang+".html#f"+nodeObj.Index+"\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    //侠客帮助链接
    if (nodeType==6 || nodeType==7 || nodeType==8 || nodeType==10 ||nodeType==14 ||nodeType==15)
        html+="<li><a href=\"hero_help_"+ServerInfo.Lang+".html#h"+nodeObj.Junta+"\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    //物品帮助链接
    if (nodeType==9)
        html+="<li><a href=\"item_help_"+ServerInfo.Lang+".html#ia"+nodeObj.Type+"\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    //大地图帮助链接
    if ((nodeType==11 && nodeObj.EspecialType!=1) || nodeType==12 || nodeType==13)
        html+="<li><a href=\"map_help_"+ServerInfo.Lang+".html\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank class=\"linkstyle\">"+Lang["Tree_82"]+"</a></li>";
    if(nodeType==11 && nodeObj.EspecialType==1)//擂台
        html+="<li><a href=\"fruition_help_"+ServerInfo.Lang+".html#f5\" onmouseover=\"ShowTips(event,'common_1_10')\" onmouseout=\"HideTips()\" target=_blank style=\"margin-left:165px;\" class=\"linkstyle_3\">"+Lang["Tree_124"]+"</a></li>";
    //强化用户信息显示
    if(PageNum==9 && nodeType==9 && nodeObj.UserName!=UserInfo.Name)
        html+="<li><a href=\"#\" onmousedown=\"PopUpSeeUserInfo()\">"+Lang["Tree_83"]+""+" "+nodeObj.UserName+"</a></li>";
    //大地图城市
    if(nodeType==11)
    {
        if(nodeObj.Type==7)
        {
            html+="<li>"+Lang["Tree_84"]+""+nodeObj.NpcFloorMax+"</li>";//隧道层数
            html+="<li>"+Lang["Tree_85"]+""+nodeObj.NpcFloor+"</li>";//当前层数
            html+="<li>"+Lang["Tree_86"]+""+UnionName[nodeObj.NpcFloorJunta]+"</li>";//当前守卫
        }
        if(nodeObj.Type==6)
            html+="<li>"+Lang["Tree_87"]+"</li>";//秘道未开启
        if(nodeObj.Type==8)
            html+="<li>"+Lang["Tree_125"]+"</li>";//擂台已开启
        if(nodeObj.Type==4 && nodeObj.EspecialType==1)
            html+="<li><span class=\"font_gray\">"+Lang["Tree_126"]+"</span></li>";//擂台未开启
        if(nodeObj.EspecialType==1)
            html+="<li><a href=\"#\" onmousedown=\"GetSeeHeros()\">"+Lang["Tree_127"]+"</a></li>"; //英雄榜
    }
    if(nodeType>=1 && nodeType<=5)
    {  
        html+=HtmlTreeCommand(nodeObj,nodeType,index);//显示可操作信息
        if(HasEventBuilding(ClickPos)>=0)  
            html+=HtmlTreeEvent(HasEventBuilding(ClickPos)); //显示事件信息         
    }
    if(nodeType==2 && nodeObj.Index==1)
    {
        var flag = CityInteriorInfo.ChangeMapFlag;
        if(flag==1)
            html+="<li><a href=\"#\" onmouseover=\"ShowTips(event,'common_1_84')\" onmouseout=\"HideTips()\" onmousedown=\"CityShow()\"><span class=\"needgold\">"+Lang["Tree_88"]+"</span></a></li>";
        else
            html+="<li class=\"font_gray\" onmouseover=\"ShowTips(event,'common_1_83')\" onmouseout=\"HideTips()\">"+Lang["Tree_88"]+"</li>";
    }     
    if(nodeType==6 || nodeType==7)
    {
        html+=HtmlTreeCommand(nodeObj,nodeType,index);//显示可操作信息
        html+=HtmlTreeEvent(HasEventHero(nodeObj.ID)); //显示事件信息
    }
    if(nodeType==8)
    {
        html+=HtmlHeroItem(nodeObj);
        html+=HtmlTreeCommand(nodeObj,nodeType,index);//显示可操作信息
        if(nodeObj.State>=9)
            html+="<li title=\""+Lang["Tree_114"]+"\" style=\"color:gray;margin-left:40px;\">"+Lang["Tree_114"]+"</li>";
        else if(nodeObj.Level<40)
            html+="<li title=\""+Lang["Tree_115"]+"\" style=\"color:gray;margin-left:40px;\">"+Lang["Tree_114"]+"</li>";
        else
            html+="<li style=\"margin-left:40px;\"><a href=\"#\" id=\"name_1\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" style=\"color:#B100FA;\" onmousedown=\"ChangeName(this.id)\">"+Lang["Tree_114"]+"</a></li>";

        if(HasEventHero(nodeObj.ID)>=0)
            html+=HtmlTreeEvent(HasEventHero(nodeObj.ID));//显示事件信息  
    }
     
    if(nodeType==9 || nodeType==10 || nodeType==11 || nodeType==12 || nodeType==13)
    {
        html+=HtmlTreeCommand(nodeObj,nodeType,index);//显示可操作信息  
    }
    if(nodeType==2 && nodeObj.EffectArray!=null)
    {
        for(var i=0;i<nodeObj.EffectArray.length;i++)
        {
            effect=nodeObj.EffectArray[i];
            if(effect.State==0)
            html+="<li><a id=\"teffect_"+effect.StaticIndex+"_"+i+"_"+effect.MainEffectType+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\" onmousedown=\"PopUpAboutEffect(this.id)\" href=\"#\"><span class=\"needgold\">"+effect.EffectName+"</span></a></li>";
            else
            html+="<li onmouseover=\"ShowTips(event,'common_1_79')\" onmouseout=\"HideTips()\" class=\"node_handle_span\">"+effect.EffectName+"</li>";
        }
    }
    //音乐/小说/小游戏
    if(nodeType==2 && nodeObj.Index==8 && nodeObj.Level>=5 && VersionInfo[0]!="kfc" && VersionInfo[0]!="kg" && VersionInfo[0]!="pps" && VersionInfo[0]!="tw" && VersionInfo[0]!="yzz")
    {
        html+="<li><a href="+ToMusic+" onmouseover=\"ShowTips(event,'common_1_85')\" onmouseout=\"HideTips()\" target=\"_blank\">"+Lang["Tree_89"]+"</a></li>";
    }
    if(nodeType==2 && nodeObj.Index==5 && nodeObj.Level>=1 && VersionInfo[0]!="kfc" && VersionInfo[0]!="kg" && VersionInfo[0]!="pps" && VersionInfo[0]!="tw" && VersionInfo[0]!="yzz")
    {
        html+="<li><a href="+ToStory+" onmouseover=\"ShowTips(event,'common_1_86')\" onmouseout=\"HideTips()\" target=\"_blank\">"+Lang["Tree_90"]+"</a></li>";
    }
    if(nodeType==2 && nodeObj.Index==11 && nodeObj.Level>=3 && VersionInfo[0]!="kfc" && VersionInfo[0]!="kg" && VersionInfo[0]!="pps" && VersionInfo[0]!="tw" && VersionInfo[0]!="yzz")
    {
        html+="<li><a href="+ToLittleGame+" onmouseover=\"ShowTips(event,'common_1_87')\" onmouseout=\"HideTips()\" target=\"_blank\">"+Lang["Tree_91"]+"</a></li>";
    }
    //快速更换资源
    if(nodeType==2 && nodeObj.Index==7 && nodeObj.TradeRes.LevelMoney<=0)
        html+="<li style=\"color:gray;\" onmouseover=\"ShowTips(event,'common_1_88')\" onmouseout=\"HideTips()\">"+Lang["Tree_92"]+"</li>";
    if(nodeType==2 && nodeObj.Index==6 && nodeObj.TradeRes.LevelFood<=0)
        html+="<li style=\"color:gray;\" onmouseover=\"ShowTips(event,'common_1_88')\" onmouseout=\"HideTips()\">"+Lang["Tree_93"]+"</li>";
    if(nodeType==2 && nodeObj.Index==5 && nodeObj.TradeRes.LevelMen<=0)
        html+="<li style=\"color:gray;\" onmouseover=\"ShowTips(event,'common_1_88')\" onmouseout=\"HideTips()\">"+Lang["Tree_94"]+"</li>";
    if(nodeType==14)
    {
        if(nodeObj.State==5)
        {
            html+="<li>"+Lang["Tree_95"]+"<span id=\"defendtime\"></span></li>";
            defendTime = nodeObj.Seconds;
            html+="<li><a href=\"#\" id=\"team_1\" onmousedown=\"PopUpSeeGoods(this.id)\">"+Lang["Tree_96"]+"</a></li>";
        }
        if(nodeObj.State==13)
        {
            html+="<li>"+Lang["Tree_136"]+"<span id=\"defendtime\"></span></li>";
            defendTime = nodeObj.Seconds;
            html+="<li><a href=\"#\" id=\"team_4\" onmousedown=\"PopUpSeeGoods(this.id)\">"+Lang["Tree_96"]+"</a></li>";
        }
        if(nodeObj.State==5 || nodeObj.State==7 || nodeObj.State==13)
        {
            html+="<li><a onmousedown=\"ShowPopUp('pop_104')\" href=\"#\">"+Lang["Tree_97"]+"</a></li>";
        }
        if(CanReturnSign==1)
        {
            html+="<li><a id=\"attackback_1\" onmouseover=\"ShowTips(event,this.id)\"  onmouseout=\"HideTips()\" href=\"#\" onmousedown=\"SpecialCallCorpsBack()\"><span class=\"needgold\">"+Lang["Tree_98"]+"</span></a></li>";
        }
        if(CanReturnSign==2)
        {  
            html+="<li><a id=\"returnback_1\" onmouseover=\"ShowTips(event,this.id)\"  onmouseout=\"HideTips()\" href=\"#\" onmousedown=\"SpecialCallCorpsBack()\"><span class=\"needgold\">"+Lang["Tree_99"]+"</span></a></li>";
        }
        if(HasEventReturn()>=0)
        html+=HtmlRetrunEvent(HasEventReturn());//显示事件信息 
    }
    //大地图城市
    if(nodeType==11)
    {
        if(nodeObj.Type==5 && nodeObj.ID!=CityID)//其他玩家
            html+="<li><a href=\"#\" onmousedown=\"SendMessageMap()\">"+Lang["Tree_71"]+"</a></li>";//写信
        if(nodeObj.Type==5 && nodeObj.ID!=CityID && nodeObj.IsLord==1 && nodeObj.OccupationInfo.LordUser==UserInfo.Name)//修改占领信息
            html+="<li><a id=\"tree_3_"+nodeType+"_-60_"+index+"\" href=\"#\" onmousedown=\"ChangeName(this.id)\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\"><span class=\"needgold\">"+Lang["Tree_139"]+"</span></a></li>";//修改占领信息
        if(DefendHeroInfo!=null)
        {
            if((nodeObj.Type==6 || nodeObj.Type==7) && DefendHeroInfo.CityID==CityID)
            {
                html+="<li><a href=\"#\" id=\"team_2\" onmousedown=\"PopUpSeeGoods(this.id)\">"+Lang["Tree_96"]+"</a></li>";//查看收益
                html+="<li><a href=\"#\" onmousedown=\"ShowPopUp('pop_104')\">"+Lang["Tree_97"]+"</a></li>";//召回
            }
            if(nodeObj.Type==8 && DefendHeroInfo.CityID==CityID)
            {
                html+="<li><a href=\"#\" id=\"team_3\" onmousedown=\"PopUpSeeGoods(this.id)\">"+Lang["Tree_96"]+"</a></li>";//查看收益
                html+="<li><a href=\"#\" onmousedown=\"ShowPopUp('pop_104')\">"+Lang["Tree_97"]+"</a></li>";//召回
            }
        }   
    }
    if(nodeType==11 && nodeObj.Type==5 && nodeObj.ID==CityID)//玩家本身
    {
        if(IamVIP==true)
            html+="<li><a href=\"#\" id=\"name_2\" title=\""+Lang["Tree_101"]+"\" onmousedown=\"ChangeName(this.id)\">"+Lang["Tree_102"]+"</a></li>";//村镇更名
        else
            html+="<li style=\"color:gray;\" title=\""+Lang["Tree_103"]+"\">"+Lang["Tree_102"]+"</li>";//村镇更名  103拥有VIP效果可以修改村镇名称
    }
    return html;        
}

//持续状态
function GetVipEffect(id)
{
    var t = id.split("_");
    var StaticIndex=parseInt(t[1],10);
    DataTranslateBegin();
    switch(StaticIndex)
    {
        case 1:
        Main.GetVipSevenDays(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 2:
        Main.GetVipThirtyDays(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 3:
        Main.GetConvokeItem(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 4:
        Main.GetAccountant(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 5:
        Main.GetGrangerItem(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 6:
        Main.GetExpPer(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 7:
        Main.GetPeaceEightHours(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 8:
        Main.GetPeaceTwoDays(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 9:
        Main.GetPeaceSevenDays(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
        case 10:
        Main.GetFastMove(CityID,cb_GetSomeEffect);
        HidePopUp();
        break;
    }
}

//获得vip效果后执行
function cb_GetSomeEffect(result)
{
    if(DataValidate(result)==false) return;
    if(result.value==0)
    {
        Main.GetValidEvent(CityID,cb_GetValidEvent);//请求当前事件信息
        Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);//请求内政信息
    }
    else
    DataTranslateEnd(); 
}


var TheHeroItem;
//英雄节点的物品信息
function HtmlHeroItem(nodeObj)
{
    html="";

    var i=0;
    var itemList=new Array();
    while(nodeObj.ItemList!=null && nodeObj.ItemList[i]!=null)
    {
        itemList[nodeObj.ItemList[i].ItemType]=nodeObj.ItemList[i];
        i++;
    }
    TheHeroItem=itemList;
   
    html+="<li>";
    
    if(itemList[2]!=null)   
        img=itemList[2].Image;
    else 
        img="/2/h/h/4.gif";    
        
        
    
    if(nodeObj.State!=5 && nodeObj.State!=7)
    {
        html+=HtmlClickTipsImg("heroitem_img_2","hero_item_img",PicPath+img,"ChangeHeroItem(1)");
        html+="<a class=\"hero_item_a\"  onmouseover=\"ShowTips(event,'common_1_46')\" onmouseout=\"HideTips()\" id=\"heroItem_a_1_"+nodeObj.ID+"\" href=\"#\" onmousedown=ChangeHeroItem(1)>  "+Lang["Tree_104"]+"</a>"; 
    }
    else
    {    
        html+=HtmlTipsImg("heroitem_img_2","hero_item_img",PicPath+img);
        html+="<span class=\"node_handle_span\">  "+Lang["Tree_104"]+"</span>";
    
    }
    html+="</li>";

    html+="<li>";
      
    if(itemList[3]!=null)
       img=itemList[3].Image;
    else
       img="/2/h/h/5.gif";    
        
    
    if(nodeObj.State!=5 && nodeObj.State!=7)
    {
        html+=HtmlClickTipsImg("heroitem_img_3","hero_item_img",PicPath+img,"ChangeHeroItem(2)");
        html+="<a  onmouseover=\"ShowTips(event,'common_1_47')\" onmouseout=\"HideTips()\" class=\"hero_item_a\" id=\"heroItem_a_2_"+nodeObj.ID+"\" href=\"#\" onmousedown=ChangeHeroItem(2)>  "+Lang["Tree_105"]+"</a>";
    }
    else
    {
        html+=HtmlTipsImg("heroitem_img_3","hero_item_img",PicPath+img);
        html+="<span class=\"node_handle_span\">  "+Lang["Tree_105"]+"</span>";
    }
    html+="</li>";
    
    html+="<li>";
    if(itemList[4]!=null)
       img=itemList[4].Image
    else
       img="/2/h/h/6.gif";
              
    if(nodeObj.State!=5 && nodeObj.State!=7)
    {
        html+=HtmlClickTipsImg("heroitem_img_4","hero_item_img",PicPath+img,"ChangeHeroItem(3)");
        html+="<a  onmouseover=\"ShowTips(event,'common_1_48')\" onmouseout=\"HideTips()\" class=\"hero_item_a\" id=\"heroItem_a_3_"+nodeObj.ID+"\" href=\"#\" onmousedown=ChangeHeroItem(3)>  "+Lang["Tree_106"]+"</a>";         
    }
    else
    {
       html+=HtmlTipsImg("heroitem_img_4","hero_item_img",PicPath+img);
       html+="<span class=\"node_handle_span\">  "+Lang["Tree_106"]+"</span>";  
    }
    html+="</li>";    
           
    return html;
}

//带事件的树节点
function HtmlTreeEvent(eventIndex)
{
    var html="";
    if(EventInfo!=null && EventInfo[eventIndex]!=null) 
    {    
        var eventObj=EventInfo[eventIndex];
        if(eventObj.ObjType==1 || eventObj.ObjType==2 || eventObj.ObjType==3 || eventObj.ObjType==4)
            html+="<li class=\"node_event_li\">"+eventObj.ObjName+EventState[eventObj.State-1]+EventActionType[eventObj.ActionType-1]+"</li>";
            html+="<li class=\"font_zong\">"+Lang["Tree_107"]+" <span class=\"tree_remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span></li>";                         
        if(eventObj.ObjType==6)
            html+="<li class=\"font_zong\">"+Lang["Tree_108"]+" <span class=\"tree_remainTime_"+eventObj.ID+"\">"+IntToTime(eventObj.RemainTime)+"</span></li>"
    }
    return html;    
}

//驻守军团返回节点
function HtmlRetrunEvent(eventIndex)
{
    var html="";
    if(EventInfo!=null && EventInfo[eventIndex]!=null)
    {
        var eventObj=EventInfo[eventIndex];
        if(eventObj.ObjType==5)
        {
            if(ClientCropsStateInfo!=null && ClientCropsStateInfo.Res!=null)
            {
                var team;
                team=ClientCropsStateInfo.Res;
                var food = team.Grain;
                var men = team.Population;
                var money = team.Money;
                if(food+men+money>0)
                {
                    html+="<li>"+Lang["Tree_109"]+"</li>";
                    html+="<li>";
                    if(food>0)
                    html+="<img src=\"img/4/2.gif\" />"+food+"";
                    if(men>0)
                    html+="<img src=\"img/4/3.gif\" />"+men+"";
                    if(money>0)
                    html+="<img src=\"img/4/1.gif\" />"+money+"";
                    html+="</li>";
                }
            }
        }
    }
    return html; 
}

//队列满了的树节点
function HtmlTreeQueueFull()
{
     var html="";
     html+="<li class=\"font_gray\">"+Lang["Tree_110"]+"</li>";
     return html;
}

//树节点可操作指令
function HtmlTreeCommand(nodeObj,nodeType,index)
{
    var html="";
    if(nodeType==1)
    {
        html+=HtmlTreeNoHandle(nodeType,1,index);
        html+=HtmlTreeNoHandle(nodeType,2,index);
        if(nodeObj.SnapSwitch==1)
        html+=HtmlTreeNoHandle(nodeType,61,index);//瞬间建造
    }    
    else if(nodeType==2)
    {
        html+=HtmlTreeNoHandle(nodeType,3,index);
        html+=HtmlTreeNoHandle(nodeType,4,index);
        if(nodeObj.SnapSwitch==1)
            html+=HtmlTreeNoHandle(nodeType,62,index);
        if(nodeObj.Index!=1 || (nodeObj.Index==1 && nodeObj.Level>1))
            html+=HtmlTreeNoHandle(nodeType,5,index);
        //html+=HtmlTreeNoHandle(nodeType,14,index);
        if(nodeObj.Index>=12 && nodeObj.Index<=21)
            html+=HtmlTreeNoHandle(nodeType,6,index);
		if(nodeObj.Index>=12 && nodeObj.Index<=21)
            html+=HtmlTreeNoHandle(nodeType,56,index);
        if(nodeObj.Index==7 && nodeObj.TradeRes.LevelMoney>0)
            html+=HtmlTreeNoHandle(nodeType,42,index);
        if(nodeObj.Index==6 && nodeObj.TradeRes.LevelFood>0)
            html+=HtmlTreeNoHandle(nodeType,43,index);
        if(nodeObj.Index==5 && nodeObj.TradeRes.LevelMen>0)
            html+=HtmlTreeNoHandle(nodeType,44,index);
    }
    else if(nodeType==3)
    {
        html+=HtmlTreeNoHandle(nodeType,3,index);
    }    
    
    else if(nodeType==4)
    {
        html+=HtmlTreeNoHandle(nodeType,1,index);
        html+=HtmlTreeNoHandle(nodeType,2,index);
    }
    
    else if(nodeType==5)
    {
        html+=HtmlTreeNoHandle(nodeType,5,index);
        html+=HtmlTreeNoHandle(nodeType,3,index);//升级
    }
    
    else if(nodeType==6)
    {
        html+=HtmlTreeNoHandle(nodeType,15,index);
        //html+=HtmlTreeNoHandle(nodeType,16,index);
        html+=HtmlTreeNoHandle(nodeType,17,index);
    }
    else if(nodeType==7)
    {
        html+=HtmlTreeNoHandle(nodeType,18,index);

    }
    else if(nodeType==8)
    {
        html+=HtmlTreeNoHandleImg(nodeType,20,index);
        //html+=HtmlTreeNoHandle(nodeType,21,index);
        html+=HtmlTreeNoHandleImg(nodeType,22,index);
        html+=HtmlTreeNoHandle(nodeType,23,index);
        html+=HtmlTreeNoHandle(nodeType,9,index);
        html+=HtmlTreeNoHandle(nodeType,40,index);//快速训练弟子
        html+=HtmlTreeNoHandle(nodeType,10,index);
        html+=HtmlTreeNoHandle(nodeType,41,index);//快速招募弟子
        html+=HtmlTreeNoHandle(nodeType,35,index);
        if(nodeObj.State==8)
        html+=HtmlTreeNoHandle(nodeType,46,index);//查看修炼
        else
        html+=HtmlTreeNoHandle(nodeType,45,index);//闭关修炼
        //html+=HtmlTreeNoHandle(nodeType,49,index);
        html+=HtmlTreeNoHandle(nodeType,24,index);
        
    }
    else if(nodeType==9)
    {
        if(PageNum==9)
        {
            
            if(TheItemInfo.UserName==UserInfo.Name)
                html+=HtmlTreeNoHandle(nodeType,29,index);
            else
            {
                html+=HtmlTreeNoHandle(nodeType,31,index);
                TreeHandleTypeList[31-1]=Lang["Tree_111"]+TheItemInfo.UserName;
                html+=HtmlTreeNoHandle(nodeType,32,index);
            }
        }
        else
        {
            if(TheItemInfo.ItemType==2 || TheItemInfo.ItemType==3 || TheItemInfo.ItemType==4)
                html+=HtmlTreeNoHandle(nodeType,25,index);//装备
            else if(TheItemInfo.ItemType==1)
                html+=HtmlTreeNoHandle(nodeType,26,index);//使用
            
            if(TheItemInfo.ItemType==2 || TheItemInfo.ItemType==3 || TheItemInfo.ItemType==4)
                html+=HtmlTreeNoHandle(nodeType,30,index);//卸下
                    
            html+=HtmlTreeNoHandle(nodeType,27,index);
            html+=HtmlTreeNoHandle(nodeType,29,index);
            if(TheItemInfo.ItemType==2 || TheItemInfo.ItemType==3 || TheItemInfo.ItemType==4)
            {    
                html+=HtmlTreeNoHandle(nodeType,37,index);//修理
                //if(IamVIP)
                    html+=HtmlTreeNoHandle(nodeType,36,index);//特殊修理              
            }
            if(TheItemInfo.ItemType==2 || TheItemInfo.ItemType==3 || TheItemInfo.ItemType==4)
            {
                html+=HtmlTreeNoHandle(nodeType,47,index);//分解
            }
            html+=HtmlTreeNoHandle(nodeType,28,index);
            if(TheItemInfo.ItemType==7)
            {
                html+=HtmlTreeNoHandle(nodeType,52,index);
                //html+=HtmlTreeNoHandle(nodeType,53,index);    //防守携带取消
                html+=HtmlTreeNoHandle(nodeType,54,index);
            }
        }
    }
    
    else if(nodeType==10)
    {
        html+=HtmlTreeNoHandle(nodeType,19,index);
    }
    //大地图城市可操作功能
    else if(nodeType==11)
    {
        if(CityInfo.EspecialType==1)
            html+=HtmlTreeNoHandle(nodeType,55,index);//擂台
        if((CityInfo.Type==5 && CityInfo.ID!=CityID) || (CityInfo.Type!=5 && CityInfo.EspecialType!=1))         
            html+=HtmlTreeNoHandle(nodeType,11,index);//攻击
        if(CityInfo.Type!=5 && CityInfo.Type!=4 && CityInfo.EspecialType!=1)
            html+=HtmlTreeNoHandle(nodeType,48,index);//探索秘道
        if(CityInfo.Type==5 && CityInfo.ID!=CityID)    
            html+=HtmlTreeNoHandle(nodeType,12,index);//增援
        if(CityInfo.Type==5 && CityInfo.ID!=CityID && UserInfo.Name!=nodeObj.OccupationInfo.LordUser)
            html+=HtmlTreeNoHandle(nodeType,59,index);//征服玩家
        if(CityInfo.Type==5 && CityInfo.ID==CityID)    
            html+=HtmlTreeNoHandle(nodeType,33,index);//进入
        if(CityInfo.Type==5 && CityInfo.ID==CityID && CityInfo.IsLord==1)
            html+=HtmlTreeNoHandle(nodeType,60,index);//赎身
        if(CityInfo.Type==6 || CityInfo.Type==7)
            html+=HtmlTreeNoHandle(nodeType,39,index);//驻守
        if(CityInfo.Type!=5)
            html+=HtmlTreeNoHandle(nodeType,38,index); //探索
        if(CityInfo.IsAppendantNPC==0 && CityInfo.Type==7 && CityInfo.IsAppendantNPC!=-1)
            html+=HtmlTreeNoHandle(nodeType,57,index); //占领山寨
        if(CityInfo.IsAppendantNPC==1)
            html+=HtmlTreeNoHandle(nodeType,58,index); //放弃占领
    }
    
    else if(nodeType==12)
    {
        html+=HtmlTreeNoHandle(nodeType,34,index);
    }
    
    else if(nodeType==13)
    {
        html+=HtmlTreeNoHandle(nodeType,38,index);
    }
    return html;
}

//树节点可操作功能项
function HtmlTreeCanHandle(nodeType,handleType,index,goldCondition)
{
    var html=""
//    if(handleType==5 || handleType==14)
//        html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_2 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=ShowPopUp(this.id)>"+TreeHandleTypeList[handleType-1]+"</a>"
//    else
        if (handleType==24 || handleType==17 || handleType==5 || handleType==23 || handleType==15)
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=ShowPopUp(this.id)>"+TreeHandleTypeList[handleType-1]+"</a>"; 
        }
        else if(handleType==40)
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=ShowPopUp(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>"; 
        }
        else if(handleType==49)
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=HeroLeaveTown(this.id)>"+TreeHandleTypeList[handleType-1]+"</a>";
        }
        else if(handleType==2 || handleType==4 || handleType==61 || handleType==62 || handleType==43 || handleType==42 || handleType==44 || handleType==41 || handleType==35 || handleType==36 || (PageNum==2 && handleType==3))
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+" class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=TreeCommand(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>";   
        }
        else if(handleType==56 || handleType==57)//快速寻访||占领山寨
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=PopUpGoldConsumer(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>";
        }
        else if(handleType==58)//放弃占领
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+" class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=PopUpGoldConsumer(this.id)>"+TreeHandleTypeList[handleType-1]+"</a>";   
        }
        else if(handleType==59)//征服玩家
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=TreeCommand(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>";
        }
        else if(handleType==60)//赎身
        {
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+"_1 class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=PopUpGoldConsumer(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>";
        }
        else
        {   
            html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+" class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=TreeCommand(this.id)>"+TreeHandleTypeList[handleType-1]+"</a>";   
        }
    return html;
}
//仓库扩容大于10级紫色显示
function HtmlTreeTechnic(nodeType,handleType,index,goldCondition)
{
    var html="";
    html+="<a id=tree_a_"+nodeType+"_"+handleType+"_"+index+"_"+goldCondition+" class=\"node_handle_a\" href=\"#\" onmouseover=ShowTips(event,this.id) onmouseout=HideTips(this.id) onmousedown=TreeCommand(this.id)><span class=\"needgold\">"+TreeHandleTypeList[handleType-1]+"</span></a>";
    return html;
}

//树节点不可操作功能项
function HtmlTreeNoHandle(nodeType,handleType,index)
{
    var html=""; 
    if(nodeType==8)
        html+="<li style=\"margin-left:40px;\" id=\"tree_handle_"+nodeType+"_"+handleType+"_"+index+"\"><span class=\"node_handle_span\" id=\"tree_span_"+nodeType+"_"+handleType+"_"+index+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">"+TreeHandleTypeList[handleType-1]+"</span></li>";
    else
        html+="<li id=\"tree_handle_"+nodeType+"_"+handleType+"_"+index+"\"><span class=\"node_handle_span\" id=\"tree_span_"+nodeType+"_"+handleType+"_"+index+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">"+TreeHandleTypeList[handleType-1]+"</span></li>";    
    return html
}
//*********************************
function HtmlTreeNoHandleImg(nodeType,handleType,index)
{
    var html="";
    if(handleType==20)
    html+="<li class=\"createimg_1\" id=\"tree_handle_"+nodeType+"_"+handleType+"_"+index+"\"><span class=\"node_handle_span\" id=\"tree_span_"+nodeType+"_"+handleType+"_"+index+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">"+TreeHandleTypeList[handleType-1]+"</span></li>";
    if(handleType==22)
    html+="<li class=\"createimg_2\" id=\"tree_handle_"+nodeType+"_"+handleType+"_"+index+"\"><span class=\"node_handle_span\" id=\"tree_span_"+nodeType+"_"+handleType+"_"+index+"\" onmouseover=\"ShowTips(event,this.id)\" onmouseout=\"HideTips()\">"+TreeHandleTypeList[handleType-1]+"</span></li>";
    return html;
}
//只开启树的第1个节点
function OpenTheFirstNode()
{
     $("#trees").find("ul").each(function() {   
         var t = $(this).attr("id").split("_");
         
         if (t[3]=="0")
         {
            $(this).show();           
            sControl ="#tree_control_"+t[2]+"_"+t[3];          
            $(sControl).attr("src",PicPath+PicReduce)     
         }      
    });
}

//控制树节点显示和消失
function NodeControl(id)
{
    var sControl;
    $("#trees").find("ul").each(function() {   
         if ($(this).is(':visible'))
         {
            $(this).hide();
            var t = $(this).attr("id").split("_");
            sControl ="#tree_control_"+t[2]+"_"+t[3];          
            $(sControl).attr("src",PicPath+PicPlus)     
         }      
    });
    
    var t=id.split("_"); 
    var sUl = "#tree_ul_"+t[2]+"_"+t[3];
    var s="#tree_control_"+t[2]+"_"+t[3]
    if(sControl == s)
       return;
    else 
       sControl=s;
          
    if ($(sUl).is(':visible')) 
    {            
        $(sUl).hide();
        $(sControl).attr("src",PicPath+PicPlus)       
    } 
    else 
    {            
        $(sUl).show();
        $(sControl).attr("src",PicPath+PicReduce)          
    }
}


//根据节点类型更新操作项
function UpdateTreeHandleState(nodeType)
{
    if(nodeType==1)
    {
        var i=0;
        while(PosBuildingInfo[i]!=null)
        {        
            UpdateNodeHandleState(PosBuildingInfo[i],nodeType,1,i);
            UpdateNodeHandleState(PosBuildingInfo[i],nodeType,2,i);  
            if(PosBuildingInfo[i].SnapSwitch==1)
            UpdateNodeHandleState(PosBuildingInfo[i],nodeType,61,i); 
            i++;
        }
    }
    else if(nodeType==2)
    {
        var i=0;
        if(TheBuildingInfo!=null)
        {        
            UpdateNodeHandleState(TheBuildingInfo,nodeType,3,i);
            UpdateNodeHandleState(TheBuildingInfo,nodeType,4,i);
            if(TheBuildingInfo.SnapSwitch==1)
              UpdateNodeHandleState(TheBuildingInfo,nodeType,62,i);
            if(TheBuildingInfo.Index!=1 || (TheBuildingInfo.Index==1 && TheBuildingInfo.Level>1) )
                UpdateNodeHandleState(TheBuildingInfo,nodeType,5,i);
            //UpdateNodeHandleState(TheBuildingInfo,nodeType,14,i);
            if(TheBuildingInfo.Index>=12 && TheBuildingInfo.Index<=21)
                UpdateNodeHandleState(TheBuildingInfo,nodeType,6,i);
            if(TheBuildingInfo.Index>=12 && TheBuildingInfo.Index<=21)
                UpdateNodeHandleState(TheBuildingInfo,nodeType,56,i);//快速寻访
            if(TheBuildingInfo.Index==7)
                UpdateNodeHandleState(TheBuildingInfo,nodeType,42,i);
            if(TheBuildingInfo.Index==6)
                UpdateNodeHandleState(TheBuildingInfo,nodeType,43,i);
            if(TheBuildingInfo.Index==5)
                UpdateNodeHandleState(TheBuildingInfo,nodeType,44,i);
        }
    }
    else if(nodeType==3)
    {
        var i=0;
        while(TechnicInfo[i]!=null)
        {        
            UpdateNodeHandleState(TechnicInfo[i],nodeType,3,i);
            i++;
        }
    }
    
    else if(nodeType==4)
    {
        var i=0;
        while(PosBuildingInfo[i]!=null)
        {        
            UpdateNodeHandleState(PosBuildingInfo[i],nodeType,1,i);
            UpdateNodeHandleState(PosBuildingInfo[i],nodeType,2,i);  
            i++;
        }
    }
    
    else if(nodeType==5)
    {
        var i=0;
        if(TheBuildingInfo!=null)
        {        
            UpdateNodeHandleState(TheBuildingInfo,nodeType,3,i);
            UpdateNodeHandleState(TheBuildingInfo,nodeType,5,i);
        }
    }
    
    else if(nodeType==6)
    {
        var i=0;
        while(HeroInfo[i]!=null)
        {        
            UpdateNodeHandleState(HeroInfo[i],nodeType,15,i);
            //UpdateNodeHandleState(HeroInfo[i],nodeType,16,i);
            UpdateNodeHandleState(HeroInfo[i],nodeType,17,i);
            i++;
        }
    }
    
    else if(nodeType==7)
    {
        var i=0;
        while(HeroInfo[i]!=null)
        {        
            UpdateNodeHandleState(HeroInfo[i],nodeType,18,i);
            i++;
        }
    }
    else if(nodeType==8)
    {
        var i=0;
        if(TheHeroInfo!=null)
        {
            UpdateNodeHandleState(TheHeroInfo,nodeType,20,i);
            //UpdateNodeHandleState(TheHeroInfo,nodeType,21,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,22,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,23,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,9,TheHeroInfo.Training==100?1:0);
            UpdateNodeHandleState(TheHeroInfo,nodeType,40,TheHeroInfo.Training==100?1:0);//快速训练弟子
            UpdateNodeHandleState(TheHeroInfo,nodeType,10,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,41,i);//快速招募弟子
            UpdateNodeHandleState(TheHeroInfo,nodeType,35,i);
            if(TheHeroInfo.State==8)
            UpdateNodeHandleState(TheHeroInfo,nodeType,46,i);//查看修炼
            else
            UpdateNodeHandleState(TheHeroInfo,nodeType,45,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,49,i);
            UpdateNodeHandleState(TheHeroInfo,nodeType,24,i);
        }
    }
    else if(nodeType==9)
    {
        if(TheItemInfo!=null)
        {
            if(PageNum==9)
            {
                if(TheItemInfo.UserName==UserInfo.Name)
                {
                    UpdateNodeHandleState(TheItemInfo,nodeType,29,0);
                }
                else
                {
                    UpdateNodeHandleState(TheItemInfo,nodeType,31,0);
                    UpdateNodeHandleState(TheItemInfo,nodeType,32,TheItemInfo.Price<=CityInteriorInfo.Gold?0:1);
                }
            }
            else
            {
                UpdateNodeHandleState(TheItemInfo,nodeType,25,TheItemInfo.State==3?1:0);
                UpdateNodeHandleState(TheItemInfo,nodeType,26,TheItemInfo.UseGold<=CityInteriorInfo.Gold?0:1);
                UpdateNodeHandleState(TheItemInfo,nodeType,30,TheItemInfo.State==3?0:1);
                UpdateNodeHandleState(TheItemInfo,nodeType,27,(TheItemInfo.State==4 || TheItemInfo.State==3)?1:0);
                UpdateNodeHandleState(TheItemInfo,nodeType,29,TheItemInfo.State==4?0:1);
                UpdateNodeHandleState(TheItemInfo,nodeType,37,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,36,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,47,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,28,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,52,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,53,0);
                UpdateNodeHandleState(TheItemInfo,nodeType,54,(TheItemInfo.State==6 || TheItemInfo.State==7)?0:1); 
            }
        }
    }    
    
    else if(nodeType==10)
    {
        var i=0;
        while(HeroInfo[i]!=null)
        {        
            UpdateNodeHandleState(HeroInfo[i],nodeType,19,i);
            i++;
        }
    }
    
    else if(nodeType==11)
    {
        var i=0;
        if(CityInfo!=null)
        {
            if((CityInfo.Type==5 && CityInfo.ID!=CityID) || (CityInfo.Type!=5))
                UpdateNodeHandleState(CityInfo,nodeType,11,i);
            if(CityInfo.Type!=5 && CityInfo.Type!=4)
                UpdateNodeHandleState(CityInfo,nodeType,48,i);
            if(CityInfo.Type==5 && CityInfo.ID!=CityID)
                UpdateNodeHandleState(CityInfo,nodeType,12,i);//增援
            if(CityInfo.Type==5 && CityInfo.ID!=CityID)
                UpdateNodeHandleState(CityInfo,nodeType,59,i);//征服玩家
            if(CityInfo.Type==5 && CityInfo.ID==CityID)
                UpdateNodeHandleState(CityInfo,nodeType,33,i);
            if(CityInfo.Type==5 && CityInfo.ID==CityID)
                UpdateNodeHandleState(CityInfo,nodeType,60,i);//赎身
            if(CityInfo.Type!=5)
                UpdateNodeHandleState(CityInfo,nodeType,38,i);
            if(CityInfo.Type==6 || CityInfo.Type==7)
                UpdateNodeHandleState(CityInfo,nodeType,39,i);
            //if(CityInfo.Type==8)
                UpdateNodeHandleState(CityInfo,nodeType,55,i);
            if(CityInfo.IsAppendantNPC==0 && CityInfo.IsAppendantNPC!=-1)//占领山寨
                UpdateNodeHandleState(CityInfo,nodeType,57,i);
            if(CityInfo.IsAppendantNPC==1)//放弃占领
                UpdateNodeHandleState(CityInfo,nodeType,58,i);
        }
    }
    
    else if(nodeType==12)
    {
        var i=0;
        if(TheCorpsInfo!=null)
        {
            UpdateNodeHandleState(TheCorpsInfo,nodeType,34,i);
        } 
    }
    
    else if(nodeType==13)
    {
        var i=0;
        if(CityInfo!=null)
        {
            UpdateNodeHandleState(TheCorpsInfo,nodeType,38,i);
        } 
    }    
}

//根据资源更新树节点操作状态
function UpdateNodeHandleState(nodeObj,nodeType,handleType,index)
{
    var conditionState=GetConditionState(nodeObj,nodeType,handleType);
    if(conditionState[0]>0)
    {
        var goldCondition=0;
        if(conditionState[0]==2)
            goldCondition=1;
        if((nodeType==3 && nodeObj.Index==13 && nodeObj.Level>9) || (nodeType==3 && nodeObj.Index==1 && nodeObj.Level>1))//仓库扩容科技按钮颜色
            var html=HtmlTreeTechnic(nodeType,handleType,index,goldCondition);
        else 
            var html=HtmlTreeCanHandle(nodeType,handleType,index,goldCondition);
        var sli="#tree_handle_"+nodeType+"_"+handleType+"_"+index;
        $(sli).html(html);
        html=null;
    }  
}


///判断树节点可否操作条件
function GetConditionState(nodeObj,nodeType,handleType)
{
    //conditionState下标...0=全部,1=元宝,2=面积,3=钱,4=粮,5=人,6=建筑.7=科技,8=队列.9=侠客个数.10.侠客状态.11.攻击条件,12.对象事件状态,13.寻访条件,14.建筑类对象最高级别,15.物品状态,16.门派建筑数,17.搜索事件个数,18.是否有驻守军队,19.弟子是否小于或等于0,20.玩家是否被占领,21.是否过了冷却时间(赎身)
    
    var conditionState = new Array(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1);
    if(CityInteriorInfo!=null)
    {
        var area=CityInteriorInfo.AreaRoom-CityInteriorInfo.Area;
        if(nodeType==4)
            area=CityInteriorInfo.MaxDefenceBuildNum-DefenceNum;
        if(nodeType==3)
            area=CityInteriorInfo.Area;
        var level=CityInteriorInfo.Level;    
        var money=CityInteriorInfo.Money; 
        var food=CityInteriorInfo.Food;
        var men=CityInteriorInfo.Men;
        var gold=CityInteriorInfo.Gold;
    }
    if(nodeType>=1 && nodeType<=6)
    {                    
        //关于门派建筑数量的限制
        if(nodeObj.Index>=12 && nodeType==1 && (handleType==1 || handleType==2 || handleType==61))
        {
            if(CanBuildJunta()==false)
                conditionState[16]=-1;                
        }
               
        //事件队列是否满足
        if((handleType>=1 && handleType<=5) || handleType==61 || handleType==62)//这里不用处理直接用
            conditionState[8]=IsEventQueueNotFull(nodeType);
        
        //建造和升级
        if(handleType==1 || handleType==2 || handleType==3 || handleType==4 || handleType==61 || handleType==62)
        {          
            if(nodeObj.UpNeedBuildingID>0 && PageNum!=2)//排除城防升级判断
            {    
                var buildingLevel=CityInteriorInfo.InteriorBuildingLevel[nodeObj.UpNeedBuildingID-1];//取对应建筑级别
                conditionState[6]=buildingLevel-nodeObj.UpNeedBuildingLevel;//建筑是否满足(需要增加判断没有建筑时不能升级)
            }
            if(nodeObj.UpNeedTechnicID>0)
            {
                var technicLevel=CityInteriorInfo.TechnicLevel[nodeObj.UpNeedTechnicID-1];//取对应科技级别
                conditionState[7]=technicLevel-nodeObj.UpNeedTechnicLevel;//科技级别是否满足(城防需要城防当前级别和对应科技等级的比较)
            } 
            if(PageNum==2 && handleType==3)//城防升级
            {
                conditionState[3]=money-nodeObj.UpNeedMoney;
                conditionState[4]=food-nodeObj.UpNeedFood;
                conditionState[5]=men-nodeObj.UpNeedMen;
            }
            else
            {
                conditionState[2]=area-nodeObj.UpNeedArea;
                conditionState[3]=money-nodeObj.UpNeedMoney;
                conditionState[4]=food-nodeObj.UpNeedFood;
                conditionState[5]=men-nodeObj.UpNeedMen;
            }
            
            if(handleType==2 || handleType==4)
                conditionState[1]=gold-nodeObj.UpNeedGold;
                
            if(handleType==61 || handleType==62)
                conditionState[1]=gold-nodeObj.SnapGold;
            if((nodeType==3 && nodeObj.Index==13) || (nodeType==3 && nodeObj.Index==1))//仓库扩容，移山填海
                conditionState[1]=gold-nodeObj.UpNeedGold;
            
            if(HasEventBuilding(ClickPos)>=0)
                conditionState[12]=-1;
            
            if((handleType==3 || handleType==4 || handleType==62) && nodeObj.Level>=nodeObj.MaxLevel)        
                conditionState[14]=-1;  
        }
        if(handleType==3 && PageNum==2)//城防页面升级按钮
        {
            if(nodeObj.MaxLevel-nodeObj.Level<=0)//当前能升到的级别大于当前级别可以操作
            {
                conditionState[7]=-1;
            }
            conditionState[1]=gold-nodeObj.UpNeedGold;
        }
        //拆除
        if(handleType==5)
        {
            conditionState[3]=money-nodeObj.DownNeedMoney;
            conditionState[4]=food-nodeObj.DownNeedFood;
            conditionState[5]=men-nodeObj.DownNeedMen;
            
            if(HasEventBuilding(ClickPos)>=0)
                conditionState[12]=-1;    
        }
       
        //寻访
        if(handleType==6)
        {
            conditionState[3]=money-500;
            conditionState[4]=food-500;
            if(HasEventBuilding(ClickPos)>=0)
                conditionState[12]=-1;
            conditionState[13]=CanFindHero(nodeObj.Index-11);     
        }
        
        //快速寻访
        if(handleType==56)
        {
            conditionState[1]=gold-5;
            conditionState[3]=money-500;
            conditionState[4]=food-500;
            if(HasEventBuilding(ClickPos)>=0)
                conditionState[12]=-1;
            conditionState[13]=CanFindHero(nodeObj.Index-11);     
        }         
       
        //雇佣
        if(handleType==15)
        {
            conditionState[3]=money-nodeObj.EngageCostMoney;
            conditionState[4]=food-nodeObj.EngageCostFood;
            conditionState[1]=gold-nodeObj.EngageCostGold;
            conditionState[9]=CityInteriorInfo.MaxEngageHeroNum-CityInteriorInfo.EngageHeroNum-1;
        }
    }   
        if(nodeType==7 && handleType==18 && nodeObj.PrenticeNum<=0)
        {
            conditionState[19]=-1;
        }
        if(handleType==10 || handleType==9 || handleType==40 || handleType==41 || (handleType>=20 && handleType<=24) || handleType==45 || handleType==49)
        {
            if(TheHeroInfo.State==5 || TheHeroInfo.State==7 || TheHeroInfo.State==8 || TheHeroInfo.State>=9)//英雄状态(添加侠客闭关状态)
                conditionState[10]=-1;
            if((handleType==9 || handleType==40) && nodeObj.PrenticeNum==0)//训练弟子并且弟子数为0
                conditionState[10]=-1;    
            if(handleType==10 && CanConscription()!="")//招募弟子并且条件不满足（1、弟子数量2、资源）
                conditionState[10]=-1;
            if(handleType==41 && CanFastConscription()!="")//快速招募弟子条件不满足
                conditionState[10]=-1;
            if(handleType==45 && CanAutoExp()!="")//闭关修炼且条件不满足
                conditionState[10]=-1;  
            if((handleType==10 || handleType==41 || handleType==45) && HasEventHero(nodeObj.ID)>=0)//招募弟子并且有英雄事件
                conditionState[12]=-1;
            if(handleType==20 && CanSetListFight()!="")
                conditionState[10]=-1;              
            if(handleType==22 && nodeObj.ListType==1)
                conditionState[10]=-1;
            if(handleType==23 && nodeObj.ItemList==null)
                conditionState[10]=-1;              
            if((handleType==24 || handleType==49) && nodeObj.ItemList!=null)
                conditionState[10]=-1;    
            if(handleType==49)    
                conditionState[1]=gold-10;//消耗的金币    
            if(handleType==9)//训练弟子
            {
                conditionState[3]=money-TheHeroInfo.TrainCostMoney*TheHeroInfo.PrenticeNum;//当前弟子数*训练花费的钱
                conditionState[4]=food-TheHeroInfo.TrainCostFood*TheHeroInfo.PrenticeNum;  //当前弟子数*训练花费的粮    
                if(HasEventHero(nodeObj.ID)>=0)//如果有英雄事件
                  conditionState[12]=-1;    
            }
            if(handleType==40)//快速训练
            {
                conditionState[1]=gold-TheHeroInfo.FastTrainCostGold*TheHeroInfo.PrenticeNum;//消耗的金币
                conditionState[3]=money-TheHeroInfo.FastTrainCostMoney*TheHeroInfo.PrenticeNum;//快速训练消耗钱
                conditionState[4]=food-TheHeroInfo.FastTrainCostFood*TheHeroInfo.PrenticeNum;  //快速训练消耗粮
                if(HasEventHero(nodeObj.ID)>=0)//如果有英雄事件
                conditionState[12]=-1;    
                conditionState[1]=gold-TheHeroInfo.FastTrainCostGold;
            }        
        }
        
        if(handleType==35)
        {
            if(TheHeroInfo.State!=2)
                conditionState[10]=-1;
                
            conditionState[1]=gold-nodeObj.ResumeCostGold;        
        }       
        
        if(handleType==11 || handleType==12 || handleType==59)//征服
        {
            var MeHasPeace=false;
            var HasPeace=false;
            if(PersistEffectGroupInfo!=null)
            {
                for(var i=0;i<PersistEffectGroupInfo.length;i++)
                {
                    if(PersistEffectGroupInfo[i].MainEffectType==6)
                    MeHasPeace=true;
                }
             }
            if(TwoEffectInfo!=null)
            {
                for(var i=0;i<TwoEffectInfo.length;i++)
                {
                    if(TwoEffectInfo[i]==6)
                    HasPeace=true;
                }
            }
            if(CanAttack()!="" || (UserInfo.State==3 && nodeObj.Type==5) || (nodeObj.Type==5 && nodeObj.State==3) ||(MeHasPeace==true && nodeObj.Type==5) || HasPeace==true)
                conditionState[11]=-1;
            if((handleType==11 && nodeObj.LevelDifferenceFlag==30131) || (handleType==11 && nodeObj.LevelDifferenceFlag==30132))
                conditionState[11]=-1;       
        }
     if(nodeType==9)
     {
        switch(handleType)
        {
            case 25:  //装备
                if(nodeObj.State!=1 || nodeObj.Durability<=0)
                conditionState[15]=-1;
                break;
            case 26:  //使用
                conditionState[1]=gold-nodeObj.UseGold;
                if(nodeObj.State!=1)
                conditionState[15]=-1;
                if(nodeObj.NeedUserLevel>0 && nodeObj.NeedUserLevel>CityInteriorInfo.Level)
                conditionState[15]=-1;
                break;
            case 27:  //出售
                if(nodeObj.State!=1 || nodeObj.Durability<=0 || nodeObj.SellFlag==1)
                conditionState[15]=-1;
                break;
            case 28:  //回收
                if(nodeObj.State!=1)
                conditionState[15]=-1;
                break;
            case 29:  //取消出售
                if(nodeObj.State!=4 || nodeObj.UserName!=UserInfo.Name)
                conditionState[15]=-1;
                break;
            case 30:  //卸下
                if(nodeObj.State!=3)
                conditionState[15]=-1;
                break;
            case 31:  //卖家
                break;                      
            case 32:  //购买
                conditionState[1]=gold-nodeObj.Price;
                break;
            case 36://特殊修复
                conditionState[1]=gold-nodeObj.Level;
                if(nodeObj.HitPoint==nodeObj.Durability || nodeObj.State==5 || nodeObj.State==2 || nodeObj.State==4)
                    conditionState[15]=-1;
                break;
            case 37://修复
                conditionState[3]=money-nodeObj.RepairItemNeedMoney;
                conditionState[4]=food-nodeObj.RepairItemNeedFood;
                if(nodeObj.HitPoint==nodeObj.Durability || nodeObj.State==5 || nodeObj.State==2 || nodeObj.State==4)
                    conditionState[15]=-1;
                break;        
            case 47://分解
                if(nodeObj.State!=1)
                    conditionState[15]=-1; 
                break;
            case 52:
            case 53:
                 if(nodeObj.State==6 || nodeObj.State==7)
                    conditionState[15]=-1; 
                break;
            case 54://取消携带
                if(nodeObj.State!=6 && nodeObj.State!=7)
                    conditionState[15]=-1;
                break;       
            default:
                break;
        }
     }
     
    //探索 
    if(handleType==38)
    {
           conditionState[5]=men-15;
           if(HasEventSerach()>=0)
           conditionState[17]=-1;               
    }                          
    if(handleType==39)//驻守
    {
        if(nodeObj.DefeceFlag==1 || (nodeObj.Level>level) || CanAttack()!="")
        conditionState[18]=-1;
    }
    if(handleType==55)//攻擂
    {
        var maxlevel = GetMaxLevel();
        if(CanAttack()!="" || nodeObj.Type!=8 || maxlevel>nodeObj.SubLevel)//侠客等级条件判断添加
        conditionState[11]=-1;
    }
    if(handleType==48)
    {
        if((nodeObj.Type==4 || nodeObj.Type==6) || CanAttack()!="")
        conditionState[11]=-1;
    }
    if(handleType==59)//占领玩家
    {
        if(UserIsDependency()>0)
            conditionState[20]=-1;
    }
    if(handleType==60)
    {
        if(UserIsStartTime()==1)
            conditionState[21]=-1;
    }
    var i=2;
    while(conditionState[i]!=null)
    {
        if(conditionState[i]>=0)
            conditionState[i]=1;
        if(conditionState[i]<0) 
            conditionState[i]=0;
        i++;
    }
    
    var i=2;
    while(conditionState[i]!=null)
    {
        if(conditionState[i]==0)
        { 
            conditionState[0]=0;
            break;
        }
        i++;
    }
        
    //以下是为了花费元宝的操作即使不满足还可以点
    if(conditionState[1]>=0)//元宝满足要求
        conditionState[1]=1;
        
    if(conditionState[1]<0)//元宝不足
    { 
        if(conditionState[0]==1)
            conditionState[0]=2;
            
        conditionState[1]=0;
    }
        
    return conditionState;   
}

//判断事件队列是否满了..//没满返回1...满了返回-1
function IsEventQueueNotFull(nodeType)
{
    var eventNum=0;
    var eventQueue=0;
    
    switch(nodeType)
    {
        case 1:
        case 2:
            eventQueue=1;
            break;
        case 4:
        case 5:
            eventQueue=2
            break;               
        default:
            eventQueue=3;        
    }
           
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].EventQueue==eventQueue)
                eventNum++;
            i++;    
        }
    }              
    
    if(eventNum<EventQueueNum[eventQueue-1])
        return 1;
    else 
        return -1;             
}


//树操作命令
function TreeCommand(id)
{
    var t=id.split("_");
    var nodeType=parseInt(t[2],10);
    var handleType=parseInt(t[3],10);
    var index=parseInt(t[4],10);
    var goldCondition=parseInt(t[5],10);
    var objType;
    var objID;
    var actionType;
    var pos;
    var commandType;
   
    
    //事件操作
        if(handleType==61)
        actionType=29;
        else if(handleType==62)
        actionType=30;
        else
        actionType=handleType;   
        switch (nodeType)
        {
            case 1:
                objType=1;
                objID=PosBuildingInfo[index].Index;
                pos=PosBuildingInfo[index].Pos;
                break;
            case 2:
                objType=1;
                objID=TheBuildingInfo.Index;
                pos=TheBuildingInfo.Pos;
                break;
            case 3:
                objType=2;
                objID=TechnicInfo[index].Index;
                pos=0;
                break;
            case 4:
                objType=3;
                objID=PosBuildingInfo[index].Index;
                pos=ClickPos;
                break;
            case 5:
                objType=3;
                objID=TheBuildingInfo.Index;
                pos=TheBuildingInfo.Pos;
                break;
            case 6:
            case 7:
            case 10:
                objType=4;
                objID=HeroInfo[index].ID;
                break;
            case 8:
                objType=4;
                objID=TheHeroInfo.ID;
                break;
            case 11:
                objType=5;
                objID=CityInfo.ID;
                break;
            case 12:
                objType=5;
                objID=TheCorpsInfo.CorpsID;
                break;                                                                                            
         }
        
        //如果不是元宝不够
        if(goldCondition==0)
        {    
            if((actionType>=1 && actionType<=6) || handleType==61 || handleType==62)
                AddBuildingEvent(actionType,objType,objID,pos);//添加建筑事件
            else if(actionType==56)
            {
                $("#popup").hide();
                $("#overlay").hide();
                AddVisitEvent(27,objType,objID,pos,1);//添加快速寻访事件
            }
            else if(actionType==57 || actionType==58)//占领山寨,放弃占领
            {
                $("#popup").hide();
                $("#overlay").hide();
                AddCorpsEvent(actionType,objType,objID,CityInfo.Pos);//添加军团事件
            }
            else if(actionType==9 || actionType==10 || actionType==40 || actionType==41 || actionType==45 || actionType==46)
                AddHeroEvent(actionType,objType,objID);//添加英雄事件
            else if((actionType>=11 && actionType<=13) || actionType==39 || actionType==48 || actionType==55 || actionType==59)
                AddCorpsEvent(actionType,objType,objID,CityInfo.Pos);//添加军团事件
            else if(actionType==15)
            {
                HidePopUp();
                Main.EngageHero(CityID,objID,cb_HeroCommandUpdate);//雇佣英雄
            }
            else if(actionType==17)
                Main.FireCanEenageHero(CityID,objID,cb_HeroCommandUpdate);//遣散英雄    
            else if(actionType==20)
                Main.ChangeHeroListType(CityID,objID,2,cb_HeroCommandUpdate);//加入攻击队列
            else if(actionType==21)
                Main.ChangeHeroListType(CityID,objID,3,cb_HeroCommandUpdate);//加入防守队列
            else if(actionType==22)
                Main.ChangeHeroListType(CityID,objID,1,cb_HeroCommandUpdate);//加入后备
            else if(actionType==23)
                Main.DebusHeroEquip(CityID,objID,cb_HeroCommandUpdate);//卸下所有装备                  
            else if(actionType==18)
                Main.SetHeroDefence(CityID,objID,ClickPos,cb_HeroCommandUpdate);//布防
            else if(actionType==19)
                Main.SetHeroDefence(CityID,objID,-1,cb_HeroCommandUpdate);//撤防
            else if(actionType==24)
                Main.FireTheHero(CityID,objID,cb_HeroCommandUpdate);//解雇侠客 
            else if(actionType==49)
                Main.HeroExpToItem(CityID,objID,cb_HeroExpToItem);//侠客归隐
            else if(actionType==33)
                EnterTheCity(objID);//进入城市
            else if(actionType==34)
                ReturnCorps(objID);//遣返支援军团
            else if(actionType==35)
                Main.HeroFastHealth(CityID,objID,cb_HeroCommandUpdate);//英雄快速恢复            
                                             
            //物品操作
            else if(actionType==25) //装备
                ItemTake();
            else if(actionType==26) //使用
                ItemUsed();
            else if(actionType==27) //出售
                ItemSell();
            else if(actionType==28) //回收
                ItemDonate();
            else if(actionType==29) //取消出售
                ItemCancleSell();
            else if(actionType==30) //卸下
                ItemTakeOff();
            else if(actionType==31) //卖家
                ItemSeller();
            else if(actionType==32) //购买
                ItemBuy();
            else if(actionType==36) //特殊修复
                ItemRepair();
            else if(actionType==37) //修复
                CommonItemRepair();
            else if(actionType==38) //搜索        
                Main.AddSearchEvent(CityID,CityInfo.Pos,cb_AddEvent);
            else if(actionType==42 || actionType==43 || actionType==44)
                GetResByGold(actionType);
            else if(actionType==47)
                ItemDecompose();//分解
            else if(actionType==52)/*chess*/
                Main.equipItemForAttackList(CityID,TheItemInfo.ID,cb_PouUpItemCommand)
            else if(actionType==53)/*chess*/
                Main.equipItemForDefListT(CityID,TheItemInfo.ID,cb_PouUpItemCommand);
            else if(actionType==54)/*chess*/
                Main.takeOffBattleItem(CityID,TheItemInfo.ID,cb_PouUpItemCommand);                 
        }
        else
            ShowPopUp("pop_25");
        //HideTips();                                 
}

function HeroLeaveTown(id)
{
    var t = id.split("_");
    var goldCondition=parseInt(t[5],10);
    if(goldCondition==0)
        ShowPopUp(id);
    else
        ShowPopUp("pop_25");
}


//侠客树操作返回
function cb_HeroCommandUpdate(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {
         Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);            
    }
    else
    {         
         ShowMessageBox(Lang["Tree_112"]);
         DataTranslateEnd(); 
    }      
}

//使用侠客归隐后
function cb_HeroExpToItem(result)
{
    if(DataValidate(result)==false) return false;
    
    if(result.value==0)
    {
         ShowMessageBox(Lang["Tree_113"]);
         Main.GetCityInteriorInfo(CityID,cb_GetCityInteriorInfo);            
    }
    else
    {         
         ShowMessageBox(Lang["Tree_112"]);
         DataTranslateEnd(); 
    }    
}
//进入城市
function EnterTheCity(objID)
{
    if(objID==CityID)
        ChangePage("N_1");

}

//遣返支援军团
function ReturnCorps(objID)
{
    Main.ReturnCorps(objID,cb_ReturnCorps);
}

var CropsSign = 0;
//添加遣返单独回调
function cb_ReturnCorps(result)
{
    if(DataValidate(result)==false) return false;
    if(result.value==0)
    {
       Main.GetCityOtherCorps(CityID,cb_GetCityOtherCorps);
       CropsSign=1;            
    }
    else
    {  
         ShowMessageBox(Lang["Tree_112"]);
         DataTranslateEnd(); 
    }   
}


//英雄改变装备
function ChangeHeroItem(type)
{
    InChoiceItem=true;
    
    ShowPopUp("item_41");
    
    ViewItemType=type;
    ViewItemPage=1;

    Main.GetItemCanUse(CityID,ViewItemType+1,TheHeroInfo.Level,TheHeroInfo.Sex,TheHeroInfo.Junta,ViewItemPage,cb_GetItemByType);
    
    DataTranslateBegin();
}

//遣返支援军团
function ReturnSupportTeam(id)
{
    var t = id.split("_");
    var index = parseInt(t[1]);
    ReturnCorps(CorpsInfo[index].CorpsID);
}

//查看支援队列侠客信息
function SeeHeroInfo(id)
{
    var t = id.split("_");
    var index = parseInt(t[1]);
    var CorpsID = CorpsInfo[index].CorpsID;
    Main.GetSimpleCropsHeros(CorpsID,cb_GetHeroByCrops)
}

//显示支援队列中英雄信息
function cb_GetHeroByCrops(result)
{
    if(DataValidate(result)==false) return false;
    SupportHeroInfo = result.value;
    if(SupportHeroInfo!=null && SupportHeroInfo[0].Level==-1)
    CorpsInfo=null;
    PopUpSeeHero();
}

//玩家是否被占领
function UserIsDependency()
{
    return Main.IsDependency(UserInfo.CityList[0].Pos).value;
}

//占领玩家是否过了冷却时间
function UserIsStartTime()
{
    return Main.IsStartTime(UserInfo.CityList[0].Pos).value;
}
