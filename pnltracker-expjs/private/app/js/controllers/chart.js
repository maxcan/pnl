'use strict';

function ChartCtrl($scope, $rootScope) {
  $scope.initialized = false;
  $scope.groupUndl = true;
  $scope.toggleGroupUndl = function() {
    updateCharts();
  }
  function getSym(t) {
    return ($scope.groupUndl ? t.underlyingSecurity.symbol : t.securityDesc);
  }
  var lineCharts =
    [ { wrapper: '#cumulative_pnl_chart', fxn: calculatePnlSeriesByUnderlying }
    ] ;
  function updateCharts() {
    if (false && $scope.initialized) { 
      updateChartData(); 
    } else {
      console.log(' updating charts');  // _DEBUG
      _.each(lineCharts, function(o) { buildLineChart(o.wrapper, o.fxn); });
      buildPieChart('#profit_share_pie_chart'
                   , function() { return calculateProfitShareByUnderlying(true);});
      buildPieChart('#loss_share_pie_chart'
                   , function() { return calculateProfitShareByUnderlying(false);});
    }

  }
  $rootScope.$on('loadedTrades', updateCharts);

  // utility functions
  function closedTrades (trds) {return _.filter(trds, function(t){return !t.isOpen;}); }
  function calculateProfitShareByUnderlying(isProfit) {
    var comps = {};
    var losses = {};
    var trades = closedTrades($scope.trades);
    _.each(trades, function(t) {    
      if ((t.netCash > 0 && isProfit) || (t.netCash <= 0 && !isProfit)) {
        if (!comps[getSym(t)])
          comps[getSym(t)] = 0;
        comps[getSym(t)] += t.netCash;
      } else {
        if (!losses[getSym(t)])
          losses[getSym(t)] = 0;
        losses[getSym(t)] += t.netCash;
      }
    });
    var retVals = [];
    _.each(comps,function(ttl, undlSym) {
      retVals.push({label: undlSym, value: ttl});
    });
    var label = (isProfit ? 'Profit Share' : 'Loss Share');
    var ret = [ { key: label, values: retVals }];

    return ret;
  }
  function calculatePnlSeriesByUnderlying() {
    var overall     = []; // [ { x : date, y : double} ]
    var underlyings = {} ; // { sym:[ { x : date, y : double} ] } 
    var sortedTrades = _.sortBy(closedTrades($scope.trades), 'closeDate');
    _.each(sortedTrades, function(trade) {
      var sym = getSym(trade); 
      if (! underlyings[sym] ) {underlyings[sym] = []; }
      var dt = new Number(new Date(trade.closeDate));
      underlyings[sym].push({x: dt, y: trade.netCash});
      overall.push({x: dt, y: trade.netCash});
    });

    var tmpSum = 0;
    var newOveralls = _.map(overall, function(o) {
      tmpSum += o.y;
      return {x : o.x, y: tmpSum} ;
    });
    var ret = [ { values: newOveralls, key: 'All Symbols' } ];
    _.each(underlyings, function(vals, undlSym) {
      tmpSum = 0;
      var newVals = _.map(vals, function(o) {
        tmpSum += o.y;
        return {x: o.x, y: tmpSum};
      });
      ret.push( { values: newVals, key: undlSym } );
    });
    return ret;
  }
  function buildPieChart(wrapperId, dataFunction) {
    var svgId = wrapperId + ' svg';
    var width = $(wrapperId).width();
    var height = width ;
    var chartData = dataFunction();
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
        .x(function(d) { return d.label })
        .y(function(d) { return d.value })
        .showLabels(true)
        .color(d3.scale.category10().range())
        .width(width)
        .height(height);

      d3.select(svgId)
        .datum(chartData)
        //.datum(testdata)
        .transition().duration(1200)
        .attr('width', width)
        .attr('height', height)
        .call(chart);

      return chart;
    });


  }
  function buildLineChart(wrapperId, dataFunction) {
    // var wrapperId = '#cumulative_pnl_chart';
    var svgId = wrapperId + ' svg';
    nv.addGraph({
      generate: function() {
        var width = $(wrapperId).width();
        var height = width * 0.65;
        var chart = nv.models.lineChart().width(width).height(height)  ;
        chart.yAxis.tickFormat(d3.format('.02f'))
                   .axisLabel('Cumulative PnL');

        chart.xAxis.tickFormat(function(d){return d3.time.format('%x')(new Date(d))})
                   .axisLabel('Date');
        d3.select(svgId)
          .attr('width', width)
          .attr('height', height)
          .datum(dataFunction())
          .call(chart);
        return chart;
      },
      callback: function(graph) {
        return;
        window.onresize = function() {
          var width = $(wrapperId).width();
          var height = width * 0.65;
          // var margin = graph.margin();

          if (width < margin.left + margin.right + 20)
            width = margin.left + margin.right + 20;

          if (height < margin.top + margin.bottom + 20)
            height = margin.top + margin.bottom + 20;

          graph.width(width).height(height);
          d3.select(svgId)
            .attr('width', width)
            .attr('height', height)
            .call(graph);
        };
      }
    });

  }

}
