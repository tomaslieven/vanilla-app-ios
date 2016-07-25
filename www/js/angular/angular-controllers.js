// global controller
app.controller('global', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    $rootScope.goTo = function(where) {
        $location.path('/' + where);
    };
}]);


// login page controller
app.controller('login', ['$scope', '$rootScope', '$location', '$cookies', 'AuthenticationService', 'StorageService', function($scope, $rootScope, $location, $cookies, AuthenticationService, StorageService) {
	$scope.loginError = '';
	$scope.loginInProgress = false;
    $scope.keepMeIn = $cookies.get('keepMeIn') == 'true' || false;

	/* TODO: only for developing */
	//$scope.email = 'demo';
	//$scope.password = 'pondelok';

	$scope.tryLogin = function() {
		$scope.loginError = '';

		if ($.trim($scope.email) == '') {
			$scope.loginError = 'Please fill the correct email';
			return true;
		} else if ($.trim($scope.password) == '') {
			$scope.loginError = 'Please fill your password';
			return true;
		}
		$scope.loginInProgress = true;
		AuthenticationService.Login($scope.email, $scope.password, function(response) {
                AuthenticationService.SetCredentials($scope.email, response.app.token, $scope.keepMeIn);
                $rootScope.cart = StorageService.getObject('cart_' + $rootScope.apiPrefix) || {priceTotal:0, items: []};
                $cookies.put('keepMeIn', $scope.keepMeIn);
                $location.path('/products');
            }, function() {
                $scope.loginError = 'You cannot login with this email and password';
                $scope.loginInProgress = false;
            });
		/*
		var token = 'f1cbe1335fd3ca027f090ce0b9dba1ee';
		$http.defaults.headers.common['Authorization'] = 'Basic ' + token;
		*/
	};
}]);


// products page controller
app.controller('products', ['$scope', '$rootScope', '$timeout', '$location', 'StorageService', 'ProductService', 'CategoryService', 'AuthenticationService', function($scope, $rootScope, $timeout, $location, StorageService, ProductService, CategoryService, AuthenticationService) {
    $scope.cartList = [];

    $rootScope.currentCustomer = {
              "email": "anonymous@que.cz",
              "first_name": "John",
              "last_name": "Doe",
              "username": "john.doe",
              "billing": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "company": "",
                    "address_1": "969 Market",
                    "address_2": "",
                    "city": "San Francisco",
                    "state": "CA",
                    "postcode": "94103",
                    "country": "US",
                    "email": "anonymous@que.cz",
                    "phone": "(555) 555-5555"
                  },
              "shipping": {
                "first_name": "John",
                "last_name": "Doe",
                "company": "",
                "address_1": "969 Market",
                "address_2": "",
                "city": "San Francisco",
                "state": "CA",
                "postcode": "94103",
                "country": "US"
                  }
                };

    $scope.getUserNick = function() {
        return $rootScope.currentCustomer.first_name.substring(0,1) + $rootScope.currentCustomer.last_name.substring(0,1);
    };

    $scope.categories = CategoryService.query(function(data) { // success
        $scope.categories = data.product_categories;
        StorageService.setObject('CategoryService_' + $rootScope.apiPrefix, data.product_categories);
    });

    //

    $scope.products = ProductService.query(function(data) { // success
        $scope.products = data.products;
        StorageService.setObject('ProductService_' + $rootScope.apiPrefix, data.products);
    });
    // console.log('test, ', test);

    $scope.addToCart = function(product) {
       // console.log('$scope.cartList: ', $scope.cartList);
       // console.log('indeOf: ', $scope.cartList.indexOf(product));
       var foundInCart = false;
       angular.forEach($rootScope.cart.items, function(item) {
            if (item.id == product.id) {
                item.cartItemsCount++;
                foundInCart = true;
            }
       });

       if (!foundInCart) {
            product.cartItemsCount = 1;
            product.isSwiped = false
            $rootScope.cart.items.push(product);
       }

        $rootScope.cart.priceTotal = (parseFloat($rootScope.cart.priceTotal) + parseFloat(product.price)).toFixed(2);
        StorageService.setObject('cart_' + $rootScope.apiPrefix, $rootScope.cart);
    };

    $scope.deleteAllItems = function() {
        if (confirm('Do you really want to delete all items in the cart ?')) {
            $rootScope.cart.items = [];
            $rootScope.cart.priceTotal = 0;
            StorageService.setObject('cart_' + $rootScope.apiPrefix, $rootScope.cart);
        }
    };

    $scope.deleteItem = function(product) {
        product.isSwiped = true;
        $timeout(function() {
            angular.forEach($rootScope.cart.items, function(item, index) {
                if (item.id == product.id) {
                    $rootScope.cart.items.splice(index, 1);
                    $rootScope.cart.priceTotal = (parseFloat($rootScope.cart.priceTotal) - (parseFloat(item.price) * item.cartItemsCount)).toFixed(2);
                }
            });

            StorageService.setObject('cart_' + $rootScope.apiPrefix, $rootScope.cart);

        }, 600);
    };

    $scope.logout = function() {
        if (confirm('Do you really want to log out ?')) {
            AuthenticationService.ClearCredentials();
            $location.path('/login');
        }
    };

    $scope.setCategory = function(slug) {
        if (slug != '') {
            $scope.products = ProductService.query(function(data) { // success
                $scope.products = data.products;
                StorageService.setObject('ProductService_' + $rootScope.apiPrefix + '_' + slug, data.products);
            }, slug);
        } else {
            $scope.products = StorageService.getObject('ProductService_' + $rootScope.apiPrefix);
        }

    };

    $scope.goToCheckout = function() {
        if ($rootScope.cart.items.length > 0) {
            $rootScope.goTo('payment');
        }
    };
}]);


