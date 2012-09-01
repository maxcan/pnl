package com.pnltracker

import java.io.File
import org.jsoup.nodes.Document
import org.jsoup.Jsoup

object App extends App {
  println("Hello, App")
  var input = new File("../assets/ib_sample.html")
  var doc = Jsoup.parse(input, "UTF-8")
  var tradeTable = doc.select("#tblTransactions_U764128")
  println(tradeTable.html())

}
