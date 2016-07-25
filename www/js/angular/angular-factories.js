
app
.factory('ProductService', ['$rootScope', 'ProductServiceResource', 'SpecificCategoryServiceResource', 'StorageService',
  function($rootScope, ProductServiceResource, SpecificCategoryServiceResource, StorageService){
    return {
        query: function(calback, slug) {
            if (!slug) {
                ProductServiceResource.query({subdomain:$rootScope.apiPrefix}, calback);
                return StorageService.getObject('ProductService_' + $rootScope.apiPrefix);
            } else {
                SpecificCategoryServiceResource.query({subdomain:$rootScope.apiPrefix, slug:slug}, calback);
                return StorageService.getObject('ProductService_' + $rootScope.apiPrefix + '_' + slug);
            }
        }
    };
}])
.factory('ProductServiceResource', ['$resource',
  function($resource){
    return $resource('http:///:subdomain.shopomoto.com/api/products', { subdomain:'@subdomain' }, {
        query: {method:'GET', isArray:false}
    }
  );
}])
.factory('CategoryService', ['$rootScope', 'CategoryServiceResource', 'StorageService',
  function($rootScope, CategoryServiceResource, StorageService){
    return {
        query: function(calback) {
            CategoryServiceResource.query({subdomain:$rootScope.apiPrefix}, calback);
            return StorageService.getObject('CategoryService_' + $rootScope.apiPrefix);
        }
    };
}])
.factory('CategoryServiceResource', ['$resource',
  function($resource){
    return $resource('http:///:subdomain.shopomoto.com/api/products/categories', { subdomain:'@subdomain' }, {
        query: {method:'GET', isArray:false}
    }
  );
}])
.factory('SpecificCategoryServiceResource', ['$resource',
  function($resource){
    return $resource('http:///:subdomain.shopomoto.com/api/products_cat/:slug', { subdomain:'@subdomain', slug:'@slug' }, {
        query: {method:'GET', isArray:false}
    }
  );
}])
.factory('OrderService', ['$resource',
  function($resource){
    return $resource('http:///:subdomain.shopomoto.com/api/orders', { subdomain:'@subdomain' }, {
        post: {method:'POST', isArray:false}
    }
  );
}]);

app.factory('StorageService', [function()  {
    var service = {};

    service.set = function(key, value) {
            localStorage.setItem(key, value);
        };
    service.setObject = function(key, value) {
            localStorage.setItem(key, angular.toJson(value));
        };
    service.get = function(key) {
            return localStorage.getItem(key);
        };
    service.getObject = function(key) {
            return angular.fromJson(localStorage.getItem(key));
        };

    return service;
}]);

app.factory('AuthenticationService',
    ['Base64', '$http', '$cookies', '$rootScope', '$timeout',
    function (Base64, $http, $cookies, $rootScope, $timeout) {
        var service = {};

        service.Login = function (username, password, callbackOk, callbackFail) {

            $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode(username + ':' + password);
            $http.post('http://shopomoto.com/api/users/me')
                .success(function (response) {
                    callbackOk(response);
                }).error(function (response) {
                    callbackFail(response);
                });
        };

        service.SetCredentials = function (username, token, keepMeIn) {
            var authdata = Base64.encode(':' + token);

            $rootScope.authdata = authdata;
            $rootScope.apiPrefix = username;

            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
            if (keepMeIn) {
                $cookies.putObject('authdata', $rootScope.authdata);
                $cookies.put('apiPrefix', $rootScope.apiPrefix);
            }

            // console.log('cookies was set', $cookies['globals']);
        };

        service.ClearCredentials = function () {
            $rootScope.authdata = {};
            $rootScope.apiPrefix = '';
            $cookies.remove('authdata');
            $cookies.remove('apiPrefix');
            $http.defaults.headers.common.Authorization = 'Basic ';
        };

        return service;
    }]);

app.factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

    /* jshint ignore:end */
});
