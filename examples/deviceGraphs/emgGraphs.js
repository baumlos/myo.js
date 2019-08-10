//This tells Myo.js to create the web sockets needed to communnicate with Myo Connect


Myo.on('connected', function(){
	console.log('connected');
	this.streamEMG(true);

	setInterval(function(){
		updateGraph(rawData);
	}, 100)
})

Myo.connect('com.myojs.emgGraphs');



var rawData = [0,0,0,0,0,0,0,0];
Myo.on('emg', function(data){
	rawData = data;
})


var range = 150;
var resolution = 50;
var emgGraphs;

var graphData= [
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0),
	Array.apply(null, Array(resolution)).map(Number.prototype.valueOf,0)
]

$(document).ready(function(){

	emgGraphs = graphData.map(function(podData, podIndex){
		return $('#pod' + podIndex).plot(formatFlotData(podData), {
			colors: ['#8aceb5'],
			xaxis: {
				show: false,
				min : 0,
				max : resolution
			},
			yaxis : {
				min : -range,
				max : range,
			},
			grid : {
				borderColor : "#427F78",
				borderWidth : 1
			}
		}).data("plot");
	});


});

var formatFlotData = function(data){
		return [data.map(function(val, index){
				return [index, val]
			})]
}


var updateGraph = function(emgData){

	//+++++ myo poller addition +++++++++
	var emgDataClone = [...emgData];
	var emgDataCloneCeddi =  [...emgData];

	graphData.map(function(data, index){
		graphData[index] = graphData[index].slice(1);
		graphData[index].push(emgData[index]);

		emgGraphs[index].setData(formatFlotData(graphData[index]));
		emgGraphs[index].draw();


	})

	//++++++++++++++++++++++++++++++++++ hacky little myo poller ++++++++++++++++++++++++++++++++++++

	if(isRecording){
		//push new array to current8pack
		emgDataClone.forEach((item) => current8Pack.push(item));
	
		//push array to dataCollection if it's full
		if(current8Pack.length == 64){
			//console.log(current8Pack);
			current8Pack.push(currentRecordingID);
			dataCollection.push(current8Pack);
			current8Pack = [];
		}

		//Ceddi data part
		if(actionCounterCeddi < 40){
			emgDataCloneCeddi.push(currentRecordingID);
			emgDataCloneCeddi.push(actionNumberCeddi);
			dataCollectionCeddi.push(emgDataCloneCeddi);
			actionCounterCeddi++;			
		}
		else{
			recordEvent();
			//console.log(dataCollectionCeddi);
		}
	}

}
 
var isRecording = false;
var currentRecordingID;

var current8Pack = [];
var dataCollection = [];

//2nd data format for ceddis csv files
var current8PackCeddi = [];
var dataCollectionCeddi = [];
var actionCounterCeddi = 0;
var actionNumberCeddi = -1;

function recordEvent(gestureID) {

	if(isRecording){
		console.log("stopped recording: "+ currentRecordingID);
		isRecording = false;
		currentRecordingID = undefined;
		current8Pack = [];

		console.log("action number: " + actionNumberCeddi + " action counter: " + actionCounterCeddi);
		actionCounterCeddi = 0;
		
		console.log(dataCollection);
	
	}else{
		currentRecordingID = gestureID;
		actionNumberCeddi++;
		console.log("start recording: "+currentRecordingID);
		isRecording = true;
	}
}

function convertArrayOfObjectsToCSV(args) {
	var result, ctr, keys, columnDelimiter, lineDelimiter, data;

	data = args.data || null;
	if (data == null || !data.length) {
		return null;
	}

	columnDelimiter = args.columnDelimiter || ';';
	lineDelimiter = args.lineDelimiter || '\n';

	keys = Object.keys(data[0]);

	result = '';
	result += args.prefix;
	result += lineDelimiter;

	data.forEach(function(item) {
		ctr = 0;
		keys.forEach(function(key) {
			if (ctr > 0) result += columnDelimiter;

			result += item[key];
			ctr++;
		});
		result += lineDelimiter;
	});

	return result;
}

function exportCSV(args) {
	var data, filename, link;
	var dataCeddi, filenameCeddi, linkCeddi;

	var csv = convertArrayOfObjectsToCSV({
		prefix: "value,gesture",
		data: dataCollection
	});
	var csvCeddi = convertArrayOfObjectsToCSV({
		columnDelimiter: ',',
		prefix: "Myo1,Myo2,Myo3,Myo4,Myo5,Myo6,Myo7,Myo8,GestureID,ActionNumber",
		data: dataCollectionCeddi
	});

	if (csv == null) return;

	filename = args.filename || 'export.csv';
	filenameCeddi = "ceddi-format-" + filename; 

	if (!csv.match(/^data:text\/csv/i)) {
		csv = 'data:text/csv;charset=utf-8,' + csv;
	}
	if (!csvCeddi.match(/^data:text\/csv/i)) {
		csvCeddi = 'data:text/csv;charset=utf-8,' + csvCeddi;
	}
	data = encodeURI(csv);
	dataCeddi = encodeURI(csvCeddi);

	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', filename);
	link.click();

	linkCeddi = document.createElement('a');
	linkCeddi.setAttribute('href', dataCeddi);
	linkCeddi.setAttribute('download', filenameCeddi);
	linkCeddi.click();
}