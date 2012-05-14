/*
 * jQuery Impromptu Extension
 * By: John Dobiatowski [http://dobiatowski.blogspot.com]
 * Version 0.9.3 for jQuery Impromptu 3.1+
 * Last Modified: 2/4/2011
 *
 * Download at: http://dobiatowski.blogspot.com/p/impromptu-extension.html
 *
 * Copyright 2010 John Dobiatowski
 * Attribution-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-sa/3.0/
 *
 * Improvements:
 *
 *	[feature] submiting forms on enter event inside prompt
 *		it support several forms in prompt, they are detected by form name
 *		for example: login form and register form opened in one prompt
 *
 *	[fix] performance problem in zoom mode fixed
 *		when zoom in IE8 is set, all animations of prompt slow down dramaticly and event stuck
 *		(tested on 2,8GHz CPU, 2GB RAM, WinXP)
 *		patch detect zoom and turn off animations
 *
 *	[fix] prompt reopen problem - if there is already prompt with the same ID, it close it and open new one
 *		it prevents situations when you could open serveral the same prompts, one overlapping other
 *
 * Usage:
 *
 *	This is extension of jQuery Impromptu, so you need both files:
 *		- jQuery Impromptu Version 3.1+
 *		  download: http://trentrichardson.com/Impromptu/index.php
 *		- jQuery Impromptu Extension Version 0.9.3 for jQuery Impromptu 3.1+
 *		  download: http://dobiatowski.blogspot.com/
 *
 */
(function($) {

	$.prompt.submit = function(clicked) {
		var $state = $.prompt.getCurrentState();
		var msg = $state.children('.'+ $.prompt.tempOptions.prefix +'message');
		//var clicked = true;
		var forminputs = {};
		var $jqi = $('#'+$.prompt.currentPrefix);

		//collect all form element values from all states
		$.each($jqi.find('#'+ $.prompt.tempOptions.prefix +'states :input').serializeArray(),function(i,obj){
			if (forminputs[obj.name] === undefined) {
				forminputs[obj.name] = obj.value;
			} else if (typeof forminputs[obj.name] == Array || typeof forminputs[obj.name] == 'object') {
				forminputs[obj.name].push(obj.value);
			} else {
				forminputs[obj.name] = [forminputs[obj.name],obj.value];
			}
		});

		var close = $.prompt.tempOptions.submit(clicked,msg,forminputs);
		if(close === undefined || close) {
			$.prompt.close();
		}

	};

	$.prompt.tempOptions;
	
	$.promptExt = function(message, options) {

		// if user uses IE8 in zoom mode turn off all animations - performance problems
		// there is no universal solution to detect zoom level in all browsers
		// the only one uses adobe flash hack - but this is unnecessary complication
		// http://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers
		var zoom = window.screen.deviceXDPI;
		if (typeof(zoom) != "undefined" && zoom != 96) {
			options.overlayspeed = 0;
			options.promptspeed = 0;
			options.show = 'show';
		}

		$.prompt.tempOptions = $.extend({},$.prompt.defaults,options);

		// if there is prompt with the same ID close it and wait to remove old instance
		if ($('#'+ $.prompt.tempOptions.prefix).length != 0) {
			$.prompt.close();
			setTimeout(function() {
				$.promptExt(message, options);
			}, 250);
			return;
		}

		$.prompt(message, options);

		// submiting form inside prompt after enter event 
		// enter key event is fired also on autocomplete list displayed for particular input
		// this is the way to prevent submiting the form in that case
		// also there is a bug in firefox discussed here:
		// http://stackoverflow.com/questions/2303955/i-have-a-problem-with-keydown-event-and-autocomplete-in-firebox-on-mac
		// which forced me to use setTimeout hack
		var oldInputValue;
		var keyPressEventHandler = function(event) {
			//enter key
			if(event.keyCode==13)
				 setTimeout(function() {enterEventHandler(event);},0);
			else
				$.promptExt.oldInputValue = event.currentTarget.value;
		}
		var enterEventHandler = function(event) {
			if($.promptExt.oldInputValue == event.currentTarget.value)
				//function sends a name of parent form of input which was hit by enter key
				//it helps in situation when in prompt you have more then one form - this will determine which one was "submited"
				//example: login form and register form opened in one prompt
				$.prompt.submit(event.currentTarget.form.name);
			else
				$.promptExt.oldInputValue = event.currentTarget.value;
		};

		// prevent all forms inside prompt against page reload on submit action
		$('#'+ $.prompt.tempOptions.prefix +'states form').submit(function () { return false; });

		// bind key event to every input in prompt
		$('#'+ $.prompt.tempOptions.prefix +'states .'+ $.prompt.tempOptions.prefix +'message :input').bind("keyup focus",keyPressEventHandler);

		// todo: set focus for first input inside prompt
		// problematic
		// $('#'+ $.prompt.tempOptions.prefix +'states input[type=text]')[0].focus();

	}
})(jQuery);