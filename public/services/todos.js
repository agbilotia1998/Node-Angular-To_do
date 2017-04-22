/**
 * Created by AYUSH on 4/20/2017.
 */
angular.module('todoService', [])

// super simple service
// each function returns a promise object
    .factory('Todos', ['$http',function($http) {
        return {
            get : function() {
                return $http.get(user+'/todos');
            },
            post : function(user,todoData) {
                return $http.post(user+'/todos', todoData);
            },
            get : function(user,id) {
                return $http.get(user+'/delete/' + id);
            }
        }
    }]);