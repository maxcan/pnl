import com.pnltracker._
import com.pnltracker.parsers._
import java.io.File
import org.jsoup.nodes._
import scala.collection.JavaConversions._
import scalaz._
import Scalaz._
import org.jsoup.Jsoup
import org.scalatest.FunSuite
import com.novus.salat.dao._
import com.mongodb.casbah.Imports._

class TestSuite extends FunSuite { 

    test("Clearing the DB") {
        Model.clearAll()
        assert(UserDAO.find(MongoDBObject()).length == 0)
        assert(SecurityDAO.find(MongoDBObject()).length == 0)
        assert(TradeDAO.find(MongoDBObject()).length == 0)
        assert(ExecutionDAO.find(MongoDBObject()).length == 0)
    }
    test("inserting a security") {
        SecurityDAO.insert(Security(symbol = "AAPL", securityType = Stock()))
        SecurityDAO.insert(Security(symbol = "JNK", securityType = Stock()))
        assert(SecurityDAO.find(MongoDBObject()).length == 2)
    }
    test("parsing a document") {
        val newUser = User(email = "test@example.com", famName = "fam", givName = "giv")
        val userId = UserDAO.insert(newUser) match {
            case None => fail("could not insert user")
            case Some(u) => u
        }
        
        Ib.loadTrades("../assets/ib_sample.html", userId)
        assert(SecurityDAO.lookupSymbolExp("AAPL") != None, "failed AAPL exists")
        assert(SecurityDAO.lookupSymbolExp("JNK") != None, "failed jnk exists")
        assert(ExecutionDAO.find(MongoDBObject()).length == 2
            , "Should have inserted 2 executions")
    }
    test("calculating principle for AAPL trades") { 
        val p = ExecutionDAO.find(MongoDBObject("symbol" -> "AAPL")).map(_.principle).sum
        println(p)
        assert(p > 302.3 && p < 303, "prin = " + p)
    }
}
