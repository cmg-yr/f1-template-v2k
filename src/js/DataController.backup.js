//app.controller('DataController', ($scope, $http, $interpolate, $location) => {
app.controller("LandingPageCtrl", function($rootScope, $scope, $http, $compile, $timeout, $location) {
  $scope.style = {
    buttonText: "Buy Now"
  }

  $scope.misc = {
    almostReady: "You're Almost Ready!",
    currentYear: new Date().getFullYear(),
    callAvailability: "Monday - Sunday: 24 hours, 7 days a week",
    returnAddress: "15568 Brookhurst St. #339, Westminster, CA 92683",
    fdaShort: "*THESE PRODUCT ARE NOT APPROVED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE.",
    fdaLong: "*The statements made on our websites have not been evaluated by the FDA (U.S. Food & Drug Administration). These products are not intended to diagnose, cure or prevent any disease. The information provided by this website, email, or this company is not a substitute for a face-to-face consultation with your health care professional and should not be construed as individual medical advice. If there is a change in your medical condition, please stop using our products immediately and consult your health care professional. Do not use if safety seal is broken or missing. For adult use only, keep out of reach of children under 18 years of age."
  }

  // ==========================================
  // Controller Functions
  // ==========================================

  $scope.option = null
  $scope.popup = {}

  $scope.testCards = ['2100000000000000', '3100000000000000']
  $scope.isTestCard = cardNumber => $scope.testCards.includes(cardNumber)

  $scope.popup.showProcessing = () => {
    $scope.popup.visible = true
    $scope.popup.processing = true
    $scope.popup.error = false
  }

  $scope.popup.showError = (message, title = '') => {
    $scope.popup.visible = true
    $scope.popup.error = true
    $scope.popup.processing = false
    $scope.popup.title = title
    $scope.popup.message = message
  }

  $scope.popup.close = () => {
    $scope.popup.visible = false
    $scope.popup.processing = false
    $scope.popup.error = false
  }

  $scope.select = (id) => {
    $scope.option = id

    const options = document.getElementsByClassName('option')
    const element = document.getElementById(id)

    Array.prototype.forEach.call(options, (el) => el.classList.remove('border-primary', 'option-active'))
    element.classList.add('border-primary', 'option-active')
  }

  $scope.createProspect = () => {
    $scope.popup.showProcessing()
    sessionStorage.form = JSON.stringify($scope.form)

    window.location.href = `/thankyou.html`
  }

  $scope.payment = () => {
    $scope.popup.showProcessing()
    try {
      $scope.form = Object.assign(JSON.parse(sessionStorage.form), $scope.form)
    } catch (err) {
      $scope.popup.showError('Customer information missing', 'Error')
      return
    }

    $scope.form.crm = $scope.product.crm

    if (!$scope.isTestCard($scope.form.creditCard.number)) {
      $scope.popup.showError('Order has been black listed', 'Error')
      return
    }

    window.location.href = `/receipt.html?orderId=10285`

  }

  $scope.formatContainer = (container, quantity) => {
    return quantity > 1 ? container + 's' : container
  }

  $scope.getDate = () => {
    return new Date().toDateString()
  }
  try {
    $scope.session = JSON.parse(sessionStorage.form)
  } catch (err) {}


  // ==========================================
  // Initialization
  // ==========================================

  $http.get('config/style.json').then(response => {
    $scope.style = Object.assign($scope.style, response.data)

    $http.get('config/fonts.json').then(response => {
      const fonts = response.data
      $scope.style.headerFont = `'${fonts[$scope.style.headerFontIndex].font}', 'Arial'`
    })

    // $http.get('https://bootswatch.com/api/4.json').then(response => {
    //   const themes = response.data.themes
    //   $scope.theme = themes[$scope.style.theme].cssMin
    // })
  })

  $http.get('config/data.json').then(response => {
    $scope.orderId = $location.search().orderId || ''

    $scope.product = response.data
    // $scope.product.description = $interpolate($scope.product.description)($scope)

    $http.get('config/ingredients.json').then(response => {
      // $scope.product.ingredients = response.data[$scope.product.ingredients]
      // $scope.product.ingredients2 = response.data[$scope.product.ingredients2]
      // $scope.product.ingredients3 = response.data[$scope.product.ingredients3]
    })
  })

})
