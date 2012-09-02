package com.pnltracker

import java.io.File
import java.util.Date
import com.novus.salat._
import com.novus.salat.annotations._
import com.novus.salat.global._
import com.mongodb.casbah.Imports._
import com.novus.salat.dao._
import com.mongodb.casbah.Imports._
import com.mongodb.casbah.MongoConnection



@Salat
sealed abstract class SecurityType

case class Stock() extends SecurityType
case class Dummy(s: String) extends SecurityType
case class Option
    ( isCall: Boolean
    , strike: Double
    , expDate: Date
    ) 

case class Security
    ( _id: ObjectId = new ObjectId
    , symbol: String
    , securityType: SecurityType
    )


object SecurityDAO extends SalatDAO[Security, ObjectId](
    collection = MongoConnection()("quick-salat")("security"))
