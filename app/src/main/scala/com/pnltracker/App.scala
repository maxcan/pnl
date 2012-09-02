package com.pnltracker

import java.io.File
import org.jsoup.nodes._
import scala.collection.JavaConversions._
import scalaz._
import Scalaz._
import org.jsoup.Jsoup
//  .. import org.scalatest.FunSuite


object App extends App {
    //  println("Hello, App")
    //  val input = new File("../assets/ib_sample.html")
    //  val doc = Jsoup.parse(input, "UTF-8")
    //  val tradeTable = doc.select("#tblTransactions_U764128 tr")

    //  val a = (mkExtractor(tradeTable.first())) match {
    //      case Some(fxn) =>
    //          val trades = (List() ++ tradeTable.iterator()).map(fxn).flatten
    //          trades.foreach(println(_))
    //          println("boo")
    //      case None => println("failed to find the right columns")
    //  }


    //  def mkExtractor(headerRow: Element): Option[Element => Option[(String, String, String)]] = {
    //      val hdrSym      = "Symbol"
    //      val hdrDateTime = "Date/Time"
    //      val hdrExchange = "Exch"
    //      val hdrQty      = "Quantity"
    //      val hdrPrice    = "T. Price"
    //      val hdrComms    = "Comm/Tax"
    //      val hdrIter = List() ++ headerRow.children().iterator()
    //      val hdrs = hdrIter.map((e) => e.ownText())

    //      def findIdx(k : String) : Option[Int] = {
    //        val i = hdrs.indexWhere(_ == k)
    //        println ("found string: " + k + " at idx: " + i)
    //        if (i != -1)  Some(i) else (None)
    //      }
    //      // hdrs.foreach(e => println(e))
    //      for {
    //          idxSym <- findIdx(hdrSym)
    //          idxPrice <- findIdx(hdrPrice)
    //          idxComms <- findIdx(hdrComms)
    //          idxQty <- findIdx(hdrQty)
    //          expCols = hdrs.length
    //          val fxn = (ele: Element) => 
    //              if  (ele.children().iterator().length < expCols
    //                  || ele.children.get(idxSym).ownText() == "Symbol"
    //                  )
    //                  None
    //              else 
    //                  Some( ele.children().get(idxSym).ownText()
    //                      , ele.children().get(idxPrice).ownText() 
    //                      , ele.children().get(idxQty).ownText() 
    //                      )
    //      } yield fxn
    //  }

    // test("basic test") {
    //     assert(true)
    // }

}
