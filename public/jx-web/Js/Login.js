
var waitTime;
$(document).ready(function(){     
   var s=$("#WaitConutdown").text();
   waitTime=parseInt(s,10);
   ChangeTime();  
});

function ChangeTime()
{
    var sTime="";
    waitTime--;
    if(waitTime<=0)
        sTime="Loading...";
    else
        sTime=IntToTime(waitTime);
    
    if(waitTime<=-1)
        window.location.reload();           
    $("#WaitConutdown").text(sTime);
    serverTimer=setTimeout("ChangeTime()",1000);
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