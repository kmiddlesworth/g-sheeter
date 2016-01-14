
var Q  					= require('q'),
	_  					= require('lodash'),
	googleSpreadsheet 	= require('google-spreadsheet'), // used for editing a document
	authAndDump 		= require('./authorize-and-dump');
	getCleanData 		= require('./get-clean-data');
	getTabsList 		= require('./get-tabs-list');
	

function googleSheeter(sheetKey, serviceCreds, options){

	this.gsheetKey 	= sheetKey;
	this.gsheet 	= new googleSpreadsheet(sheetKey);
	this.creds 		= serviceCreds;
	this.options 	= options;

	// this.sheetData is populated by this.authAndDump(fun...);

}


googleSheeter.prototype.authAndDump 	= authAndDump; // -> ./authorize-and-dump.js

googleSheeter.prototype.getTabs 		= getTabsList; // -> ./get-tabs-list.js

googleSheeter.prototype.getData 		= getCleanData; // -> ./get-clean-data.js



module.exports = function(sheetKey, serviceCreds, options){
	return new googleSheeter(sheetKey, serviceCreds, options);
}