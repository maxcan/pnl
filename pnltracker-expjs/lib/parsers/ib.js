

var cheerio = require('cheerio');



exports.parseEmailedReportString = function(ibHtmlData, owner, mailRef) {
  /*****
   *  looking to parse tables like:
   *
      <div>Trades</div>
      <a name="0.0_transactions_"></a><div>
      <table cellspacing="0">
        <tr>
        <th width="6%" align="left">Acct ID</th>
        <th width="12%" align="left">Symbol</th>
        <th width="12%" align="left">Trade Date</th>
        <th width="8%" align="left">Settle Date</th>
        <th width="6%" align="left">Buy/Sell</th>
        <th width="6%" align="left">Exchange</th>
        <th width="8%" align="right">Quantity</th>
        <th width="8%" align="right">Price</th>
        <th width="10%" align="right">Proceeds</th>
        <th width="6%" align="right">Comm</th>
        <th width="6%" align="right">Tax</th>
        <th width="6%" align="right">Order Type</th>
        <th width="6%" align="right">Code</th>
        </tr>

        <tr><td colspan="13">Equity and Index Options</td></tr>
        <tr><td colspan="13">USD</td></tr>
        <tr>
        <td align="left" width="6%">U764128</td>
        <td align="left" width="12%">ZNGA 22DEC12 2.0 P</td>
        <td align="left" width="12%">2012-09-05, 12:18:18</td>
        <td align="left" width="8%">2012-09-06</td>
        <td align="left" width="6%">BUY</td>
        <td align="left" width="6%">-</td>
        <td align="right" width="8%">5</td>
        <td align="right" width="8%">0.1100</td>
        <td align="right" width="10%">-55.00</td>
        <td align="right" width="6%">-2.20</td>
        <td align="right" width="6%">0.00</td>
        <td align="right" width="6%">LMT</td>
        <td align="right" width="6%">O</td>
        </tr>
   */

  var hdrSym      = "Symbol"
  var hdrAcctId   = "Acct ID"
  var hdrDateTime = "Trade Date"
  var hdrExchange = "Exchange"
  var hdrQty      = "Quantity"
  var hdrPrice    = "Price"
  var hdrComms    = "Comm"
  var hdrTax      = "Tax"
  var $ = cheerio.load(ibHtmlData, {lowerCaseTags: true} );
  var allTrades = [];
  $('table').each(function(_, tblElement) {
    try {
      var allRows = $(tblElement).find('tr');
      var hdrRow = allRows.first();
      // console.log('---------------------------------------');  // _DEBUG
      // console.log('processing: ' + $(tblElement).html().substring(0,400));  // _DEBUG
      //not sure why we dont need to split them this time..
      var cols = [];
      hdrRow.children().each(function(i,e) { cols[i] = $(e).text().trim();});
      if (!cols) return;
      // console.log('cols = ' + cols);  // _DEBUG
      var colCount = cols.length;

      var idxSym = cols.indexOf(hdrSym);
      var idxAcctId = cols.indexOf(hdrAcctId);
      var idxDateTime = cols.indexOf(hdrDateTime);
      var idxExchange = cols.indexOf(hdrExchange);
      var idxQty = cols.indexOf(hdrQty);
      var idxPrice = cols.indexOf(hdrPrice);
      var idxComms = cols.indexOf(hdrComms);
      var idxTax = cols.indexOf(hdrTax);
      // console.log('checking headers..');  // _DEBUG
      if ([idxSym, idxDateTime, idxExchange, idxQty, idxPrice, idxComms, idxTax, idxAcctId].indexOf(-1) != -1) {
        // we couldn't find one of the headers.  bail out

        return ; 
      }
      allRows.each(function rowIterator(_, rowElement) {
        if ($(rowElement).children().length != colCount) {
          // console.log('row wtih wrong count.. skipping');  // _DEBUG
          // console.log('colCont' + colCount + ' and cur count=  ' + $(rowElement).children().length  );  // _DEBUG
        } else { 

          var elements = $(rowElement).children().map(function (i,e) { return $(e).text(); });
          if (elements[idxSym] != hdrSym) { 
            var newTrade = 
              { date    : new Date(elements[idxDateTime])
              , qty     : Number(elements[idxQty])
              , symbol  : "ib:" + elements[idxSym]
              , exchnge : elements[idxExchange]
              , avgPx   : Number(elements[idxPrice])
              , fees    : Number(elements[idxComms]) + Number(elements[idxTax])
              , acctId  : elements[idxAcctId]
              , mailRef : mailRef
              };
            allTrades.push(newTrade);
          }
        }
      });
    } catch (e) {
      console.log('exception in parseEmailedReport: ' + e);
      throw e;
    }
  });
  return allTrades;
}

exports.parseGeneratedReportString = function(ibHtmlData, owner) {
  /*****
   *  looking to parse tables like:
          <A name="tblTransactions_U764128"></A><DIV class="tblBodyDiv" id="tblTransactions_U764128DivContainer">
          <TABLE cellspacing="0" id="tblTransactions_U764128"><THEAD></THEAD><TBODY>
            <TR>
            <TH width="12%" align="left">Symbol</TH>
            <TH width="12%" align="left">Date/Time</TH>
            <TH width="6%" align="left">Exchange</TH>
            <TH width="6%" align="right">Quantity</TH>
            <TH width="6%" align="right">T. Price</TH>
            <TH width="6%" align="right">C. Price</TH>
            <TH width="8%" align="right">Proceeds</TH>
            <TH width="6%" align="right">Comm/Tax</TH>
            <TH width="8%" align="right">Basis</TH>
            <TH width="8%" align="right">Realized P/L</TH>
            <TH width="8%" align="right">MTM P/L</TH>
            <TH width="8%" align="right">Code</TH>
            </TR>

            <TR><TD colspan="12" class="assetHeader">Stocks</TD></TR>
            <TR><TD colspan="12" class="currencyHeader">USD</TD></TR>
            <TR>
            <TD align="left" width="12%">AAPL</TD>
            <TD align="left" width="12%">2011-10-19, 08:21:06</TD>
            <TD align="left" width="6%">-</TD>
            <TD align="right" width="6%">100</TD>
            <TD align="right" width="6%">400.0100</TD>
            <TD align="right" width="6%">398.6200</TD>
            <TD align="right" width="8%">-40,001.00</TD>
            <TD align="right" width="6%">-1.02</TD>
            <TD align="right" width="8%">40,002.02</TD>
            <TD align="right" width="8%">0.00</TD>
            <TD align="right" width="8%">-139.00</TD>
            <TD align="right" width="8%">O</TD>
            </TR>
   */
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
              if (elements[idxSym] != hdrSym) { 
                var newTrade = 
                  { date    : new Date(elements[idxDateTime])
                  , qty     : Number(elements[idxQty])
                  , symbol  : "ib:" + elements[idxSym]
                  , exchnge : elements[idxExchange]
                  , avgPx   : Number(elements[idxPrice])
                  , fees    : Number(elements[idxComms])
                  };
                allTrades.push(newTrade);
              }
            }
            
          });
        } catch (e) {
          // console.log(" couldn't get column headings for this table" + e);  // _DEBUG
          throw e ;
        }
        // :console.log('setting curID');  // _DEBUG
      }
    }
  });
  return allTrades;
}

