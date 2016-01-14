var convertToObject = require('./convert-to-object');
var _  					= require('lodash')



// options obj:
// 		{
// 			rowsToObject  	 		: string or function - when populated, converts the array data to an object
// 										- when a string is supplied, the object key for the row item is made the key for the whole row
// 										- when a function is supplied, the key for the row is made from the return data
// 											- the function takes two parameters: function(rowObject, tabMeta)
// 		}

module.exports = function(value, data){

	var valueType = typeof value,
		error;

 //console.log(data.tabs.test);

// return data;

	for (key in data.tabs) {
		
		var tabObj = {};

		if (!data.tabs[key].rows.length) {
			tabObj.tabs[key].rows = 'Error: the Google Sheet tab, ' + key + ', is currently being edited.'
			continue;
		} 

		// loop through the current array
		data.tabs[key].rows.map(function(item, index){

			// if a string is supplied, simply update the object
			if (valueType == 'string') {
				//console.log(' filter string');
				tabObj[item[value] || 'null'] = item;
			}

			// if a function is supplied, run it
			else if (valueType == 'function') {
				//console.log(' filter function');
				tabObj[value(item) || 'null'] = item;
			}

			// if an object with keys that reference by tab, pass through the converter
			else if (valueType == 'object' && _.has(value, key)) {

				if (typeof value[key] == 'string') tabObj[item[value[key]] || 'null'] = item;
				if (typeof value[key] == 'function')  tabObj[value[key](item, index) || 'null'] = item;
			}
			
			else { 

				tabObj['null-error'] = item;

				error = 'Error: Not all data was written to the object. If a row\'s object keys are set according to each Google Sheet tab, then all tabs must be accounted for in the options parameter.';
			}

		});

		data.tabs[key].rows = tabObj;

	}

	if (error) console.log(error);

	return data;

}

