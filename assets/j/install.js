/**
 * "The contents of this file are subject to the Mozilla Public License
 *  Version 1.1 (the "License"); you may not use this file except in
 *  compliance with the License. You may obtain a copy of the License at
 *  http://www.mozilla.org/MPL/
 
 *  Software distributed under the License is distributed on an "AS IS"
 *  basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 *  License for the specific language governing rights and limitations
 *  under the License.

 *  The Original Code is OpenVBX, released June 15, 2010.

 *  The Initial Developer of the Original Code is Twilio Inc.
 *  Portions created by Twilio Inc. are Copyright (C) 2010.
 *  All Rights Reserved.

 * Contributor(s):
 **/

if(typeof(OpenVBX) == "undefined") {
	var OpenVBX = {};
}


OpenVBX.Installer = {
	tabsDisabled: true,
	ready : false,
	currentStep : 1,
	moreInfoToggled : false,
	validate : function(afterValidation) {
		var step = $('#step-'+OpenVBX.Installer.currentStep);
		var params = $('textarea, input, select', step);
		var result = $.ajax({
			url : OpenVBX.home + 'install/validate',
			data : params,
			success : function(data) {
				$('.invalid').removeClass('invalid');
				if(!data.success) {
					$('.error').text(data.message);
					$('.error').slideDown();
					for(var a in data.errors) {
						$('#'+a+'-'+OpenVBX.Installer.currentStep).addClass('invalid');
					}
				} else {
					if(OpenVBX.Installer.currentStep == 5) {
						OpenVBX.Installer.ready = true;
					}
					
					afterValidation();
				}
				return data.success;
			},
			type : 'post',
			async : false,
			dataType : 'json',
			error : function(XMLHttpRequest, textStatus, errorThrown) {
			  OpenVBX.Installer.displayError('An application error occurred. Please try again', 'HTTPStatus: ' + XMLHttpRequest.status + '<br>Error: ' + textStatus);
			}
		});
		return result;
	},
	
	displayError: function(errorText, moreInfo) {
	  OpenVBX.Installer.moreInfoToggled = false;
    var html = errorText;
    if(moreInfo) {
      html += ' <a id="moreInfoToggler" onclick="OpenVBX.Installer.toggleMoreInfo(event)">(More Information)</a>' 
           +  '<div id="moreInfo">' 
           +     moreInfo
           +  '</div>';
    }
	  $('.error').html(html)
	             .slideDown();
	},
	
	toggleMoreInfo: function(event) {
	  if(OpenVBX.Installer.moreInfoToggled) {
	    $('#moreInfo').slideUp();
	    $('#moreInfoToggler').text('(More Information)');
	  } else {
	    $('#moreInfo').slideDown();
	    $('#moreInfoToggler').text('(Less Information)');
	  }
    //Toggle state
	  OpenVBX.Installer.moreInfoToggled = !OpenVBX.Installer.moreInfoToggled;
	  //Make sure the error region's click handler doesn't fire
	  event.stopPropagation();
	},
	
	prevStep : function(e) {
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.prevStepLock)
			return false;

		OpenVBX.Installer.prevStepLock = true;
		if($('.steps').css('left').replace('px','') > -700)
			return false;

		$('.error').slideUp();
		OpenVBX.Installer.currentStep -= 1;
		OpenVBX.Installer.gotoStep(OpenVBX.Installer.currentStep);

		return false;
	},
	nextStep : function(e) {
		OpenVBX.Installer.tabsDisabled = false;
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.nextStepLock)
			return false;

		var afterValidation = function() {
			
			OpenVBX.Installer.nextStepLock = true;
			if($('.steps').css('left').replace('px','') <= -3500)
				return false;
			
			$('.error').slideUp();
			OpenVBX.Installer.currentStep += 1;
			if(OpenVBX.Installer.currentStep == 6 && OpenVBX.Installer.ready) {
				OpenVBX.Installer.submit(e);
			} else {
				OpenVBX.Installer.gotoStep(OpenVBX.Installer.currentStep);
			}

		};

		OpenVBX.Installer.validate(afterValidation);

		return false;
	},
	setButtons : function() {
		if($('.steps').css('left').replace('px','') > -700) {
			$('button.prev').attr('disabled', 'disabled');
		} else {
			$('button.prev').removeAttr('disabled');
		}
		
		if($('.steps').css('left').replace('px','') <= -3500) {
			$('button.next').attr('disabled', 'disabled');
		} else {
			$('button.next').removeAttr('disabled');
		}
		switch(OpenVBX.Installer.currentStep) {
			case 1:
				$('button.prev').hide();
				$('button.next').show();
				$('button.submit').hide();
			break;
			default:
				$('button.prev').show();
				$('button.next').show();
				$('button.submit').hide();
				break;
			case 5:
				$('button.next').hide();
				$('button.submit').show();
				break;
			case 6:
				$('button').hide();
				break;
		}

		OpenVBX.Installer.nextStepLock = false;
		OpenVBX.Installer.prevStepLock = false;
	},
	gotoStep : function(step) {
		var left = (step * -700) + 700;
		$('.steps').animate({'left': left}, 'normal', 'swing', OpenVBX.Installer.setButtons);
		OpenVBX.Installer.currentStep = step;
	},
	toggleError : function() {
		$('.error').slideToggle();
	},
	submit : function(e) {
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.ready)
		{
			$.ajax({
				url : OpenVBX.home + '/install/setup',
				data : $('form input, form select, form textarea'),
				success : function(data) {
					if(!data.success) {
						$('.error')
							.text(data.error)
							.slideDown();
					} else {
						OpenVBX.Installer.gotoStep(6);
					}
				},
				type : 'post',
				dataType : 'json',
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					OpenVBX.Installer.displayError('An application error occurred.  Please try again');
				}
			});
		}

		return false;
	}
};

$(document).ready(function() {
	if($('.error').text() != '') {
		setTimeout(OpenVBX.Installer.toggleError, 
				   1000);
	}
	
	OpenVBX.Installer.setButtons();
	$('button.next').click(OpenVBX.Installer.nextStep);
	$('button.prev').click(OpenVBX.Installer.prevStep);
	$('.error').click(OpenVBX.Installer.toggleError);
	$('button.submit').click(OpenVBX.Installer.nextStep);
	$('form').submit(function(e) {
		e.preventDefault();
	});
	
	$('fieldset').each(function() { 
		$('input:last', 
		  this).keypress(
			  function(e) {
				  var keyCode = e.keyCode || e.which; 
				  if(keyCode == 9) {
					  e.preventDefault();
					  OpenVBX.Installer.nextStep();
				  }
			  });
	});

	var last_key = false;
	$(window).bind('keydown', function(e) {
		var tabstops = {iDatabasePassword : '', 
						iTwilioToken : '',
						iFromEmail : '',
						iAdminPw2 : ''};

		if($(e.target).attr('id') in tabstops
		   && e.which == 9 && last_key != 16)
			e.preventDefault();

		if(OpenVBX.Installer.tabsDisabled && e.which == 9)
			e.preventDefault();
		last_key = e.which;
	});

	setTimeout(function() {
		$.ajax({ 
			url : OpenVBX.home.replace('index.php', 'support/rewrite'), 
			success : function(data, code) {
				$('input[name=rewrite_enabled]').attr("value", 1);
			}, 
			error : function(data) { 
				$('input[name=rewrite_enabled]').attr("value", 0);
			} 
		});
	}, 1000);


});