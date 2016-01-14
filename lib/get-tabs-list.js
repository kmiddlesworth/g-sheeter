// get all tabs listed in the sheet
//		- "filter" is an array of tabs to exclude
//

module.exports = function(filter, callback){
		
	if (typeof filter == 'function' && !callback) { 
		callback = filter;
		filter = undefined;
	} 

	this.authAndDump(function(){
		// build array of tab names
		var tabNames = this.sheetData.worksheets.map(function(item) {
			return item.title;
		});

		if (filter) {
			var tabNames = tabNames.filter(function(item) {
				return (filter.indexOf(item) != -1);
			});
		}
		callback(tabNames);

	}.bind(this));
}