/**
 * Created by AYUSH on 4/20/2017.
 */
// public/core.js

var Todo = angular.module('Todo', []);

function mainController($scope, $http) {
    $scope.formData = {};


    $http.get('/login')
        .success(function (data) {
            $scope.data = data;

            $http.get(data.user + '/todos')
                .success(function (data) {
                    $scope.todos = data;
                    console.log(data);
                })
                .error(function (data) {
                    console.log('Error: ' + data);
                });
            //globalVariable=data.user;
            console.log(data);
        })
        .error(function (data) {
            console.log('Error: ' + data);
        });


    // when landing on the page, get all todos and show them


    // when submitting the add form, send the text to the node API
    $scope.createTodo = function (user) {
        $http.post(user + '/todos', $scope.formData)
            .success(function (data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.login = function () {
        alert('done');
        $http({
            method: 'POST',
            url: 'http://localhost:5000/login',
            data: $scope.formData
        })
            .success(function (data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.user = data;
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };


    // delete a todo after checking it
    $scope.deleteTodo = function (user, id) {
        console.log('done');
        $http.get(user + '/delete/' + id)
            .success(function (data) {
                $scope.todos = data;

                $http.get(user + '/todos')
                    .success(function (data) {
                        $scope.todos = data;
                        console.log(data);
                    })
                    .error(function (data) {
                        console.log('Error: ' + data);
                    });
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.updateTodo = function (user, id) {
        console.log('done');
        $http.get(user + '/update/' + id)
            .success(function (data) {
                $scope.todos = data;
                $http.get(user + '/todos')
                    .success(function (data) {
                        $scope.todos = data;
                        console.log(data);
                    })
                    .error(function (data) {
                        console.log('Error: ' + data);
                    });

                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

}

