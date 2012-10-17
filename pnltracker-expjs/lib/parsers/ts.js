var _ = require('underscore');

var util = require('util');


/**********************************************************************
 * sample report:
 */
var sampleExtract = [
                "The TradeStation Building",
                "Page 1 of 2",
                "Suite 2000",
                "8050 S.W. 10th Street",
                "Plantation, FL 33324",
                "(954) 652-7920 * (800) 871-3577",
                "Processing Date  9/05/2012",
                "Account Number 17406463 FTR9",
                "0000028929",
                "NATHANIEL COX",
                "10055 N 142ND ST UNIT 2030",
                "SCOTTSDALE AZ 85259",
                "CONFIRMATION",
                "WE ARE PLEASED TO CONFIRM THE FOLLOWING TRANSACTION(S)",
                "Please address all communications to the firm and not to any particular individual, and please",
                "prominently mention your account number in your correspondence.",
                "EQUITIES AND OPTIONS",
                "Trade Settlement Bought/ Symbol/",
                "Trade",
                "Date Date Sold Description CUSIP Quantity Price Money Type Money Amount Type MC Number",

        "09/05/2012 09/06/2012 Bought",
        "DISNEY WALT CO",
        "OCT 20,2012 @ 50 CALL",
        "OPENING CONTRACT",
        "DIS 121020C50 3 1.76 Principal 528.00 MGN 71 70198",
        "2546872*C Commission 3.00",
        "Options Regulatory Fee 0.08",
        "NET AMOUNT 531.08",

                "09/05/2012 09/06/2012 Bought",
                "APPLE COMPUTER INC",
                "SEP 22,2012 @ 675 CALL",
                "OPENING CONTRACT",
                "AAPL 120922C675 1 14.35 Principal 1,435.00 MGN 81 81924",
                "0378331^* Commission 1.00",
                "Options Regulatory Fee 0.03",
                "NET AMOUNT 1,436.03",

                "09/05/2012 09/06/2012 Bought",
                "SPDR TR",
                "SEP 22,2012 @ 141 PUT",
                "OPENING CONTRACT",
                "SPY 120922P141 3 2.24 Principal 672.00 MGN 81 81925",
                "78462F2$: Commission 3.00",
                "Options Regulatory Fee 0.08",
                "NET AMOUNT 675.08",

                "09/05/2012 09/06/2012 Sold",
                "SPDR TR",
                "SEP 22,2012 @ 141 PUT",
                "CLOSING CONTRACT",
                "SPY 120922P141 3 2.22 Principal 666.00 MGN 81 84446",
                "78462F2$: Commission 3.00",
                "Options Regulatory Fee 0.08",
                "Transaction Fee 0.02",
                "NET AMOUNT 662.90",
                "09/05/2012 09/06/2012 Sold",
                "SPDR TR",
                "SEP 28,2012 @ 141 PUT",
                "CLOSING CONTRACT",
                "SPY 120928P141 2 2.69 Principal 538.00 MGN 81 84447",
                "78462F2!N Commission 2.00",
                "Options Regulatory Fee 0.06",
                "Transaction Fee 0.02",
                "NET AMOUNT 535.92",

                "26610 7487 0 250 564Q",
                "IT  IS  AGREED  BETWEEN  YOU  AND  TRADESTATION",
                "SECURITIES THAT:",
                "1. Transactions are subject to the terms of your Account Application",
                "and  Agreement  with  TradeStation  Securities  (your  \"Agreement\")",
                "and the constitution, rules, by-laws, practices and interpretations of",
                "the  exchange  or  market  (and  clearing  house,  if  any)  where",
                "executed, and of the Financial Industry Regulatory Authority, and",
                "all applicable law.",
                "2. If  required  payment  or  delivery  of  securities  is  not  made  by",
                "settlement  date,  positions  may  be  closed  out  and  appropriate",
                "charges, including interest, may be made to your account.",
                "3. Until  fully  paid  for,  securities  in  a  cash  account,  as  defined  by",
                "Regulation T of the Federal Reserve Board, may be hypothecated",
                "under  circumstances  which  permit  commingling  thereof  with",
                "securities of other customers.",
                "4. The  name  of  the  party  from  or  to  whom  the  securities  were",
                "purchased or sold for you, and the time when the transaction took"
                ];

// Patterns:

