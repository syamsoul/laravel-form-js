(function( factory ) {
	"use strict";

	if ( typeof exports === 'object' ) {
		// CommonJS
		if ( ! $ || ! jQuery) {
			$ = require('jquery');
		}
		
        let modules = factory($);
        
        jQuery.SdLarajax = $.SdLarajax = modules['SdLarajax'];
        jQuery.fn.SdLaraform = $.fn.SdLaraform = modules['SdLaraform'];
        
		module.exports = modules;
	}
	else {
		// Browser
        let modules = factory(jQuery);
        
		jQuery.SdLarajax = $.SdLarajax = modules['SdLarajax'];
        jQuery.fn.SdLaraform = $.fn.SdLaraform = modules['SdLaraform'];
	}
}
(function($) {
	"use strict";
    
    $.SdLarajax = function(opts, is_with_csrf=true){
		
		let that = this;
		
		let opts_new = (function(){
            let opts_new = {};
            
            if(typeof opts == "string"){
                opts_new['url']     = opts;
                opts_new['method']  = 'GET';
				opts_new['data']  	= {};
				opts_new['exec'] 	= {};
            }else if(typeof opts == "object"){
                
				if(typeof opts['url'] != "string"){
					console.log("URL is required");
					return false;
				}else opts_new['url'] = opts['url'];
				
				if(typeof opts['method'] != "string") opts_new['method'] = 'GET';
				else opts_new['method'] = opts['method'];
			
				if(typeof opts['data'] != "object") opts_new['data'] = {};
				else opts_new['data'] = opts['data'];
				
				if(typeof opts['exec'] != "object") opts_new['exec'] = {};
				else opts_new['exec'] = opts['exec'];
            }else{
				console.log("There's something wrong with your SdLaraform configuration");
				return false;
			}
            
            return opts_new;
        })();
		
		that.beforeSend = function(execBeforeSend=function(){}){
			if(opts_new === false) return false;
			
			if(typeof execBeforeSend == "function") opts_new['exec']['beforeSend'] = execBeforeSend;
			
			return that;
		};
		
		that.send = function(execAfterDone=function(){}, execAfterFail=function(){}){
			if(opts_new === false) return false;
			
	        let ajax_opts = {
	            url: opts_new.url,
	            type: opts_new.method,
				data: opts_new.data
	        };
	        
			if(is_with_csrf){
		        let meta_csrf = $('meta[name="csrf-token"]');
		        
		        if(meta_csrf.length == 1){
		            ajax_opts['headers'] = {
		                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
		            };
		        }
			}
			
			if(typeof opts_new['exec']['beforeSend'] == "function") opts_new['exec']['beforeSend']();
	    
	        return $.ajax(ajax_opts).done((res)=>{
	            if(typeof execAfterDone == "function") execAfterDone(res);
	        }).fail((res)=>{
	            if(typeof execAfterFail == "function") execAfterFail(res.responseJSON, res.status, res);
	        });
		};
		
		
		return that;
		
    }
	
	
	$.fn.SdLaraform = (()=>{
		let CORE = function(){
			let form_jel, opts_new;
			
			this.methods = {
				init : function(opts) {
					let that = this;
					
					form_jel = $(that);
					
					opts_new = (function(){
			            let opts_new = {};
					
			            if(typeof opts == "object"){               
							if(typeof opts['data'] != "object" && typeof opts['data'] != "function") opts_new['data'] = {};
							else opts_new['data'] = opts['data'];
					
							if(typeof opts['exec'] != "object") opts_new['exec'] = {};
							else opts_new['exec'] = opts['exec'];
							
							if(typeof opts['error_class_name'] != "string") opts_new['error_class_name'] = 'sd-form-error';
							else opts_new['error_class_name'] = opts['error_class_name'];
							
							if(typeof opts['is_bs4_input'] != "boolean") opts_new['is_bs4_input'] = true;
							else opts_new['is_bs4_input'] = opts['is_bs4_input'];
							
							if(typeof opts['is_with_csrf'] != "boolean") opts_new['is_with_csrf'] = true;
							else opts_new['is_with_csrf'] = opts['is_with_csrf'];
			            }else{
							console.log("There's something wrong with your SdLaraform configuration");
							return false;
						}
					
			            return opts_new;
			        })();
					
			        
					form_jel.on('submit', function(e){
						e.preventDefault();
						
						let formJson = (function($form){
						    var unindexed_array = form_jel.serializeArray();
						    var indexed_array = {};
				
						    $.map(unindexed_array, function(n, i){
						        indexed_array[n['name']] = n['value'];
						    });
				
						    return indexed_array;
						})();
						
						
						let formUrl = form_jel.attr('action');
						if(formUrl == undefined){
							$.error("Action(URL) is required");
							return false;
						}
						
						let formMethod = form_jel.attr('method');
						if(formMethod == undefined){
							formMethod = "POST";
						}
						
						let extra_data = opts_new['data'];
						if(typeof opts_new['data'] == "function") extra_data = opts_new['data']();						
						
						$.SdLarajax({
							url: formUrl,
							method: formMethod,
							data: $.extend(formJson, extra_data)
						}, opts_new['is_with_csrf']).beforeSend(()=>{
					        if(typeof opts_new['exec']['beforeSend'] == "function") opts_new['exec']['beforeSend']();
					    }).send((res)=>{
					        if(typeof opts_new['exec']['afterDone'] == "function") opts_new['exec']['afterDone'](res);
							if(typeof opts_new['exec']['afterCompleted'] == "function") opts_new['exec']['afterCompleted'](res);
					    }, (res, errorStatus)=>{
							if(errorStatus == 422){
								let errors = res.errors;
								
								form_jel.find('.'+opts_new['error_class_name']).html('');
								form_jel.find('.'+opts_new['error_class_name']).each((index, el)=>{
									let input_name = $(el).attr('data-inputname');
									
									if(input_name == undefined) $(el).html(errors[Object.keys(errors)[0]]);
									else{
										if(typeof errors[input_name] != "undefined"){
											$(el).html(errors[input_name]);
											if(opts_new['is_bs4_input']){
												form_jel.find('[name="'+input_name+'"]').addClass('is-invalid-new');
											}
										}
									}
								});
								
								if(opts_new['is_bs4_input']){
									form_jel.find('.form-control.is-valid').removeClass('is-valid');
									form_jel.find('.form-control.is-invalid:not(.is-invalid-new)').removeClass('is-invalid').addClass('is-valid');
									form_jel.find('.form-control.is-invalid').removeClass('is-invalid');
									form_jel.find('.form-control.is-invalid-new').removeClass('is-invalid-new').addClass('is-invalid');
								}
							}
							
							if(typeof opts_new['exec']['afterFail'] == "function") opts_new['exec']['afterFail'](res, errorStatus);
							if(typeof opts_new['exec']['afterCompleted'] == "function") opts_new['exec']['afterCompleted'](res);
						});
					});
					
					return that;
				},
				clear : function() { 
					form_jel[0].reset();
					form_jel.find('.form-control.is-valid').removeClass('is-valid');
					form_jel.find('.form-control.is-invalid').removeClass('is-invalid');
					form_jel.find('.'+opts_new['error_class_name']).html('');
				}
			};
		};
	
	    return function(methodOrOptions) {
			let settings = $(this).data("settings");
			 
			if(settings == undefined){
				settings = {is_first_time:true,methods:{}};
				$(this).data("settings", settings);
			}
			
			let methods = settings.methods;
			
			if ( methods[methodOrOptions] ) {
				return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
			} else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
				if(settings.is_first_time){
					settings = new CORE();
					$(this).data("settings", settings);
				
					// Default to "init"
					return settings.methods.init.apply( this, arguments );
				}else{
					$.error( 'Method init cannot be called multiple times' );
				}				
			} else {
				$.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.SdLaraform' );
			}    
		};
	})();
    
    return {
        'SdLarajax':$.SdLarajax,
        'SdLaraform':$.fn.SdLaraform
    };
}));