// customer page controller
app.controller('customer', ['$scope', '$cookies', function($scope, $cookies) {
    // user personal info
    $scope.user = $cookies.getObject('user') || { name:'John', surname:'Smith', phone:'(123) 456-7891', address:'350 5th Ave', zip:'10118', city:'New York NY' };
}]);


// payment page controller
app.controller('payment', ['$scope', '$rootScope', '$cookies', function($scope, $rootScope, $cookies) {
    $scope.paymentIndex = 0;
    $scope.paymetnMethods = [{'method_id':'cash', 'method_title':'Manually added'}, {'method_id':'card', 'method_title':'Paid with card'}];
    $scope.cashReceived = 0;

    $rootScope.payment_details = {
                            'method_id': 'cash',
                            'method_title': 'Manually added',
                            'paid': true,
                            'transaction_id': '4jjs0al5zdwu434n29'
                        };

    $scope.setPayment = function(index) {
        $scope.paymentIndex = index;
        $rootScope.payment_details.method_id = $scope.paymetnMethods[index].method_id;
        $rootScope.payment_details.method_title = $scope.paymetnMethods[index].method_title;
    };

    $scope.addMoney = function(value) {
        if ($scope.isCalculatorUsed) {
            $scope.cashReceived = 0;
            $scope.isCalculatorUsed = false;
        }
        $scope.cashReceived += value;
    };

    $scope.alwaysPositive = function(value) {
        return Math.abs(value);
    };

    $scope.isReceivedMore = function() {
        return $scope.cashReceived > parseFloat($rootScope.cart.priceTotal);
    }

    $scope.isCalculatorUsed = false;
    $scope.calculator = function(value) {
        if (!$scope.isCalculatorUsed) {
            if (value != '.' && value != 'x') {
                $scope.cashReceived = value;
            }
            $scope.isCalculatorUsed = true;
        } else {
            if (value == '.' && ($scope.cashReceived.indexOf('.') > -1 || $scope.cashReceived.length == 0)) return;

            if (value == 'x')  {
                $scope.cashReceived = 0;
            } else {
                $scope.cashReceived = ($scope.cashReceived != 0 ? $scope.cashReceived.toString() : '') + value;
            }

        }
    };
}]);

// confirmation page controller
app.controller('confirmation', ['$scope', '$rootScope', 'StorageService', 'OrderService', function($scope, $rootScope, StorageService, OrderService) {
    $scope.totalPaid = angular.copy($rootScope.cart.priceTotal);

    console.log('$rootScope.currentCustomer: ', $rootScope.currentCustomer);
    console.log('typeof $rootScope.currentCustomer == \'undefined\': ', typeof $rootScope.currentCustomer == 'undefined');

    if (typeof $rootScope.currentCustomer == 'undefined') {
        $rootScope.goTo('products');
        return;
    } else if (typeof $rootScope.payment_details == 'undefined') {
        $rootScope.goTo('payment');
        return;
    };

    // PREPARE ORDER FOR SAVING
    var line_items = [];
    for (var i=0; i < $rootScope.cart.items.length; i++) {
        var item = $rootScope.cart.items[i];
        line_items.push({
                        "product_id": item.id,
                        "quantity": item.cartItemsCount,
                        "total_tax": item.price * item.cartItemsCount,
                        "subtotal_tax": item.price,
                        "tax_class": item.tax_class
                    });
    }

     var payload = {
                "order": {
                    "line_items": line_items,
                    "billing_address": {
                        "first_name": $rootScope.currentCustomer.billing.first_name,
                        "last_name": $rootScope.currentCustomer.billing.last_name,
                        "email": $rootScope.currentCustomer.billing.email,
                        "phone": $rootScope.currentCustomer.billing.phone
                    },
                    "payment_details": $rootScope.payment_details,
                    "note": "one note second note",
                    "created_at": "2015-01-26T20:00:21Z",
                    "status": "completed"
                }
            };

    OrderService.post({subdomain:$rootScope.apiPrefix}, payload, function() { console.log('order was sended successfully'); });

    // DELETE CART ITEMS
    $rootScope.cart.items = [];
    $rootScope.cart.priceTotal = 0;
    StorageService.setObject('cart_' + $rootScope.apiPrefix, $rootScope.cart);
    $rootScope.payment_details = undefined;

}]);
