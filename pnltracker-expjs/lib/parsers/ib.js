

var cheerio = require('cheerio');

exports.parseString = function(ibHtmlData, owner) {
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
                , sym     : elements[idxSym]
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
  // return
  // var acct;
  // if (acctFieldId.substring(0,hdrAcctField.length) === acctFieldId) {
  //   acct = acctFieldId.substring(hdrAcctField.length);
  // } else {
  //   throw new Error("couldn't get account id");
  // }
  // return acct;

}

//        val hdrIter = List() ++ headerRow.children().iterator()
//        val hdrs = hdrIter.map((e) => e.ownText())
//
//        
//        def findIdx(k : String) : Option[Int] = {
//          val i = hdrs.indexWhere(_ == k)
//          println ("found string: " + k + " at idx: " + i)
//          if (i != -1)  Some(i) else (None)
//        }
//        // hdrs.foreach(e => println(e))
//        for {
//            idxSym <- findIdx(hdrSym)
//            idxPrice <- findIdx(hdrPrice)
//            idxComms <- findIdx(hdrComms)
//            idxDateTime <- findIdx(hdrDateTime)
//            idxQty <- findIdx(hdrQty)
//            expCols = hdrs.length
//            val fxn = (ele: Element) => 
//                if  (ele.children().iterator().length < expCols
//                    || ele.children.get(idxSym).ownText() == "Symbol"
//                    )
//                    None
//                else for {
//                    px <-  ele.children().get(idxPrice).ownText().parseDouble.toOption
//                    cms <-  ele.children().get(idxComms).ownText().parseDouble.toOption
//                    qty <- ele.children().get(idxQty).ownText().parseInt.toOption
//                    dt  <-  ele.children().get(idxDateTime).ownText() |> Model.parseDate
//                    sym = ele.children().get(idxSym).ownText()
//                    exec = Execution ( owner = userId
//                        , security = SecurityDAO.lookupSymbolExp(sym)
//                        , symbol = sym
//                        , price = px
//                        , tradeDate = dt
//                        , quantity = qty
//                        , comms = cms
//                        )
//                } yield exec
//        } yield fxn
//    }
//
//}
//
//    test("Clearing the DB") {
//        Model.clearAll()
//        assert(UserDAO.find(MongoDBObject()).length == 0)
//        assert(SecurityDAO.find(MongoDBObject()).length == 0)
//        assert(TradeDAO.find(MongoDBObject()).length == 0)
//        assert(ExecutionDAO.find(MongoDBObject()).length == 0)
//    }
//    test("inserting a security") {
//        SecurityDAO.insert(Security(symbol = "AAPL", securityType = Stock()))
//        SecurityDAO.insert(Security(symbol = "JNK", securityType = Stock()))
//        assert(SecurityDAO.find(MongoDBObject()).length == 2)
//    }
//    test("parsing a document") {
//        val newUser = User(email = "test@example.com", famName = "fam", givName = "giv")
//        val userId = UserDAO.insert(newUser) match {
//            case None => fail("could not insert user")
//            case Some(u) => u
//        }
//        
//        Ib.loadTrades("../assets/ib_sample.html", userId)
//        assert(SecurityDAO.lookupSymbolExp("AAPL") != None, "failed AAPL exists")
//        assert(SecurityDAO.lookupSymbolExp("JNK") != None, "failed jnk exists")
//        assert(ExecutionDAO.find(MongoDBObject()).length == 2
//            , "Should have inserted 2 executions")
//    }
//    test("calculating principle for AAPL trades") { 
//        val p = ExecutionDAO.find(MongoDBObject("symbol" -> "AAPL")).map(_.principle).sum
//        println(p)
//        assert(p > 302.3 && p < 303, "prin = " + p)
//    }
//}
//
//
//// import org.specs2.mutable._
//// 
//// import play.api._
//// import play.api.test._
//// import play.api.test.Helpers._
//// 
//// class HelloWorldSpec extends Specification {
//// 
////     "The 'Hello world' string" should {
////         "contain 11 characters" in {
////             "Hello world" must have size(11)
////         }
////         "start with 'Hello'" in {
////             "Hello world" must startWith("Hello")
////         }
////         "end with 'world'" in {
////             "Hello world" must endWith("world")
////         }
////     }
//// }
////:r
//package models.parsers

// import java.io.File
// import org.jsoup.nodes._
// import scala.collection.JavaConversions._
// import scalaz._
// import Scalaz._
// import org.jsoup.Jsoup
// import models._
// import com.mongodb.casbah.Imports._
// 
// object Ib {
//     println("Hello, IB Parser")
//     def loadTrades(filepath: String, userId: ObjectId) {
//         val input = new File(filepath)
//         val doc = Jsoup.parse(input, "UTF-8")
//         val tradeTable = doc.select("#tblTransactions_U764128 tr")
//         
//         val a = (mkExtractor(tradeTable.first(), userId)) match {
//             case Some(fxn) =>
//                 val trades = (List() ++ tradeTable.iterator()).map(fxn).flatten
//                 trades.foreach(ExecutionDAO insert _)
//                 println("boo")
//             case None => println("failed to find the right columns")
//         }
//     } 
// 
// 
//     def mkExtractor(headerRow: Element, userId: ObjectId): Option[Element => Option[Execution]] = {
//         val hdrSym      = "Symbol"
//         val hdrDateTime = "Date/Time"
//         val hdrExchange = "Exch"
//         val hdrQty      = "Quantity"
//         val hdrPrice    = "T. Price"
//         val hdrComms    = "Comm/Tax"
//         val hdrIter = List() ++ headerRow.children().iterator()
//         val hdrs = hdrIter.map((e) => e.ownText())
// 
//         
//         def findIdx(k : String) : Option[Int] = {
//           val i = hdrs.indexWhere(_ == k)
//           println ("found string: " + k + " at idx: " + i)
//           if (i != -1)  Some(i) else (None)
//         }
//         // hdrs.foreach(e => println(e))
//         for {
//             idxSym <- findIdx(hdrSym)
//             idxPrice <- findIdx(hdrPrice)
//             idxComms <- findIdx(hdrComms)
//             idxDateTime <- findIdx(hdrDateTime)
//             idxQty <- findIdx(hdrQty)
//             expCols = hdrs.length
//             val fxn = (ele: Element) => 
//                 if  (ele.children().iterator().length < expCols
//                     || ele.children.get(idxSym).ownText() == "Symbol"
//                     )
//                     None
//                 else for {
//                     px <-  ele.children().get(idxPrice).ownText().parseDouble.toOption
//                     cms <-  ele.children().get(idxComms).ownText().parseDouble.toOption
//                     qty <- ele.children().get(idxQty).ownText().parseInt.toOption
//                     dt  <-  ele.children().get(idxDateTime).ownText() |> Model.parseDate
//                     sym = ele.children().get(idxSym).ownText()
//                     exec = Execution ( owner = userId
//                         , security = SecurityDAO.lookupSymbolExp(sym)
//                         , symbol = sym
//                         , price = px
//                         , tradeDate = dt
//                         , quantity = qty
//                         , comms = cms
//                         )
//                 } yield exec
//         } yield fxn
//     }
// 
// }
