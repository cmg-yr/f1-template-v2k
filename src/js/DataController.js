app.controller('DataController', ($scope, $http, $interpolate, $location) => {

  $scope.style = {
    buttonText: "Buy Now"
  }

  $scope.misc = {
    almostReady: "You're Almost Ready!",
    currentYear: new Date().getFullYear(),
    callAvailability: "Monday through Friday 8:00 AM to 8:00 PM EST, Saturday 9:00 AM to 2:00 PM EST.",
    fdaShort: "*THESE PRODUCT ARE NOT APPROVED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE.",
    fdaLong: "*The statements made on our websites have not been evaluated by the FDA (U.S. Food & Drug Administration). These products are not intended to diagnose, cure or prevent any disease. The information provided by this website, email, or this company is not a substitute for a face-to-face consultation with your health care professional and should not be construed as individual medical advice. If there is a change in your medical condition, please stop using our products immediately and consult your health care professional. Do not use if safety seal is broken or missing. For adult use only, keep out of reach of children under 18 years of age."
  }

  // ==========================================
  // Controller Functions
  // ==========================================

  $scope.option = null
  $scope.popup = {}

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

  $scope.checkout = () => {
    if ($scope.current.option !== null) {
      const offerType = $('input:radio[name=offer-type]:checked').val()
      window.location.href = `checkout.html?option=${$scope.current.optionIndex}&offer=${offerType}`
      
    } else {
      $scope.popup.showError('Please select an option')
    }
  }

  $scope.offerType = $location.search().offer

  $scope.payment = () => {
    $scope.popup.showProcessing()

    $scope.form.crm = {
      campaignId: $scope.brand.campaignId,
      productId: $scope.current.option.productId,
      shippingId: $scope.current.option.shippingId
    }

    console.log('processing')

    $http.post('https://payment-processa.herokuapp.com/payment', $scope.form).then(res => {
      const response = res.data
      if (response.responseCode === '100') {
        saveSession($scope.form)
        window.location.href = `receipt.html?option=${$scope.current.optionIndex}&orderId=${response.orderId}`

      } else {
        $scope.popup.showError(
          response.errorMessage.replace('campaign', 'product').replace('Campaign', 'Product'), `Code ${response.responseCode}`)
      }
    }, response => {
      $scope.popup.showError(response.data)
    })
  }

  $scope.formatContainer = (container, quantity) => {
    return quantity > 1 ? container + 's' : container
  }

  $scope.getDate = () => {
    return new Date().toDateString()
  }

  $scope.session = sessionStorage


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
    const option = $location.search().option || 0
    $scope.orderId = $location.search().orderId || ''

    $scope.brand = response.data
    // $scope.brand.product.description = $interpolate($scope.brand.product.description)($scope)

    $http.get('config/ingredients.json').then(response => {
      $scope.brand.product.options = $scope.brand.product.options.map(option => {
        return {
          ...option,
          ingredients: response.data[option.ingredients]
        }
      })
      $scope.current = {
        optionIndex: option,
        option: $scope.brand.product.options[option]
      }
    })
  })

})

function saveSession(form) {
  delete form.creditCard
  delete form.crm
  Object.assign(sessionStorage, form)
}