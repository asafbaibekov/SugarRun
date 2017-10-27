angular.module('app', ['components'])
 
// .controller('fruits', function($scope, $locale) {
//   $scope.fruits = [
//       {
//           name: "banana",
//           image: "../../images/banana.png"
//       }
//   ]
// });


angular.module('components', [])
.directive('fruits', function() {
    return {
      restrict: 'C',
      transclude: true,
      scope: {},
      controller: function($scope, $element) {
        var panes = $scope.panes = [];
 
        $scope.select = function(pane) {
          angular.forEach(panes, function(pane) {
            pane.selected = false;
          });
          pane.selected = true;
        }
 
        this.addPane = function(pane) {
          if (panes.length == 0) $scope.select(pane);
          panes.push(pane);
        }
      },
      template:
        `<div class="col-md-6 col-sm-12 col-xs-12" style="float: right; padding: 0;">
            <div class="container-fluid" style="height: 100%;">
                <div class="row" style="height: 100%; display: flex; align-items: center;">
                    <div style="padding: 20px 20px 20px 0; width: 33%;">
                        <div style="position: relative; background-color: #444444; float: right; width: 100%; height: 0; padding-top: 100%; border-radius: 100%; overflow-x: hidden;">
                            <img style="position: absolute; top: 0; left: 0; bottom: 0; right: 0; margin: auto;" src="../../images/banana.png">
                        </div>
                    </div>
                    <div style="width: 67%; margin-left: 5%; display: flex; align-items: center; justify-content: center;">
                        <a href="" style="width: 20%; margin: 10px;"><img src="../../images/minus_icon.svg"></a>
                        <label class="fruitsNumber" for="" style="margin:0; color: #9E339A; font-size:140%; margin: 10px;">5</label>
                        <img style="width: 20%; margin: 10px;" src="../../images/plus_icon.svg">
                    </div>
                </div>
            </div>
        </div>`,
      replace: true
    };
  })