// this is the trade and settlement date of a trade and represents the beginning of 
// a new block
var patTradeDateLine = /^(\d\d\/\d\d\/\d{4}) +(\d\d\/\d\d\/\d{4}) +(Bought|Sold)/;
var patDescription = /^[A-Z0-9a-z ]*$/  ; 
var patOptionInfo = /^([A-Z]{3}) +(\d\d),(\d{4}) +@ +([.0-9]+) +(PUT|CALL)/;
var patOpenClose  = /^(OPENING|CLOSING) CONTRACT/;

// Matched fields:           [ 'SPY 120928P141 2 2.69 Principal 538.00 MGN 81 84447',
//    1: underlying symbol     'SPY',
//    2: 20xx year             '12',
//    3: month (01-12)         '09',
//    4: day                   '28',
//    5: C or P                'P',
//    6: strike                '141',
//    7: quantity              '2',
//    8: price                 '2.69',
//    9: total principal       '538.00',

var patDetailLine = /^([A-Z]{1,5}) +(\d\d)(\d\d)(\d\d)(C|P)([0-9.]+) +([0-9,]+) ([0-9,]+\.\d\d) Principal ([0-9,]*\.\d\d) +.*$/;

var patCommission = /^.* Commission ([0-9,]+\.\d\d)$/;
var patGenericFee = /^.* Fee +([0-9,]+\.\d\d)$/;
var patTxnFee = /^.* Fee +([0-9,]+\.\d\d)$/;
var patNetAmt = /NET AMOUNT +([0-9,]+\.\d\d)$/;

function stateNew(remLines, fillStack) {
  function nextLine() { 
    var l = remLines.shift();
    return l;
  }
  var curLine = nextLine();
  if (!curLine) return fillStack;
  var matchTradeDate = curLine.match(patTradeDateLine);
  if (!matchTradeDate) return stateNew(remLines, fillStack);
  if (remLines.length < 7) throw new Error('Insufficient lines following date declaration');
  var matchDesc = nextLine().match(patDescription); 
  if (!matchDesc) throw new Error('could not find desc after date');

  var matchOptionInfo = nextLine().match(patOptionInfo); 
  if (!matchOptionInfo) throw new Error('could not find OptionInfo ');

  var matchOpenClose = nextLine().match(patOpenClose); 
  if (!matchOpenClose) throw new Error('could not find OpenClose ');

  var matchDetailLine = nextLine().match(patDetailLine); 
  if (!matchDetailLine) throw new Error('could not find DetailLine ');

  var matchCommission = nextLine().match(patCommission); 
  if (!matchCommission) throw new Error('could not find Commission ');

  // ok, now we need to loop through fees..
  
  var totalGenericFees = 0;
  var givenNetAmt;
  var iterateOverGenericFees = function() {
    var nextItem = nextLine();
    var matchGenericFee = nextItem.match(patGenericFee);
    if (matchGenericFee) {
      totalGenericFees += Number(matchGenericFee[1]);
      return iterateOverGenericFees();
    } else {
      var matchNetAmt = nextItem.match(patNetAmt);
      if (matchNetAmt) {
        givenNetAmt = Number(matchNetAmt[1]);
      } else { throw new Error('unexpected string: ' + nextItem);}
    }
  }
  iterateOverGenericFees();

  var fillDate = new Date(matchTradeDate[1]);
  // set openings in the morning, closings in the afternoon (so we get the ordering right)
  var fillIsOpen = matchOpenClose[1] === "OPENING" ;
  (fillIsOpen ? fillDate.setHours(10) : fillDate.setHours(15));
  var nextFill = 
    { date:   fillDate
    , qty:    (matchTradeDate[3] === 'Bought' ? 1 : -1) * Number(matchDetailLine[7])
    , avgPx:  Number(matchDetailLine[8])
    , fees:   -1 * (totalGenericFees + Number(matchCommission[1]))
    , symbol: 'ts:'+ matchDetailLine[1] + ' '  
                   + matchDetailLine[2]
                   + matchDetailLine[3]
                   + matchDetailLine[4]
                   + matchDetailLine[5]
                   + matchDetailLine[6]
    , isOpen: fillIsOpen
    }
                  
  var calcedPrin = (-1 * nextFill.qty * nextFill.avgPx * 100) + nextFill.fees;
  
  if (givenNetAmt - Math.abs(calcedPrin) > 0.0001) { 
    console.log('fill: ' + util.inspect(nextFill));  // _DEBUG
    console.log('calced: ' + calcedPrin);  // _DEBUG
    console.log('given: ' + givenNetAmt);  // _DEBUG
    throw new Error("principal sanity check failed");
  }
  fillStack.push(nextFill)
  return stateNew(remLines, fillStack);
}

exports.parseTradeStationExtractedText = function(lines) {
  return stateNew(lines,[]);  
}; 


