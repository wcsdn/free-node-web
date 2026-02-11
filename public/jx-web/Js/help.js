function HtreeControl(result)
{
	$("#sidebar_help").find("ul").each(function()
	{
	$(this).hide();
	})
	var t =result.split("_");
	t[0]="#"+t[0]+"_ul";
	if($(t[0]).css("display")=="none")
	$(t[0]).show();
}