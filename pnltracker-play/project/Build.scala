import sbt._
import Keys._
import PlayProject._

object ApplicationBuild extends Build {

    val appName         = "pnltracker-play"
    val appVersion      = "1.0-SNAPSHOT"

    val appDependencies = Seq ( "org.jsoup" % "jsoup" % "1.6.3"
                              , "org.scalaz" %% "scalaz-core" % "6.0.4"
                              , "com.novus" %% "salat" % "1.9.1"
                              , "org.scalatest" %% "scalatest" % "1.8" % "test"
                              , "org.mongodb" %% "casbah" % "2.4.1" )

    val main = PlayProject(appName, appVersion, appDependencies, mainLang = SCALA).settings(
      // Add your own project settings here      
      testOptions in Test := Nil
    )

}
