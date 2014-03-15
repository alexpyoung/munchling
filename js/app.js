angular.module('munchling', [
	'ngRoute',
	'munchling.services',
	'munchling.controllers'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/home', {
		templateUrl: 'partials/index.html', 
		controller: 'HomeController'
	});
	$routeProvider.otherwise({
		redirectTo: '/home'
	});
}]);

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

String.prototype.repeat= function(n){
    n = n || 1;
    return Array(n+1).join(this);
}
