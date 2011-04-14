var express = require('express');
var jade = require('jade');
var nowjs = require('now');

// Express - Configure App
var app = express.createServer();

app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('view engine', 'jade');
});

// Express - Routes
app.get('/', function(req, res) {

  console.log("Rendering chat app");

  res.render('chat', {
    layout: 'chatLayout',
    title: 'Holy Chat!',
    data: {
      pageTitle: 'Holy Chat!'
    }
  });

});

// Initialize http server
app.listen(8080);
console.log("Holy Chat Started on port %d", app.address().port);

// Initialize NowJs
var everyone = nowjs.initialize(app);
console.log("NowJs Initialized");

var users = [];

everyone.connected(function() {
  for(var i=0; i< users.length; i++) {
    everyone.now.userJoin(users[i], false);
  }

  everyone.now.userJoin(this.now.name, true);
  users.push(this.now.name);
});

everyone.disconnected(function() {
  everyone.now.userLeave(this.now.name);

  var i = users.indexOf(this.now.name);
  if (i >= 0) {
    users.splice(i, 1);
  }
});

everyone.now.distributeMessage = function(msg) {
  everyone.now.receiveMessage(this.now.name, msg);
}

