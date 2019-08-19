//const app = angular.module('ElminaraApp', ['ngAnimate'])

var app = angular.module("App", []);

app.config(['$locationProvider', ($locationProvider) => {
  $locationProvider.html5Mode({
    enabled: true,
    reloadOnChange: true,
    requireBase: false
  })
}])

app
  .directive('bottle', () => {
    return {
      restrict: 'E',
      templateUrl: 'src/components/Bottle.html'
    }
  })
  .directive('header', () => {
    return {
      restrict: 'E',
      templateUrl: 'src/components/Header.html'
    }
  })
  .directive('footer', () => {
    return {
      restrict: 'E',
      templateUrl: 'src/components/Footer.html'
    }
  })
  .directive('optionBox', () => {
    return {
      restrict: 'E',
      templateUrl: 'src/components/Option.html'
    }
  })
  .directive('popup', () => {
    return {
      restrict: 'E',
      templateUrl: 'src/components/Popup.html'
    }
  })