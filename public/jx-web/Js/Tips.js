 
var PageH=600;
var PageW=1002;
var NextLevel="";

var InteriorBuildingTipsPostfix = new Array("","%",Lang["Tips_1"],Lang["Tips_1"],Lang["Tips_1"],"","","","%",Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"]);
var InteriorBuildingTipsPrefix = new Array("",Lang["Tips_3"],Lang["Tips_4"],Lang["Tips_4"],Lang["Tips_4"],Lang["Tips_5"],Lang["Tips_5"],Lang["Tips_5"],Lang["Tips_6"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"],Lang["Tips_7"]);
var TechnicTipPrefix = new Array("",Lang["Tips_8"],Lang["Tips_9"],Lang["Tips_10"],Lang["Tips_11"],Lang["Tips_12"],Lang["Tips_13"],Lang["Tips_14"],Lang["Tips_15"],Lang["Tips_16"],Lang["Tips_17"],Lang["Tips_18"],Lang["Tips_19"],Lang["Tips_20"],Lang["Tips_21"],Lang["Tips_22"]);
var TechnicTipPostfix = new Array("","",Lang["Tips_2"],Lang["Tips_23"],Lang["Tips_23"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],Lang["Tips_2"],"%","%","%","个","%","%");
var UnionName= new Array(Lang["Tips_24"],Lang["Tips_25"],Lang["Tips_26"],Lang["Tips_27"],Lang["Tips_28"],Lang["Tips_29"],Lang["Tips_30"],Lang["Tips_31"],Lang["Tips_32"],Lang["Tips_33"],Lang["Tips_34"]);
var UnionDes = new Array(
"",
Lang["Tips_35"],
Lang["Tips_36"],
Lang["Tips_37"],
Lang["Tips_38"],
Lang["Tips_39"],
Lang["Tips_40"],
Lang["Tips_41"],
Lang["Tips_42"],
Lang["Tips_43"],
Lang["Tips_44"]);
var UnionWuXing = new Array("",Lang["Tips_45"],Lang["Tips_45"],Lang["Tips_46"],Lang["Tips_46"],Lang["Tips_47"],Lang["Tips_47"],Lang["Tips_48"],Lang["Tips_48"],Lang["Tips_49"],Lang["Tips_49"]);
var WuXingFontStyle = new Array("","font_gold","font_gold","font_wood","font_wood","font_water","font_water","font_fire","font_fire","font_dust","font_dust");
var Sex= new Array(Lang["Tips_50"],Lang["Tips_51"]);
var CommonTipsText = new Array(Lang["Tips_52"],Lang["Tips_53"],Lang["Tips_54"],Lang["Tips_55"],Lang["Tips_56"],Lang["Tips_57"],Lang["Tips_58"],Lang["Tips_59"],Lang["Tips_60"],
Lang["Tips_61"],Lang["Tips_62"],Lang["Tips_63"],Lang["Tips_64"],Lang["Tips_65"],Lang["Tips_66"],
Lang["Tips_67"],Lang["Tips_68"],Lang["Tips_69"],
Lang["Tips_70"],Lang["Tips_71"],
Lang["Tips_72"],Lang["Tips_73"],Lang["Tips_74"],
Lang["Tips_75"],Lang["Tips_76"],Lang["Tips_77"],Lang["Tips_78"],Lang["Tips_79"],Lang["Tips_80"],
Lang["Tips_81"],Lang["Tips_82"],Lang["Tips_83"],Lang["Tips_84"],Lang["Tips_85"],Lang["Tips_86"],Lang["Tips_87"],Lang["Tips_88"],Lang["Tips_89"],Lang["Tips_90"],Lang["Tips_91"],Lang["Tips_92"],Lang["Tips_93"],Lang["Tips_94"],Lang["Tips_95"],Lang["Tips_96"],
Lang["Tips_97"],Lang["Tips_98"],Lang["Tips_99"],Lang["Tips_100"],Lang["Tips_101"],Lang["Tips_102"],Lang["Tips_103"],Lang["Tips_104"],Lang["Tips_105"],Lang["Tips_106"],
Lang["Tips_107"],Lang["Tips_108"],Lang["Tips_109"],Lang["Tips_110"],Lang["Tips_111"],Lang["Tips_112"],Lang["Tips_113"],Lang["Tips_114"],Lang["Tips_115"],
Lang["Tips_116"],Lang["Tips_117"],Lang["Tips_118"],Lang["Tips_119"],Lang["Tips_120"],Lang["Tips_121"],Lang["Tips_122"],Lang["Tips_123"],Lang["Tips_124"],Lang["Tips_125"],
Lang["Tips_126"],Lang["Tips_127"],Lang["Tips_128"],Lang["Tips_129"],Lang["Tips_130"],Lang["Tips_131"],Lang["Tips_132"],Lang["Tips_133"],
Lang["Tips_134"],Lang["Tips_135"],Lang["Tips_136"],Lang["Tips_137"],Lang["Tips_138"],Lang["Tips_139"],Lang["Tips_140"],Lang["Tips_431"]);
var HeroStateTips = new Array(Lang["Tips_141"],Lang["Tips_142"],Lang["Tips_143"])
var AreaTips = new Array(Lang["Tips_144"],Lang["Tips_145"],Lang["Tips_146"],Lang["Tips_147"],Lang["Tips_148"],Lang["Tips_149"],Lang["Tips_150"],
Lang["Tips_151"],Lang["Tips_152"],Lang["Tips_153"],Lang["Tips_154"],Lang["Tips_155"],Lang["Tips_156"],Lang["Tips_157"],Lang["Tips_158"],Lang["Tips_159"]);
var InteriorBuildings=[Lang["Tips_153"],Lang["Tips_157"],Lang["Tips_146"],Lang["Tips_154"],Lang["Tips_156"],Lang["Tips_155"],Lang["Tips_151"],Lang["Tips_148"],Lang["Tips_158"],Lang["Tips_152"],Lang["Tips_159"],Lang["Tips_160"],Lang["Tips_161"],Lang["Tips_162"],Lang["Tips_163"],Lang["Tips_164"],Lang["Tips_165"],Lang["Tips_166"],Lang["Tips_167"],Lang["Tips_168"],Lang["Tips_169"]];
var EffectTipsOne = new Array(Lang["Tips_170"],Lang["Tips_171"],Lang["Tips_172"],Lang["Tips_173"],Lang["Tips_174"],Lang["Tips_175"]);
var EffectTipsTwo = new Array(Lang["Tips_176"],Lang["Tips_177"],Lang["Tips_178"],Lang["Tips_179"],Lang["Tips_180"],Lang["Tips_181"]);
var EffectTipsThree = new Array(Lang["Tips_182"],Lang["Tips_183"],Lang["Tips_184"],Lang["Tips_185"],Lang["Tips_185"],Lang["Tips_185"]);
var EffectTipsFour = new Array(Lang["Tips_186"],Lang["Tips_186"],Lang["Tips_186"],Lang["Tips_187"],"",Lang["Tips_187"]);
var DamageType = new Array(Lang["Tips_188"],Lang["Tips_189"],Lang["Tips_190"],Lang["Tips_191"],Lang["Tips_192"],Lang["Tips_193"],Lang["Tips_194"],Lang["Tips_195"],Lang["Tips_196"],Lang["Tips_197"],Lang["Tips_198"],Lang["Tips_199"],Lang["Tips_200"],Lang["Tips_201"],Lang["Tips_202"],Lang["Tips_203"])
var WeaponList = new Array(Lang["Tips_204"],Lang["Tips_205"],Lang["Tips_206"],Lang["Tips_207"],Lang["Tips_208"],Lang["Tips_209"],Lang["Tips_210"],Lang["Tips_211"],Lang["Tips_212"],Lang["Tips_213"],Lang["Tips_214"])
var AttackAreaList = new Array(Lang["Tips_215"],Lang["Tips_216"],Lang["Tips_217"],Lang["Tips_218"],Lang["Tips_219"],Lang["Tips_220"],Lang["Tips_221"],Lang["Tips_222"],Lang["Tips_223"],Lang["Tips_224"])
var RangeEff = new Array(Lang["Tips_225"],Lang["Tips_226"],Lang["Tips_227"],Lang["Tips_228"],Lang["Tips_229"],Lang["Tips_230"],Lang["Tips_231"],Lang["Tips_232"],Lang["Tips_233"],Lang["Tips_230"]);
var EffectTipsList = new Array(Lang["Tips_234"],Lang["Tips_235"],Lang["Tips_236"],Lang["Tips_237"],Lang["Tips_238"],Lang["Tips_239"],Lang["Tips_240"]);
var DefenceRasTips = new Array(Lang["Tips_241"],Lang["Tips_242"],Lang["Tips_243"],Lang["Tips_244"]);
var MainEffectName = [Lang["Tips_245"],Lang["Tips_246"],Lang["Tips_247"],Lang["Tips_248"],Lang["Tips_249"],Lang["Tips_250"],Lang["Tips_251"]];
var UserInfoTips=[Lang["Tips_441"],Lang["Tips_442"],Lang["Tips_443"],Lang["Tips_444"],Lang["Tips_445"],Lang["Tips_446"],Lang["Tips_447"],Lang["Tips_448"],Lang["Tips_449"],Lang["Tips_450"],Lang["Tips_451"],Lang["Tips_452"],Lang["Tips_453"],Lang["Tips_454"],Lang["Tips_455"],Lang["Tips_456"]];
 
function ShowTips(ev,tipsID)
{  
     ev = ev || window.event;
     MousePos = mousePos(ev);
     if(MousePos!=null)
     {
        var tips=tipsID;
        var t=tipsID.split("_");
        var tipsType;
        var sTips;
        var nodeType;
        var index;
        var handleType;
        
        //内政区域tips
        if(t[0]=="area")
        {
        var pos=parseInt(t[2],10);
        tips=CreateAreaTips(pos);
        sTips="#tips_short";
        }
        else if(t[0]=="userInfo")
        {
             var pos=parseInt(t[1],10);
             tips=UserInfoTips[pos];
             if(pos==1) 
                tips=tips.replace("XX",NextLevel);
             sTips="#tips_short";
        }  
        else if(t[0]=="effect")
        {
            index=parseInt(t[1],10);
            type=parseInt(t[2],10);
            tips=CreateEffectTips(index,type);
            sTips="#tips";
        }
        else if(t[0]=="mall")
        {
            index = parseInt(t[1],10);
            type = parseInt(t[2],10);
            tips = CreateMallItemTips(index,type);
            sTips="#tips";
        }
        else if(t[0]=="citem")
        {
            var usetype = parseInt(t[3],10);
            sTips="#tips";
            tips="<ul>";
            tips+="<li>"+ChessItemIns[usetype-9]+"</li>";
            tips+="</ul>";
        }
        else if(t[0]=="teffect")
        {
            var index=parseInt(t[2],10);
            var effect=TheBuildingInfo.EffectArray[index];
            MainEffectType=parseInt(t[3],10);
            var dayssign=parseInt(t[1],10);
            var gold=CityInteriorInfo.Gold;
            var NeedGold=gold-effect.Gold;
            sTips="#tips";
            tips="<ul>";
            if(MainEffectType!=1)
            tips+="<li>"+EffectTipsList[MainEffectType-1]+"</li>";
            else
            {
                if(dayssign==1)
                    tips+="<li>"+Lang["Tips_252"]+"</li>";
                else
                    tips+="<li>"+Lang["Tips_253"]+"</li>";
                tips+="<li>"+Lang["Tips_254"]+"</li>";
                tips+="<li>"+Lang["Tips_255"]+"</li>";
                tips+="<li><span class=\"font_green\">"+Lang["Tips_422"]+"</span></li>";
                tips+="<li>"+Lang["Tips_256"]+"</li>";
                tips+="<li>"+Lang["Tips_257"]+"</li>";
                tips+="<li>"+Lang["Tips_258"]+"</li>";
                tips+="<li>"+Lang["Tips_259"]+"</li>";
                tips+="<li><span class=\"font_green\">"+Lang["Tips_432"]+"</span></li>";
                tips+="<li>"+Lang["Tips_260"]+"</li>";
            }
            if(MainEffectType!=1 && MainEffectType!=6)
            tips+="<li>"+EffectTipsFour[MainEffectType-2]+"</li>";
            if(NeedGold>=0)
            tips+="<li><img style=\"margin-right:5px;\" src=\"img/4/4.GIF\" />"+effect.Gold+"<li>";
            else
            tips+="<li class=\"font_red\"><img style=\"margin-right:5px;\" src=\"img/4/4.GIF\" />"+effect.Gold+"<li>";
            tips+="</ul>";
        }
        else if(t[0]=="defence")
        {
            tips=CreateDefenceTips(tipsID);
            sTips="#tips_short";
        }
        else if(t[0]=="name")
        {
            var gold=CityInteriorInfo.Gold;
            var NeedGold = gold-5;
            sTips="#tips";
            tips="<ul>";
            tips+="<li>"+Lang["Tips_261"]+"</li>";
            tips+="<li>"+Lang["Tips_418"]+"</li>";
            if(NeedGold>=0)
            tips+="<li><img style=\"margin-right:5px;\" src=\"img/4/4.GIF\" />"+5+"<li>";
            else
            tips+="<li class=\"font_red\"><img style=\"margin-right:5px;\" src=\"img/4/4.GIF\" />"+5+"<li>";
            tips+="</ul>";
        }
        else if(t[0]=="EndProtect")
        {
            tips=UserInfo.EndProtect;
            sTips="#tips_short";
        }
        else if(t[0]=="heroitem")
        {
            type=parseInt(t[2],10);
            tips=CreateHeroItemTips(type);
            if(tips=="")
            {
                tips=Lang["Tips_262"];
                sTips="#tips_short";
            }
            sTips="#tips"; 
        }
        else if(t[0]=="taskitem")
        {
            index=parseInt(t[1],10);
            type=parseInt(t[2],10);
            tips=CreateTaskItemTips(index,TaskInfo[index].GetItem);
            sTips="#tips";
        }
        else if(t[0]=="taskcostitem")
        {
            index=parseInt(t[1],10);
            index1=parseInt(t[2],10);          
            tips=CreateTaskItemTips(index,TaskInfo[index].CostItemList[index1]);
            sTips="#tips";
        }
        else if(t[0]=="world")
        {
            tips=CreateWorldTips(tipsID);
            sTips="#tips_short";
        }
        
        //树的tips
        else if(t[0]=="tree")
        {
            sTips="#tips";
            //待雇佣侠客
            if(t[1]=="icon")
            {
                nodeType=parseInt(t[2],10);
                index=parseInt(t[3],10);
                if(parseInt(t[2],10)==6 || parseInt(t[2],10)==7 || parseInt(t[2],10)==10)
                {
                    tips=CreateHeroTips(nodeType,index);
                }
                $(sTips).css({"width":100,"display":"block"});
            }
            
            //其它操作
            else
            {
                nodeType=parseInt(t[2],10);
                handleType=parseInt(t[3],10);
                index=parseInt(t[4],10);
            
                tips=CreateTreeTips(nodeType,handleType,index);
                $(sTips).css({"width":140,"display":"block"});         
            }
                       
        }
        
        else if(t[0]=="common")
        {
            type=parseInt(t[1],10);
            index=parseInt(t[2],10);
            if(type==1)
                sTips="#tips_short";
            else
            {
                $(sTips).css({"width":150,"display":"block"});
                sTips="#tips";
            }
            tips=CommonTipsText[index];
            if(index==77)
            {
                if(CityInteriorInfo.Level<20)
                    tips+="("+Lang["Tips_263"]+""+UserLevel[CityInteriorInfo.Level]+")";
                else
                    tips+=Lang["Tips_264"];
            }
            if(index==89)
            {
                tips=tips;
            }
        }
        else if(t[0]=="herostate")
        {
            sTips="#tips_short";
            tips=HeroStateTips[parseInt(t[1],10)-1];
        }
        else if(t[0]=="herospcstate")
        {
            sTips="#tips_short";
            tips=HeroSpcStateTips[parseInt(t[1],10)-1];
        }
        else if(t[0]=="task")
        {
            if(t[1]=="1")
            {
                sTips="#tips_short";
                tips="<p>"+Lang["Tips_265"]+"</p>";
                tips+="<p class='font_bold'>"+Lang["Tips_266"]+"</p>";
                if(CityInteriorInfo.Men>=50)
                    tips+="<p><img src=\"img/4/3.gif\" /><span>   50</span></p>";
                else
                    tips+="<p><img src=\"img/4/3.gif\" /><span class=\"font_red\">   50</span></p>";
                var needTime=1200*TimePercent/100
                if(needTime>0)
                    tips+="<p><img src=\"img/o/18.GIF\" /><span>  "+IntToTime(needTime)+"</span></p></p>";          
            }
            else if(t[1]=="4")
            {
                sTips="#tips_short";
                if(t[2]=="a")
                    tips="<p>"+Lang["Tips_267"]+"</p>";
                if(t[2]=="b")
                    tips="<p>"+Lang["Tips_268"]+"</p>"
                tips+="<p class='font_bold'>"+Lang["Tips_266"]+"</p>";
                if(CityInteriorInfo.Men>=100)
                    tips+="<p><img src=\"img/4/3.gif\" /><span>   100</span></p>";
                else
                    tips+="<p><img src=\"img/4/3.gif\" /><span class=\"font_red\">   100</span></p>";
                var needTime=0;
                if(t[2]=="a")
                    needTime=1200*TimePercent/100;
                if(needTime>0)
                    tips+="<p><img src=\"img/o/18.GIF\" /><span>  "+IntToTime(needTime)+"</span></p></p>";
                if(t[2]=="b")
                {
                    if(CityInteriorInfo.Gold>=1)
                        tips+="<p><img src=\"img/4/4.gif\" /><span>   1</span></p>";             
                    else
                        tips+="<p><img src=\"img/4/4.gif\" /><span class=\"font_red\">   1</span></p>";  
                }
            }
        }
        else if(t[0]=="notask")
        {
            if(t[1]=="1")
            {
                sTips="#tips_short";    
                var eventNum=GetComposeTaskEventNum()+GetTaskEventNum();
                var taskNum=GetNormalTaskNum();
                if(CityInteriorInfo.Men<50)
                    tips=Lang["Tips_269"];
                if(eventNum>0)
                    tips=Lang["Tips_270"];
                if(taskNum>0)
                    tips=Lang["Tips_271"];   
            }
            else if(t[1]=="4")
            {
                sTips="#tips_short";
                var eventNum=0;
                if(t[2]=="a")
                    eventNum=GetComposeTaskEventNum()+GetTaskEventNum();
                else
                    eventNum=GetComposeTaskEventNum();
                var taskNum=GetComposeTaskNum();
                if(eventNum>0)
                    tips=Lang["Tips_270"];
                else if(taskNum>=3)
                    tips=Lang["Tips_272"];
                else
                {    
                    if(t[2]=="a")
                        tips="<p>"+Lang["Tips_267"]+"</p>";
                    if(t[2]=="b")
                        tips="<p>"+Lang["Tips_268"]+"</p>"
                    tips+="<p class='font_bold'>"+Lang["Tips_266"]+"</p>";
                    if(CityInteriorInfo.Men>=100)
                        tips+="<p><img src=\"img/4/3.gif\" /><span>   100</span></p>";
                    else
                        tips+="<p><img src=\"img/4/3.gif\" /><span class=\"font_red\">   100</span></p>";
                    var needTime=0;
                    if(t[2]=="a")
                        needTime=1200*TimePercent/100;
                    if(needTime>0)
                        tips+="<p><img src=\"img/o/18.GIF\" /><span>  "+IntToTime(needTime)+"</span></p></p>";
                    if(t[2]=="b")
                    {
                        if(CityInteriorInfo.Gold>=1)
                            tips+="<p><img src=\"img/4/4.gif\" /><span>   1</span></p>";             
                        else
                            tips+="<p><img src=\"img/4/4.gif\" /><span class=\"font_red\">   1</span></p>";  
                    }
                }       
            }
        }
        else if(t[0]=="heroskill")
        {
            sTips="#tips";
            var index=parseInt(t[1],10);
            var dtype=HeroInfo[index].SkillList[0].EffID-1;
            var wtype=HeroInfo[index].SkillList[0].NeedItemType;
            var aarea=HeroInfo[index].SkillList[0].EffRange-1;
            //tips+="<ul style=\"list-style:none;\">";
            tips="<p>"+HeroInfo[index].SkillList[0].Name+" <span style=\"color:#35c235\">"+HeroInfo[index].SkillList[0].SkillLevel+""+Lang["Tips_2"]+"</span></p>"
            tips+="<p>"+Lang["Tips_273"]+""+HeroInfo[index].SkillList[0].EXP+"</p>"
            tips+="<p>"+Lang["Tips_274"]+""+HeroInfo[index].SkillList[0].Des+"</p>"
            tips+="<p>"+Lang["Tips_275"]+""+DamageType[dtype]+"</p>";
            tips+="<p>"+Lang["Tips_276"]+""+HeroInfo[index].SkillList[0].EffValue+"</p>";
            //tips+="<p>发动几率:"+HeroInfo[index].SkillList[0].Probability+"%</p>";
            tips+="<p>"+Lang["Tips_277"]+""+AttackAreaList[aarea]+"</p>";
            if(HeroInfo[index].NoSkillReason==0)
                tips+="<p>"+Lang["Tips_278"]+""+WeaponList[wtype]+"</p>";
            else
                tips+="<p class='font_red'>"+Lang["Tips_278"]+""+WeaponList[wtype]+"</p>";    
            //tips+="</ul>";
        }
        else if(t[0]=="heroimg")
        {
            sTips="#tips";
            var index=parseInt(t[1],10);
            var hero=HeroInfo[index];
            tips="<p>"+UnionName[hero.Junta]+""+Lang["Tips_279"]+""+Sex[hero.Sex-1]+""+Lang["Tips_280"]+"</p>";
            tips+="<p>"+UnionDes[hero.Junta]+"</p>";  
        }
        else if(t[0]=="heroattack")
        {
            sTips="#tips_short";
            var index=parseInt(t[1],10);
            var hero=HeroInfo[index];
            var WeaponState;//1:装备武器且耐久大于0 2:装备武器耐久等于0 
            var HasWeapon=false;//有武器为true
            var WeaponIndex=0;
            if(hero.ItemList!=null)
            {
                for(var i=0;i<hero.ItemList.length;i++)
                {
                    if(hero.ItemList[i].ItemType==2 && hero.ItemList[i].Durability>0)
                    {
                        WeaponState=1;
                        WeaponIndex=i;
                        HasWeapon=true;
                    }
                    if(hero.ItemList[i].ItemType==2 && hero.ItemList[i].Durability==0)
                    {
                        WeaponState=2;
                        HasWeapon=true;
                    }                  
                }
            }
            tips="<p>"+Lang["Tips_281"]+"</p>";
            if(WeaponState==1)
            tips+="<p>"+(hero.Attack-hero.ItemList[WeaponIndex].Attack)+"+<span class=\"font_green\">"+hero.ItemList[WeaponIndex].Attack+"</span></p>";
            if(WeaponState==2)
            tips+="<p>"+hero.Attack+"+<span class=\"font_red\">0</span></p>";
            if(HasWeapon==false)
            tips+="<p>"+hero.Attack+"</p>";
        }
        else if(t[0]=="herodefence")
        {
            sTips="#tips_short";
            var index=parseInt(t[1],10);
            var hero=HeroInfo[index];
            var ArmorState;//1:装备衣服且耐久大于0 2:装备衣服耐久等于0 
            var HasArmor=false;
            var ArmorIndex=0;
            if(hero.ItemList!=null)
            {
                for(var i=0;i<hero.ItemList.length;i++)
                {
                    if(hero.ItemList[i].ItemType==3 && hero.ItemList[i].Durability>0)
                    {
                        ArmorState=1;
                        ArmorIndex=i;
                        HasArmor=true;
                    }
                    if(hero.ItemList[i].ItemType==3 && hero.ItemList[i].Durability==0)
                    {
                        ArmorState=2;
                        HasArmor=true;
                    }
                }
            } 
            tips="<p>"+Lang["Tips_282"]+"</p>";
            if(ArmorState==1)
            tips+="<p>"+(hero.Defence-hero.ItemList[ArmorIndex].Defence)+"+<span class=\"font_green\">"+hero.ItemList[ArmorIndex].Defence+"</span></p>";
            if(ArmorState==2)
            tips+="<p>"+hero.Defence+"+<span class=\"font_red\">0</span></p>";
            if(HasArmor==false)
            tips+="<p>"+hero.Defence+"</p>";
        }
        else if(t[0]=="attackback")
        {
            sTips="#tips";
            var gold=CityInteriorInfo.Gold;
            tips="";
            tips+="<p>"+Lang["Tips_283"]+"</p>";
            if(gold-1>=0)
            tips+="<p><img style=\"padding-right:15px;\" src=\"img/4/4.gif\"/>1</p>";
            else
            tips+="<p><img style=\"padding-right:15px;\" src=\"img/4/4.gif\"/><span class=\"font_red\">1</span></p>";
        }
        else if(t[0]=="returnback")
        {
            sTips="#tips";
            tips="";
            var gold=CityInteriorInfo.Gold;
            tips+="<p>"+Lang["Tips_284"]+"</p>";
            if(gold-5>=0)
            tips+="<p><img style=\"padding-right:15px;\" src=\"img/4/4.gif\"/>5</p>";
            else
            tips+="<p><img style=\"padding-right:15px;\" src=\"img/4/4.gif\"/><span class=\"font_red\">5</span></p>";
        }
        else if(t[0]=="heroexp")
        {
            sTips="#tips";
            var index=parseInt(t[2],10);
            tips="<p>"+""+Lang["Tips_285"]+""+HeroInfo[index].LevelExp+"/"+HeroInfo[index].LevelExpStatic+"</p>";
            tips+="<p>"+Lang["Tips_286"]+"</p>"; 
        }
        else if(t[0]=="createorg")
        {
            sTips="#tips_short";
            tips="";
            tips+="<ul>";
            tips+="<li><span class=\"font_bold\">"+Lang["Tips_266"]+"</span></li>";
            var men = parseInt(t[1]);
            var food = parseInt(t[2]);
            var money = parseInt(t[3]);
            var level = parseInt(t[4])-8;
            if(men<0)
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/3.gif\" /><span class=\"font_red\">2000</span></li>";
            else
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/3.gif\" />2000</li>";
            if(food<0)
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/2.gif\" /><span class=\"font_red\">20000</span></li>";
            else
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/2.gif\" />20000</li>";
            if(money<0)
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/1.gif\" /><span class=\"font_red\">20000</span></li>";
            else
            tips+="<li><img style=\"margin-right:10px;\" src=\"img/4/1.gif\" />20000</li>";
            if(level<0)
            tips+="<li>"+Lang["Tips_287"]+"<span class=\"font_red\">"+Lang["Tips_288"]+"</span>"+Lang["Tips_289"]+"</li>";
            else
            tips+="<li>"+Lang["Tips_290"]+"</li>";
            tips+="</ul>";
                
        }
        HideTips();
        $(sTips).html(tips);
        $(sTips).hide();    
        var h=$(sTips).height(); 
        var w=$(sTips).width();
        var top=MousePos.y+20;
        var left=MousePos.x;  
        if(top+h>PageH-10)
           top=MousePos.y-30-h; 
        $(sTips).css({"left":left,"top":top,"display":"block"});             
        tips=null;
     }    
}
 

//创建区域热点ToolTips
function CreateAreaTips(pos)
{
    var tips=AreaTips[pos-1];
    var hasBuilding=HasBuilding(pos);
    var hasEvent=HasEventBuilding(pos);
    
    if(hasBuilding>=0 && MapUnitInfo!=null && MapUnitInfo[hasBuilding]!=null)
        tips=MapUnitInfo[hasBuilding].Name+" "+MapUnitInfo[hasBuilding].Level+""+Lang["Tips_2"]+"";  
    
    if(hasEvent>=0 && EventInfo!=null && EventInfo[hasEvent]!=null)
        tips=EventInfo[hasEvent].ObjName+" "+EventInfo[hasEvent].ObjLevel+""+Lang["Tips_2"]+" " +EventState[EventInfo[hasEvent].State-1]+EventActionType[EventInfo[hasEvent].ActionType-1]
    
    return tips;    
}

//创建城防地图单元ToolTips
function CreateDefenceTips(tipsID)
{
    var tips="";
    var t=tipsID.split("_");
    var index=parseInt(t[3],10);
    var obj;
    
 
    if(t[1]=="landform" || t[1]=="build" || t[1]=="sinker")
    {
        obj=LandformInfo[index];
        
        var x=(obj.Pos-1)%DefenceWidth;
        var y=Math.floor((obj.Pos-1)/DefenceWidth); 
        if(obj.Type==1 || y<=3 || y>=DefenceHeight-2)
        {
            if(obj.Type==0)
            {
                if(y<=3)
                    tips=Lang["Tips_291"];
                else
                    tips=Lang["Tips_292"];     
            }
            else
            {
                tips=DefenceRasTips[obj.Index];
            }    
        }
        else
            tips=Lang["Tips_293"];       
     
    }
    if(t[1]=="building" || t[1]=="hero")
    {
        obj=MapUnitInfo[index];
        tips=obj.Name+" "+obj.Level+""+Lang["Tips_2"]+" ";               
    }
  
    var pos=obj.Pos;
    var hasEvent=HasEventBuilding(pos);
    
    if(hasEvent>=0)
        tips=EventInfo[hasEvent].ObjName+" "+EventInfo[hasEvent].ObjLevel+""+Lang["Tips_2"]+" " +EventState[EventInfo[hasEvent].State-1]+EventActionType[EventInfo[hasEvent].ActionType-1] 
    
    return tips;      
}

//创建大地图ToolTips
function CreateWorldTips(tipsID)
{   
    var tips="";
    var t=tipsID.split("_");
    var index=parseInt(t[3],10);
    var obj;

    if(t[1]=="landform")
    {
        obj=LandformInfo[index];
        var x=Math.floor(obj.Pos%400);
        if(x==0)x=400;
        var y=(Math.floor((obj.Pos-1)/400)+1); 
        tips+=""+Lang["Tips_294"]+"("+x+","+y+")";//空地
    }
    if(t[1]=="city")
    {
        obj=MapUnitInfo[index];
        var m = 1;
        if(obj.Level>1)
            m=(obj.Level-1)*5;
        var x=Math.floor(obj.Pos%400);
        if(x==0)x=400;
            var y=(Math.floor((obj.Pos-1)/400)+1); 
            
        if(obj.Type==4 ||obj.Type==6 || obj.Type==7 || obj.EspecialType==1)
        {
            tips+="<div class=\"font_bold\">"+obj.Name+" "+m+""+Lang["Tips_2"]+"</div>";//帮派
            tips+="<div>"+Lang["Tips_295"]+"("+x+","+y+")</div>";//位置
        }
        if(obj.Type==5)//玩家
        {
            tips+="<div class=\"font_bold\">"+obj.Name+"</div>"; 
            tips+="<div>"+Lang["Tips_296"]+""+obj.UserName;//玩家
            tips+="</div>"; 
            if(obj.IsLord==1)//占领状态
            tips+="<div>"+Lang["Tips_436"]+"<span class=\"font_green\">"+obj.OccupationInfo.LordUser+"</span></div>"
            if(obj.State==3)
                tips+="<div>"+Lang["Tips_297"]+"</div>";//新手保护状态
            tips+="<div>"+Lang["Tips_298"]+""+UserLevel[obj.Level-1]+"</div>";//官位
            if(obj.JuntaName!=null)
                tips+="<div>"+Lang["Tips_299"]+""+obj.JuntaName+"</div>";//帮派
            else
                tips+="<div>"+Lang["Tips_300"]+"</div>"; //帮派:无
            //属地
            if(obj.OccupationInfo.DependencyNum > 0)
                tips+="<div>"+Lang["Tips_437"]+"<span class=\"font_green\">"+obj.OccupationInfo.DependencyNum+Lang["Tips_23"]+"</span></div>"
            tips+="<div>"+Lang["Tips_295"]+"("+x+","+y+")</div>";//位置
        }
    }
  
    var pos=obj.Pos;
    var hasEvent=HasEventBuilding(pos);
    
    if(hasEvent>=0)
        tips=EventInfo[hasEvent].ObjName+" "+EventInfo[hasEvent].ObjLevel+""+Lang["Tips_2"]+" " +EventState[EventInfo[hasEvent].State-1]+EventActionType[EventInfo[hasEvent].ActionType-1] 
    
    return tips;      
}

//创建树节点操作ToolTips
function CreateTreeTips(nodeType,handleType,index)
{
   var tips="";
   var needMoney;
   var needFood;
   var needMen;
   var needTime;
   var needGold;
   var needLevel;
   var needSex;
   var needUnion;
   var needInsignia;
   var effValue;
   var level;
   var nodeObj;
   var conditionState;
   var hitPoint;
   var Durability;
   var attack;
   var HasPeace=false;
   var MeHasPeace=false;
   var tips2="";
   
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
   
   
   if((nodeType==1 || nodeType==4) && PosBuildingInfo!=null && PosBuildingInfo[index]!=null)
       nodeObj=PosBuildingInfo[index];
   if((nodeType==2 || nodeType==5) && TheBuildingInfo!=null)   
       nodeObj=TheBuildingInfo;
   if(nodeType==3 && TechnicInfo!=null && TechnicInfo[index]!=null) 
       nodeObj=TechnicInfo[index];
   if((nodeType==6 || nodeType==7) && HeroInfo!=null && HeroInfo[index]!=null)
       nodeObj=HeroInfo[index];
   if(nodeType==8 && TheHeroInfo!=null)
       nodeObj=TheHeroInfo;    
   if(nodeType==9 && ItemInfo!=null && ItemInfo[index]!=null)
       nodeObj=TheItemInfo;
   if((nodeType==11 || nodeType==13) && CityInfo!=null)
       nodeObj=CityInfo;    
 
   conditionState=GetConditionState(nodeObj,nodeType,handleType);
   
   if(conditionState[12]==0)
   {
      var index;
      var hasEvent;
      if((handleType>=1 && handleType<=6) || handleType==56 || handleType==61 || handleType==62)
      {
          hasEvent=HasEventBuilding(ClickPos);
          if(EventInfo!=null && EventInfo[hasEvent]!=null)
              tips=EventInfo[hasEvent].ObjName+EventState[EventInfo[hasEvent].State-1]+EventActionType[EventInfo[hasEvent].ActionType-1];
      }
      else if(handleType==9 || handleType==10 || handleType==40 || handleType==41 || handleType==45)
      {     
          hasEvent=HasEventHero(nodeObj.ID);
          if(EventInfo!=null && EventInfo[hasEvent]!=null)
              tips=EventInfo[hasEvent].ObjName+EventState[EventInfo[hasEvent].State-1]+EventActionType[EventInfo[hasEvent].ActionType-1];    
      }
      return tips;   
   }
   
   if(conditionState[13]==0)//当前建筑仍有侠客停留
   {
       return Lang["Tips_301"];
   }
   
   if(conditionState[14]==0 && (handleType==3 || handleType==4))
   {
       if(PageNum==1)
       return Lang["Tips_302"];
       else
       return Lang["Tips_303"];
   }
   
   if(conditionState[16]==0)
   {
       return Lang["Tips_304"];  
   }
   if(conditionState[19]==0)
   {
       return Lang["Tips_305"];  
   }
   if(conditionState[20]==0 && CanAttack()=="")
   {
       return Lang["Tips_439"];  
   }
   if(conditionState[21]==0)
   {
       return Lang["Tips_440"]+nodeObj.LordEndTime;  
   }
   if((handleType>=1 && handleType<=4) || handleType==61 || handleType==62)
   {
        needMoney=nodeObj.UpNeedMoney;
        needFood=nodeObj.UpNeedFood;
        needMen=nodeObj.UpNeedMen;
        if(handleType==1)
        {
             level=nodeObj.Level;
             effValue=nodeObj.CurrentEff;
             needTime=nodeObj.UpNeedTime;
             hitpoint=nodeObj.HitPoint;
             Durability=nodeObj.Durability;
             attack=nodeObj.Attack;
        }
        if(handleType==2)
        {
             level=nodeObj.Level;
             effValue=nodeObj.CurrentEff;
             if(nodeType==4)
             needTime=5;
             else
             needTime=Math.ceil(nodeObj.UpNeedTime*FastUpdateNeedTimePercent/100);
             needGold=nodeObj.UpNeedGold;  
        }
        if(handleType==61)//瞬间建造
        {
            level=nodeObj.Level;
            effValue=nodeObj.CurrentEff;
            needTime=30;
            needGold=nodeObj.SnapGold;
        }
        if(handleType==3)
        {
             level=nodeObj.Level+1;
             effValue=nodeObj.NextEff;
             if(nodeType==5)
             needTime=5;
             else
             needTime=nodeObj.UpNeedTime;
             if(nodeType==3 || nodeType==5)//城防升级
                needGold=nodeObj.UpNeedGold;   
        }
        if(handleType==4)
        {
             level=nodeObj.Level+1;
             effValue=nodeObj.NextEff;
             needTime=Math.ceil(nodeObj.UpNeedTime*FastUpdateNeedTimePercent/100);
             needGold=nodeObj.UpNeedGold;  
        }
        if(handleType==62)
        {
             level=nodeObj.Level+1;
             effValue=nodeObj.NextEff;
             needTime=30;
             needGold=nodeObj.SnapGold;  
        }
    }  
        if(handleType==5)
        {
            level=nodeObj.Level-1;
            needMoney=nodeObj.DownNeedMoney;
            needFood=nodeObj.DownNeedFood;
            needMen=nodeObj.DownNeedMen;
            effValue=nodeObj.OldEff;
            needTime=Math.ceil(nodeObj.UpNeedTime*DegradeNeedTimePercent/100); 
        }
        
        if(handleType==6)
        { 
            needMoney=500;
            needFood=500;
            needTime=1800*TimePercent/100;
        }
        if(handleType==56)//快速寻访
        { 
            needMoney=500;
            needFood=500;
            needGold=5;
            needTime=30*TimePercent/100;
        }
        if(handleType==57)//占领山寨
        { 
            needGold=OccupationGold;
            needInsignia=OccupationInsignia;
        }
        if(handleType==59 && UserInfo.State!=3 && nodeObj.State!=3)//征服
        {
            if(CanAttack()=="" && MeHasPeace!=true && HasPeace!=true) 
                needInsignia=3500;
        }
        if(handleType==60)//赎身
        { 
            needInsignia=500;
        }
        if(handleType==-60)//修改占领信息
        { 
            needGold=5;
        }
        if(handleType==15 || handleType==16)
        {
            needMoney=nodeObj.EngageCostMoney;
            needFood=nodeObj.EngageCostFood;
            needGold=nodeObj.EngageCostGold;
        }
        if(handleType==9)
        {
            if(nodeObj.Training<100)
            {
                needMoney=nodeObj.TrainCostMoney*nodeObj.PrenticeNum;
                needFood=nodeObj.TrainCostFood*nodeObj.PrenticeNum;
                needTime=nodeObj.TrainCostTime*nodeObj.PrenticeNum;
            }
        }
        if(handleType==40)//快速训练
        {
            if(nodeObj.Training<100)
            {
                needMoney=nodeObj.FastTrainCostMoney*nodeObj.PrenticeNum;//当前弟子数量*需要资源
                needFood=nodeObj.FastTrainCostFood*nodeObj.PrenticeNum;
                needTime=nodeObj.FastTrainCostTime;
                needGold=nodeObj.FastTrainCostGold;
            }
        }
        if (handleType==36)
        {
            needGold=nodeObj.Level;
        }
        if(handleType==37)
        {
            needMoney=nodeObj.RepairItemNeedMoney;
            needFood=nodeObj.RepairItemNeedFood;
        }
        if(handleType==38)
        {
            needMen=15;
            needTime=1800*TimePercent/100;
        }
        if(handleType==39)
        {
           level=nodeObj.Level-CityInteriorInfo.Level; 
        }
        if(handleType==49)
        {
           needGold=10;
        }
        switch(handleType)
        {
            case 25:
                needLevel=nodeObj.UseLevel;
                needSex=nodeObj.UseSex;
                needUnion=nodeObj.UseUnion;
                break;
            case 26:
                needGold=nodeObj.UseGold;
                break;
            case 32:
                needGold=nodeObj.Price;
                break;
            default:
                break;
        }
        
        tips+="<ul class=\"tips_tree_ul\" >";
        var effPrefix="";
        var effPostfix="";
        if(effValue>0 && nodeObj.EffID>=0)
        {
            if(nodeType==1 || nodeType==2)
            {
                effPostfix=InteriorBuildingTipsPostfix[nodeObj.EffID];
                effPrefix=InteriorBuildingTipsPrefix[nodeObj.EffID];
            }
            if(nodeType==3)
            {
                effPrefix=TechnicTipPrefix[nodeObj.EffID];
                effPostfix=TechnicTipPostfix[nodeObj.EffID];
            }
        }
        //if(attack>0)
          //  tips+="<li>"+level+"级 攻击力:"+attack+"</li>";
        if(hitPoint>1)
            tips+="<li>"+level+""+Lang["Tips_306"]+""+Durability+"</li>";
        if(handleType==5) 
        {
            if((nodeObj.Pos==1 || nodeObj.Pos==2 || nodeObj.Pos==4 || nodeObj.Pos==6 || nodeObj.Pos==7) && level==0)
                tips+="<li>"+Lang["Tips_307"]+"</li>";
            else if(handleType==5 && (level==0 || nodeType==5))
                tips+="<li>"+Lang["Tips_308"]+"</li>";
        }         
        if(handleType==6 || handleType==56)//寻访or快速寻访
            tips+="<li>"+Lang["Tips_309"]+"</li>";    
        if(handleType==15)
            tips+="<li>"+Lang["Tips_310"]+"</li>"; 
        if(handleType==16)
            tips+="<li>"+Lang["Tips_321"]+"</li>";
        if(handleType==17)
            tips+="<li>"+Lang["Tips_311"]+"</li>";
        if(handleType==18)
            tips+="<li>"+Lang["Tips_312"]+"</li>";
        if(handleType==19)
            tips+="<li>"+Lang["Tips_313"]+"</li>";
        if(handleType==34)
            tips+="<li>"+Lang["Tips_314"]+"</li>";    
            
        if(handleType==9 || handleType==10 || handleType==40 || handleType==41 || (handleType>=20 && handleType<=24) || handleType==42 || handleType==43 || handleType==44 || handleType==45 || handleType==49)
        {
            if(nodeObj.State==5 ||  nodeObj.State==7 || nodeObj.State==13)
               tips+="<li>"+Lang["Tips_315"]+"</li>"; 
            else if(nodeObj.State==8)
               tips+="<li>"+Lang["Tips_316"]+"</li>";
            else if(handleType==10 && CanConscription()!="")
               tips+="<li>"+CanConscription()+"</li>"
            else if(handleType==41 && CanFastConscription()!="" ) 
               tips+="<li>"+CanFastConscription()+"</li>";
            else
            {
                switch(handleType)
                {
                    case 9:
                        if(nodeObj.Training<100)
                        {
                            tips+=""+Lang["Tips_317"]+""+nodeObj.UpTraining+"%";
                            tips+="<br/>"+Lang["Tips_318"]+"";
                        }
                        else
                            tips+=Lang["Tips_319"];
                        break;
                    case 40:
                        if(nodeObj.Training<100)
                        {
                            tips+=""+Lang["Tips_320"]+"";
                            tips+="<br/>"+Lang["Tips_318"]+"";
                        }
                        else
                            tips+=""+Lang["Tips_319"]+"";
                        break;
                    case 10:
                    case 41:
                        tips+="<li>"+Lang["Tips_322"]+" </li>";
                        break;
                    case 42:
                        tips+="<li>"+Lang["Tips_323"]+"</li>";
                        break
                    case 43:
                        tips+="<li>"+Lang["Tips_324"]+"</li>";
                        break
                    case 44:
                        tips+="<li>"+Lang["Tips_325"]+"</li>";
                        break
                    case 20:
                        if(CanSetListFight()!="")
                            tips+="<li>"+CanSetListFight()+"</li>" 
                        else
                            tips+="<li>"+Lang["Tips_326"]+"</li>";
                        break;
                    case 22:
                        if(nodeObj.ListType==1)
                            tips+="<li>"+Lang["Tips_327"]+"</li>";
                        else     
                            tips+="<li>"+Lang["Tips_328"]+"</li>";
                        break;
                    case 23:
                        if(nodeObj.ItemList==null)
                            tips+="<li>"+Lang["Tips_329"]+"</li>";
                        else    
                            tips+="<li>"+Lang["Tips_330"]+"</li>";
                        break;
                    case 24:
                        if(nodeObj.ItemList!=null)
                            tips+="<li>"+Lang["Tips_331"]+"</li>";
                        else    
                            tips+="<li>"+Lang["Tips_332"]+"</li>";
                        break;
                   case 49:
                        if(nodeObj.ItemList!=null)
                            tips+="<li>"+Lang["Tips_331"]+"</li>";
                        else
                        tips+=Lang["Tips_333"];
                        break;                  
                }
            }                           
        }
        
        if(handleType==35)
        {
            if(nodeObj.State==2)
            {
                tips+="<li>"+Lang["Tips_334"]+"</li>";
                needGold=nodeObj.ResumeCostGold;
            }
            else if(nodeObj.State==7 || nodeObj.State==5 || nodeObj.State==13)
            {
                tips+="<li>"+Lang["Tips_315"]+"</li>";
            }
            else
            {
                tips+="<li>"+Lang["Tips_335"]+"</li>";
            }        
        }
        
        if(handleType==11 || handleType==12 || handleType==59)
        {
            if(CanAttack()!="")
                tips+="<li>"+CanAttack()+"</li>";
            else if(MeHasPeace==true && nodeObj.Type==5)
                tips+="<li>"+Lang["Tips_336"]+"</li>";
            else if(HasPeace==true)
                tips+="<li>"+Lang["Tips_337"]+"</li>";
            else if (UserInfo.State==3 && nodeObj.Type==5)
            {
                tips+="<li>"+Lang["Tips_338"]+"</li>";  
            }
            else if(nodeObj.Type==5 && nodeObj.State==3)
            {
                tips+="<li>"+Lang["Tips_339"]+"</li>"; 
            }
            else if(nodeObj.LevelDifferenceFlag==30131 && handleType==11)
            {
                tips+="<li>"+Lang["Tips_340"]+"</li>";
            }
            else if(nodeObj.LevelDifferenceFlag==30132 && handleType==11)
            {
                tips+="<li>"+Lang["Tips_341"]+"</li>";
            }  
            else
            {
                if(handleType==11)
                    tips+="<li>"+Lang["Tips_342"]+"</li>";    
                else if(handleType!=59)
                    tips+="<li>"+Lang["Tips_343"]+"</li>"; 
            }    
                
        } 
        
        if(handleType==33)
        {
            tips+="<li>"+Lang["Tips_344"]+"</li>";
        }
        
        if(handleType==38)
        {
            var men=CityInteriorInfo.Men;
            if(HasEventSerach()>=0)    
            {
                tips+="<li>"+Lang["Tips_345"]+"</li>";
                return tips;
            }  
            else if(men<15)
            {
                tips+="<li>"+Lang["Tips_346"]+"</li>";
            }      
            else
                tips+="<li>"+Lang["Tips_347"]+"</li>";       
        }
        if(handleType==39)
        {   
            if(CanAttack()!="")
                tips+="<li>"+CanAttack()+"</li>";
            else if(nodeObj.DefeceFlag==1)
            tips+="<li>"+Lang["Tips_348"]+"</li>";
            else if(level>0)
            tips+="<li>"+Lang["Tips_349"]+"</li>";
            else
            tips+="<li>"+Lang["Tips_350"]+"</li>"; 
        } 
        if(handleType==55)
        {
            var maxlevel = GetMaxLevel();
            if(CanAttack()!="")
                tips+="<li>"+CanAttack()+"</li>";
            else if(nodeObj.Type!=8)
                tips+="<li>"+Lang["Tips_419"]+""+nodeObj.StartTime+"-"+nodeObj.EndTime+"</li>";
            else if(maxlevel>nodeObj.SubLevel)
                tips+="<li>"+Lang["Tips_420"]+""+nodeObj.SubLevel+""+Lang["Tips_2"]+"</li>";
            else
                tips+="<li>"+Lang["Tips_421"]+"</li>"; 
        }
        if(handleType==57)//占领山寨
        {
            tips+="<li>"+Lang["Tips_423"]+"</li>";
            tips+="<li>"+Lang["Tips_424"]+"</li>";
            tips+="<li>"+Lang["Tips_425"]+"</li>";
            tips+="<li>"+Lang["Tips_426"]+"</li>";
            tips+="<li>"+Lang["Tips_427"]+"</li>";
            tips+="<li class=\"font_green\">"+Lang["Tips_428"]+"</li>";
        }
        if(handleType==58)//放弃占领
        {
            tips+="<li>"+Lang["Tips_433"]+"</li>";
        }
        if(handleType== -57)//占领山寨图标
        {
            tips+="<li>"+Lang["Tips_429"]+"</li>";
            tips+="<li>"+Lang["Tips_424"]+"</li>";
            tips+="<li>"+Lang["Tips_425"]+"</li>";
            tips+="<li>"+Lang["Tips_426"]+"</li>";
            tips+="<li>"+Lang["Tips_430"]+nodeObj.AppendantNPCSingle.EndTime+"</li>";
        }
        if(handleType==59 && UserInfo.State!=3 && nodeObj.State!=3)//征服
        {
            if(CanAttack()=="" && MeHasPeace!=true && HasPeace!=true)
                tips+="<li>"+Lang["Tips_434"]+"</li>";
        }
        if(handleType==-59)//占领状态图标
        { 
            tips+="<li>"+nodeObj.OccupationInfo.LordUser+Lang["Tree_138"]+"</li>";
        }
        if(handleType==60)//赎身
        { 
            tips+="<li>"+Lang["Tips_438"]+"</li>";
        }
        if(handleType==-60)//修改占领信息
        { 
            tips+="<li>"+Lang["Tips_435"]+"</li>";
        }
        if(handleType==48)
        {
//            if(CanAttack()!="")
//                tips+="<li>"+CanAttack()+"</li>";
//           else
//                tips+="<li>攻击山寨胜利，会出现秘道，战胜秘道守卫可以有机会获得物品奖励。</li>";
            if(nodeObj.Type==7)
            {
                if(CanAttack()!="")
                    tips+="<li>"+CanAttack()+"</li>";
                else
                    tips+="<li>"+Lang["Tips_351"]+"</li>";          
            }
            if(nodeObj.Type==4 || nodeObj.Type==6)
                tips+="<li>"+Lang["Tips_351"]+"</li>";
              
        }
        if(handleType==45) 
        {
            if(CanAutoExp()!="")
                tips+="<li>"+CanAutoExp()+"</li>";
            else
                tips+="<li>"+Lang["Tips_352"]+"</li>";
        } 
        if(handleType==46)   
        {
            tips+="<li>"+Lang["Tips_353"]+"</li>";
        }
        switch(handleType)
        {
            case 14:
                tips+=Lang["Tips_354"];
                break;
            case 25:
                if(nodeObj.State==2)
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                else if(nodeObj.State==3)
                    tips+="<li>"+Lang["Tips_356"]+"</li>";
                else if(nodeObj.State==4) 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                else if(nodeObj.State==5) 
                    tips+="<li>"+Lang["Tips_358"]+"</li>";
                else if(nodeObj.Durability<=0)
                    tips+="<li>"+Lang["Tips_359"]+"</li>";       
                else           
                    tips+="<li>"+Lang["Tips_360"]+"</li>";
                break;
            case 26:
                if(nodeObj.State==2)
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                else if(nodeObj.State==3)
                    tips+="<li>"+Lang["Tips_356"]+"</li>";
                else if(nodeObj.State==4) 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                else if(nodeObj.State==5) 
                    tips+="<li>"+Lang["Tips_358"]+"</li>";
                else if(nodeObj.NeedUserLevel>0 && nodeObj.NeedUserLevel>CityInteriorInfo.Level)
                    tips+="<li>"+Lang["Tips_287"]+""+UserLevel[nodeObj.NeedUserLevel-1]+"</li>";        
                else           
                    tips+="<li>"+Lang["Tips_361"]+"</li>";
                break;
            case 27:
                if(nodeObj.State==2)
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                else if(nodeObj.State==3)
                    tips+="<li>"+Lang["Tips_356"]+"</li>";
                else if(nodeObj.State==4) 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                else if(nodeObj.State==5) 
                    tips+="<li>"+Lang["Tips_358"]+"</li>";
                else if(nodeObj.Durability<=0)
                    tips+="<li>"+Lang["Tips_362"]+"</li>";
                else if(nodeObj.SellFlag==1)
                    tips+="<li>"+Lang["Tips_363"]+"</li>";        
                else           
                    tips+="<li>"+Lang["Tips_364"]+"</li>";
                break;
            case 28:
                if(nodeObj.State==2)
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                else if(nodeObj.State==3)
                    tips+="<li>"+Lang["Tips_356"]+"</li>";
                else if(nodeObj.State==4) 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                else if(nodeObj.State==5) 
                    tips+="<li>"+Lang["Tips_358"]+"</li>";     
                else           
                    tips+="<li>"+Lang["Tips_365"]+"</li>";
                break;
            case 29:
                if(nodeObj.State==4)
                tips+="<li>"+Lang["Tips_366"]+"</li>";
                else
                tips+="<li>"+Lang["Tips_367"]+"</li>";
                break;
            case 30:
                if(nodeObj.State==3)
                tips+="<li>"+Lang["Tips_368"]+"</li>";
                else if(nodeObj.State==5)
                tips+="<li>"+Lang["Tips_369"]+"</li>";
                else
                tips+="<li>"+Lang["Tips_370"]+"</li>";
                break;
            case 31:
                tips+="<li>"+Lang["Tips_371"]+"</li>";
                break;
            case 32:
                tips+="<li>"+Lang["Tips_372"]+"</li>";    
                break;
            case 36:
                if(nodeObj.State==5) 
                {
                    tips+="<li>"+Lang["Tips_358"]+"</li>";
                    return tips;
                }
                if(nodeObj.State==2)
                {
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                    return tips;
                }
                else if(nodeObj.State==4)
                { 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                    return tips;
                }
                else if(nodeObj.HitPoint==nodeObj.Durability)
                {
                    tips+="<li>"+Lang["Tips_373"]+"</li>";
                    return tips;
                }
                else
                {
                    tips+="<li>"+Lang["Tips_374"]+"</li>";
                }
                break;
            case 37:
                if(nodeObj.State==5) 
                {
                    tips+="<li>"+Lang["Tips_358"]+"</li>";
                    return tips;
                }
                if(nodeObj.State==2)
                {
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                    return tips;
                }
                else if(nodeObj.State==4)
                { 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                    return tips;
                }
                else if(nodeObj.HitPoint==nodeObj.Durability)
                {
                    tips+="<li>"+Lang["Tips_373"]+"</li>";
                    return tips;
                }
                else
                    tips+="<li>"+Lang["Tips_375"]+"</li>";
                break; 
                case 47:
                if(nodeObj.State==2)
                    tips+="<li>"+Lang["Tips_355"]+"</li>";
                else if(nodeObj.State==3)
                    tips+="<li>"+Lang["Tips_356"]+"</li>";
                else if(nodeObj.State==4) 
                    tips+="<li>"+Lang["Tips_357"]+"</li>";
                else if(nodeObj.State==5) 
                    tips+="<li>"+Lang["Tips_358"]+"</li>";     
                else           
                    tips+="<li>"+Lang["Tips_376"]+"</li>";
                break;
                case 52:
                if(nodeObj.State==6 || nodeObj.State==6)
                    tips+="<li>物品已被携带</li>";
                else
                    tips+="<li>携带道具到出战队列</li>";
                break;
                case 53:
                if(nodeObj.State==6 || nodeObj.State==6)
                    tips+="<li>物品已被携带</li>";
                else
                    tips+="<li>携带道具到出战队列</li>";
                break;
                case 54:
                if(nodeObj.State!=6 && nodeObj.State!=7)
                    tips+="<li>物品未被携带</li>";
                else
                    tips+="<li>取消携带物品</li>";
                break; 
            default:
                break;     
        }
        
        //需求内容
        /*
        if((handleType>=1 && handleType<=5) || handleType==6 || handleType==9 || handleType==15 || handleType==16 || handleType==25 || handleType==26 || handleType==32)
            tips+="<li><b>需求</b></li>";  
            */
        var tips1="";
         if(effValue>0)
         tips+="<li>"+level+""+Lang["Tips_2"]+" "+effPrefix+effValue+effPostfix+"</li>";     
        //需求建筑
        if((handleType==1 || handleType==2 || handleType==3 || handleType==4 || handleType==61 || handleType==62) && nodeObj.UpNeedBuildingLevel>0) 
        {
            //if(PageNum!=2 && handleType!=3)//*******排除城防升级
            if(PageNum==2 && handleType==3)
            tips2+="";
            else
            tips2+=HtmlTipsTree("tips_tree_condition_6","tips_tree_condition_6_"+conditionState[6],nodeObj.UpNeedBuildingName+" "+nodeObj.UpNeedBuildingLevel);
        }
        //需求科技
        if((handleType==1 || handleType==2 || handleType==3 || handleType==4 || handleType==61 || handleType==62) && nodeObj.UpNeedTechnicLevel>0) 
            tips1+=HtmlTipsTree("tips_tree_condition_7","tips_tree_condition_7_"+conditionState[7],nodeObj.UpNeedTechnicName+" "+nodeObj.UpNeedTechnicLevel);
        
        //需求面积
        if((handleType==1 || handleType==2 || handleType==3 || handleType==4 || handleType==61 || handleType==62 ) && nodeObj.UpNeedArea>0)     
        {    
            if(PageNum==2)
                var s = Lang["Tips_11"];
            else 
                var s = Lang["Tips_377"];
            //if(PageNum!=2 && handleType!=3)//********排除城防升级
            if(PageNum==2 && handleType==3)
            tips+="";
            else
            tips1+=HtmlTipsTree("tips_tree_condition_2","tips_tree_condition_2_"+conditionState[2],s+" "+nodeObj.UpNeedArea);
         }   
            
        //需求钱
        if(needMoney>0)
        tips1+=HtmlTipsTree("tips_tree_condition_3","tips_tree_condition_3_"+conditionState[3],needMoney);
        
        //需求食物
        if(needFood>0)
        tips1+=HtmlTipsTree("tips_tree_condition_4","tips_tree_condition_4_"+conditionState[4],needFood);
        
        //需求人力
        if(needMen>0)
        tips1+=HtmlTipsTree("tips_tree_condition_5","tips_tree_condition_5_"+conditionState[5],needMen);
   
        //需求元宝
        if(needGold>0)
            tips1+=HtmlTipsTree("tips_tree_condition_1","tips_tree_condition_1_"+conditionState[1],needGold);

        //需求时间   
        if(needTime>0)
            tips1+=HtmlTipsTree("tips_tree_time","tips_tree_time",IntToTime(needTime));
        
        //需求等级
        if(needLevel>0)
            tips1+=HtmlTipsTree("tips_tree_condition_2","tips_tree_condition_2_1",""+Lang["Tips_378"]+" "+needLevel);
            
        //需求性别
        if(needSex>0)
            tips1+=HtmlTipsTree("tips_tree_condition_2","tips_tree_condition_2_1",""+Lang["Tips_370"]+" "+Sex[needSex-1]);
        
        //需求门派
        if(needUnion>0)
            tips1+=HtmlTipsTree("tips_tree_condition_2","tips_tree_condition_2_1",""+Lang["Tips_380"]+""+UnionName[needUnion]);
        
        //需求战勋
        if(needInsignia>0)
        {
            tips1+=HtmlTipsTree("tips_tree_condition_8","tips_tree_condition_8_1",needInsignia);
        }
        
        if(tips1!="")
        {
            if(tips!="")
            tips+="<li><b>"+Lang["Tips_266"]+"</b></li>"+tips2+tips1;  
            else
            tips+="<li><b>"+Lang["Tips_266"]+"</b></li>"+tips1;  
        }
        
        //结束语
        if(conditionState[8]==0 && ((handleType>=1 && handleType<=5) || handleType==61 || handleType==62))
            tips+="<li class=\"font_red\">"+Lang["Tips_381"]+"</li>";
            
        if(conditionState[9]==0)
            tips+="<li class=\"font_gray\">"+Lang["Tips_382"]+"</li>";
        
      
    if(handleType==14)
    {
        tips+=""+Lang["Tips_383"]+""
    }
    
   return tips;     
}

//创建持续VIP效果tips
function CreateEffectTips(index,type)
{
    var tips="";
    var effect;
    effect=PersistEffectGroupInfo[index];
    tips+="<ul>";
    if(type==1)
    {
        tips+="<li>"+Lang["Tips_384"]+"</li>";
        tips+="<li>"+Lang["Tips_254"]+"</li>";
        tips+="<li>"+Lang["Tips_255"]+"</li>";
        tips+="<li><span class=\"font_green\">"+Lang["Tips_422"]+"</span></li>";
        tips+="<li>"+Lang["Tips_259"]+"</li>";
        tips+="<li>"+Lang["Tips_256"]+"</li>";
        tips+="<li>"+Lang["Tips_257"]+"</li>";
        tips+="<li>"+Lang["Tips_258"]+"</li>";
        tips+="<li><span class=\"font_green\">"+Lang["Tips_432"]+"</span></li>";
        tips+="<li>"+Lang["Tips_260"]+"</li>";
        tips+="<li>"+Lang["Tips_185"]+""+effect.EndTime+"</li>";
    }
    else
    {
        tips+="<li>"+EffectTipsOne[type-2]+"</li>";
        tips+="<li>"+EffectTipsTwo[type-2]+"</li>";
        tips+="<li>"+EffectTipsThree[type-2]+effect.EndTime+"</li>";
    }
    tips+="<ul>";
    return tips;
}

//商城道具tips
function CreateMallItemTips(index,type)
{
    var tips="";
    var item;
    tips+="<ul>";
    if(type==1)
    {
        item = MallItemInfo[index].ItemSingle;
        tips+=CreateTaskItemTips(index,item);
    }
    else
    {
        item = MallItemInfo[index];
        tips+="<li><b>"+item.TypeName+"</b></li>";
        if(item.MainEffectType==1)
        {
            if(item.EffectType==1)
                tips+="<li>"+Lang["Tips_252"]+"</li>";
            else
                tips+="<li>"+Lang["Tips_253"]+"</li>";
            tips+="<li>"+Lang["Tips_254"]+"</li>";
            tips+="<li>"+Lang["Tips_255"]+"</li>";
            tips+="<li><span class=\"font_green\">"+Lang["Tips_422"]+"</span></li>";
            tips+="<li>"+Lang["Tips_256"]+"</li>";
            tips+="<li>"+Lang["Tips_257"]+"</li>";
            tips+="<li>"+Lang["Tips_258"]+"</li>";
            tips+="<li>"+Lang["Tips_259"]+"</li>";
            tips+="<li><span class=\"font_green\">"+Lang["Tips_432"]+"</span></li>";
            tips+="<li>"+Lang["Tips_260"]+"</li>";
        }
        else
        tips+="<li><p style=\"color:#b5a05f\">"+item.Tips+"</p></li>";
    }
    tips+="</ul>";
    return tips;
}

//显示英雄卡片
function CreateHeroTips(nodeType,index)
{
    var tips="";
    if(HeroInfo!=null && HeroInfo[index]!=null)
    {
        hero=HeroInfo[index];
        
        tips+="<ul>";
        tips+="<li>"+UnionName[hero.Junta]+" "+Sex[hero.Sex-1]+"</li>";
        tips+="</ul>";
        tips+="<div class=\"line\"></div>";
        tips+="<ul>";
        tips+="<li>"+Lang["Tips_385"]+""+hero.Attack+" "+Lang["Tips_386"]+""+hero.Defence+"</li>";
        tips+="<li>"+Lang["Tips_387"]+""+hero.Dodge+" "+Lang["Tips_388"]+""+hero.CrushBlow+"</li>";
        tips+="<li>"+Lang["Tips_389"]+""+RangeEff[hero.MoveRange-1]+" "+Lang["Tips_390"]+""+RangeEff[hero.AttackRange-1]+"</li>";
        tips+="<li>"+Lang["Tips_391"]+""+hero.SkillList[0].Name+"</li>";
        tips+="<li>"+Lang["Tips_392"]+""+hero.PrenticeNum+"/"+hero.MaxPrenticeNum+"</li>";
        tips+="</ul>";
    }
    return tips;  
}

//显示物品属性
function CreateHeroItemTips(type)
{
    var tips="";
   
    if(TheHeroItem[type]!=null)
    {
        var item=TheHeroItem[type];
        tips+="<ul>";
        tips+="<li class=\"hquality_"+item.Quality+"\">"+item.Name+" "+item.UseLevel+""+Lang["Tips_2"]+"</li>";
        if(type==2)
        {    
            tips+="<li>"+Lang["Tips_275"]+""+item.Attack+"</li>";
            tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";
        }
        else if(type==3)
        {   
            tips+="<li>"+Lang["Tips_395"]+""+item.Defence+"</li>";
            tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";
        }    
        else
        {    
            tips+="<li>"+Lang["Tips_396"]+""+item.LR+"</li>";
            tips+="<li>"+Lang["Tips_397"]+""+item.FR+"</li>";
            tips+="<li>"+Lang["Tips_398"]+""+item.CR+"</li>";
            tips+="<li>"+Lang["Tips_399"]+""+item.DR+"</li>";
            tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";  
        }
        tips+="</ul>";
        
    }
    return tips;

}

//任务道具tips
function CreateTaskItemTips(index,item)
{
    var tips="";
        
    tips+="<ul class=\"itemtips\">";
    tips+="<li class=\"iquality_"+item.Quality+"\">"+item.Name+"</li>";
    if(item.ItemType==2)
    {    
         tips+="<li>"+Lang["Tips_400"]+""+item.UseLevel+"</li>";
         tips+="<li>"+Lang["Tips_401"]+""+UnionName[item.UseUnion]+"</li>";
         tips+="<li class=\"iquality_"+item.Quality+"\">"+Lang["Tips_275"]+""+item.Attack+"</li>";
         tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";
    }
    else if(item.ItemType==3)
    {   
         tips+="<li>"+Lang["Tips_400"]+""+item.UseLevel+"</li>";
         tips+="<li>"+Lang["Tips_401"]+""+UnionName[item.UseUnion]+"</li>";
         if(item.UseSex==0)
         tips+="<li>"+Lang["Tips_402"]+"</li>";
         else
         tips+="<li>"+Lang["Tips_403"]+""+Sex[item.UseSex-1]+"</li>";
         tips+="<li class=\"iquality_"+item.Quality+"\" >"+Lang["Tips_395"]+""+item.Defence+"</li>";
         tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";
    }
    else if(item.ItemType==4)
   {    
         tips+="<li>"+Lang["Tips_400"]+""+item.UseLevel+"</li>";   
         tips+="<li>"+Lang["Tips_396"]+""+item.LR+"</li>";
         tips+="<li>"+Lang["Tips_397"]+""+item.FR+"</li>";
         tips+="<li>"+Lang["Tips_398"]+""+item.CR+"</li>";
         tips+="<li>"+Lang["Tips_399"]+""+item.DR+"</li>";
         tips+="<li>"+Lang["Tips_394"]+""+item.Durability+"/"+item.HitPoint+"</li>";  
    }
 
    tips+="<li>"+item.Des+"</li>";   

    tips+="</ul>";
    
    tips+="</ul>";
        
    return tips;
}


function HtmlTipsTree(id,css,text)
{
    var tips="";
    
    tips+="<li id=\""+id+"\" class=\""+css+"\">"+text+"</li>";
    
    return tips;
}


//隐藏tooltips
function HideTips()
{
     $("#tips").hide();
     $("#tips_short").hide();
}

//是否可以攻击
function CanAttack()
{
    var result="";
    if(HeroInfo==null)
        return Lang["Tips_404"];//尚未雇佣侠客<br>请在门派建筑寻访和雇佣侠客
    var i=0;
    var num=0;
    while(HeroInfo!=null && HeroInfo[i]!=null)
    {
        if(HeroInfo[i].ListType==2)
            num++;
        if(HeroInfo[i].ListType==2 && HeroInfo[i].State==2)
            return Lang["Tips_405"];//出战队伍中有重伤侠客
        if(HeroInfo[i].ListType==2 && HeroInfo[i].State==7 || HeroInfo[i].State==5)
            return Lang["Tips_406"];//已有出战队列在外<br/>每个村镇只能派遣一支出战队列
        i++;        
    }
    if(num==0)
        return Lang["Tips_407"];//出战队列中没有侠客<br>请在侠客页面中组建出战队列
            
    return result;          
}


//是否可以招募弟子
function CanConscription()
{
    var result="";   
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.ConscriptionCostMoney;
    var needFood=TheHeroInfo.ConscriptionCostFood;
    var needMen=TheHeroInfo.ConscriptionCostMen;    
    if(TheHeroInfo.MaxPrenticeNum==TheHeroInfo.PrenticeNum)
        return Lang["Tips_408"];
    if(money-needMoney<0 || food-needFood<0 || men-needMen<0)
        return Lang["Tips_409"];        
    return result;          
}

//是否可以快速招募弟子
function CanFastConscription()
{
    var result = "";
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.FastConscriptionCostMoney;
    var needFood=TheHeroInfo.FastConscriptionCostFood;
    var needMen=TheHeroInfo.FastConscriptionCostMen; 
    if(TheHeroInfo.MaxPrenticeNum==TheHeroInfo.PrenticeNum) 
    return Lang["Tips_408"];
    if(money-needMoney<0 || food-needFood<0 || men-needMen<0)
        return Lang["Tips_409"];
    return result;
}

//是否可以使用闭关修炼
function CanAutoExp()
{
    var result = "";
    var money=CityInteriorInfo.Money;
    var food=CityInteriorInfo.Food;
    var men=CityInteriorInfo.Men;
    var needMoney=TheHeroInfo.AutoExpResMoney;
    var needFood=TheHeroInfo.AutoExpResFood;
    var needMen=TheHeroInfo.AutoExpResMen; 
    if(TheHeroInfo.AutoExpNum>0) 
    return Lang["Tips_410"];
    if(TheHeroInfo.ListType!=1)
    return Lang["Tips_411"];
    if(money-needMoney<0 || food-needFood<0 || men-needMen<0)
        return Lang["Tips_412"];
    return result;
}

//是否可以寻访侠客
function CanFindHero(junta)
{
    var result=0;
    if(EventInfo!=null)
    {
        var i=0;
        while(EventInfo[i]!=null)
        {
            if(EventInfo[i].ActionType==8 && EventInfo[i].EventPos==junta)
            {   
                result=-1;
                break;
            }
            i++;
        }
    }   
    return result;       
}

//是否可以设为出战
function CanSetListFight()
{
    var result="";
    
    if(TheHeroInfo!=null && TheHeroInfo.ListType==2)
    {
        result=Lang["Tips_413"];
    }
    else if(TheHeroInfo!=null && TheHeroInfo.State==2)
    {
        result=Lang["Tips_414"];
    }
    else if(TheHeroInfo!=null && TheHeroInfo.PrenticeNum<=0)
    {
        result=Lang["Tips_415"];
    }    
    else
    {
        var num=0;
        var i=0;
        while(HeroInfo!=null && HeroInfo[i]!=null)
        {
            if(HeroInfo[i].ListType==2)
                num++;
            if(num>=5)
            {
                result=Lang["Tips_416"];
                break;
            }
            if(HeroInfo[i].State==5 || HeroInfo[i].State==7)
            {
                result=Lang["Tips_417"];
                break;
            }
            i++;
        }
    }    
    return result;       
}

//是否可以建设门派建筑
function CanBuildJunta()
{
    var num=0;
    var result=true; 
    var i=11;
    while(i<21)
    {
        if(CityInteriorInfo.InteriorBuildingLevel[i]>0)
            num++;
        i++;
    }
    var i=0
    while(EventInfo!=null && EventInfo[i]!=null)
    {
        if(EventInfo[i].ObjType==1 && EventInfo[i].ObjID>=12 && (EventInfo[i].ActionType==1 || EventInfo[i].ActionType==2))
            num++;
        i++;
    }
    if(num>=JuntaNum)
        result=false;         
    return result;    
} 