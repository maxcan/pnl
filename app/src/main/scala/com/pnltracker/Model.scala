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
case class Opt
    ( isCall: Boolean
    , strike: Double
    , expDate: Date
    , underlying: Security
    ) 

case class Security
    ( @Key("_id") _id: ObjectId = new ObjectId
    , symbol: String
    , securityType: SecurityType
    )

object SecurityDAO extends SalatDAO[Security, ObjectId](
    collection = MongoConnection()("pnltracker")("security")) 

case class Trade
    ( @Key("_id") _id:  ObjectId = new ObjectId
    , security:         Option[Security]
    , symbol:           String
    )

object TradeDAO extends SalatDAO[Trade, ObjectId](
    collection = MongoConnection()("pnltracker")("trade")) 

case class Execution
    ( @Key("_id") _id:  ObjectId = new ObjectId
    , security:         Option[Security]
    , symbol:           String
    , price:            Double
    , quantity:         Long
    )
