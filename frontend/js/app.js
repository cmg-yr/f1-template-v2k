// polyfill for closet
if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s), i, el = this;
        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement)); 
        return el;
    };
}

/**global:angular**/
var app = angular.module("ElminaraApp", []);
app.run(function($rootScope, $http, $q, $compile, $timeout) {
    // Default parameters
    $rootScope.countryStateJson = {};
    $rootScope.processing = false;
    $rootScope.countriesData = [];
    $rootScope.statesData = [];
    $rootScope.allowed_country_codes = [];
    $rootScope.yearsData = [];
    $rootScope.monthsData = [];
    $rootScope.configData = window.elmConfigs || null;
    $rootScope.errorMessages = [];
    $rootScope.validating = false;
    $rootScope.couponValidated = false;
    $rootScope.isPageRedirect = false;
    $rootScope.validateGogoleCaptcha = false;
    $rootScope.hasGoogleCaptcha = false;
    $rootScope.googleCaptchaPublicKey = "6Le4rF8UAAAAAAUNcAJgB6T75T5Fd4r8ekZ0Ws16";
    // Default parameters for full offer page
    $rootScope.FullFormData = {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        billingSameAsShipping: 'yes',
        billingFirstName: '',
        billingLastName: '',
        billingAddress: '',
        billingCity: '',
        billingCountry: '',
        billingState: '',
        billingZip: '',
        cc_type: '',
        cc_number: '',
        expmonth: '',
        expyear: '',
        cvv: ''
    };
    if (document.getElementsByName('agreeCheckbox').length > 0) {
        $rootScope.FullFormData.agreeCheckbox = false;
    }
    // Default parameters for prospect page
    $rootScope.FormData = {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: '',
        state: '',
        zip: '',
        phone: '',
        email: ''
    };
    if (document.getElementsByName('agreeCheckbox').length > 0) {
        $rootScope.FormData.agreeCheckbox = false;
    }
    // Default parameters for checkout page
    $rootScope.CheckoutData = {
        billingSameAsShipping: 'yes',
        billingFirstName: '',
        billingLastName: '',
        billingAddress: '',
        billingCity: '',
        billingCountry: '',
        billingState: '',
        billingZip: '',
        cc_type: '',
        cc_number: '',
        expmonth: '',
        expyear: '',
        cvv: ''
    };
    if (document.getElementsByName('billingAgreeCheckbox').length > 0) {
        $rootScope.CheckoutData.billingAgreeCheckbox = false;
    }
    // Default parameters for remote upsell page
    $rootScope.RemoteUpsellFormData = {};
    // Default parameters for upsell page
    $rootScope.UpsellData = {};
    // Card types
    $rootScope.cardTypes=[
        {type:"visa",name:"Visa"},
        {type:"master",name:"Master Card"},
        {type:"maestro",name:"Maestro"},
        {type:"amex",name:"American Express"},
        {type:"discover",name:"Discover"},
        {type:"jcb",name:"JCB"},
        {type:"solo",name:"Solo"},
        {type:"visa_electron",name:"Visa Electron"}
    ];
    // Get config data
    $rootScope.getConfig = function() {
        return $q(function(resolve, reject) {
            if ($rootScope.configData) {
                if ($rootScope.configData.cards) {
                    $rootScope.cardTypes = angular.copy($rootScope.configData.cards);
                }
                resolve($rootScope.configData);
            } else {
                $http({
                    method: 'GET',
                    url: './ajax/config'
                }).then(function(response) {
                    $rootScope.configData = response.data;
                    if ($rootScope.configData.cards) {
                        $rootScope.cardTypes = angular.copy($rootScope.configData.cards);
                    }
                    resolve($rootScope.configData);
                }).catch(function() {
                    reject();
                });
            }
        });
    };
    // Method to check state exists or not for given country
    $rootScope.statesExists = function(cid) {
        var obj = {};
        var statesData = [];
        var islands = ["American Samoa", "Virgin Islands of the U.S.", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands", "Minor Outlying Islands", "Bajo Nuevo Bank", "Baker Island", "Howland Island", "Jarvis Island", "Johnston Atoll", "Kingman Reef", "Midway Islands", "Navassa Island", "Palmyra Atoll", "Serranilla Bank", "Wake Island"];
        angular.forEach($rootScope.countryStateJson, function(value, key) {
            if ((value.FIELD3.length && value.FIELD4.length) && value.FIELD4.indexOf(cid) === 0) {
                var state_code = value.FIELD4;
                state_code = value.FIELD4;
                // if (cid == 'US-') {
                //  state_code = state_code.replace(cid, '');
                // } else if (cid == 'CA-') {
                //  state_code = state_code.replace(cid, '');
                // }
                //*  Remove armed forces states from dropdown.
                var is_islands_in_list = parseInt($rootScope.configData.is_islands_in_list);
                var is_armed_forces_in_list = parseInt($rootScope.configData.is_armed_forces_in_list);
                if ((['US-'].indexOf(cid) != -1 && value.FIELD3.match(/Armed Forces/) != null && is_armed_forces_in_list === 0) || (islands.indexOf(value.FIELD3) != -1 && is_islands_in_list === 0)) {
                    return;
                }
                //removed island value
                if (['US-', 'CA-'].indexOf(cid) != -1) {
                    state_code = state_code.replace(cid, '');
                }
                obj = {
                    state_code: state_code,
                    state_name: value.FIELD3
                };
                statesData.push(obj);
            }
        });
        if(statesData.length === 0){
            statesData = [{
                state_code: 'n/a',
                state_name: 'N/A'
            }];
        }
        return statesData;
    };
    // Get countries data
    $rootScope.getCountries = function() {
        $rootScope.getConfig().then(function(config) {
            var countries = config.countries.replace("UK", "GB");
            $rootScope.allowed_country_codes = countries.length ? countries.split(',') : [];
            $http({
                method: 'GET',
                url: './frontend/storage/country_state.json',
                dataType: 'json'
            }).then(function(response) {
                $rootScope.countryStateJson = response.data;
                var obj = {};
                var cid;
                angular.forEach($rootScope.countryStateJson, function(value, key) {
                    if ($rootScope.allowed_country_codes.length) {
                        if ((value.FIELD1.trim().length && value.FIELD2.trim().length) && $rootScope.allowed_country_codes.indexOf(value.FIELD2) != -1) {
                            cid = value.FIELD2 + '-';
                            var statesData = $rootScope.statesExists(cid);
                            if (statesData.length) {
                                obj = {
                                    country_code: value.FIELD2,
                                    country_name: value.FIELD1
                                };
                                $rootScope.countriesData.push(obj);
                            }
                        }
                    } else {
                        if ((value.FIELD1.trim().length && value.FIELD2.trim().length)) {
                            cid = value.FIELD2 + '-';
                            var statesData = $rootScope.statesExists(cid);
                            if (statesData.length) {
                                obj = {
                                    country_code: value.FIELD2,
                                    country_name: value.FIELD1
                                };
                                $rootScope.countriesData.push(obj);
                            }
                        }
                    }
                });
                if ($rootScope.FormData.country != undefined || $rootScope.CheckoutData.billingCountry || $rootScope.FullFormData.country || $rootScope.FullFormData.billingCountry) {
                    $rootScope.getStates();
                }
            }).catch(function(response) {
                $rootScope.errorMessages = ['Countries record not found, Please try again later'];
                $rootScope.modalShow();
            });
        }).catch(function() {
            $rootScope.errorMessages = ['Config record not found, Please try again later'];
            $rootScope.modalShow();
        });
    };
    // Get state data
    $rootScope.getStates = function() {
        $rootScope.statesData = [];
        var cid;
        if ($rootScope.FormData.country != '') {
            cid = $rootScope.FormData.country + '-';
        } else if ($rootScope.CheckoutData.billingCountry != '') {
            cid = $rootScope.CheckoutData.billingCountry + '-';
        } else if ($rootScope.FullFormData.country != '') {
            cid = $rootScope.FullFormData.country + '-';
        } else if ($rootScope.FullFormData.billingCountry != '') {
            cid = $rootScope.FullFormData.billingCountry + '-';
        }
        $rootScope.statesData = $rootScope.statesExists(cid);
    };
    // Get country and state from city's name
    $rootScope.matchGeoData = function() {
        // http://maps.googleapis.com/maps/api/geocode/json?address=keshtopur&sensor=true
        var location = '';
        var elements = document.querySelectorAll('[data-geo-trigger]');
        for (key = 0; key < elements.length; key++) {
            var element = elements[key];
            var value = angular.element(element).val();
            location += ' ' + value;
        }
        var geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(location) + '&sensor=true';
        $http.get(geoUrl).then(function(response) {
            if (response.status == 200) {
                if (!response.data || response.data == undefined) return false;
                if (response.data.results == undefined || !Array.isArray(response.data.results)) return false;
                if (response.data.results[0] == undefined || response.data.results[0].address_components == undefined) return false;
                var locData = response.data.results[0].address_components;
                var country_code = '';
                for (var i = locData.length - 1; i >= 0; i--) {
                    var locObj = locData[i];
                    var short_name = locObj.short_name;
                    var types = locObj.types;
                    for (var j = 0; j < types.length; j++) {
                        var type = types[j];
                        if (type == 'country') country_code = short_name;
                        //If state
                        var delay = 0;
                        if (type == 'administrative_area_level_1') {
                            // short_name = country_code+"-"+short_name;
                            for (var k = 0; k < $rootScope.statesData.length; k++) {
                                var state_code = $rootScope.statesData[k].state_code;
                                if (state_code == short_name) {
                                    break;
                                }
                                if (state_code == country_code + "-" + short_name) {
                                    short_name = state_code;
                                    break;
                                }
                            }
                            delay = 100;
                        }
                        var tagName = '[data-geo-' + type.replace(/_/g, '-') + ']';
                        var elements = document.querySelectorAll(tagName);
                        for (key = 0; key < elements.length; key++) {
                            var element = elements[key];
                            var targetModel = element.getAttribute('ng-model');
                            var targetModelBreak = targetModel.split(".");
                            if (targetModelBreak.length != 2) continue;
                            $rootScope.setModelValue(targetModelBreak[0], targetModelBreak[1], short_name, delay);
                        }
                    }
                }
            }
        }).catch(function(response) {});
    };
    $rootScope.setModelValue = function(form, key, value, delay) {
        $timeout(function() {
            $rootScope[form][key] = value;
            if (key == 'country') $rootScope.getStates();
        }, delay);
    };
    // Populate months drop-down
    $rootScope.getMonths = function() {
        var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var obj = {};
        for (var monthNumber = 0; monthNumber <= 11; monthNumber++) {
            obj = {
                month_num: ("0" + (monthNumber + 1)).slice(-2),
                month_name: "(" + ("0" + (monthNumber + 1)).slice(-2) + ") " + monthArray[monthNumber]
            };
            $rootScope.monthsData.push(obj);
        }
    };
    // Populate years drop-down
    $rootScope.getYears = function() {
        var count = 20;
        var card_years = document.querySelector('[data-card-years]');
        if (card_years !== null) {
            card_years = parseInt(card_years.getAttribute('data-card-years'));
            if (card_years >= 0) {
                count = card_years;
            }
        }
        var thisYear = new Date().getFullYear();
        var obj = {};
        for (var i = thisYear; i <= thisYear + count; i++) {
            obj = {
                year_num: i.toString().substring(2),
                year_name: i
            };
            $rootScope.yearsData.push(obj);
        }
    };
    // Card regex patterns
    $rootScope.cardPatternFullValidRegex = {
        'visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
        'master': /^5[1-5][0-9]{14}$/,
        'maestro': /^(5018|5020|5038|5612|5893|6304|6390|6759|676[1-3]|0604)/,
        'amex': /^3[47][0-9]{13}$/,
        'discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/,
        'jcb': /^(?:2131|1800|35\d{3})\d{11}$/,
        'diners': /^(54|55)/,
        'solo': /^(6334|6767)/,
        'laser': /^(6304|670[69]|6771)/,
        'visa_electron': /^(6304|670[69]|6771)/
    };
    //Block Card Bins
    $rootScope.validateBIN = function(cc_number) {
        var block_cards = $rootScope.configData.is_block_bins && $rootScope.configData.is_block_bins == 1 && $rootScope.configData.block_bins ? $rootScope.configData.block_bins : [];
        for (var i = 0; i < block_cards.length; i++) {
            var block_card = block_cards[i];
            if (cc_number.startsWith(block_card)) {
                return false;
            }
        }
        return true;
    };
    // Check validations
    $rootScope.errorHandler = function(formFields, formType) {
        return $q(function(resolve, reject) {
            $rootScope.errorMessages = [];
            var error_messages = $rootScope.configData.error_messages;
            //Captcha
            if (typeof grecaptcha_value !== "undefined" && grecaptcha_value != undefined && grecaptcha_value != null) {
                formFields.grecaptcha_value = grecaptcha_value;
            }
            if (formType == 'coupon') {
                if (formFields == '') {
                    $rootScope.errorMessages.push(error_messages['coupon_code']);
                }
            } else {
                var alphaNumericValidRegex = /^[a-z0-9]+$/i;
                var alphaNumericSpaceDashValidRegex = /^[a-z\d\-_\s]+$/i;
                var telephoneValidRegex = /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i;
                var emailValidRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                var cvvValidRegex = /^[0-9]{3,4}$/;
                var test_cards = $rootScope.configData.test_cards && $rootScope.configData.test_cards[0].length ? $rootScope.configData.test_cards : [];
                var billingSameAsShipping = formFields.hasOwnProperty('billingSameAsShipping') ? formFields.billingSameAsShipping : 'no';
                angular.forEach(formFields, function(fieldValue, fieldKey) {
                    if (formType == 'full') {
                        if (billingSameAsShipping == 'yes') {
                            if ((fieldKey == 'firstName' || fieldKey == 'lastName' || fieldKey == 'address' || fieldKey == 'city' || fieldKey == 'country' || fieldKey == 'state') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'zip' && (!fieldValue || fieldValue == '' || !fieldValue.match(alphaNumericSpaceDashValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'phone' && (!fieldValue || fieldValue == '' || !fieldValue.match(telephoneValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'email' && (!fieldValue || fieldValue == '' || !fieldValue.match(emailValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear' || fieldKey == 'cvv') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((document.getElementsByName('agreeCheckbox').length > 0) && fieldKey == 'agreeCheckbox' && !fieldValue) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cvv' && (!fieldValue || fieldValue == '' || !fieldValue.match(cvvValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && !formFields.cc_type) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && (!fieldValue || !fieldValue.match($rootScope.cardPatternFullValidRegex[formFields.cc_type]) || !$rootScope.validateBIN(fieldValue)) && test_cards.indexOf(formFields.cc_number) == -1) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            }
                        } else {
                            if ((fieldKey == 'firstName' || fieldKey == 'lastName' || fieldKey == 'address' || fieldKey == 'city' || fieldKey == 'country' || fieldKey == 'state' || fieldKey == 'billingFirstName' || fieldKey == 'billingLastName' || fieldKey == 'billingAddress' || fieldKey == 'billingCity' || fieldKey == 'billingCountry' || fieldKey == 'billingState') && (fieldValue == '' || !fieldValue)) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'zip' || fieldKey == 'billingZip') && (!fieldValue || fieldValue == '' || !fieldValue.match(alphaNumericSpaceDashValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'phone' && (!fieldValue || fieldValue == '' || !fieldValue.match(telephoneValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'email' && (!fieldValue || fieldValue == '' || !fieldValue.match(emailValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear' || fieldKey == 'cvv') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((document.getElementsByName('agreeCheckbox').length > 0 || document.getElementsByName('billingAgreeCheckbox').length > 0) && (fieldKey == 'agreeCheckbox' || fieldKey == 'billingAgreeCheckbox') && !fieldValue) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear' || fieldKey == 'billingAgreeCheckbox') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cvv' && (!fieldValue || fieldValue == '' || !fieldValue.match(cvvValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && !formFields.cc_type) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && (!fieldValue || !fieldValue.match($rootScope.cardPatternFullValidRegex[formFields.cc_type]) || !$rootScope.validateBIN(fieldValue)) && test_cards.indexOf(formFields.cc_number) == -1) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            }
                        }
                    } else if (formType == 'mail') {
                        if ((fieldKey == 'firstName') && (!fieldValue || fieldValue == '')) {
                            $rootScope.errorMessages.push(error_messages[fieldKey]);
                        } else if (fieldKey == 'phone' && (!fieldValue || fieldValue == '' || !fieldValue.match(telephoneValidRegex))) {
                            $rootScope.errorMessages.push(error_messages[fieldKey]);
                        } else if (fieldKey == 'email' && (!fieldValue || fieldValue == '' || !fieldValue.match(emailValidRegex))) {
                            $rootScope.errorMessages.push(error_messages[fieldKey]);
                        } else if (fieldKey == 'message' && (!fieldValue || fieldValue == '')) {
                            $rootScope.errorMessages.push(error_messages[fieldKey]);
                        } else if (!fieldValue || fieldValue == '') {
                            if (error_messages[fieldKey] != undefined) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else {
                                $rootScope.errorMessages.push("Please enter " + fieldKey.replace(/_/g, ' ') + "!");
                            }
                        }
                    } else {
                        if (billingSameAsShipping == 'yes') {
                            if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear' || fieldKey == 'billingAgreeCheckbox') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cvv' && (!fieldValue || fieldValue == '' || !fieldValue.match(cvvValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && !formFields.cc_type) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && (!fieldValue || !fieldValue.match($rootScope.cardPatternFullValidRegex[formFields.cc_type]) || !$rootScope.validateBIN(fieldValue)) && test_cards.indexOf(formFields.cc_number) == -1) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            }
                        } else {
                            if ((fieldKey == 'firstName' || fieldKey == 'lastName' || fieldKey == 'address' || fieldKey == 'city' || fieldKey == 'country' || fieldKey == 'state' || fieldKey == 'billingFirstName' || fieldKey == 'billingLastName' || fieldKey == 'billingAddress' || fieldKey == 'billingCity' || fieldKey == 'billingCountry' || fieldKey == 'billingState') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'zip' || fieldKey == 'billingZip') && (!fieldValue || fieldValue == '' || !fieldValue.match(alphaNumericSpaceDashValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'phone' && (!fieldValue || fieldValue == '' || !fieldValue.match(telephoneValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'email' && (!fieldValue || fieldValue == '' || !fieldValue.match(emailValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && !formFields.cc_type) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cc_number' && (!fieldValue || !fieldValue.match($rootScope.cardPatternFullValidRegex[formFields.cc_type]) || !$rootScope.validateBIN(fieldValue)) && test_cards.indexOf(formFields.cc_number) == -1) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((fieldKey == 'cc_type' || fieldKey == 'cc_number' || fieldKey == 'expmonth' || fieldKey == 'expyear' || fieldKey == 'billingAgreeCheckbox') && (!fieldValue || fieldValue == '')) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if (fieldKey == 'cvv' && (!fieldValue || fieldValue == '' || !fieldValue.match(cvvValidRegex))) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            } else if ((document.getElementsByName('agreeCheckbox').length > 0 || document.getElementsByName('billingAgreeCheckbox').length > 0) && (fieldKey == 'agreeCheckbox' || fieldKey == 'billingAgreeCheckbox') && !fieldValue) {
                                $rootScope.errorMessages.push(error_messages[fieldKey]);
                            }
                        }
                    }
                    //Confirm email check if exists
                    if(
                        fieldKey === 'confirmEmail' && formFields.hasOwnProperty('email') &&
                        formFields.email != formFields.confirmEmail
                    ){
                        $rootScope.errorMessages.push(error_messages['confirmEmail']);
                    }
                });
                //Additional Checkboxes
                var cboxes = document.querySelectorAll('[name="additionalCheckbox[]"], [data-additional-checkbox]');
                var len = cboxes.length;
                for (var i = 0; i < len; i++) {
                    if (!cboxes[i].checked) {
                        if (cboxes[i].getAttribute('data-error-message')) {
                            $rootScope.errorMessages.push(cboxes[i].getAttribute('data-error-message'));
                        } else {
                            $rootScope.errorMessages.push(error_messages.additionalCheckbox + '-' + (i + 1) + '!');
                        }
                    }
                }
                //Additional Radioboxes
                var rbtns = document.querySelectorAll('[data-additional-radio]');
                var len = rbtns.length;
                var rgroups = [];
                for (var i = 0; i < len; i++) {
                    var elemgroup = rbtns[i].getAttribute('name');
                    if (rgroups[elemgroup] == undefined) rgroups[elemgroup] = [];
                    rgroups[elemgroup].push(rbtns[i]);
                }
                for (key in rgroups) {
                    var checked = false;
                    var errorMsg = error_messages.additionalCheckbox + '-' + (key) + '!';
                    //Get error message from first radio
                    if (rgroups[key][0].getAttribute('data-error-message')) {
                        errorMsg = rgroups[key][0].getAttribute('data-error-message');
                    }
                    for (var j = 0; j < rgroups[key].length; j++) {
                        if (rgroups[key][j].checked) {
                            checked = true;
                            break;
                        }
                    }
                    if (!checked) {
                        $rootScope.errorMessages.push(errorMsg);
                    }
                }
            }
            // Add google captcha error
            if ($rootScope.configData.show_google_captcha && $rootScope.hasGoogleCaptcha) {
                $( "body" ).append( $( '<script src="https://www.google.com/recaptcha/api.js" async defer></script>' ) );
                if ($rootScope.validateGogoleCaptcha === false) {
                    $rootScope.errorMessages.push('Captcha verification failed!');
                }
            }
            
            if ($rootScope.errorMessages.length) {
                reject();
            } else {
                resolve();
            }
        });
    };

    // Google re captcha api
    $rootScope.loadGoogleCaptcha = function() {
        $rootScope.hasGoogleCaptcha = true;
        $rootScope.getConfig().then(function() {
            if ($rootScope.configData.show_google_captcha) {
                $( "body" ).append( $( '<script src="https://www.google.com/recaptcha/api.js" async defer></script>' ) );
            } 
        });
    }
    
    // Modal window show
    $rootScope.modalShow = function(type) {
        //console.log('d');
        angular.element(document.querySelector(".error_handler_overlay")).removeClass('hide').addClass('show');
        //Switch type of content
        if (type != undefined && type == 'iframe') {
            angular.element(document.querySelector(".error_handler_body_content_iframe")).removeClass('hide').addClass('show');
            angular.element(document.querySelector(".error_handler_body_content_error")).removeClass('show').addClass('hide');
        } else {
            angular.element(document.querySelector(".error_handler_body_content_iframe")).removeClass('show').addClass('hide');
            angular.element(document.querySelector(".error_handler_body_content_error")).removeClass('hide').addClass('show');
        }
        //add noscroll to body
        var bodyElement = document.querySelector('body');
        bodyElement.className += " noscroll";
        //iOS Scroll fix
        if ($rootScope.is_iOS) {
            var modalElements = document.querySelectorAll('.error_handler_overlay .error_handler_body .error_handler_body_content');
            var len = modalElements.length;
            for (var i = 0; i < len; i++) {
                var elem = modalElements[i];
                if (elem == undefined) continue;
                if (elem.className.indexOf("ios_scroll") < 0) {
                    elem.className += " ios_scroll fullheight";
                }
            }
        }
    };
    // Modal window hide
    $rootScope.modalHide = function(e) {
        var iframeElement = document.querySelector('.error_handler_overlay iframe');
        if (iframeElement !== undefined || iframeElement != null) {
            iframeElement.src = 'about:blank';
        }
        angular.element(document.querySelector(".error_handler_overlay")).removeClass('show').addClass('hide');
        //remove noscroll to body
        var bodyElement = document.querySelector('body');
        bodyElement.className = bodyElement.className.replace(" noscroll", "");
    };
    // Get the querystrings
    $rootScope.getQueryStrings = function() {
        var assoc = {};
        var decode = function(s) {
            return decodeURIComponent(s.replace(/\+/g, " "));
        };
        var queryString = location.search.substring(1);
        var keyValues = queryString.split('&');
        for (var i in keyValues) {
            var key = keyValues[i].split('=');
            if (key.length > 1) {
                assoc[decode(key[0])] = decode(key[1]);
            }
        }
        return assoc;
    };
    //iOS detection
    var is_iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    $rootScope.is_iOS = is_iOS; //is_iOS;
    // Trigger ajax methods
    $rootScope.trigger = function(postData) {
        $http.post(SITE_BASE_URL + '/ajax/trigger', postData).then(function(response) {
            $rootScope.isPageRedirect = true;
        }).catch(function(response) {
            $rootScope.isPageRedirect = true;
        });
    };
    // Method to track given mail id
    $rootScope.triggerMailIdTracking = function() {
        var queryStrings = $rootScope.getQueryStrings();
        var url = window.location.pathname;
        var currentPage = url.split('/').pop();
        if (currentPage == 'checkout' && (!queryStrings.hasOwnProperty('order_id') || !queryStrings.order_id.length)) {
            var postData = {
                triggerType: 'trackGovMail',
                processType: 'prospect'
            };
            $rootScope.trigger(postData);
        } else if (currentPage == 'thank-you' && (queryStrings.hasOwnProperty('order_id') && queryStrings.order_id.length)) {
            var postData = {
                triggerType: 'trackGovMail',
                processType: 'order'
            };
            $rootScope.trigger(postData);
        }
    };
    // Method to send mail
    $rootScope.triggerMail = function(isThankYou, getOrderID) {
        var queryStrings = $rootScope.getQueryStrings();
        if (isThankYou == undefined) isThankYou = false;
        var email_template = document.querySelector("[data-trigger-mail]");
        if (email_template !== null) {
            email_template = email_template.getAttribute('data-trigger-mail')
        }
        if (getOrderID !== undefined) queryStrings.order_id = getOrderID;
        if ((isThankYou && (queryStrings.hasOwnProperty('order_id') && queryStrings.order_id.length)) || email_template !== null) {
            var postData = {
                triggerType: 'OrderConfirmationMail',
                queryStrings: queryStrings,
                template: email_template !== null ? email_template : null,
            };
            $rootScope.pushMailData(postData);
            if (isThankYou) {
                $rootScope.triggerMails();
            }
            // $rootScope.trigger(postData);
        } else {
            $rootScope.isPageRedirect = true;
        }
        //If other pages, get template ID tag
    };
    //Send custom email from anywhere using angular function
    $rootScope.sendMail = function(id) {
        var queryStrings = $rootScope.getQueryStrings();
        var postData = {
            triggerType: 'OrderConfirmationMail',
            queryStrings: queryStrings,
            template: id,
        };
        $rootScope.trigger(postData);
    };
    $rootScope.pushMailData = function(data) {
        var mailArray = $rootScope.getMailArray();
        mailArray.push(data);
        // console.log("--Push");
        $rootScope.setMailArray(mailArray);
        // console.log("--Total Content");
        // console.log(mailArray);
    };
    $rootScope.triggerMails = function() {
        var mailArray = $rootScope.getMailArray();
        // console.log("--Retrieve Content");
        // console.log(mailArray);
        // return true;
        for (var i = 0; i < mailArray.length; i++) {
            var postData = mailArray[i];
            if (postData == undefined || postData == null) continue;
            // console.log("--Firing");
            // console.log(postData);
            $rootScope.trigger(postData);
        }
        $rootScope.setMailArray(null);
    };
    $rootScope.getMailArray = function() {
        try {
            var mailArray = localStorage ? localStorage.getItem("mail_array") : null;
            if (mailArray != null && mailArray != undefined && IsJsonString(mailArray)) {
                var mailArr = JSON.parse(mailArray);
                return mailArr;
            } else {
                return [];
            }
        } catch (err) {
            return [];
        }
    };
    $rootScope.setMailArray = function(data) {
        try {
            if (localStorage) {
                if (data == null || data.length == 0) {
                    localStorage.removeItem("mail_array");
                } else {
                    localStorage.setItem("mail_array", JSON.stringify(data));
                }
            }
        } catch (err) {}
    };
    $rootScope.triggerMailIdTracking();
    // Method to track site traffic
    $rootScope.triggerTraffic = function() {
        var url = window.location.href;
        var postData = {
            page_url: url,
            triggerType: 'triggerTraffic'
        };
        var response = $rootScope.trigger(postData);
    };
    // Progress overlay
    $rootScope.processOverlay = function(display) {
        if (display == 'validating') {
            $rootScope.validating = true;
        } else if (display != 'validating' && display == true) {
            $rootScope.processing = display;
        }
        var modal_parent = document.querySelector('.dom_manipulator');
        var elements = document.getElementsByClassName('process_overlay');
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
        if (display == 'validating') {
            modal_parent.innerHTML += '<div class="error_handler_overlay process_overlay ng-scope show" ng-click="modalHide($event);"><div class="error_handler_body"><table><tr><td><img src="' + spinnerurl + '"></td><td><span class="process_text text-muted">Validating ...</span></td></tr></table></div></div>';
        } else if (display != 'validating' && display == true) {
            modal_parent.innerHTML += '<div class="error_handler_overlay process_overlay ng-scope show" ng-click="modalHide($event);"><div class="error_handler_body"><table><tr><td><img src="' + spinnerurl + '"></td><td><span class="process_text text-muted">Processing ...</span></td></tr></table></div></div>';
        }
    };
    // Open footer links in popups
    $rootScope.openLinkPopup = function(link) {
        var iframeElement = document.querySelector('.error_handler_overlay iframe');
        angular.element(document.querySelector(".error_handler_overlay .iframeLoader")).removeClass('hide').addClass('show');
        iframeElement.src = link;
        $rootScope.modalShow('iframe');
        iframeElement.onload = function(event) {
            angular.element(document.querySelector(".error_handler_overlay .iframeLoader")).removeClass('show').addClass('hide');
        };
    };
    $rootScope.closeLinkPopup = function(event) {
        event.stopPropagation();
        var modalElement = document.querySelector('.iframe_overlay');
        modalElement.parentNode.removeChild(modalElement);
        //remove no scroll class from body
        var bodyElement = document.querySelector('body');
        bodyElement.className = bodyElement.className.replace(" noscroll", "");
    };
    //Scroll to elements
    $rootScope.scrollTo = function(to, duration) {
        if (duration <= 0) return;
        currentScrollPos = window.pageYOffset || document.documentElement.scrollTop;
        var difference = to - currentScrollPos;
        var perTick = difference / duration * 10;
        setTimeout(function() {
            window.scrollTo(0, currentScrollPos + perTick);
            if (currentScrollPos == to) return;
            $rootScope.scrollTo(to, duration - 10);
        }, 1);
    };
    $rootScope.position = function(element) {
        var top = 0,
            left = 0;
        do {
            top += element.offsetTop || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while (element);
        return {
            top: top,
            left: left
        };
    };
    //Bind utilities
    $rootScope.initUtilities = function() {
        //Login parameters
        var access_token = $rootScope.getCookie('access_token');
        $rootScope.access_token = [];
        $rootScope.access_token_valid = false;
        if (access_token != "" && access_token != undefined && access_token != null) {
            $rootScope.access_token = JSON.parse(access_token);
            $rootScope.access_token_valid = true;
            var access_tag = "data-access";
            var elements = document.querySelectorAll('[' + access_tag + ']');
            for (key = 0; key < elements.length; key++) {
                var element = elements[key];
                var tk = element.getAttribute(access_tag);
                element.innerHTML = $rootScope.access_token[tk];
            }
        }
        //Open links in popups
        document.addEventListener('click', function(event){
            if(event.target.hasAttribute('data-open-popup') && 
               event.target.getAttribute('data-open-popup') === 'true'){
                event.preventDefault ? event.preventDefault() : (event.returnValue = false);
                $rootScope.openLinkPopup(event.target.getAttribute('href'));
            }
        });
        //Scroll to top of the page
        var elements = document.querySelectorAll('[data-scroll-top]');
        for (key = 0; key < elements.length; key++) {
            var element = elements[key];
            element.onclick = function(event) {
                event.preventDefault ? event.preventDefault() : (event.returnValue = false);
                $rootScope.scrollTo(0, 600);
            };
        }
        //Scroll to defined section
        var elements = document.querySelectorAll('[data-scroll]');
        for (key = 0; key < elements.length; key++) {
            var element = elements[key];
            element.onclick = function(event) {
                event.preventDefault ? event.preventDefault() : (event.returnValue = false);
                var goToElement = document.querySelector(this.getAttribute('data-scroll'));
                var rect = $rootScope.position(goToElement);
                $rootScope.scrollTo(rect.top - 20, 600);
            };
        }
        //Additional validations without form
        var elements = document.querySelectorAll('[data-checkbox-validate], [data-additional-validate]');
        for (key = 0; key < elements.length; key++) {
            var element = elements[key];
            element.onclick = function(event) {
                event.preventDefault ? event.preventDefault() : (event.returnValue = false);
                $rootScope.errorMessages = [];
                var error_messages = $rootScope.configData.error_messages;
                //Checkboxes
                var cboxes = document.querySelectorAll('[name="additionalCheckbox[]"], [data-additional-checkbox]');
                var len = cboxes.length;
                for (var i = 0; i < len; i++) {
                    if (!cboxes[i].checked) {
                        if (cboxes[i].getAttribute('data-error-message')) {
                            $rootScope.errorMessages.push(cboxes[i].getAttribute('data-error-message'));
                        } else {
                            $rootScope.errorMessages.push(error_messages.additionalCheckbox + '-' + (i + 1) + '!');
                        }
                    }
                }
                //Radio buttons
                var rbtns = document.querySelectorAll('[data-additional-radio]');
                var len = rbtns.length;
                var rgroups = [];
                for (var i = 0; i < len; i++) {
                    var elemgroup = rbtns[i].getAttribute('name');
                    if (rgroups[elemgroup] == undefined) rgroups[elemgroup] = [];
                    rgroups[elemgroup].push(rbtns[i]);
                }
                for (key in rgroups) {
                    var checked = false;
                    var errorMsg = error_messages.additionalCheckbox + '-' + (key) + '!';
                    //Get error message from first radio
                    if (rgroups[key][0].getAttribute('data-error-message')) {
                        errorMsg = rgroups[key][0].getAttribute('data-error-message');
                    }
                    for (var j = 0; j < rgroups[key].length; j++) {
                        if (rgroups[key][j].checked) {
                            checked = true;
                            break;
                        }
                    }
                    if (!checked) {
                        $rootScope.errorMessages.push(errorMsg);
                    }
                }
                $rootScope.$apply();
                if ($rootScope.errorMessages.length) {
                    $rootScope.modalShow();
                } else if (this.getAttribute('href')) {
                    location.href = this.getAttribute('href');
                }
            };
        }
        //Trigger emails from previous form submit
        $rootScope.triggerMails();
    };
    // Allowed parameter injection
    $rootScope.campaignsParameters = {
        campaignId: 'campaign-id',
        // shippingId: 'shipping-id',
        productId: 'product-id',
        // productPrice: 'product-price',
        productQty: 'product-qty',
    };
    // Get URL parameters
    var QueryString = function() {
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return query_string;
    }();
    //Clear all selected products
    $rootScope.clearActiveProducts = function() {
        var selectedProduct = document.querySelectorAll('[data-product].active');
        for (var i = 0; i < selectedProduct.length; i++) {
            var aProduct = selectedProduct[i];
            aProduct.className = aProduct.className.replace(" active", "");
        }
    };
    $rootScope.calculateCartTotal = function() {
        $timeout(function() {
            var activeProducts = $rootScope.cart;
            var totalPrice = 0;
            for (var i in activeProducts) {
                var elem = activeProducts[i];
                if (elem != null && elem['data-product-price']) {
                    var qty = 1;
                    if (elem['data-product-qty']) qty = Number(elem['data-product-qty']);
                    var shipping_price = 0;
                    if (elem['data-shipping-price']) shipping_price = Number(elem['data-shipping-price']);
                    var product_price = Number(elem['data-product-price']);
                    if (elem['data-product-multiply-qty']) {
                        product_price = product_price * qty;
                    }
                    totalPrice += Number(product_price) + shipping_price;
                }
            }
            var subTotalPrice = totalPrice;
            //Additional price elements on page
            var additionalPrices = document.querySelectorAll('[data-additional-price].active');
            for (var i = 0; i < additionalPrices.length; i++) {
                var elem = additionalPrices[i];
                if (elem.getAttribute('data-additional-price') != undefined && elem.getAttribute('data-additional-price') != null) {
                    totalPrice += Number(elem.getAttribute('data-additional-price'));
                }
            }
            //document.querySelector('[data-product-total]').innerHTML = totalPrice.toFixed(2);
            var totalElements = document.querySelectorAll('[data-product-sub-total]');
            for (var i = 0; i < totalElements.length; i++) {
                var aElem = totalElements[i];
                aElem.innerHTML = subTotalPrice.toFixed(2);
            }
            totalElements = document.querySelectorAll('[data-product-total]');
            for (var i = 0; i < totalElements.length; i++) {
                var aElem = totalElements[i];
                aElem.innerHTML = totalPrice.toFixed(2);
            }
        });
    };
    // Campaign Block Switcher
    $rootScope.campaignSwitcher = function() {
        $rootScope.initCart();
        // Bind switching
        var product_blocks = document.querySelectorAll('[data-product]');
        if (product_blocks.length > 0) {
            for (key in product_blocks) {
                var product = product_blocks[key];
                product.onclick = function() {
                    if (!this.hasAttribute('data-product-checkbox')) {
                        //Radio: Selects only 1 product
                        $rootScope.clearActiveProducts();
                        this.className += " active";
                        $rootScope.calculateCartTotal();
                    } else {
                        //Checkbox: Selects multiple products
                        if (this.className.indexOf(" active") > -1) {
                            this.className = this.className.replace(" active", "");
                        } else {
                            this.className += " active";
                        }
                        $rootScope.calculateCartTotal();
                    }
                    //Add products to cart
                    $rootScope.setCart();
                };
            }
        }
    };
    //Cart Handler    
    $rootScope.incrementQty = function(productId, qty, lastLimit) {
        if (angular.isDefined($rootScope.cart[productId])) {
            var productQrt = angular.isDefined($rootScope.cart[productId]['productQty']) ? $rootScope.cart[productId]['productQty'] : 0;
            if (lastLimit <= productQrt) {
                return 0;
            }
            $rootScope.cart[productId]['productQty'] = !angular.isDefined($rootScope.cart[productId]['productQty']) ? 1 : parseInt($rootScope.cart[productId]['productQty']) + parseInt(qty);
            $rootScope.cart[productId]['data-product-qty'] = $rootScope.cart[productId]['productQty'];
            $rootScope.cart[productId]['data-product-price'] = angular.isDefined($rootScope.cart[productId]['data-product-price']) ? parseFloat($rootScope.cart[productId]['data-product-price']).toFixed(2) : 0.00;
            if (angular.isDefined($rootScope.cart[productId]['data-total-product-qty-price'])) {
                $rootScope.cart[productId]['data-total-product-qty-price'] = parseFloat($rootScope.cart[productId]['data-product-price'] * $rootScope.cart[productId]['productQty']).toFixed(2);
            }
            document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-product-qty', $rootScope.cart[productId]['productQty']);
            document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-total-product-qty-price', $rootScope.cart[productId]['data-total-product-qty-price']);
            // console.log('in count', $rootScope.cart, productId, qty);
            // $rootScope.calculateCartTotal();
        }
        document.querySelector("[data-product-id = '" + productId + "']").className += ' active';
        // console.log(document.querySelector("[data-product-id = '" + productId + "']").className);
        $rootScope.setCart();
        $rootScope.initCart();
        $rootScope.calculateCartTotal();
    };
    $rootScope.descQty = function(productId, qty) {
        var removeActiveClass = false;
        if (angular.isDefined($rootScope.cart[productId])) {
            if ($rootScope.cart[productId]['productQty'] > 0) {
                $rootScope.cart[productId]['productQty'] = parseInt($rootScope.cart[productId]['productQty']) - parseInt(qty);
                $rootScope.cart[productId]['data-product-qty'] = $rootScope.cart[productId]['productQty'];
                $rootScope.cart[productId]['data-product-price'] = angular.isDefined($rootScope.cart[productId]['data-product-price']) ? parseFloat($rootScope.cart[productId]['data-product-price']).toFixed(2) : 0.00;
                if (angular.isDefined($rootScope.cart[productId]['data-total-product-qty-price'])) {
                    $rootScope.cart[productId]['data-total-product-qty-price'] = parseFloat($rootScope.cart[productId]['data-product-price'] * $rootScope.cart[productId]['productQty']).toFixed(2);
                }
                if ($rootScope.cart[productId]['productQty'] == 0) {
                    $rootScope.cart[productId]['productQty'] = 1;
                    document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-product-qty', $rootScope.cart[productId]['productQty']);
                    document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-total-product-qty-price', $rootScope.cart[productId]['data-product-price']);
                    removeActiveClass = true;
                } else {
                    document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-product-qty', $rootScope.cart[productId]['productQty']);
                    document.querySelector("[data-product-id = '" + productId + "']").setAttribute('data-total-product-qty-price', $rootScope.cart[productId]['data-total-product-qty-price']);
                }
            } else if ($rootScope.cart[productId]['productQty'] <= 0) {
                removeActiveClass = true;
            }
        }
        if (removeActiveClass) {
            delete $rootScope.cart[productId];
            document.querySelector("[data-product-id = '" + productId + "']").className = document.querySelector("[data-product-id = '" + productId + "']").className.replace(' active', '');
        }
        $rootScope.setCart();
        $rootScope.initCart();
        $rootScope.calculateCartTotal();
    };
    $rootScope.changeQty = function(productId, incDescValue, minLimit, maxLimit) {
        incDescValue = parseInt(incDescValue);
        var productQty = angular.isDefined($rootScope.cart[productId]) ? $rootScope.cart[productId]['productQty'] : 0;
        if ((productQty >= minLimit && productQty <= maxLimit)) {
            if (incDescValue > 0) {
                $rootScope.incrementQty(productId, incDescValue, maxLimit);
            } else if (incDescValue < 0) {
                incDescValue = (-1) * incDescValue;
                $rootScope.descQty(productId, incDescValue);
            }
        }
    };
    $rootScope.loadCart = function() {
        try {
            if (localStorage) {
                var cart = localStorage.getItem("cart");
                if (cart != null && cart != undefined && IsJsonString(cart)) {
                    var cartArr = JSON.parse(localStorage.getItem("cart"));
                    return cartArr;
                }
            }
        } catch (err) {}
        return {};
    };
    $rootScope.clearCart = function() {
        $rootScope.cart = {};
        try {
            if (localStorage) {
                var cart = localStorage.getItem("cart");
                if (cart != null && cart != undefined) {
                    localStorage.removeItem("cart");
                }
            }
        } catch (err) {}
    };
    $rootScope.objectToArray = function(object) {
        var arr = [];
        for (var key in object) {
            var element = object[key];
            arr.push(element);
        }
        return arr;
    };
    $rootScope.loadCartInScope = function() {
        $rootScope.cart = $rootScope.loadCart();
        if (Object.keys($rootScope.cart).length > 0) {
            $rootScope.cart_array = $rootScope.objectToArray($rootScope.cart);
        }else{
          $rootScope.cart_array = [];
        }
    };
    $rootScope.initCart = function() {
        //Clear selected products if cart-clear data tag is found
        var deletecart = "[data-cart-clear]";
        if (document.querySelector(deletecart) != null || QueryString['cart_clear'] != undefined) {
            $rootScope.clearCart();
        }
        //Products to select on this page
        var targetProducts = [];
        //Select the products in page from cart
        $rootScope.loadCartInScope();
        if ($rootScope.cart) {
            for (key in $rootScope.cart) {
                var productDetail = $rootScope.cart[key];
                var targetProduct = "";
                var matchCounters = 0;
                for (prop in productDetail) {
                    var tag = $rootScope.campaignsParameters[prop];
                    if (tag == undefined || tag == null) continue;
                    tag = "data-" + tag;
                    var value = productDetail[prop];
                    targetProduct += '[' + tag + '="' + value + '"]';
                    matchCounters++;
                }
                if (matchCounters > 0) {
                    targetProducts.push(targetProduct);
                }
            }
        }
        //Select product in page from URL parameters
        matchCounters = 0;
        var targetProduct = "";
        for (key in $rootScope.campaignsParameters) {
            var getParam = $rootScope.campaignsParameters[key].replace("-", "_");
            var tag = 'data-' + $rootScope.campaignsParameters[key];
            if (QueryString[getParam] == undefined) continue;
            targetProduct += '[' + tag + '="' + QueryString[getParam] + '"]';
            matchCounters++;
        }
        if (matchCounters > 0) {
            if (!document.querySelector(targetProduct).hasAttribute('data-product-checkbox')) {
                targetProducts = [];
                $rootScope.clearCart();
            }
            targetProducts.push(targetProduct);
        }
        //Select / Activate products which were matched through cart or URL
        if (targetProducts.length > 0) {
            $rootScope.clearActiveProducts();
            for (var i = 0; i < targetProducts.length; i++) {
                targetTag = targetProducts[i];
                if (document.querySelector(targetTag) != null && document.querySelector(targetTag).className.indexOf(" active") < 0) {
                    document.querySelector(targetTag).className += " active";
                }
            }
        }
        //Set cart based on active products
        $rootScope.setCart();
        //Recalculate total
        $rootScope.calculateCartTotal();
    };
    $rootScope.setCart = function() {
        var targetPackage = "[data-product]";
        var selectedProduct = document.querySelectorAll(targetPackage);
        var cart = $rootScope.loadCart();
        var pageCart = [];
        if (selectedProduct != undefined && selectedProduct != null && selectedProduct.length > 0) {
            for (var i = 0; i < selectedProduct.length; i++) {
                var aProduct = selectedProduct[i];
                var productDetail = {};
                var productId = 0;
                var defaultTags = [];
                for (key in $rootScope.campaignsParameters) {
                    var tag = 'data-' + $rootScope.campaignsParameters[key];
                    defaultTags.push(tag);
                    var aValue = aProduct.getAttribute(tag);
                    if (aValue == undefined || aValue == '') {
                        continue;
                    } else {
                        if (key == 'productId') productId = aValue;
                        productDetail[key] = aValue;
                    }
                }
                //Custom property tags
                var attrs = aProduct.attributes;
                for (var key = 0; key < attrs.length; key++) {
                    var tag = attrs[key].nodeName;
                    var aValue = attrs[key].value;
                    // if (defaultTags.indexOf(tag)>=0) continue;
                    if (aValue == undefined || aValue == '') {
                        continue;
                    } else {
                        productDetail[tag] = aValue;
                    }
                }
                //Remove or Add product depending on whether it has active class or not
                if (aProduct.className.indexOf(" active") < 0) {
                    if (cart[productId] != undefined && pageCart.indexOf(productId) < 0) {
                        delete cart[productId];
                    }
                } else {
                    cart[productId] = productDetail;
                    pageCart.push(productId);
                }
            }
        }
        // console.log("SET");
        // console.log(cart);
        try {
            if (localStorage) {
                localStorage.setItem("cart", JSON.stringify(cart));
                $rootScope.loadCartInScope();
                $rootScope.updateCouponPriceToCart();
            }
        } catch (err) {}
    };

    function IsJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    
    $rootScope.hasNewCartStorage = function (cartStorageName) {
        var cart = cartStorageName || 'elmCart';
        if (typeof localStorage != 'undefined' && localStorage[cart] && (JSON.parse(localStorage[cart])).length > 0) {
            var data = {};
            objArr = JSON.parse(localStorage[cart]);

            if (objArr && objArr.length > 0) {
                for (var i=0; i < objArr.length; i++) {
                    var kname = 'product'+(i+1);
                    data[kname] = {
                        productId : 'elm_'+objArr[i]['id'],
                        productQty : objArr[i]['qty']
                    };
                }
                return data;
            }
        }
        return $rootScope.cart;
    }
    // Get parameters from URL or hidden dynamic fields like campaign switcher
    $rootScope.getHiddenParameters = function(formData) {
        if (document.getElementsByName('coupon_code').length > 0 && $rootScope.couponValidated) {
            var couponCode = document.getElementById('coupon_code').value;
            formData.promo_code = couponCode;
        }
        // Checking for new Cart system if found then overwrite the selectedProduct obj with new cart storage
        var selectedProduct = $rootScope.hasNewCartStorage('elmCart');
        if (selectedProduct == undefined || selectedProduct == null || selectedProduct.length < 1) return true;
        for (key in $rootScope.campaignsParameters) {
            var tag = 'data-' + $rootScope.campaignsParameters[key];
            var value = "";
            var count = 0;
            for (var i in selectedProduct) {
                var aProduct = selectedProduct[i];
                var aValue = aProduct[key];
                if (aValue == undefined || aValue == '') {
                    continue;
                } else {
                    if (count > 0) value += ",";
                    value += aValue;
                }
                count++;
            } 
            
            if (value == undefined || value == '') {
                if (formData[key] != undefined && formData[key] != null) {
                    delete formData[key];
                }
            } else {
                formData[key] = value;
            }
        }
    };
    // Browser autofill patch
    $rootScope.browserAutofill = function(formType, append) {
        var countryDomKey = (append !== undefined ? append + 'Country' : 'country');
        var stateDomKey = (append !== undefined ? append + 'State' : 'state');
        if (document.querySelector('[ng-model="' + formType + '.' + countryDomKey + '"]') !== null) {
            var insert_parent = document.querySelector('[ng-model="' + formType + '.' + countryDomKey + '"]').parentNode;
            insert_parent.innerHTML += '<input class="fakecountry input-hidden" placeholder="Country" name="Country"><input class="fakestate input-hidden" placeholder="State" name="State">';
            $compile(insert_parent)($rootScope);
            var countryInput = document.querySelector('.fakecountry');
            var stateInput = document.querySelector('.fakestate');
            countryInput.onchange = function() {
                for (key in $rootScope.countriesData) {
                    var value = $rootScope.countriesData[key];
                    if (countryInput.value.toLowerCase() == value.country_name.toLowerCase()) {
                        $rootScope[formType][countryDomKey] = value.country_code;
                        $rootScope.getStates();
                        setTimeout(function() {
                            for (key2 in $rootScope.statesData) {
                                var value2 = $rootScope.statesData[key2];
                                if (stateInput.value.toLowerCase() == value2.state_name.toLowerCase()) {
                                    $rootScope[formType][stateDomKey] = value2.state_code;
                                    $rootScope.$apply();
                                    //Remove the fake fields
                                    insert_parent.removeChild(countryInput);
                                    insert_parent.removeChild(stateInput);
                                    return true;
                                }
                            }
                        }, 200);
                        return true;
                    }
                }
            }
        }
    };
    // Enable insurance checkbox
    $rootScope.enableInsurance = function(key) {
        $rootScope.getConfig().then(function() {
            if ($rootScope.configData[key] != 1) {
                var insureshipChk = document.querySelector('[name="insureshipCheckbox"]');
                if (insureshipChk) {
                    insureshipChk.checked = false;
                    if (document.querySelector('.insurance') && document.querySelector('.insurance') != undefined && document.querySelector('.insurance') != null) {
                        document.querySelector('.insurance').className += ' input-hidden';
                    }
                }
            }
        });
    };
    //Add messages to display in the modal
    $rootScope.pushErrorMessage = function(response) {
        if (response.data && response.data.apiResponse && response.data.apiResponse.response_message) {
            $rootScope.errorMessages = [response.data.apiResponse.response_message];
        } else {
            $rootScope.errorMessages = ['Something went wrong'];
        }
    };
    $rootScope.validateCoupon = function() {
        var couponCode = document.getElementById('coupon_code').value;
        $rootScope.errorHandler(couponCode, 'coupon').then(function() {
            $rootScope.processOverlay('validating');
            
            $http.post(SITE_BASE_URL + '/ajax/validate', {
                promo_code: couponCode,
                email: $rootScope.FullFormData.email
            }).then(function(response) {
                if (response.data.status == 'success') {
                    $rootScope.couponValidated = true;
                    if (response.data.apiResponse.hasOwnProperty('crm_type') && response.data.apiResponse.crm_type == 'triangle') {
                        $rootScope.updateCouponPriceToCart();
                    }
                } else {
                    if(response.data.apiResponse.hasOwnProperty('response_code') &&
                       response.data.apiResponse.response_code == 342){
                        $rootScope.errorMessages = ['Enter a valid email'];
                    }else{
                        $rootScope.errorMessages = ['Invalid coupon/promo code'];
                    }
                    $rootScope.modalShow();
                }
            }).catch(function(response) {
                //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                $rootScope.pushErrorMessage(response);
                $rootScope.modalShow();
            }).finally(function() {
                $rootScope.processOverlay(false);
                $rootScope.validating = false;
                $rootScope.processing = false;
            });
        }).catch(function() {
            $rootScope.modalShow();
        });
    };
    $rootScope.forceRedirect = function() {
        var redirectData = document.querySelector('[data-redirect-to]');
        var redirectPage = null;
        if (redirectData !== null) {
            redirectPage = redirectData.getAttribute('data-redirect-to');
        }
        return redirectPage;
    };
    //Cookie control
    $rootScope.setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    $rootScope.getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    //DOB 18+ validation
    $rootScope.dayList = {
        1: 1
    };
    $rootScope.yearList = {
        1900: 1900
    };
    for (var i = 1; i <= 31; i++) {
        $rootScope.dayList[i] = i;
    }
    $rootScope.dobMonthList = {
        1: 'January',
        2: 'February',
        3: 'March',
        4: 'April',
        5: 'May',
        6: 'June',
        7: 'July',
        8: 'August',
        9: 'September',
        10: 'October',
        11: 'November',
        12: 'December'
    };
    var cueenrtDay = new Date().getDate();
    var currentMonth = (new Date().getMonth()) + 1;
    var monthName = $rootScope.dobMonthList[currentMonth];
    var varCurrentYear = new Date().getFullYear();
    for (var i = 1900; i <= varCurrentYear; i++) {
        $rootScope.yearList[i] = i;
    }
    $rootScope.dobValidation = {
        hidePopup: false,
        dobDate: cueenrtDay,
        dobMonth: monthName,
        dobYear: varCurrentYear,
        dobConfirm: false,
        currentYear: varCurrentYear,
        isDOB18: false,
        showIsNot18Error: false,
        isNot18ErrorMsg: 'Sorry! Our product is not appropriate for individuals under 18.'
    };
    $rootScope.checkDobValidation = function(dobValidation) {
        $rootScope.dobValidation.showIsNot18Error = false;
        var monthVal = 1;
        //var insDate= new Date();
        var nowVal = Date.now();
        insDate = new Date(nowVal);
        var currentDate = new Date(insDate.getFullYear(), (insDate.getMonth() + 1), insDate.getDate(), insDate.getHours(), insDate.getMinutes(), insDate.getSeconds(), insDate.getMilliseconds());
        for (var i = 1; i <= 12; i++) {
            if ($rootScope.dobMonthList[i] == dobValidation.dobMonth) {
                monthVal = i;
                break;
            }
        }
        var userDate = new Date();
        userDate.setDate(dobValidation.dobDate);
        userDate.setFullYear(dobValidation.dobYear);
        userDate.setMonth(monthVal);
        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds   
        var ageYear = parseInt((Math.round(Math.abs((currentDate.getTime() - userDate.getTime()) / (oneDay)))) / 365);
        if (ageYear >= 18 && dobValidation.dobConfirm == true) {
            $rootScope.dobValidation.isDOB18 = true;
        } else {
            $rootScope.dobValidation.isDOB18 = false;
        }
        //console.log($rootScope.dobValidation.isDOB18);
    };
    $rootScope.validateDOBButton = function(ev) {
        if ($rootScope.dobValidation.dobConfirm == true) {
            $rootScope.modalHide(ev)
            $rootScope.dobValidation.hidePopup = true;
        }
    };
    $rootScope.addToCart = function(productId, productInfo, redirectTo) {
        if (productInfo.hasOwnProperty('validateCheckBox') && !productInfo.validateCheckBox) {
            return;
        }
        if (typeof productId === 'undefined') {
            console.error("A Product Id must be provided");
            return;
        }
        productInfo = productInfo || {};
        if (typeof productInfo !== 'object') {
            console.error("Product Info must be an Object");
            return;
        }
        $rootScope.cart = $rootScope.getCartDataFromStorage();
        if (!$rootScope.cart.hasOwnProperty(productId)) {
            $rootScope.cart[productId] = {
                productId: productId
            };
        }
        for (var key in productInfo) {
            $rootScope.cart[productId][key] = productInfo[key];
        }
        var defaultValues = {
            productPrice: 0.00,
            shippingPrice: 0.00,
            productQty: 1
        };
        for (var key in defaultValues) {
            if (!$rootScope.cart[productId].hasOwnProperty(key)) {
                $rootScope.cart[productId][key] = defaultValues[key];
            }
        }
        var qty = parseFloat($rootScope.cart[productId]['productQty']);
        var price = parseFloat($rootScope.cart[productId]['productPrice']);
        var shippingPrice = parseFloat($rootScope.cart[productId]['shippingPrice']);
        $rootScope.cart[productId]['subTotal'] = ((qty * price) + shippingPrice).toFixed(2);
        $rootScope.saveCartDataToStorage($rootScope.cart);
        if (typeof redirectTo !== 'undefined') {
            window.location.href = './' + redirectTo + window.location.search;
        }
    };
  
    $rootScope.updateCart = function(productId, productInfo, redirectTo) {
        if (productInfo.hasOwnProperty('validateCheckBox') && !productInfo.validateCheckBox) {
            return;
        }
        if (typeof productId === 'undefined') {
            console.error("A Product Id must be provided");
            return;
        }
        productInfo = productInfo || {};
        if (typeof productInfo !== 'object') {
            console.error("Product Info must be an Object");
            return;
        }

        if (!$rootScope.cart.hasOwnProperty(productId)) {
            $rootScope.cart[productId] = {
                productId: productId
            };
        }
        for (var key in productInfo) {
            $rootScope.cart[productId][key] = productInfo[key];
        }
        var defaultValues = {
            productPrice: 0.00,
            shippingPrice: 0.00,
            productQty: 1
        };
        for (var key in defaultValues) {
            if (!$rootScope.cart[productId].hasOwnProperty(key)) {
                $rootScope.cart[productId][key] = defaultValues[key];
            }
        }
        var qty = parseFloat($rootScope.cart[productId]['productQty']);
        var price = parseFloat($rootScope.cart[productId]['productPrice']);
        var shippingPrice = parseFloat($rootScope.cart[productId]['shippingPrice']);
        $rootScope.cart[productId]['subTotal'] = ((qty * price) + shippingPrice).toFixed(2);
        $rootScope.saveCartDataToStorage($rootScope.cart);
        if (typeof redirectTo !== 'undefined') {
            window.location.href = './' + redirectTo + window.location.search;
        }
    };
  
    $rootScope.removeFromCart = function(productId) {
        //$rootScope.cart = $rootScope.getCartDataFromStorage();
        if (!$rootScope.cart.hasOwnProperty(productId)) {
            return;
        }
        delete $rootScope.cart[productId];
        $rootScope.saveCartDataToStorage($rootScope.cart);
    };
  
    $rootScope.removeAllFromCart = function() {
        $rootScope.cart = {};
        $rootScope.saveCartDataToStorage({});
    };
  
    $rootScope.getCartTotal = function() {
        //$rootScope.cart = $rootScope.getCartDataFromStorage();
        var cartTotal = 0.00;
        if ($rootScope.getCartGlobalShipping()) {
            cartTotal += parseFloat($rootScope.getCartGlobalShipping());
        }
        
        for (var key in $rootScope.cart) {
            cartTotal += parseFloat($rootScope.cart[key].subTotal);
        }
        return cartTotal.toFixed(2);
    };
    
    $rootScope.isEmptyCart = function(){
        //$rootScope.cart = $rootScope.getCartDataFromStorage();
        if(Object.keys($rootScope.cart).length === 0){
            return true;
        }
        return false;
    };

    $rootScope.getCartGlobalShipping = function() {
        try {
            var globalSh = 0;
            if ($rootScope.isEmptyCart() === false) {
                var gsh = [0];
                for (var key in $rootScope.cart) {
                    if (
                        $rootScope.cart[key].global_shipping !== undefined &&
                        $rootScope.cart[key].global_shipping !== ''
                        ) {
                        var v = parseFloat($rootScope.cart[key].global_shipping);
                        if (typeof v === 'number') {
                            gsh.push(v);
                        }
                    }
                }
                globalSh = Math.max.apply(0, gsh);
            }
        } catch (e) {
           var globalSh = 0; 
        }
        return globalSh.toFixed(2);
    };

    $rootScope.getCartQuantity = function(){
        try {
            if(Object.keys($rootScope.cart).length === 0){
                return 0;
            }
            return Object.keys($rootScope.cart).length;
        }catch(err) {
            return 0;
        } 
    };
  
    $rootScope.saveCartDataToStorage = function(cartData){
        try {
            localStorage.setItem('cart', JSON.stringify(cartData));
        } catch (e) {
            document.cookie = "cart=" + JSON.stringify(cartData);
        }
    };
  
    $rootScope.getCartDataFromStorage = function(){
        var cartData = {};
        try {
            cartData = JSON.parse(localStorage.getItem('cart'));
        } catch (e) {
            var cookieVars = document.cookie.split(";");
            for (var i in cookieVars) {
                var keyValue = cookieVars[i].trim();
                if (keyValue.startsWith("cart=")) {
                    var value = keyValue.replace('cart=', '', cookieVars[i].trim());
                    cartData = JSON.parse(value);
                    break;
                }
            }
        }
        return cartData || {};
    };
  
    $rootScope.updateCouponPriceToCart = function() {
        try {
            if (!$rootScope.couponValidated) {
                return false;
            }
            $rootScope.loadCartInScope();
            $rootScope.cart;
            if ($rootScope.cart) {
                var coupon = document.getElementById('coupon_code').value;
                var descPercentage = document.querySelector('[data-coupon="' + coupon + '"]').getAttribute('data-coupon-discount');
                descPercentage = Number(descPercentage);
                for (key in $rootScope.cart) {
                    var productDetail = $rootScope.cart[key];
                    var productId = $rootScope.cart[key]['productId'];
                    var elm = document.querySelector('[data-product-id="' + productId + '"].active');
                    if (!elm) continue;
                    var product_price = Number(elm.getAttribute('data-product-price'));
                    var new_product_price = Number((product_price * descPercentage) / 100);
                    new_product_price = new_product_price.toFixed(2);
                    var product_qty = Number(elm.getAttribute('data-product-qty'));
                    var total_product_qty_price = (Number(new_product_price * product_qty)).toFixed(2)
                    $rootScope.cart[key]['data-product-price'] = new_product_price;
                    $rootScope.cart[key]['data-total-product-qty-price'] = total_product_qty_price;
                }
            }
            localStorage.setItem("cart", JSON.stringify($rootScope.cart));
            $rootScope.loadCartInScope();
            $rootScope.calculateCartTotal();
        } catch (err) {}
    };
    //End
    // Check validations
    $rootScope.checkout3DValidation = function(formFields) {
        return $q(function(resolve, reject) {
            if ($rootScope.configData.is_3d_validation == 0 || $rootScope.configData.api_type != 'limelight') {
                resolve();
            } else {
                var totalAmount = (document.querySelector('[data-product-total]')) ? document.querySelector('[data-product-total]').innerHTMl : 0;
                totalAmount = totalAmount ? totalAmount : 0;
                $http({
                    method: 'POST',
                    url: 'ajax/save-ll3d-data',
                    data: {
                        cc_number: formFields.cc_number,
                        expmonth: formFields.expmonth,
                        expyear: formFields.expyear,
                        total_amount: totalAmount
                    }
                }).success(function(data) {
                    var iframe = document.createElement('iframe');
                    iframe.setAttribute("height", "0");
                    iframe.setAttribute("width", "0");
                    iframe.setAttribute("id", "ll3ds-iframe");
                    iframe.src = location.protocol + '//' + $rootScope.configData.base_url + 'll3dvalidation';
                    document.body.appendChild(iframe);
                    var intervalVar = setInterval(function() {
                        var htmlBody = iframe.contentDocument.getElementsByTagName('body')[0].innerHTML;
                        if ($rootScope.isJson(htmlBody)) {
                            var inerFrameHtml = JSON.parse(htmlBody);
                            if (inerFrameHtml.hasOwnProperty('error')) {
                                if (!inerFrameHtml.error) {
                                    $rootScope.CheckoutData.cavv = inerFrameHtml.cavv;
                                    $rootScope.CheckoutData.eci = inerFrameHtml.eci;
                                    $rootScope.CheckoutData.xid = inerFrameHtml.xid;
                                    $rootScope.CheckoutData.verify_3d_temp_id = inerFrameHtml.verify_3d_temp_id;
                                    resolve();
                                } else {
                                    if (inerFrameHtml.hasOwnProperty('message')) {
                                        $rootScope.errorMessages.push(inerFrameHtml.message);
                                    }
                                    reject();
                                }
                                iframe.src = '';
                                clearInterval(intervalVar);
                            }
                        }
                    }, 1000);
                }).error(function() {
                    reject();
                });
            }
        });
    };
    $rootScope.isJson = function(str) {
        var ret = false;
        try {
            JSON.parse(str);
            ret = true
        } catch (e) {
            ret = false;
        }
        return ret;
    };

    $rootScope.updateCurrencyRates = function(){
        $http.get('./ajax/update-currency-rates');
    };
    $rootScope.getConfig().then(function(configData){
        if(configData.currency_rates_update_required){
            $rootScope.updateCurrencyRates(configData);
        }
    });

    $rootScope.updateCurrency = function(formType){
        if(localStorage.hasOwnProperty('currencyChangeFormData')){
            var data = JSON.parse(localStorage.getItem('currencyChangeFormData'));
            if(data.country === $rootScope[formType]['country']){
                localStorage.removeItem('currencyChangeFormData');
                return;
            }
        }
        localStorage.setItem(
            'currencyChangeFormData', JSON.stringify($rootScope[formType])
        );
        var queryString = window.location.search.replace('?', '');
        var queryParams = queryString.split('&');
        var newQueryParams = [];
        for(var ii = 0; ii < queryParams.length; ii++){
            if(queryParams[ii].match(/current_country=/)){
                continue;
            }
            newQueryParams.push(queryParams[ii]);
        }
        newQueryParams.push('current_country=' + $rootScope[formType]['country']);
        newQueryString = newQueryParams.join('&').replace(/^&/, '');
        var endIndex = window.location.href.indexOf('?');
        if(endIndex > -1){
            window.location.href = window.location.href.substr(0, endIndex) + '?' + newQueryString;
        }else{
            window.location.href = window.location.href + '?' + newQueryString;
        }
    };
    
    $rootScope.loadFromCurrencyChangeFormData = function(formType){
        if(!localStorage.hasOwnProperty('currencyChangeFormData')){
            return;
        }
        if(!window.location.search.match(/current_country=/)){
            localStorage.removeItem('currencyChangeFormData');
            return;
        }
        if(localStorage.hasOwnProperty('currencyChangeFormData')){
            var data = JSON.parse(localStorage.getItem('currencyChangeFormData'));
            $rootScope[formType] = data;
            localStorage.setItem(
                'currencyChangeFormData', JSON.stringify($rootScope[formType])
            );
        }
    };

    $rootScope.showUrlErrorMessage = function(){
        var queryParts = location.search.replace('?', '').split('&');
        for(var ii = 0; ii < queryParts.length; ii++){
            if(queryParts[ii].trim().match(/^error=/)){
                $rootScope.errorMessages = [
                    decodeURIComponent(
                        (queryParts[ii].trim().replace(/^error=/, '') + '').replace(/\+/g, '%20')
                    )
                ];
                $rootScope.modalShow();
                return;
            }
        }
    };

    // Paay ThreeDS
    $rootScope.randomString = function (length) {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i)
            result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    $rootScope.initializePaayThreeDS = function() {
        return $q(function(resolve, reject) {
            if (!$rootScope.configData.isActivePaay || window.parent.location.pathname === '/sandbox/view') {
                console.log('sandbox');
                return resolve();
            }
            var el = angular.element(document.querySelector('form [ng-model$=".cc_number"]'));
            var modelAttr = el.attr('ng-model');
            if (!modelAttr.length) return resolve();
            var cForm = document.querySelector('form [ng-model$=".cc_number"]').closest("form");
            if (cForm.id) {
                var formIdName = cForm.id;
            } else {
                cForm.id ='paayForm';
                var formIdName = cForm.id;
            }
            var formType = modelAttr.replace('.cc_number', ''); // FullFormData
            var integrationUrl = SITE_BASE_URL +'/ajax/paay-three-ds';

            var m = $rootScope[formType]['expmonth'],
                y = $rootScope[formType]['expyear'],
                cc = $rootScope[formType]['cc_number'],
                amt = 10,
                t = $rootScope.randomString(13);
            cc = cc.replace(/-/g, '');
            
            if (m != '' && y != '' && cc != '' && t != '' && amt != '') {
                var tds = new ThreeDS(
                    formIdName,
                    integrationUrl,
                    {verbose: false, autoSubmit: false}
                );
                tds.verify(amt, cc, m, y, t, function (data) {
                    console.info('3ds success');
                    $rootScope[formType]['cavv'] = data.cavv;
                    $rootScope[formType]['eci'] = data.eci;
                    $rootScope[formType]['xid'] = data.xid;
                    return resolve();
                }, function (error) {
                    console.log(error);
                    return resolve();
                });

            } else{
                return resolve();
            }
        });
    }
    // END: ThreeDS

    $rootScope.$on("$includeContentLoaded", function(){
        $rootScope.showUrlErrorMessage();
    });

    $rootScope.checkoutPrefillCardData = function($event, formData, callback){
        formData.cc_type = 'visa';
        formData.expmonth = '12';
        formData.expyear = '50';
        formData.cvv = '123';
        if(formData.cardToken){
            callback($event, true);
        }
        Frames.submitCard().then(function(data) {
            formData.cc_number = '4242424242424242';
            formData.cardToken = data.cardToken;
            callback($event, true);
        }).catch(function (err) {
            var message = 'Please check your card details';
            if($rootScope.configData.error_messages.hasOwnProperty('checkout_gateway')){
                message = $rootScope.configData.error_messages.checkout_gateway;
            }
            $rootScope.configData.error_messages.cc_number = message;
            callback($event, true);
        })
    };
    //End
});
// Full offer page controller
app.controller("LandingOfferPageCtrl", function($rootScope, $scope, $http, $compile, $timeout) {
    // Google Captcha
    $rootScope.loadGoogleCaptcha();
    var captchaCallBack = function(res){
       $rootScope.validateGogoleCaptcha = true;
    };
    $scope.publicKey = $rootScope.googleCaptchaPublicKey;
    window.captchaCallBack = captchaCallBack;
    // Google Captcha

    $rootScope.getCountries();
    $rootScope.getMonths();
    $rootScope.getYears();
    // Reverse sets the cc_type based on cc_number
    $scope.$watch('FullFormData.cc_number', function() {
        for (cType in $rootScope.cardPatternFullValidRegex) {
            if ($scope.FullFormData.cc_number.match($rootScope.cardPatternFullValidRegex[cType])) {
                $scope.FullFormData.cc_type = cType;
                return true;
            }
        }
    });
    // Browser country / state autofill patch
    $rootScope.browserAutofill('FullFormData');
    // Open footer links in popup
    $rootScope.initUtilities();
    // Campaign Switcher
    $rootScope.campaignSwitcher();
    // Insurance checkbox available
    $rootScope.enableInsurance('split_charge');
    // Full offer form submit handler
    $scope.landingOfferPageSubmitHandler = function($event, internalCall) {
       
        if($rootScope.configData.api_type == 'checkout' && typeof internalCall == 'undefined'){
            $rootScope.checkoutPrefillCardData($event, $rootScope.FullFormData, arguments.callee);
            return;
        }
        $rootScope.getHiddenParameters($rootScope.FullFormData);
        var forceRedirectPage = $scope.redirectTo? $scope.redirectTo: $rootScope.forceRedirect();
        var forceRedirectTo = forceRedirectPage == null ? 'thank-you' : forceRedirectPage;
        if (document.getElementsByName('insureshipCheckbox').length > 0) {
            if (document.getElementsByName('insureshipCheckbox')[0].checked) {
                $rootScope.FullFormData.insureshipCheckbox = true;
            } else {
                $rootScope.FullFormData.insureshipCheckbox = false;
            }
        }
        $rootScope.errorHandler($rootScope.FullFormData, 'full').then(function() {
             var campaignId = '';
            for (var i in $rootScope.cart){
                if ('object' === typeof $rootScope.cart[i] && $rootScope.cart[i].hasOwnProperty('campaignId')) {
                    var campaignId = $rootScope.cart[i]['campaignId'];
                }
            }
            var redirect_to = parseInt($rootScope.configData.enable_upsells) ? 'upsell' : forceRedirectTo;
            $rootScope.processOverlay(true);
            $rootScope.FullFormData.current_url = window.location.href;
            $rootScope.FullFormData.next_url = './' + redirect_to;
            $rootScope.FullFormData.campaignId = campaignId;
            $rootScope.initializePaayThreeDS().then(function() {
                $http.post(SITE_BASE_URL + '/ajax/offer', $rootScope.FullFormData).then(function(response) {
                    if (response.data.status == 'success') {

                        if(response.data.hasOwnProperty('is_html') && response.data.is_html){
                            document.write(response.data.html_data);
                            document.close();
                            return;
                        }

                        var prospectID = response.data.apiResponse.prospectId;
                        var customerID = response.data.apiResponse.customerId;
                        var orderID = response.data.apiResponse.orderId;
                        $rootScope.triggerMail(false, orderID);
                        window.location.href = './' + redirect_to + '?' + (prospectID !== undefined ? 'prospect_id=' + prospectID + '&' : '') + 'customer_id=' + customerID + '&order_id=' + orderID;
                    } else {
                        $rootScope.processOverlay(false);
                        //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                        $rootScope.pushErrorMessage(response);
                        $rootScope.modalShow();

                        // Handle google captcha
                        $rootScope.configData.show_google_captcha = response.data.isActiveCaptcha;
                        $rootScope.loadGoogleCaptcha();
                        $rootScope.validateGogoleCaptcha = false;
                        if (window.grecaptcha !== undefined) window.grecaptcha.reset();
                    }
                }).catch(function(response) {
                    $rootScope.processOverlay(false);
                    //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                    $rootScope.pushErrorMessage(response);
                    $rootScope.modalShow();
                }).finally(function() {
                    $rootScope.processing = false;
                });
            });
        }).catch(function() {
            $rootScope.modalShow();
        });
    };
});
// Prospect page controller
app.controller("LandingPageCtrl", function($rootScope, $scope, $http, $compile, $timeout) {
    $rootScope.getCountries();
    $rootScope.triggerTraffic(); //Call traffic function
    //Browser country / state autofill patch
    $rootScope.browserAutofill('FormData');
    //Open footer links in popup
    $rootScope.initUtilities();
    //Campaign Switcher
    $rootScope.campaignSwitcher();
    // Prospect form handler
    $scope.popup = {}

  $scope.testCards = ['2100000000000000', '3100000000000000']
  $scope.isTestCard = cardNumber => $scope.testCards.includes(cardNumber)
    $scope.popup.showProcessing = function() {
    $scope.popup.visible = true
    $scope.popup.processing = true
    $scope.popup.error = false
  }

    $scope.createProspect =  function() {
    $scope.popup.showProcessing()
    sessionStorage.form = JSON.stringify($scope.form)

    window.location.href = `/thankyou.html`
  }

   $scope.landingPageSubmitHandler = function($event) {
        var forceRedirectPage = $scope.redirectTo? $scope.redirectTo: $rootScope.forceRedirect();
        var forceRedirectTo = forceRedirectPage == null ? 'checkout' : forceRedirectPage;
        $rootScope.FormData.campaignId = document.getElementsByName('campaignId').length > 0 ? document.getElementsByName('campaignId')[0].value : '';
        $rootScope.errorHandler($rootScope.FormData, 'prospect').then(function() {
            $rootScope.processOverlay(true);
            $http.post(SITE_BASE_URL + '/ajax/prospect', $rootScope.FormData).then(function(response) {
                if (response.data.status == 'success') {
                    $rootScope.triggerMail();
                    var prospectID = response.data.apiResponse.prospectId;
                    window.location.href = './' + forceRedirectTo + '?prospect_id=' + prospectID;
                } else {
                    $rootScope.processOverlay(false);
                    //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                    $rootScope.pushErrorMessage(response);
                    $rootScope.modalShow();
                }
            }).catch(function(response) {
                $rootScope.processOverlay(false);
                //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                $rootScope.pushErrorMessage(response);
                $rootScope.modalShow();
            }).finally(function() {
                $rootScope.processing = false;
            });
        }).catch(function() {
            $rootScope.modalShow();
        });
    };

   
});
// Checkout page controller
app.controller("CheckoutPageCtrl", function($rootScope, $scope, $http) {

    // Google Captcha
    $rootScope.loadGoogleCaptcha();
    var captchaCallBack = function(res){
       $rootScope.validateGogoleCaptcha = true;
    };
    $scope.publicKey = $rootScope.googleCaptchaPublicKey;
    window.captchaCallBack = captchaCallBack;
    // Google Captcha


    var queryStrings = $rootScope.getQueryStrings();
    if (!queryStrings.hasOwnProperty('prospect_id') || !queryStrings.prospect_id.length) {
        window.location.href = './';
    }
    $scope.loadCountries = function() {
        if ($rootScope.CheckoutData.billingSameAsShipping == 'no' && $rootScope.countriesData.length == 0) {
            $rootScope.getCountries();
            setTimeout(function() {
                //Browser country / state autofill patch
                $rootScope.browserAutofill('CheckoutData', 'billing');
            }, 200);
        }
    };
    $rootScope.getMonths();
    $rootScope.getYears();
    //Reverse sets the cc_type based on cc_number
    $scope.$watch('CheckoutData.cc_number', function() {
        for (cType in $rootScope.cardPatternFullValidRegex) {
            if ($scope.CheckoutData.cc_number.match($rootScope.cardPatternFullValidRegex[cType])) {
                $scope.CheckoutData.cc_type = cType;
                return true;
            }
        }
    });
    //End Reverse sets the cc_type based on cc_number
    //Open footer links in popup
    $rootScope.initUtilities();
    //Campaign Switcher
    $rootScope.campaignSwitcher();
    //Insurance checkbox available
    $rootScope.enableInsurance('split_charge');
    // Checkout form handler
    $scope.CheckoutPageSubmitHandler = function($event, internalCall) {
        if($rootScope.configData.api_type == 'checkout' && typeof internalCall == 'undefined'){
            $rootScope.checkoutPrefillCardData($event, $rootScope.FullFormData, arguments.callee);
            return;
        }
        $rootScope.CheckoutData.prospectId = queryStrings.prospect_id;
        $rootScope.getHiddenParameters($rootScope.CheckoutData);
        var forceRedirectPage = $rootScope.forceRedirect();
        var forceRedirectTo = forceRedirectPage == null ? 'thank-you' : forceRedirectPage;
        if (document.getElementsByName('insureshipCheckbox').length > 0) {
            if (document.getElementsByName('insureshipCheckbox')[0].checked) {
                $rootScope.CheckoutData.insureshipCheckbox = true;
            } else {
                $rootScope.CheckoutData.insureshipCheckbox = false;
            }
        }
        $rootScope.errorHandler($rootScope.CheckoutData, 'checkout').then(function() {
            var redirect_to = parseInt($rootScope.configData.enable_upsells) ? 'upsell' : forceRedirectTo;
            $rootScope.processOverlay(true);
            $rootScope.CheckoutData.current_url = window.location.href;
            $rootScope.CheckoutData.next_url = './' + redirect_to;
            $rootScope.initializePaayThreeDS().then(function() {
                $http.post(SITE_BASE_URL + '/ajax/checkout', $rootScope.CheckoutData)
                .then(function(response) {
                    if (response.data.status == 'success') {

                        if(response.data.hasOwnProperty('is_html') && response.data.is_html){
                            document.write(response.data.html_data);
                            document.close();
                            return;
                        }

                        var prospectID = response.data.apiResponse.prospectId;
                        var customerID = response.data.apiResponse.customerId;
                        var orderID = response.data.apiResponse.orderId;
                        $rootScope.triggerMail(false, orderID);
                        var redirect_to = parseInt($rootScope.configData.enable_upsells) ? 'upsell' : forceRedirectTo;
                        window.location.href = './' + redirect_to + '?prospect_id=' + prospectID + '&customer_id=' + customerID + '&order_id=' + orderID;
                        
                    } else {
                        $rootScope.processOverlay(false);
                        //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                        $rootScope.pushErrorMessage(response);
                        $rootScope.modalShow();
                        
                        // Handle google captcha
                        $rootScope.configData.show_google_captcha = response.data.isActiveCaptcha;
                        $rootScope.loadGoogleCaptcha();
                        $rootScope.validateGogoleCaptcha = false;
                        if (window.grecaptcha !== undefined) window.grecaptcha.reset();
                    }
                }).catch(function(response) {
                    $rootScope.processOverlay(false);
                    //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                    $rootScope.pushErrorMessage(response);
                    $rootScope.modalShow();
                }).finally(function() {
                    $rootScope.processing = false;
                });
            });
        }).catch(function() {
            $rootScope.modalShow();
        });
    };
});
// Upsell page controller
app.controller("UpsellPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
    //Campaign Switcher
    $rootScope.campaignSwitcher();
    //Insurance checkbox available
    $rootScope.enableInsurance('enable_upsell_step');
    var queryStrings = $rootScope.getQueryStrings();
    var hasProspectId = false;
    if (queryStrings.hasOwnProperty('prospect_id') && queryStrings.prospect_id.length > 0) {
        hasProspectId = queryStrings.prospect_id;
    }
    if ((!queryStrings.hasOwnProperty('customer_id') || !queryStrings.customer_id.length) || (!queryStrings.hasOwnProperty('order_id') || !queryStrings.order_id.length)) {
        window.location.href = './';
    }
    var prospectID = hasProspectId;
    var customerID = queryStrings.customer_id;
    var orderID = queryStrings.order_id;
    $rootScope.getConfig();
    if (document.getElementById("no-thanks")) {
        document.getElementById("no-thanks").addEventListener("click", function(event, queryStrings) {
            event.preventDefault ? event.preventDefault() : (event.returnValue = false);
            var redirect_to = document.getElementById("no-thanks").getAttribute("href");
            if (redirect_to == 'no-thanks') {
                window.location.href = './' + redirect_to;
            } else if (redirect_to == 'thank-you') {
                window.location.href = './' + redirect_to + '?' + (hasProspectId !== false ? 'prospect_id=' + hasProspectId + '&' : '') + 'customer_id=' + customerID + '&order_id=' + orderID;
            } else {
                $http.post(SITE_BASE_URL + '/ajax/switch-upsell').then(function(response) {
                    if (!response.data.success) {
                        redirect_to = 'thank-you';
                    }
                    window.location.href = './' + redirect_to + '?' + (hasProspectId !== false ? 'prospect_id=' + hasProspectId + '&' : '') + 'customer_id=' + customerID + '&order_id=' + orderID;
                }).catch(function(response) {});
            }
        });
    }
    // Upsell form handler
    $scope.upsellPageSubmitHandler = function($event) {
        $rootScope.getHiddenParameters($rootScope.UpsellData);
        var forceRedirectPage = $rootScope.forceRedirect();
        var forceRedirectTo = forceRedirectPage == null ? 'thank-you' : forceRedirectPage;
        if (document.getElementsByName('insureshipCheckbox').length > 0) {
            if (document.getElementsByName('insureshipCheckbox')[0].checked) {
                $rootScope.UpsellData.insureshipCheckbox = true;
            } else {
                $rootScope.UpsellData.insureshipCheckbox = false;
            }
        }
        var data = {
            queryStrings: queryStrings,
            upsellData: $rootScope.UpsellData
        };
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/upsell', data).then(function(response) {
            if (response.data.status == 'success') {
                $rootScope.triggerMail(false, orderID);
                var redirect_to = parseInt($rootScope.configData.upsell_step) == parseInt(response.data.upsell_step) ? forceRedirectTo : 'upsell';
                window.location.href = './' + redirect_to + '?' + (hasProspectId !== false ? 'prospect_id=' + hasProspectId + '&' : '') + 'customer_id=' + customerID + '&order_id=' + orderID;
            } else {
                $rootScope.processOverlay(false);
            }
        }).catch(function(response) {});
    };
});
// Thank-you page controller
app.controller("ThankyouPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
    // Campaign Switcher
    $rootScope.campaignSwitcher();
    //Fire thankyou email
    var queryStrings = $rootScope.getQueryStrings();
    var orderID = queryStrings.order_id;
    $rootScope.triggerMail(true, orderID); //Send true to force thankyou page email even if data-trigger-mail isn't defined in page
    if ((!queryStrings.hasOwnProperty('customer_id') || !queryStrings.customer_id.length) || (!queryStrings.hasOwnProperty('order_id') || !queryStrings.order_id.length)) {
        window.location.href = '/index.html';
    }
});
// No-thanks page controller
app.controller("NothanksPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
});
// Terms & conditions page controller
app.controller("TermsconditionsPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
});
// Privacy policy page controller
app.controller("PrivacypolicyPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
});
// Contact us page controller
app.controller("ContactusPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
});
// Static page controller
app.controller("StaticPageCtrl", function($rootScope, $scope, $http) {
    //Open footer links in popup
    $rootScope.initUtilities();
    // Campaign Switcher
    $rootScope.campaignSwitcher();
});
// Full offer page controller
app.controller("RemoteUpsellPageCtrl", function($rootScope, $scope, $http, $compile, $timeout) {
    // Open footer links in popup
    $rootScope.initUtilities();
    // Campaign Switcher
    $rootScope.campaignSwitcher();
    var queryStrings = $rootScope.getQueryStrings();
    if (!queryStrings.hasOwnProperty('order_id') || !queryStrings.order_id.length) {
        window.location.href = './';
    }
    // Full offer form submit handler
    $scope.remoteUpsellPageSubmitHandler = function($event) {
        $rootScope.getHiddenParameters($rootScope.RemoteUpsellFormData);
        $rootScope.RemoteUpsellFormData.previousOrderId = queryStrings.order_id;
        var forceRedirectPage = $rootScope.forceRedirect();
        var forceRedirectTo = forceRedirectPage == null ? 'thank-you' : forceRedirectPage;
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/remote-upsell', $rootScope.RemoteUpsellFormData).then(function(response) {
            if (response.data.status == 'success') {
                var prospectID = response.data.apiResponse.prospectId;
                var customerID = response.data.apiResponse.customerId;
                var orderID = response.data.apiResponse.orderId;
                $rootScope.triggerMail(false, orderID);
                var redirect_to = forceRedirectTo;
                window.location.href = './' + redirect_to + '?' + (prospectID !== undefined ? 'prospect_id=' + prospectID + '&' : '') + 'customer_id=' + customerID + '&order_id=' + orderID;
            } else {
                $rootScope.processOverlay(false);
                //$rootScope.errorMessages = [response.data.apiResponse.response_message];
                $rootScope.pushErrorMessage(response);
                $rootScope.modalShow();
            }
        }).catch(function(response) {
            $rootScope.processOverlay(false);
            //$rootScope.errorMessages = [response.data.apiResponse.response_message];
            $rootScope.pushErrorMessage(response);
            $rootScope.modalShow();
        }).finally(function() {
            $rootScope.processing = false;
        });
    };
});
// Static page controller
app.controller("AccessCtrl", function($rootScope, $scope, $http) {
    $scope.AccessFormData = {};
    $scope.loginSubmitHandler = function() {
        var forceRedirectPage = $scope.redirectTo;
        var forceRedirectTo = forceRedirectPage == null || forceRedirectPage == undefined ? null : forceRedirectPage;
        var loginExpiryDays = $scope.loginExpiryDays == null || $scope.loginExpiryDays == undefined ? 7 : $scope.loginExpiryDays;
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/access-login', $scope.AccessFormData).then(function(response) {
            if (response.data.status == 'success') {
                $rootScope.triggerMail();
                $rootScope.processOverlay(false);
                if (!$scope.hidePopup) {
                    $rootScope.errorMessages = ['Successfully Authenticated'];
                    $rootScope.modalShow();
                }
                $rootScope.setCookie("access_token", JSON.stringify($scope.AccessFormData), loginExpiryDays);
                if (forceRedirectTo != null) {
                    var redirect_to = forceRedirectTo;
                    window.location.href = './' + redirect_to;
                }
            } else {
                $rootScope.processOverlay(false);
                $rootScope.errorMessages = [response.data.message];
                $rootScope.modalShow();
                $rootScope.setCookie("access_token", "", -3600);
            }
        }).catch(function(response) {
            $rootScope.processOverlay(false);
            $rootScope.errorMessages = ['Error Authenticating'];
            $rootScope.modalShow();
            $rootScope.setCookie("access_token", "", -3600);
        }).finally(function() {
            $rootScope.processing = false;
        });
    };
    $scope.registerSubmitHandler = function() {
        var forceRedirectPage = $scope.redirectTo;
        var forceRedirectTo = forceRedirectPage == null || forceRedirectPage == undefined ? null : forceRedirectPage;
        var loginExpiryDays = $scope.loginExpiryDays == null || $scope.loginExpiryDays == undefined ? 7 : $scope.loginExpiryDays;
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/access-register', $scope.AccessFormData).then(function(response) {
            if (response.data.status == 'success') {
                $rootScope.triggerMail();
                $rootScope.processOverlay(false);
                if (!$scope.hidePopup) {
                    $rootScope.errorMessages = ['Successfully Registered'];
                    $rootScope.modalShow();
                }
                $scope.AccessFormData = {};
                if (forceRedirectTo != null) {
                    var redirect_to = forceRedirectTo;
                    window.location.href = './' + redirect_to;
                }
            } else {
                $rootScope.processOverlay(false);
                $rootScope.errorMessages = [response.data.message];
                $rootScope.modalShow();
            }
        }).catch(function(response) {
            $rootScope.processOverlay(false);
            $rootScope.errorMessages = ['Error Registration'];
            $rootScope.modalShow();
        }).finally(function() {
            $rootScope.processing = false;
        });
    };
    $scope.logoutSubmitHandler = function() {
        var forceRedirectPage = $scope.redirectTo;
        var forceRedirectTo = forceRedirectPage == null || forceRedirectPage == undefined ? null : forceRedirectPage;
        var loginExpiryDays = $scope.loginExpiryDays == null || $scope.loginExpiryDays == undefined ? 7 : $scope.loginExpiryDays;
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/access-logout').then(function(response) {
            if (response.data.status == 'success') {
                $rootScope.processOverlay(false);
                if (!$scope.hidePopup) {
                    $rootScope.errorMessages = ['Successfully Logged Out'];
                    $rootScope.modalShow();
                }
                $rootScope.setCookie("access_token", "", -3600);
                if (forceRedirectTo != null) {
                    var redirect_to = forceRedirectTo;
                    window.location.href = './' + redirect_to;
                }
            } else {
                $rootScope.processOverlay(false);
                $rootScope.errorMessages = [response.data.message];
                $rootScope.modalShow();
            }
        }).catch(function(response) {
            $rootScope.processOverlay(false);
            $rootScope.errorMessages = ['Error Authenticating'];
            $rootScope.modalShow();
        }).finally(function() {
            $rootScope.processing = false;
        });
    };
});
// Mail controller
app.controller("MailCtrl", function($rootScope, $scope, $http) {
    $scope.MailFormData = {};
    $rootScope.getConfig();
    $scope.mailSubmitHandler = function() {
        $rootScope.errorHandler($scope.MailFormData, 'mail');
        if ($rootScope.errorMessages.length > 0) {
            $rootScope.processOverlay(false);
            $rootScope.modalShow();
            return true;
        }
        var forceRedirectPage = $scope.redirectTo;
        var forceRedirectTo = forceRedirectPage == null || forceRedirectPage == undefined ? null : forceRedirectPage;
        var successMessage = $scope.successMessage == null || $scope.successMessage == undefined ? 'Message has been sent!' : $scope.successMessage;
        $rootScope.processOverlay(true);
        $http.post(SITE_BASE_URL + '/ajax/post-mail', $scope.MailFormData).then(function(response) {
            if (response.data.status == 'success' || response.data.status== true) {
                successMessage = (response.data.hasOwnProperty('message')) ? response.data.message :successMessage;
                $rootScope.processOverlay(false);
                $rootScope.errorMessages = [successMessage];
                $rootScope.modalShow();
                if (forceRedirectTo != null) {
                    var redirect_to = forceRedirectTo;
                    setTimeout(function(){
                    window.location.href = './' + redirect_to;
                    },1000);
                }

            } else {
                $rootScope.processOverlay(false);
                $rootScope.errorMessages = [response.data.message];
                $rootScope.modalShow();
            }
        }).catch(function(response) {
            $rootScope.processOverlay(false);
            $rootScope.pushErrorMessage(response);
            $rootScope.modalShow();
        }).finally(function() {
            $rootScope.processing = false;
        });
    };
});
// Cart controller
app.controller("CartCtrl", function($rootScope, $scope, $http, $interval) {
    $scope.reload = 5000;
    $interval(function() {
        $rootScope.loadCartInScope();
        $rootScope.calculateCartTotal();
    }, $scope.reload);
});
//Directive
app.directive('restrictInput', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var ele = element[0];
            var regex = RegExp(attrs.restrictInput);
            var value = ele.value;
            ele.addEventListener('keyup', function(e) {
                if (regex.test(ele.value)) {
                    value = ele.value;
                } else {
                    ele.value = value;
                }
            });
        }
    };
}]);
//Filter
app.filter('trustAsHtml', ['$sce', function($sce) {
    return function(value) {
        return $sce.trustAsHtml(value);
    }
}]);
// loader image for modal
var spinnerurl = 'data:image/gif;base64,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';

// Add new cart system
if (
    'undefined' !== typeof elmConfigs && 
    'undefined' !== typeof localStorage && 
    'undefined' !== typeof sessionStorage
    ) loadJS('frontend/js/cart.js');

function loadJS(file) {
    $( "body" ).append( $( '<script src="'+file+'">'+'</'+'script>' ) );
}
// loadJS("https://cdn.checkout.com/js/frames.js");