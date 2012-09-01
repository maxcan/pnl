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
      scalaVersion := "2.9.2"
      // add other settings here
    )
  )
}
