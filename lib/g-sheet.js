
var Q = require('q'),
	GoogleSpreadsheet = require('google-spreadsheet'), // used for editing a document

var excludedSheetTabs = ['config', 'template'];
var sheetLocation = function() {
	return ('GSHEETKEY' in g && g.GSHEETKEY) ? 'https://docs.google.com/spreadsheets/d/' + g.GSHEETKEY + '/edit#gid=0' : null;
};


module.exports = {

	checkForGoogleSheetFile: function(callback) {

		// cache 'this' for use in nested functions
		var self = this;

		// if the env gsheet key variable does not exist, or if is null, create a new sheet
		if (!('GSHEETKEY' in g) || !g.GSHEETKEY || g.GSHEETKEY == 'null') {

			console.log('Google Sheet key for Translatable Elements does not exist.');
			return this.createNewGoogleSheet(callback);

		}
		// if a key exists in .env, determine that the file actually exists in google drive
		else if (g.GSHEETKEY) {

			drive.files.touch({
				auth: authClient,
				'fileId': g.GSHEETKEY
			}, function(err, res) {

				if (err) return console.log('Error talking to Google: ', err);

				// if the response comes back null, the file does not exist
				if (res === null) {
					console.log('Error: ' + err.code + '  -  ' + err.errors[0].message);
					return self.createNewGoogleSheet(callback).then(self.doBuild);
				}

				if (res.title !== g.SITENAME) {
					console.log('Warning: the current sheet is named \'' + res.title + '\' but should be \'' + g.SITENAME + '\'');
					return self.renameGoogleSheet(callback).then(self.doBuild);
				}

				console.log('Google sheet for ', g.SITENAME, ' project exists and is named properly at ' + sheetLocation());

				self.doBuild(callback);

			});

		}
	},

	createNewGoogleSheet: function(callback) {

		// set deffered object
		var deferred = Q.defer();

		// cache 'this' for use in nested functions
		var self = this;

		console.log('Creating a new Google Sheet for Translatable Elements');

		drive.files.copy({
			auth: authClient,
			'fileId': g.GSHEETTEMPLATEKEY,
			'resource': {
				'title': g.SITENAME
			}
		}, function(err, res) {

			// if the response comes back null, the file does not exist
			if (res === null) return console.log('Error: ' + err.code + '  -  ' + err.errors[0].message);

			console.log('Google sheet for ', g.SITENAME, ' is now created.');

			console.log('Updateing site .env to include GSHEETKEY');

			// update the .env file on the server
			self.upsertEnvConfig('GSHEETKEY', res.id, function() {

				deferred.resolve(callback);

			});

		});

		return deferred.promise;
	},

	getSheetTabs: function(callback) {

		// set deffered object
		var deferred = Q.defer();

		// get the list of pages
		var htmlOutputFiles = fs.readdirSync(htmlFileLocation).filter(function(item) {
			return item.indexOf('.html') != -1;
		});

		// initialize google sheet api
		var gsheet = new GoogleSpreadsheet(g.GSHEETKEY);

		// authorize the api
		gsheet.useServiceAccountAuth(googleCreds, function(err) {

			// getInfo returns info about the sheet and an array of "worksheet" objects
			gsheet.getInfo(function(err, sheetData) {

				sheetData.gsheet = gsheet;

				// build array of tab names
				var tabNames = sheetData.worksheets.map(function(item) {
					return item.title;
				});

				// filter array of pages
				var newTabs = htmlOutputFiles.filter(function(item) {
					return tabNames.indexOf(item) == -1;
				});

				// if more tabs are needed in the Google sheet, provide directions
				if (newTabs.length) console.log('Add tabs: go to ' + sheetLocation() + '. \nSelect "Build New Sheets" from the "Custom" menu. When prompted, enter the following: ' + newTabs.join(' ') + ' \nUpdate the Google sheet and then run another build.');
				else {
					console.log('All google sheet tabs are up-to-date.');
					deferred.resolve(sheetData);
				}


			});

		});

		return deferred.promise;
	},

	getAllSheetData: function(sheetData) {

		//console.log('g-sheet.getAllSheetData()');

		// set deffered object
		var deferred = Q.defer();

		//console.log(sheetData.worksheets);

		var sheetIndex = 0,
			sheetCount = sheetData.worksheets.length;
		var strippedData = [];

		//if (sheetCount <= excludedSheetTabs.length) return console.log('The Goolge Sheet has no tabs or the project does not have the correct files in it. Check the pages in the \'dist-sitebuilder\' folder and try again.')

		function rowGetter() {

			var tabData = [];

			sheetData.worksheets[sheetIndex].getRows(function(err, rows) {

				// omit any tabs that don't include .html in their names
				if (sheetData.worksheets[sheetIndex].title.indexOf('.html') == -1) {

					strippedData.push(null);

				} else {

					for (var i = 0, len = rows.length; i < len; i++) {

						tabData.push({
							//id: rows[i].id,
							id: sheetData.worksheets[sheetIndex].id,
							file: sheetData.worksheets[sheetIndex].title,
							key: rows[i].key,
							value: rows[i].value,
							active: rows[i].active,
						});
					}

					strippedData.push(tabData);
				}

				sheetIndex++;

				if (sheetIndex < sheetCount) rowGetter();
				else deferred.resolve({
					sheet: sheetData,
					stripped: strippedData
				});

			});

		}

		rowGetter(sheetIndex);

		return deferred.promise;
	},

	buildJsonFile: function(data) {

		//console.log('g-sheet.buildJsonFile()');

		var deferred = Q.defer();

		var self = module.exports;

		var newObj = {};

		console.log('Writing JSON file...');

		// loop through data and convert to an object of arrays
		for (var i = 0, ilen = data.varData.length; i < ilen; i++) {

			//console.log(data.varData[i]);

			// if there is no data or if the array value is null, skip it
			if (!data.varData[i] || !data.varData[i].length) continue;

			var fileName = data.varData[i][0].file;

			newObj[fileName] = data.varData[i];

		}

		self.writeToFile(jsonFileLocation, JSON.stringify(newObj), function() {

			deferred.resolve(newObj);

		});

		return deferred.promise;
	},

	writeToFile: function(location, content, callback) {

		//console.log('g-sheet.writeToFile()');

		fs.writeFile(location, content, function(err) {
			if (err) {
				return console.log('Error writing to ' + jsonFileLocation + ': ' + err);
			}

			console.log('Success writing data to ' + location);

			if (callback) callback();

		});
	},


	initialize: function(callback) {

		//console.log('g-sheet.initialize()');

		this.checkForGoogleSheetFile(callback);

	},

	doBuild: function(callback) {

		//console.log(this);

		this.getSheetTabs()
			.then(this.setSheetTabs) // TODO
			.then(this.getAllSheetData)
			.then(this.getAllSiteContent)
			.then(this.getContentVariables)
			.then(this.htmlSheetUpdate)
			.then(this.buildJsonFile)
			.then(this.buildXmlFiles)
			.then(function(a) {
				console.log('\nTranslatable elements build complete.\n');
				if (callback) callback();
			});
	}

};


// code to enable command line execution of this script
if (process.argv.length > 2) {
	// remove the first two arguments: node g-sheets.js
	var args = process.argv.slice(2);

}
