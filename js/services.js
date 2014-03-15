/* Yelp's API does not work nicely with Angular's
 * JSON callback handler so I had to manually inject
 * the script
 */
var JSONP_Callback;

var JSONP_Handler = function(data) {
	JSONP_Callback(data);
};

var JSONP_Request = function(url, callback) {
	var script = document.createElement('script');
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
	JSONP_Callback = callback;
};

/* Recipe Model
 * 
 * Shares JSON array of recipes and allows access by ID
 */
angular.module('munchling.services', [])
.service('Recipes', [function() {
	var Recipes = {};
	var list = [];
	Recipes.cache = function(recipes) {
		list = recipes;
	};
	Recipes.recipeWithId = function(id) {
		for(var i = 0; i < list.length; i++){
			if(list[i].id == id) {
				return list[i];
			}
		}
	};
	return Recipes;
}])

/* Restaurant Model
 * 
 * Shares JSON array of restaurants and allows access by ID
 */
.service('Restaurants', [function() {
	var Restaurants = {};
	var list = [];
	Restaurants.cache = function(restaurants) {
		list = restaurants;
	};
	Restaurants.restaurantWithId = function(id) {
		for(var i = 0; i < list.length; i++){
			if(list[i].id == id) {
				return list[i];
			}
		}
	};
	return Restaurants;
}])

/* Shared service to access browser geolocation
 *
 * The browser geolocation object passes the 
 * coordinates of the current location to a
 * callback function. This service checks that
 * the browser object is available before invocation
 */
.service('Geolocation', [function() {
	this.getCurrentPosition = function(callback) {
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(callback);
		}
	};
}])

/* Shared service to access Yummly API
 *
 * Provides an abstraction to send a GET request
 * to Yummly's RESTful API
 *
 * NOTE: API Keys are currently unsecure on the client-side
 */
.service('Yummly', ['$http', function($http) {
	var app_id = "f2e70c6d";
	var app_key = "21532be94f6db50c3ac06232dc473099";

	this.search = function(cuisine, success) {
		var promise = $http.jsonp('http://api.yummly.com/v1/api/recipes?', {
			params: {
				'_app_id': app_id,
				'_app_key': app_key,
				'allowedCuisine[]': cuisine,
				'callback': 'JSON_CALLBACK'
			}
		});
		promise.then(success);
	};
}])

/* Shared service to access Yelp API
 *
 * Provides an abstraction to send a GET request
 * to Yelp's RESTful API
 *
 * NOTE: API Keys are currently unsecure on the client-side,
 * request is encrypted via Oauth
 */
.service('Yelp', ['$http', function($http) {
	var auth = {
		consumerKey: "IXAoE9MDhiMSmOkpXQMUdg", 
		consumerSecret: "sCxOB9KA9tx3gXSq5XhKBEgdz-Q",
		accessToken: "ZhhCCx-fC1l1xSjinyu4n7sy22bTvjNC",
		accessTokenSecret: "WtzqRRNjdCvPFoTgkb9h1KHHzYc",
		serviceProvider: { 
	  		signatureMethod: "HMAC-SHA1"
	  	}
	};
	var accessor = {
		consumerSecret: auth.consumerSecret,
		tokenSecret: auth.accessTokenSecret
	};

	this.search = function(cuisine, location, success) {
		parameters = [];
		parameters.push(['category_filter', cuisine]);
		parameters.push(['ll', location]);
		parameters.push(['callback', 'JSONP_Handler']);
		parameters.push(['oauth_consumer_key', auth.consumerKey]);
		parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
		parameters.push(['oauth_token', auth.accessToken]);
		parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

		var message = { 
			'action': 'http://api.yelp.com/v2/search?',
			'method': 'GET',
			'parameters': parameters 
		};

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

		var url = message.action + $.param(parameterMap);

		JSONP_Request(url, function(data) {
			success(data);
		});
	};
}]);