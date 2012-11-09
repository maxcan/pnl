'use strict';

function StripeCtrl($scope, $rootScope, $http) {
  $rootScope.$on('needPayment', function() {
    Stripe.setPublishableKey($scope.user.stripePublishableKey);
    if ($scope.isAdmin() ) {
      $scope.card = {number: '4242424242424242', cvc: '123', 'exp_year': 2015, 'exp_month': 12};
    } else {
      $scope.card=  {};
    }

    $('#stripe_error').hide();
    $('#stripe_modal').modal();
    $scope.validate();
  });

  function handleCreateTokenResponse(status, response) {
    $scope.validate();
    if (response.error) {
      console.log('erro: ' + response.error.message);  
      $('#stripe_error').text(response.error.message)
      $('#stripe_error').show();
    } else {
      console.log(' got token: ' + response['id']);  // _DEBUG
      $scope.stripeToken = response['id'];
      saveStripeToken();
      return; 
    }
  }
  function saveStripeToken () {
    var postData =  { stripeToken: $scope.stripeToken
                , redemptionCode: $scope.card.redemptionCode}
    if (!$scope.allowSubmit) return ; 
    $http.post('../../api/user/stripe-token', postData)
         .success(function() {
           $('#stripe_modal').modal('hide');
           $rootScope.$broadcast('saved token');
           alert('saved payment data');
         })
         .error(function(d, s) {
           console.log('error setting token: ' + d + ': status = ' + s);
           $('#stripe_error').text(s);
           $('#stripe_error').show();
          
         });
  }
  $scope.processCard = function () {
    console.log('processing');  // _DEBUG
    Stripe.createToken($scope.card, handleCreateTokenResponse)
  };
  $scope.validate = function () {
    var res = {};
    res.cvc = Stripe.validateCVC($scope.card.cvc);
    res.number = Stripe.validateCardNumber($scope.card.number);
    res.expiry = Stripe.validateExpiry($scope.card.exp_month, $scope.card.exp_year);
    _.each(res, function(b, fld) { 
      if (b) {
        $scope[fld+'Class'] = 'success';
        $scope[fld+'Result'] = 'valid';
      } else { 
        $scope[fld+'Class'] = 'error';
        $scope[fld+'Result'] = 'invalid';
      }
    });
    $scope.allowSubmit = (_.all(_.values(res)));
  };
  $scope.checkRedemptionCode = function() {
    if (!$scope.card.redemption_code) return ;
    if ($scope.card.redemption_code.length < 4) {
      $scope.allowSubmit = false;
      return ; 
    } 
    var postData =  {redemptionCode: $scope.card.redemption_code};
    console.log('data; ' + JSON.stringify(postData));  // _DEBUG
    $scope.discountedPrice = null;
    $http.post('../../api/user/check-coupon', postData)
      .error(function(d,s) {
        $scope.redemptionResult = "error";
        $scope.redemptionInfo = d;
        $scope.allowSubmit = false;

      })
    .success(function(s) {
      $scope.redemptionResult = "success";
      $scope.redemptionInfo = "Discount: " + s['percent_off'] + "% off";
      $scope.discountedPrice = 88 * (0.001 * Number(s['percent_off']));
      $scope.validate();
    });

  };

}

StripeCtrl.$inject = ['$scope','$rootScope', '$http'];

