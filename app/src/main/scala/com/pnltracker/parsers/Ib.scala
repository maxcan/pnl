package com.pnltracker.parsers

import java.io.File
import org.jsoup.nodes._
import scala.collection.JavaConversions._
import scalaz._
import Scalaz._
import org.jsoup.Jsoup
import com.pnltracker._
import com.mongodb.casbah.Imports._

object Ib {
    println("Hello, IB Parser")
    def loadTrades(filepath: String, userId: ObjectId) {
        val input = new File(filepath)
        val doc = Jsoup.parse(input, "UTF-8")
        val tradeTable = doc.select("#tblTransactions_U764128 tr")
        
        val a = (mkExtractor(tradeTable.first(), userId)) match {
            case Some(fxn) =>
                val trades = (List() ++ tradeTable.iterator()).map(fxn).flatten
                trades.foreach(ExecutionDAO insert _)
                println("boo")
            case None => println("failed to find the right columns")
        }
    } 


    def mkExtractor(headerRow: Element, userId: ObjectId): Option[Element => Option[Execution]] = {
        val hdrSym      = "Symbol"
        val hdrDateTime = "Date/Time"
        val hdrExchange = "Exch"
        val hdrQty      = "Quantity"
        val hdrPrice    = "T. Price"
        val hdrComms    = "Comm/Tax"
        val hdrIter = List() ++ headerRow.children().iterator()
        val hdrs = hdrIter.map((e) => e.ownText())

        
        def findIdx(k : String) : Option[Int] = {
          val i = hdrs.indexWhere(_ == k)
          println ("found string: " + k + " at idx: " + i)
          if (i != -1)  Some(i) else (None)
        }
        // hdrs.foreach(e => println(e))
        for {
            idxSym <- findIdx(hdrSym)
            idxPrice <- findIdx(hdrPrice)
            idxComms <- findIdx(hdrComms)
            idxDateTime <- findIdx(hdrDateTime)
            idxQty <- findIdx(hdrQty)
            expCols = hdrs.length
            val fxn = (ele: Element) => 
                if  (ele.children().iterator().length < expCols
                    || ele.children.get(idxSym).ownText() == "Symbol"
                    )
                    None
                else for {
                    px <-  ele.children().get(idxPrice).ownText().parseDouble.toOption
                    cms <-  ele.children().get(idxComms).ownText().parseDouble.toOption
                    qty <- ele.children().get(idxQty).ownText().parseInt.toOption
                    dt  <-  ele.children().get(idxDateTime).ownText() |> Model.parseDate
                    sym = ele.children().get(idxSym).ownText()
                    exec = Execution ( owner = userId
                        , security = SecurityDAO.lookupSymbolExp(sym)
                        , symbol = sym
                        , price = px
                        , tradeDate = dt
                        , quantity = qty
                        , comms = cms
                        )
                } yield exec
        } yield fxn
    }

}
