var convertToObject = require('./convert-to-object');

var tablength;


// options obj:
// 		{
// 			rowsToObject 	 		: string or function - when populated, converts the array data to an object
// 										- when a string is supplied, the object key for the row item is made the key for the whole row
// 										- when a function is supplied, the key for the row is made from the return data
// 											- the function takes two parameters: function(rowObject, tabMeta)
// 		}

module.exports = function(options, callback){

	if (typeof options == 'function' && !callback) { 
		callback = options;
		options = undefined;
	} 

	this.authAndDump(function(){
		
		var returnData 		= populateFileMeta(this);
			returnData.tabs = {};

		// exclude tabs if indicated
		if (options && options.exclude) {
			this.sheetData.worksheets = this.sheetData.worksheets.filter(function(item) {
				return (options.exclude.indexOf(item.title) != -1);
			});
		}

		getAllRowData(this.sheetData.worksheets, returnData, this.sheetData, function(data){

			this.cleanData = optionsHandler(options, returnData);
			callback(this.cleanData);

		}.bind(this));

	}.bind(this));

}

// private helper functions
function populateFileMeta(appObj){
	return {
		webUrl: 	'https://docs.google.com/spreadsheets/d/' + appObj.gsheetKey,
		idUrl: 		appObj.sheetData.url,
		id: 		appObj.sheetData.id,
		title: 		appObj.sheetData.title,
		author: 	appObj.sheetData.author,
		updated: 	appObj.sheetData.updated
	};
}

function getAllRowData(worksheets, returnData, fileMeta, callback){

	// cache the length of the worksheets (tabs) array
	tabLength = worksheets.length;
	tabCounter = 0; 

	tabStepper();


	// stepping finction to wait for getRows() return
	function tabStepper(){

		var item = worksheets[tabCounter];

		// populate the return object with tab information
		returnData.tabs[item.title] = {
			rows: [],
			meta: populateTabMeta(item, fileMeta)
		};

		// get all the rows for the google sheet
		item.getRows(function(err, rows){
			
			if (err) console.log(err);

			rows.map(function(rowObj, i){

				returnData.tabs[item.title].rows.push(cleanRowData(rowObj));

			});
			
			tabCounter++;

			// // execute callback after the last item
			if (tabCounter == tabLength) callback(returnData);
			else tabStepper();
		});
	}
}

function populateTabMeta(tabObj){
	return {
		url: 		tabObj.url,
		id: 		tabObj.id,
		title: 		tabObj.title,
		rowCount: 	tabObj.rowCount,
		colCount: 	tabObj.colCount,
	};
}

function cleanRowData(rowObj){

	delete rowObj._xml;
	delete rowObj.save;
	delete rowObj.del;
	delete rowObj._links;
	return rowObj;
}

function optionsHandler(options, data){

	if (!options) return data;
	else {

		if (options.rowsToObject) return convertToObject(options.rowsToObject, data) ;

	}

}

//function 