// angular.module('services', []);

// create Angular application
var app = angular.module('app', ['ngAnimate', 'ngCookies', 'ngResource', 'ngRoute', 'ngSanitize', 'ngTouch', 'ngImgCache']);

// started when application run
app
/* routers */
.config(function($routeProvider) {
    // define default URL
    $routeProvider.otherwise('/login');

    // direct hash routes to pages
    $routeProvider
    .when('/products', {
        templateUrl: 'pages/products.html',
        controller: 'products'
    }).when('/customer', {
        templateUrl: 'pages/customer.html',
        controller: 'customer'
    }).when('/payment', {
        templateUrl: 'pages/payment.html',
        controller: 'payment'
    }).when('/confirmation', {
        templateUrl: 'pages/confirmation.html',
        controller: 'confirmation'
    }).when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'login'
    });
})
/* routers : end */
.run(['$rootScope', '$timeout', '$http', '$cookies', '$location', 'StorageService', function($rootScope, $timeout, $http, $cookies, $location, StorageService){
    $rootScope.pageIsLoaded = false;



    $rootScope.$on('$stateChangeStart', function(ev,data) {
        $rootScope.pageIsLoaded = false;
    });

    $rootScope.$on('$viewContentLoaded', function(ev,data) {
        $timeout(function() {
            $rootScope.pageIsLoaded = true;
        }, 1000);
    });

    console.log('Application was run');
    // keep user logged in after page refresh
    $rootScope.authdata = $cookies.getObject('authdata') || '';
    $rootScope.apiPrefix = $cookies.get('apiPrefix') || '';
    if ($rootScope.authdata != '') {
        $http.defaults.headers.common['Authorization'] = 'Basic :' + $rootScope.authdata; // jshint ignore:line
        $rootScope.cart = StorageService.getObject('cart_' + $rootScope.apiPrefix) || {priceTotal:0, items: []};
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && $rootScope.authdata == '') {
            $location.path('/login');
        }
    });

    FastClick.attach(document.body);
}]);


app.directive('customSelect', ['$timeout', function($timeout) {
    return {
        restrict: 'C',
        link: function (scope, elem, attr) {
            $(elem[0]).find('.value').click(function() {
                if (!$(elem[0]).find('ul').is(':visible')) {
                    $(elem[0]).find('ul').show();
                    $timeout(function() {
                        $(document).bind('click.customSelect', function(event) {
                            $(elem[0]).find('ul').hide();
                            $(document).unbind('.customSelect');
                        });
                    });
                }
            });
            $(elem[0]).on('click', 'li', function() {
                $(elem[0]).find('.value').html($(this).html());
            });
        }
    };
 }]);
