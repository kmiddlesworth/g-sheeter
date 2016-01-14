jQuery.ajax({
	url: 'http://admin.brightcove.com/js/BrightcoveExperiences.js',
	crossDomain: true,
	dataType: "script",
	success: function () {
		// initialize Brightcove script
		brightcove.createExperiences();
	},
	error: function () { }
});