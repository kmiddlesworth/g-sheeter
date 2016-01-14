# g-sheeter
A middleware based upon [google-spreadsheet](https://www.npmjs.com/package/google-spreadsheet) for collecting (and eventually editing) google spreadsheet data.

## Install

```
$ npm install --save g-sheeter
```

## Setup

* Follow the Service Account [instructions here](https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method).
* Make sure to `require()` your Google-provided service account information, otherwise [refence this](https://www.npmjs.com/package/google-spreadsheet#unauthenticated-access-read-only-access-on-public-docs). 


## Examples

### Get all tabs w/o authentication
```js
//node modules and global configs
var gSheeter = require('./lib/constructor');

var sheet = gSheeter(
	'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
	null
);

sheet.getData(
	function(data){
		//...thank you Google!
	}
);

```
### Get all tabs w/ authentication
```js
//node modules and global configs
var gSheeter = require('./lib/constructor'),
	googleService = require('[path to service file]');

var sheet = gSheeter(
	'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
	googleService
);

...

```


### Get some tabs w/ authentication
```js
...

// exclude the 'config' tab

var sheet = gSheeter(
	'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
	googleService,
	{
		excludeTabs: ['config']
	}

);

...


```
### Convert data array to an object

Make the `slug` label the key for each row
```js
...

var options = {		
	rowsToObject: 'slug'
}


sheet.getData(
	options, 
	function(data){
		//...thank you Google!
	}
);

...

```

Make the `slug` + `type` labels + `index` the key for each row
```js
...

var options = {
	rowsToObject: function(row, index){
		return row.slug + row.type + index;
	}
}

...

```

Tab1: Make the `slug` label the key for each row  
Tab2: Make the `slug` label + `index` the key for each row
```js
...

// Tab1 and Tab2 below correspond to tabs on the Google spreadsheet.

var options = {
	rowsToObject: {
		Tab1: 'slug'
		Tab2: function(row, index){
			return row.slug + index;
		}
	}
}

...

```
_Note: When using the tab-specific method, be sure to specify every tab in the options. Otherwise, not all the data will be returned int he callback._



## API

### `gSheeter'
Main g-sheeter class.

### `new gSheeter(key, auth, options)`

* `key` - `string` - required
	* Google Sheet unique identifier
	* Ex: docs.google.com/spreadsheets/d/_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_
* `auth` - `object` or `null` - reqired
	* Google Service Account credentials
	* See [setup instructions](#setup)
* `options` - `object` - optional
	* `excludeTabs` - `array` of tabs in the Google Sheet to ignore
* `returns` google sheet object


### sheet.getData(options, callback)
* `options` - object
	* `rowsToObject` - `string` OR `function` OR `object` - Determine how the returning array in the callback shoud be converted into an object instead of the default array
		* when `string` - builds whole row key from matching row item label
		* when `function` - builds whole row key from custom function - see example
		* when 'object' - each key of this object must be `string` or `function`, and the keys supplied should match *ALL* Google Sheet tab names


