//
// Authenticate and Access the Global site data
//		- used in almost all the methods below
//

module.exports = function(callback){
	
	var self = this;

	if (!this.creds) getSheetInfo();
	
	else {

		this.gsheet.useServiceAccountAuth(this.creds, function(err) {
			getSheetInfo(err)
		}.bind(this));	
	}


	function getSheetInfo(err) {
		// getInfo returns info about the sheet and an array of "worksheet" objects
		self.gsheet.getInfo(function(err, sheetData) {
			if (err) console.log('Error accessing the Google Sheet.');
			else {
			
				optionsRouter(self.options, sheetData, function(data){

					self.sheetData = data;
					callback(data);

				}.bind(self));

			} 
		}.bind(self));
	}

}

function optionsRouter(options, sheetData, callback){

	if (options) {
		sheetData.worksheets = (options.excludeTabs) ? excludeTabs() : sheetData.worksheets;
	}

	callback(sheetData);


	//
	// Routed functions based on option
	//

	// exclude tabs
	function excludeTabs(){
		return sheetData.worksheets.filter(function(item){
			return (options.excludeTabs.indexOf(item.title) == -1);
		});
	} 
}