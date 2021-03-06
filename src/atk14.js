var ATK14 = ( function() {
	"use strict";

	$( document ).on( "click", "a[data-remote], a[data-method]", function( e ) {
		var $link = $( this );

		if ( !allowAction( $link ) ) {
			return false;
		}

		if ( $link.data( "remote" ) ) {
			ATK14.handleRemote( this );
			e.preventDefault();
		} else if ( $link.data( "method" ) ) {
			handleMethod( $link );
			e.preventDefault();
		}
	} );

	// Here is onClick on a button with a "name" attribute.
	// Values of attributes "name" and "value" have to be put together into an extra parameter and passed to handleRemote.
	$( document ).on( "click", "form[data-remote] button[type=\"submit\"][name]", function( e ) {
		var $button = $( this ), $form = $button.closest( "form" );
		ATK14.handleRemote( $form, [ {
			name: $button.attr( "name" ),
			value: $button.attr( "value" )
		} ] );
		e.preventDefault();
	} );

	$( document ).on( "submit", "form[data-remote]", function( e ) {
		ATK14.handleRemote( this );
		e.preventDefault();
	} );

	$( document )
		.ajaxStart( function() {
			$( document.body ).addClass( "loading" );
		} )
		.ajaxStop( function() {
			$( document.body ).removeClass( "loading" );
		} );

	$.ajaxSetup( {
		converters: {
			"text conscript": true
		},
		dataType: "conscript"
	} );

	function fire( obj, name, data ) {
		var event = new $.Event( name );
		obj.trigger( event, data );
		return event.result !== false;
	}

	function allowAction( $element ) {
		var message = $element.data( "confirm" );
		return !message || ( fire( $element, "confirm" ) && window.confirm( message ) );
	}

	function handleMethod( $link ) {
		var href = $link.attr( "href" ),
			method = $link.data( "method" ),
			$form = $( "<form method='post' action='" + href + "'></form>" ),
			metadataInput = "<input name='_method' value='" + method + "' type='hidden' />";

		$form.hide().append( metadataInput ).appendTo( "body" );
		$form.submit();
		$form.remove();
	}

	return {

		action: $( "meta[name='x-action']" ).attr( "content" ),

		handleRemote: function( element, extraParams ) {
			var method, url, data, $link, $form,
				$element = $( element ),
				dataType = $element.data( "type" ) || $.ajaxSettings.dataType;

			extraParams = extraParams || [];

			if ( $element.is( "form" ) ) {
				$form = $element; // Remove later
				method = $element.attr( "method" );
				url = $element.attr( "action" );
				data = $element.serializeArray();
				data = data.concat( extraParams );
			} else {
				$link = $element; // Remove later
				method = $element.data( "method" );
				url = $element.attr( "href" );
				data = null;
			}

			method = method || "GET"; // By default the method is GET
			if ( method.toUpperCase() == "GET" ) {
				url += url.indexOf("?")>=0 ? "&" : "?";
				url += "__xhr_request=1";
			}

			$.ajax( {
				url: url,
				type: method,
				data: data,
				dataType: dataType,
				beforeSend: function( xhr, settings ) {
					return fire( $element, "ajax:beforeSend", [ xhr, settings ] );
				},
				success: function( data, status, xhr ) {
					$element.trigger( "ajax:success", [ data, status, xhr ] );

					if ( dataType === "conscript" ) {
						eval( data );
					}
				},
				complete: function( xhr, status ) {
					$element.trigger( "ajax:complete", [ xhr, status ] );
				},
				error: function( xhr, status, error ) {
					$element.trigger( "ajax:error", [ xhr, status, error ] );
				}
			} );
		}
	};

} )();
