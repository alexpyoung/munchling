angular.module('munchling.controllers', []).
controller('HomeController', ['$scope', '$http', '$sce', 'Geolocation', 'Yelp', 'Yummly', 'Recipes', 'Restaurants', function($scope, $http, $sce, Geolocation, Yelp, Yummly, Recipes, Restaurants) {
	$scope.loading = false; // State control for when the application is accessing APIs
	$scope.orderRestaurants = "title"; // Request results can be sorted by HTML select, initializes to a title
	$scope.orderRecipes = "title"; // Request results can be sorted by HTML select, initializes to a title

	/* I am trying to create the visual effect of the entire
	 * page flipping along a central, vertical axis. To achieve this 
	 * effect, the wrapper div must always stretch the entire view
	 */
	$(function(){
		var $wrapper = $('#container');
		var $content = $('.flip-container');
	    var windowH = $(window).height();
	    var wrapperH = $wrapper.height();
	    if(windowH > wrapperH) {                            
	        $wrapper.css({'height':($(window).height())+'px'});
	    }                                                                               
	    $(window).resize(function(){
	        var windowH = $(window).height();
	        var wrapperH = $wrapper.height();
	        var differenceH = windowH - wrapperH;
	        var newH = wrapperH + differenceH;
	        var contentH = $content.height();
	        if(windowH > contentH) {
	            $wrapper.css('height', (newH)+'px');
	        }
	    });          
	});

	/* Fetch available cuisines from JSON file
	 */
	var promise = $http.get('lib/cuisines.json');
	promise.then(function(json) {
		$scope.cuisines = json.data.cuisines;
		$scope.cuisineChoice = $scope.cuisines[0];
	});

	/* Main function that executes after the user has chosen a cuisine
	 */
	$scope.go = function() {
		// Clear any pervious results loaded in the scope
		$scope.restaurants = null;
		$scope.recipes = null;

		// Animations to minimize header to make room for results
		$('.cuisine-choice-container').addClass('minimize');
		$('.cuisine-choice-container').children(':not(img, select, #loading, .go-back-button)').fadeOut();

		$scope.loading = true; // State control

		// Fetch user choices
		var diningChoice = $scope.diningChoice;
		var cuisineChoice = $scope.cuisineChoice;

		switch(diningChoice) {
			case "cook":
				var cuisine = cuisineChoice.yummlyValue;
				Yummly.search(cuisine, function(response) {
					$scope.restaurants = null;
					$scope.loading = false;
					$scope.recipes = response.data.matches;

					var starIcon = '<span class="glyphicon glyphicon-star"></span>';
					var emptyStarIcon = '<span class="glyphicon glyphicon-star-empty	"></span>';
					var ratingIcon;

					for(var i = 0; i < $scope.recipes.length; i++) {
						var recipe = $scope.recipes[i];
						recipe.neededIngredients = recipe.ingredients.slice(0);
						recipe.ownedIngredients = [];
						switch(recipe.rating) {
							case 0:
								ratingIcon = emptyStarIcon.repeat(5);
								break;
							case 1:
								ratingIcon = starIcon + emptyStarIcon.repeat(4);
								break;
							case 2:
								ratingIcon = starIcon.repeat(2) + emptyStarIcon.repeat(3);
								break;
							case 3:
								ratingIcon = starIcon.repeat(3) + emptyStarIcon.repeat(2);
								break;
							case 4:
								ratingIcon = starIcon.repeat(4) + emptyStarIcon;
								break;
							case 5:
								ratingIcon = starIcon.repeat(5);
						}
						recipe.ratingIcon = $sce.trustAsHtml(ratingIcon);
					}
					Recipes.cache($scope.recipes);
				});
				break;
			case "restaurant":
				Geolocation.getCurrentPosition(function(position) {
					var location = position.coords.latitude + "," + position.coords.longitude;
					var cuisine = cuisineChoice.yelpValue;
					Yelp.search(cuisine, location, function(response) {
						$scope.$apply(function() {
							$scope.recipes = null;
							$scope.loading = false;

							$scope.restaurants = response.businesses;

							for(var i = 0; i < $scope.restaurants.length; i++) {
								var restaurant = $scope.restaurants[i];
								restaurant.distance *= 0.000621371; // Convert distance in meters to miles
								restaurant.distance = restaurant.distance.toFixed(2);
							}
						});

 						Restaurants.cache($scope.restaurants);
					});
				});
				break;
		}
	};

	$scope.flip = function(diningChoice) {
		$('.flip-wrapper').toggleClass('flip');
		$scope.diningChoice = diningChoice;
		$scope.restaurants = null;
		$scope.recipes = null;
		$('.cuisine-choice-container').removeClass('minimize');
		$('.cuisine-choice-container').children(':not(img, select, #loading, .go-back-button)').show();
		$scope.cuisineChoice = $scope.cuisines[0];
	};

	$scope.addToOwnedIngredients = function(recipeIndex, ingredientIndex) {
		console.log("1");
		var recipe = $scope.recipes[recipeIndex];
		recipe.ownedIngredients.push(recipe.neededIngredients[ingredientIndex]);
		recipe.neededIngredients.splice(ingredientIndex, 1);
	};

	$scope.addToNeededIngredients = function(recipeIndex, ingredientIndex) {
		console.log("2");
		var recipe = $scope.recipes[recipeIndex];
		recipe.neededIngredients.push(recipe.ownedIngredients[ingredientIndex]);
		recipe.ownedIngredients.splice(ingredientIndex, 1);
	};

}])
.controller('RecipeController', ['$scope', '$routeParams', 'Recipes', function($scope, $routeParams, Recipes) {
	$scope.recipe = Recipes.recipeWithId($routeParams.id);
}])
.controller('RestaurantController', ['$scope', '$routeParams', 'Restaurants', function($scope, $routeParams, Restaurants) {
	$scope.restaurant = Restaurants.restaurantWithId($routeParams.id);
	$scope.restaurant.distance *= 0.000621371; // Convert distance in meters to miles
	$scope.restaurant.distance = $scope.restaurant.distance.toFixed(2);
}]);