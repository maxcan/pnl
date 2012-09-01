import sbt._
import sbt.Keys._

object AppBuild extends Build {

  lazy val app = Project(
    id = "app",
    base = file("."),
    settings = Project.defaultSettings ++ Seq(
      name := "App",
      organization := "com.pnltracker",
      version := "0.1-SNAPSHOT",
      scalaVersion := "2.9.2" , 
      // add other settings here
      libraryDependencies ++= Seq (
        "org.jsoup" % "jsoup" % "1.6.3"  , 
        "com.novus" %% "salat" % "1.9.1", 
        "org.mongodb" %% "casbah" % "2.4.1" )

    )
  )
}
