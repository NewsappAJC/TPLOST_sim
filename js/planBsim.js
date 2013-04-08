//  Created by Merwin, Emily (CNI - AJC) on 2013-04-02.
//  Last updated 2013-04-08
//  Copyright (c) 2013 __Emily Merwin/AJC__. All rights reserved.
var importanceArr = [];//importance = cost
var projectInfo=new Array;
var seriesKey = new Array;//keep track of which projects are activated so we can match the dom projects to their pie color for our interactive legend
var fundedTotal = 0;
var activeTotal = 0;
//these are for the results text
var roadsStart = 0;
var transitStart = 0;
var repairStart = 0;
var roadEnd = 0;
var transitEnd = 0;
var repairEnd = 0;

$(document).ready(function(){
	$.ajax({
		type: "GET",
		url: "planB.xml",
		dataType: "xml",
		success: function(xml) {
			fundedTotal = $(xml).find('docbase').attr('fundedTotal');
			activeTotal = fundedTotal;
			$(xml).find('Project').each(function(index){
				var PID = $(this).attr('Pid');
				var descript = $(this).attr('descript');
				var cost = parseInt($(this).attr('Cost'));
				importanceArr.push(cost);
				var funded = $(this).attr('Funded');
				var catType = $(this).attr('type');
				var projType = $(this).attr('ProjType');
				var projLoc = $(this).attr('Location');
				var finished = $(this).attr("finishDate");
				var tempArr=[PID, descript, cost, funded, catType, projType, projLoc, finished];
				projectInfo.push(tempArr);
			});
		addProjects();
		drawChart();
		getPriorities("statusquo");
		}
	});
		
});
function addProjects(){
	for(var i=0; i<projectInfo.length; i++){
		if(projectInfo[i][3] === "true"){
			projectInfo[i].push("on");
			setContent(i, "col1");
		}
		else{
			projectInfo[i].push("off");
			setContent(i, "col2");
			
		}
	}

	$(".on").button({label:"Unfund"});		
	$(".off").button({label: "Fund"});
	document.getElementById("budget").innerHTML = "<span><span class='budgeLabels'><span class='budgetLabel'>Budget:</span><br/><span class='budgetLabel'>Remaining:</span></span><span class='budgeNums'> <span class='budgetNums'>$"+addCommas(fundedTotal)+"</span><br/><span id='activeTot' class='budgetNums'>$"+addCommas(fundedTotal-activeTotal)+"</span></span></span>";
	$( "#dialog" ).dialog({
		autoOpen: false,
		resizable: true,
		width: "60%",
		modal: true,
		buttons: {
			"Play Again?": function() {
				reloadPage();
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		},
		position: { my: "top", at: "top", of: window }
	});
	$( "#oops" ).dialog({
		autoOpen: false,
		resizable: false,
		modal: true,
		buttons: {
			Ok: function() {
				$( this ).dialog( "close" );
			}
		},
		position: { my: "center", at: "center", of: window }
	});
	$("#submitbutton").button();
	$( "#submitbutton" ).click(function() {		
		$( "#dialog" ).dialog( "open" );
		storeResults();
	});

	$(document).tooltip({
		items: ".moreInfo", 
		content: function(){ 
			var id = $(this).attr("id"); 
			var tip= "<strong>Scheduled to be completed:</strong> "+projectInfo[id][7]+"<br/> <strong>Location: </strong>"+projectInfo[id][6]
			return tip;
		}
	});
}
function resetActive(){
	document.getElementById("activeTot").innerHTML = "$"+addCommas((fundedTotal-activeTotal));	
}
function setContent(i, column){
	var innerHTML = '<div class="item clearfix"><span class="moreInfo" id="'+i+'"></span><span class="label">'+projectInfo[i][1]+'</span><span class="details"><span class="legend" id="color'+i+'"> </span><span class="number" id="n'+i+'">$'+addCommas(projectInfo[i][2])+'</span><span class="arrows"><button name="project'+i+'" value="'+i+'" id="t'+i+'" onclick="toggleProject('+i+')" ';
	if(projectInfo[i][3] === "true"){
		innerHTML+= "class='on'/>"
	}
	else{
		innerHTML += "class='off'/>";
	}
	innerHTML += "</span></span></div>";
	
	document.getElementById(column).innerHTML += innerHTML;
	
}
function drawChart(){
	var data = [];
	var onIndex = 0;
	if(activeTotal < fundedTotal){
		data.push({label: "Left over", data: (fundedTotal-activeTotal)/fundedTotal, color:"#FFFFFF"})
	}
	for(var i=0; i<projectInfo.length; i++){
		if(projectInfo[i][8]==="on"){
			data.push({label: projectInfo[i][1], data: (importanceArr[i])/fundedTotal, color:i});
			seriesKey[onIndex] = i;
			onIndex++;
		}
	}
    	var plot = $.plot($("#default"), data, 
		{
			series: {
            	pie: { 
                	show: true,
					label:{
						show:false
					},
					//offset:{left:5}
            	}
        	},
			grid: {
			        hoverable: true,
			        clickable: true
			    },
		 	legend: {
            	show: false
        	}
		});		
		$("#default").bind("plothover", function (event, pos, item) {
			if (item) {						
					$("#tooltip").remove();
					showTooltip(pos.x, pos.y, item.series.label); 
			}
			else {
				$("#tooltip").remove();
			}			
		});
	setMenuColors(plot);
}
function setMenuColors(plot){
	var myseries = plot.getData();
	var seriesIndex = 0;
	for(var i=0; i<projectInfo.length; i++){
		$("#color"+i).css("background-color", "#FFFFFF");
		if(projectInfo[i][8]==="on"){
			if(activeTotal < fundedTotal){
				$("#color"+seriesKey[seriesIndex]).css("background-color", myseries[seriesIndex+1].color);
			}
			else{
				$("#color"+seriesKey[seriesIndex]).css("background-color", myseries[seriesIndex].color);
			}
			seriesIndex++;
		}				
	}			
}
function showTooltip(x, y, contents) {
	$('<div id="tooltip" class="ui-tooltip ui-widget ui-corner-all ui-widget-content">' + contents + '</div>').css( {
		display: 'none',
		top: "3%",
		left: "60%",
		position: 'absolute',
		opacity: 0.80
	}).appendTo("#grapharea").fadeIn(200);
}
function toggleProject(num){
	if(projectInfo[num][8]==="on"){
		$("#t"+num).switchClass( "on", "off", 1000 );
		$("#t"+num).button( "option", "label", "Fund" );
		projectInfo[num][8] = "off";
		activeTotal = (activeTotal - importanceArr[num]);	
	}
	else if((activeTotal+importanceArr[num])>fundedTotal){
		$( "#oops" ).dialog( "open" );
	}
	else{
		$("#t"+num).switchClass( "off", "on", 1000 )
		$("#t"+num).button( "option", "label", "Unfund" );
		projectInfo[num][8] = "on";
		activeTotal = activeTotal + importanceArr[num];
	}
	resetActive();
	drawChart();
}
function getPriorities(startend){
	var roads = 0;
	var repair =0;
	var transit = 0;
	for(var i=0; i<projectInfo.length; i++){
		var tempVal = projectInfo[i];
		if(tempVal[8]==="on"){
			if(tempVal[4] === "Road"){
				roads = roads+1;
			}
			else if(tempVal[4] === "Transit"){
				transit = transit +1;
			}
			if(projectInfo[i][5] === "Repair"){
				repair = repair +1;
			}
		}
	}
	if(startend ==="statusquo"){
		roadStart = roads;
		transitStart = transit;
		repairStart = repair;
	}
	else{
		roadEnd = roads;
		transitEnd = transit;
		repairEnd = repair;
	}
}
function storeResults(){
	getPriorities("final");
	var roadExpand = "maintain";
	var transitExpand = "maintain";
	var repairExpand = "maintain";
	if(roadEnd > roadStart){
		roadExpand = "expand";		
	}
	else if(roadEnd < roadStart){
		roadExpand = "reduce"
	}
	if(transitEnd > transitStart){
		transitExpand = "expand";
	}
	else if(transitEnd < transitStart){
		transitExpand = "reduce";
	}
	if(repairEnd > repairStart){
		repairExpand = "expand";
	}
	else if(repairEnd < repairStart){
		repairExpand = "reduce";
	}
	document.getElementById("dialog").innerHTML = "<strong>You have chosen to "+transitExpand+" mass transit service.</strong><br/><p>You've grasped the hot potato of Atlanta transportation politics.  The Atlanta region's spread-out layout makes it more difficult and expensive to serve with mass transit.  But business leaders say transit is a must in order to stay competitive and give commuters an alternative to clogged highways.  Moreover, demographic shifts here point to growing populations desirous of transit that they can't access now.  But mass transit is difficult to build because Georgia’s deep pocket, the gas tax, can't be spent on it.</p><br/><strong>You have chosen to "+roadExpand+" road expansion funds.</strong><br/><p>Driving is decreasing slightly in popularity here.  But it still is far and away the commute of choice in the Atlanta region.  And road congestion delay is a significant drag on the economy, costing the Atlanta area $3 billion a year.  The average commuter wastes 51 hours a year sitting in Atlanta-area traffic, and expanding a road is the most immediate way to alleviate that.  (Until the traffic fills up again with new traffic, which it tends to do.)</p><br/><strong>You have chosen to "+repairExpand+" repair funds.</strong><br/><p>Repair and maintenance funds are key to traveler safety.  Experts say the region is stretched to keep its roads and transit safely maintained within its current budget.  The Atlanta region contains 26,900 miles of roads, with bridges every time they cross over a road, track, creek, river or gully.  The longer you wait to repave a road the harder and more expensive it gets. That said, Georgia has traditionally kept its roads better-paved than almost all other states.</p><p>As for transit, MARTA says it has a maintenance backlog of more than $1 billion.</p>"

}
	
function reloadPage(){
	window.location.reload();
}

function addCommas(x){
	if(x>0){
		x=Math.round(x)
		if(x){
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
		else{
			return 0;
		}
	}
	else{
		return x;
	}
}