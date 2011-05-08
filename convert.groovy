def counter = 0

new File(this.args[0]).eachLine {
  if (counter++ == this.args[1] as Integer) {
    println it
    counter = 0
  }
}
