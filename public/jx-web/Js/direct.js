var direct_content = {
	"c1": Lang["direct_1"],
	"c2": Lang["direct_2"],
	"c3": Lang["direct_3"],
	"c4": Lang["direct_4"],
	"c5": Lang["direct_5"],
	"c6": Lang["direct_6"],
	"c7": Lang["direct_7"],
	"c8": Lang["direct_8"],
	"c9": Lang["direct_9"],
	"c10": Lang["direct_10"],
	"c11": Lang["direct_11"],
	"c12": Lang["direct_12"],
	"c13": Lang["direct_13"],
	//"c9": '<p>有战斗发生的时候，你可以打开<span class="direct_font_2">战场页面</span>，操控自己的侠客移动、攻击、撤退。如果你是防守方，你要尽量不让敌方侠客进入<span class="direct_font_3">资源区域</span>内，如果你是进攻方，你需要努力使自己的侠客占领对方的资源区域直至战斗结束，系统将会按照你占领的<span class="direct_font_3">资源区域</span>所占百分比分配给你掠夺的资源。</p>',
	"c14": Lang["direct_14"],
	"c15": Lang["direct_15"],
	"c16": Lang["direct_16"],
	"c17": Lang["direct_17"]
};
var step = 1;
function nextstep(){
	if (step>17)
	{
		window.location.reload();
		return;
	}
	var func = "step"+step+"()";
	eval(func);
	step++;
}
function step1(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
}
function step2(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
}
function step3(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_link_2").style.display = "none";
}
function step4(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("direct_gif_1").style.display = "none";
}
function step5(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_link_2").style.display = "none";
	document.getElementById("direct_gif").style.left = 220+"px";
}
function step6(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("main_navtop").src = "img/h/t/4d.gif";
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/7.gif";
}
function step7(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_gif").style.left = 295+"px";
	document.getElementById("direct_link_2").style.display = "none";
	//document.getElementById("main_contentbot").src = ImgUrl+"h/t/9.gif";
}
function step8(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("main_navtop").src = "img/h/t/4e.gif";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/8.gif";
}
/*
function step9(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif").style.left = 688+"px";
	document.getElementById("main_navtop").src = "img/h/t/4h.gif";
	document.getElementById("direct_gif_1").src = "img/h/t/3.gif";
}
*/
function step9(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif").style.left = 365+"px";
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_link_2").style.display = "none";
}
function step10(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("main_navtop").src = "img/h/t/4f.gif";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/9.gif";
	document.getElementById("direct_link_2").style.display = "block";
}
function step11(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_link_2").style.display = "none";
	document.getElementById("direct_gif").style.left = 440+"px";
	document.getElementById("direct_gif_1").style.display = "block";
}
function step12(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/10.gif";
	document.getElementById("main_navtop").src = "img/h/t/4g.gif";
}
function step13(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_link_2").style.display = "none";
	document.getElementById("direct_gif").style.left = 688+"px";
	document.getElementById("direct_gif_1").src = "img/h/t/3.gif";
}
function step14(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("main_navtop").src = "img/h/t/4h.gif";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/11.gif";
}
function step15(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "block";
	document.getElementById("direct_link_2").style.display = "none";
	document.getElementById("direct_gif").style.left = 748+"px";
}
function step16(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_gif_1").style.display = "none";
	document.getElementById("direct_link_2").style.display = "block";
	document.getElementById("main_contentbot").src = ImgUrl+"h/t/12.gif";	
}
function step17(){
	document.getElementById("case_content").innerHTML = eval("direct_content.c"+step);
	document.getElementById("direct_link_2").style.display = "none";
	document.getElementById("direct_link_1").innerHTML = "<li style='float:right;'><a class='linkstyle_6' onclick='Over()' href='#'>"+Lang["direct_18"]+"</a></li>";
}

function preloader(){
	var imageObj = new Image();
	var images = new Array("img/h/t/1.gif","img/h/t/2.gif","img/h/t/3.gif",ImgUrl+"h/t/4a.gif",ImgUrl+"h/t/4b.gif","img/h/t/4c.gif",
		"img/h/t/4d.gif","img/h/t/4e.gif","img/h/t/4f.gif","img/h/t/4g.gif","img/h/t/4h.gif",ImgUrl+"h/t/5.gif",ImgUrl+"h/t/6.gif",
		ImgUrl+"h/t/7.gif",ImgUrl+"h/t/8.gif",ImgUrl+"h/t/9.gif",ImgUrl+"h/t/10.gif",ImgUrl+"h/t/11.gif",ImgUrl+"h/t/12.gif")
	for (i=0;i<images.length ;i++ )
	{
		imageObj.src = images[i];
	}
}

function Over()
{
    window.location="Main.aspx";
}
