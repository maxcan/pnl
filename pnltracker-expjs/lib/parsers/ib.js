

var cheerio = require('cheerio');

exports.parseGeneratedReportString = function(ibHtmlData, owner) {
  var hdrSym      = "Symbol"
  var hdrDateTime = "Date/Time"
  var hdrExchange = "Exchange"
  var hdrQty      = "Quantity"
  var hdrPrice    = "T. Price"
  var hdrComms    = "Comm/Tax"
  var transactionsIdPrefix = "tblTransactions_" ; // U764128
  var $ = cheerio.load(ibHtmlData, {lowerCaseTags: true} );
  // find the account number
  var curId = ''; 
  var allTrades = [];
  $('table').each(function(_, tblElement) {
    var tblIdString = $(tblElement).attr('id') ; 
    if (tblIdString) { 
      if (tblIdString.substring(0,transactionsIdPrefix.length) === transactionsIdPrefix) {
        try {

          curId = tblIdString.substring(transactionsIdPrefix.length);
          console.log('curID = ' + curId);  // _DEBUG
          var allRows = $(tblElement).find('tr');
          var hdrRow = allRows.first();
          var cols = hdrRow.map(function(i,e) {return $(e).text().trim();})[0].split("\n\t");
          var colCount = cols.length;

          var idxSym = cols.indexOf(hdrSym);
          var idxDateTime = cols.indexOf(hdrDateTime);
          var idxExchange = cols.indexOf(hdrExchange);
          var idxQty = cols.indexOf(hdrQty);
          var idxPrice = cols.indexOf(hdrPrice);
          var idxComms = cols.indexOf(hdrComms);
          if ([idxSym, idxDateTime, idxExchange, idxQty, idxPrice, idxComms].indexOf(-1) != -1) {
            // we couldn't find one of the headers.  bail out
            throw new Error("coudln't find the column headings");
          }

          allRows.each(function rowIterator(_, rowElement) {
            if ($(rowElement).children().length != colCount) {
            } else { 

              var elements = $(rowElement).children().map(function (i,e) { return $(e).text(); });
              var newTrade = 
                { date    : elements[idxDateTime]
                , qty     : elements[idxQty]
                , symbol  : "ib:" + elements[idxSym]
                , exchnge : elements[idxExchange]
                , avgPx   : elements[idxPrice]
                , fees    : elements[idxComms]
                };
              allTrades.push(newTrade);
            }
            
          });
        } catch (e) {
          console.log(" couldn't get column headings for this table" + e);  // _DEBUG
          throw e ;
        }
        // :console.log('setting curID');  // _DEBUG
      }
    }
  });
  return allTrades;
}

