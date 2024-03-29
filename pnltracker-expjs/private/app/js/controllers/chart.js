'use strict';

function ChartCtrl($scope, $rootScope) {
  $scope.initialized = false;
  $scope.groupUndl = true;
  var forcedUngroup  = false ; // if we automicatlly ungrouped
  $scope.toggleGroupUndl = function() {
    forcedUngroup = false;
    updateCharts();
  }
  function getSym(t) {
    return ($scope.groupUndl ? t.underlyingSecurity.symbol : t.securityDesc);
  }
  function updateCharts() {
    if (false && $scope.initialized) { 
      updateChartData(); 
    } else {
      // check if we're down to a single symbol
      if ($scope.groupUndl) {
        var symMap = {};
        _.each(closedTrades(), function(t) { symMap[getSym(t)] = 1;});
        // only one symbol.  We should auto-ungroup
        if (_.keys(symMap).length === 1) {
          $scope.groupUndl = false;
          forcedUngroup = true;
        }
      } else {
        // they aren't grouped. if we ungrouped them, regoup them
        if (forcedUngroup) {
          var symMap = {};
          _.each(closedTrades(), function(t) { symMap[t.underlyingSecurity.symbol] = 1;});
          // only one symbol.  We should auto-ungroup
          if (_.keys(symMap).length != 1 || $scope.tradeFilter === '' ) {
            $scope.groupUndl = true;
            forcedUngroup = false;
          }

        } 

      }
      // pnl timeseries chart:
      // buildStackedLineChart('#stacked_pnl_chart', calcPnlSeriesByUnderlying);
      buildStackedBarChart('#stacked_pnl_bar_chart', calcNetCashPerSymbol);
      buildScatterChart('#time_duration_scatter_chart', calcDurationScatter);
      buildPieCharts('#profit_share_pie_chart' , '#loss_share_pie_chart'
                   , function() { return calcProfitShareByUnderlying();});
    }

  }
  $rootScope.$on('loadedTrades', updateCharts);

  // utility functions
  function closedTrades () {return $scope.$parent.filteredClosedTrades;  }
  function calcProfitShareByUnderlying() {
    var wins = {};
    var losses = {};
    var trades = closedTrades();
    _.each(trades, function(t) {    
      if (t.netCash > 0) {
        if (!wins[getSym(t)]) wins[getSym(t)] = 0;
        wins[getSym(t)] += t.netCash;
      } else {
        if (!losses[getSym(t)]) losses[getSym(t)] = 0;
        losses[getSym(t)] += Math.abs(t.netCash);
      }
    });
    var lossesArr = [] ;
    _.each(losses, function(v, k) { lossesArr.push({s:k,amt:v});});
    lossesArr = _.first(_.sortBy(lossesArr, 'amt'), 10);
    lossesArr.reverse();
    var winsArr = [] ;
    _.each(wins, function(v, k) { winsArr.push({s:k,amt:v});});
    winsArr = _.first(_.sortBy(winsArr, 'amt'), 10);
    winsArr.reverse();
    var symsToReport = _.uniq(_.pluck(lossesArr.concat(winsArr), 's'))
    var retVals = {winData: [], lossData: []};
    _.each(symsToReport, function(sym) {
      var winAmt = wins[sym] || 0;
      var lossAmt = losses[sym] || 0;
      retVals.winData.push({label: sym, value: winAmt});
      retVals.lossData.push({label: sym, value: lossAmt});
    });
    var otherWinAmt = 0;
    _.each(wins, function(v,k) { if (symsToReport.indexOf(k) != -1) otherWinAmt += v });
    var otherLossAmt = 0;
    _.each(losses, function(v,k) { if (symsToReport.indexOf(k) != -1) otherLossAmt += Math.abs(v) });
    retVals.winData.push({label: '_other', value: otherWinAmt});
    retVals.lossData.push({label: '_other', value: otherLossAmt});
    return  { winData: [{key: 'Profit Share', values: retVals.winData}]
            , lossData:  [{key: 'Loss Share', values: retVals.lossData}]};
  }

  function calcNetCashPerSymbol(maxRows) {
    if (!maxRows) maxRows = 15;
    var trades = closedTrades();
    var loserCashSum = {};
    var winnerCashSum = {};
    var overallCashSum = {};
    _.each(trades, function(trade) {
      var sym = getSym(trade);
      var netCash = Number(trade.netCash);
      if (netCash < 0) {
        if (!loserCashSum[sym]) loserCashSum[sym] = 0;
        loserCashSum[sym] = loserCashSum[sym] + netCash;
      } else {
        if (!winnerCashSum[sym]) winnerCashSum[sym] = 0;
        winnerCashSum[sym] = winnerCashSum[sym] + netCash;
      }
      if (!overallCashSum[sym]) overallCashSum[sym] = 0;
      overallCashSum[sym] = overallCashSum[sym] + Math.abs(netCash);
    });

    var sortedOveralls =  _.sortBy(_.pairs(overallCashSum), function(a) { return -1 * a[1];});
    var topSyms = _.first(sortedOveralls, maxRows);
    var restOfSyms = _.rest(sortedOveralls, maxRows);
    var winners = { key: 'Winners', color: '#22ff22', values: [] } ;
    var losers  = { key: 'Losers', color: '#ff2222', values: [] } ;
    _.each(topSyms, function (pair) {
      winners.values.push({label: pair[0], value: (winnerCashSum[pair[0]] || 0)});
      losers.values.push({label: pair[0], value: (loserCashSum[pair[0]] || 0)});
    });
    if (restOfSyms.length > 0) {
      var restWin = 0;
      var restLose = 0;
      _.each(restOfSyms, function(pair) {
        restWin += (winnerCashSum[pair[0]] || 0);
        restLose += (loserCashSum[pair[0]] || 0);
      });
      winners.values.push({label: 'other', value: restWin});
      losers.values.push({label: 'other', value: restLose});
    }
    return [losers,winners];
  }

  function calcDurationScatter() {
    var trades = closedTrades();
    var ret = {};
    _.each(trades, function(trade) {
      if (!ret[getSym(trade)]) ret[getSym(trade)] = [];
      ret[getSym(trade)].push({x: trade.duration, y: trade.netCash, z: trade.maxPrin});
    });
    var retArr = [];
    _.each(ret, function(ar, sy) { retArr.push({key: sy, values: ar});});
    return retArr;
  }


  // if we get a sparse array of type: 
  //     [ { key: String, values: [{ x: DateInNumeric, y: Val} ] } ]
  // this will will in the missing dates so we can use a stacked chart..
  // Assumes that the values are sorted..
  function populateSparseDates(inputArrRaw) {
    //check for an null values..
    var inputArr = _.filter(inputArrRaw, function (o) { return o.values.length > 0 ; });
    var minDateNum = _.min(_.map(inputArr, function(o) { return o.values[0].x}));
    var maxDateNum = _.max(_.map(inputArr, function(o) { return o.values[o.values.length - 1].x}));
    var minDate = new Date(minDateNum.valueOf());
    var maxDate = new Date(maxDateNum.valueOf() + (1000 * 24 * 60 * 60));
    function toDayEnd(d) { d.setHours(23); d.setMinutes(59); d.setSeconds(59); } 
    function incDate(d) { var dd = new Date(d); dd.setDate(dd.getDate() + 1); return dd;}
    var curDate = minDate;
    var dateArr = [curDate];
    toDayEnd(minDate); toDayEnd(maxDate);
    while (curDate < maxDate) { curDate = incDate(curDate); dateArr.push(curDate); } 
    var retObjects = [];
    _.each(inputArr, function(curKeyValPair) { 
      var vals = curKeyValPair.values;
      var newVals = [];
      var nextValIdx = 0;
      var curValAmt = 0;
      _.each(dateArr, function(curDate) {
        // for each full date,  get the most recent value
        if (nextValIdx >= vals.length) {

          // curDate is greater than the last date in vals.  keep using the last amount.
          newVals.push( { x : curDate.valueOf(), y : curValAmt} );
        } else if (curDate.valueOf() <= vals[nextValIdx].x) {
          // use the previous amount since there's still a more data ahead
          newVals.push( { x : curDate.valueOf(), y : curValAmt} );
        } else {
          // ok, now use the next element in values
          curValAmt = vals[nextValIdx].y;
          nextValIdx++;
          newVals.push( { x : curDate.valueOf(), y : curValAmt} );
        }

      });
      retObjects.push({key: curKeyValPair.key, values: newVals});
    });
    return retObjects;
  }

  // Returns an array of objects: [ { key: String, values: [{ x: DateInNumeric, y: Val} ] } ]
  // Note that this function is cumulative.. 
  function calcPnlSeriesByUnderlying(excludeOverall) {
    var overall     = []; // [ { x : date, y : double} ]
    var underlyings = {} ; // { sym:[ { x : date, y : double} ] } 
    var sortedTrades = _.sortBy(closedTrades(), 'closeDate');
    _.each(sortedTrades, function(trade) {
      var sym = getSym(trade); 
      if (! underlyings[sym] ) {underlyings[sym] = []; }
      var dt = new Number(new Date(trade.closeDate));
      underlyings[sym].push({x: dt, y: trade.netCash});
      excludeOverall || overall.push({x: dt, y: trade.netCash});
    });

    var tmpSum = 0;
    var newOveralls = excludeOverall || _.map(overall, function(o) {
      tmpSum += o.y;
      return {x : o.x, y: tmpSum} ;
    });
    var ret = ( excludeOverall ? [] : [{ values: newOveralls, key: 'All Symbols' }]);
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
  function buildPieCharts(winWrapperId, lossWrapperId, dataFunction) {
    var allData = dataFunction();
    buildPieChart(winWrapperId, allData.winData);
    buildPieChart(lossWrapperId, allData.lossData);
    function buildPieChart(wrapperId, data) { 
      var svgId = wrapperId + ' svg';
      var width = $(wrapperId).width();
      var height = width ;
      var chartData = dataFunction();
      nv.addGraph(function() {
        var chart = nv.models.pieChart()
        .x(function(d) { return d.label })
        .y(function(d) { return d.value })
        .showLabels(true)
        // .color(d3.scale.category10().range())
        .width(width)
        .height(height);

      d3.select(svgId)
        .datum(data)
        //.datum(testdata)
        .transition().duration(1200)
        .attr('width', width)
        .attr('height', height)
        .call(chart);

      return chart;
      });
    }
  }

  function buildScatterChart(wrapperId, dataFunction) {
    var svgId = wrapperId + ' svg';
    nv.addGraph({
      generate: function() {
        var width = $(wrapperId).width();
        var height =  width;
        console.log(' using w: ' + width + ' and h: ' + height);  // _DEBUG
        var chart = nv.models.scatterChart().width(width).height(height) 
                // .x(function(d) { return d[0] })
                // .y(function(d) { return d[1] })
                .showDistX(true).showDistY(true)
                .x(function(d) { return d.x })
                .showLegend(false)
                .y(function(d) { return d.y })
                .size(function(d) { return d.z })
      ;
        chart.yAxis.tickFormat(d3.format('.02f')).axisLabel('Cumulative PnL');
        chart.xAxis.tickFormat(function(d){return '';});
        // chart.xAxis.tickFormat(function(d){return d3.time.format('%x')(new Date(d))}).axisLabel('Date');
        d3.select(svgId)
          .attr('width', width).attr('height', height)
          .datum(dataFunction(true))
          .call(chart);
        return chart;
      },
      callback: function(graph) {
        window.onresize = function() {
          return; 
          var width = $(wrapperId).width();
          var height = width * 0.65;
          // if (width < margin.left + margin.right + 20) width = margin.left + margin.right + 20;
          // if (height < margin.top + margin.bottom + 20) height = margin.top + margin.bottom + 20;
          graph.width(width).height(height);
          d3.select(svgId).attr('width', width).attr('height', height).call(graph);
        };
      }
    });
  }

  function buildStackedLineChart(wrapperId, dataFunction) {
    var svgId = wrapperId + ' svg';
    nv.addGraph({
      generate: function() {
        var width = $(wrapperId).width();
        var height = width * 0.5;
        var chart = nv.models.stackedAreaChart().width(width).height(height) 
                // .x(function(d) { return d[0] })
                // .y(function(d) { return d[1] })
                .x(function(d) { return d.x })
                .y(function(d) { return d.y })
      ;
        chart.yAxis.tickFormat(d3.format('.02f'))
                   .axisLabel('Cumulative PnL');

        chart.xAxis.tickFormat(function(d){return d3.time.format('%x')(new Date(d))})
                   .axisLabel('Date');
        d3.select(svgId)
          .attr('width', width)
          .attr('height', height)
          .datum(populateSparseDates(dataFunction(true)))
          .call(chart);
        return chart;
      },
      callback: function(graph) {
        window.onresize = function() {
          return; 
          var width = $(wrapperId).width();
          var height = width * 0.65;
          // if (width < margin.left + margin.right + 20) width = margin.left + margin.right + 20;
          // if (height < margin.top + margin.bottom + 20) height = margin.top + margin.bottom + 20;
          graph.width(width).height(height);
          d3.select(svgId).attr('width', width).attr('height', height).call(graph);
        };
      }
    });
  }

  function buildStackedBarChart(wrapperId, dataFunction) {
    // var wrapperId = '#cumulative_pnl_chart';
    var width = $(wrapperId).width();
    var height = width * 0.8;
    var svgId = wrapperId + ' svg';

    nv.addGraph({
      generate: function() {
        var chart = nv.models.multiBarHorizontalChart().width(width).height(height)  ;
        chart.x(function(d) { return d.label })
            
             .y(function(d) { return d.value })
             .showValues(true).showControls(false);
        d3.select(svgId)
          .attr('width', width)
          .attr('height', height)
          .datum(dataFunction())
          .call(chart);
        var b = true;
        var bh = Math.round(chart.multibar.barHeight() * 2) + 'px'
        $('svg.thicken-x .nv-x.nv-axis line').each(function(_,ele) {
          $(ele).css({'opacity':(b ? 0.4 : 0.2), 'stroke-width': bh }); b = !b; 
        });
        return chart;
      },
      callback: function(graph) {
        window.onresize = function() {
          return; 
          width = $(wrapperId).width();
          height = width * 0.65;
          graph.width(width).height(height);
          d3.select(svgId).attr('width', width).attr('height', height).call(graph);
        };
      }
    });
  }

  

  function buildLineChart(wrapperId, dataFunction) {
    // var wrapperId = '#cumulative_pnl_chart';
    var width = $(wrapperId).width();
    var height = width * 0.5;
    var svgId = wrapperId + ' svg';
    nv.addGraph({
      generate: function() {
        var chart = nv.models.lineWithFocusChart().width(width).height(height)  ;
        chart.yAxis.tickFormat(d3.format('.02f')).axisLabel('Cumulative PnL');
        chart.y2Axis.tickFormat(d3.format('.02f'));

        chart.xAxis.tickFormat(function(d){return d3.time.format('%x')(new Date(d))}); 
        chart.x2Axis.tickFormat(function(d){return d3.time.format('%x')(new Date(d))})
                   .axisLabel('Date');
        d3.select(svgId)
          .attr('width', width)
          .attr('height', height)
          .datum(dataFunction())
          .call(chart);
        return chart;
      },
      callback: function(graph) {
        window.onresize = function() {
          width = $(wrapperId).width();
          height = width * 0.65;
          graph.width(width).height(height);
          d3.select(svgId).attr('width', width).attr('height', height).call(graph);
        };
      }
    });
  }
}
