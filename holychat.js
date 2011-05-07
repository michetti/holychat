var express = require('express');
var jade = require('jade');
var io = require('socket.io');
var os = require('os');
var exec = require('child_process').exec;

var getCpuCommand = "ps -p " + process.pid + " -u | grep " + process.pid;

var usersConnected = 0;
var dtMessages = 0;
var totalMessages = 0;


function printLog() {
  var child = exec(getCpuCommand, function(error, stdout, stderr) {
       var d = new Date();
       var ts = d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

      var s = stdout.split(/\s+/);
      var cpu = s[2];
      var memory = s[3];
 
      console.log(ts + ',' + usersConnected + ',' + memory + ',' + cpu + ',' + totalMessages + ',' + dtMessages);
  });
}


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

  console.log("Serving chat app");

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
//console.log("Holy Chat Started on port %d", app.address().port);

// Log cpu and memory utilization
setInterval(function() {
  printLog();
  dtMessages = 0;
  
}, 1000);

// Initialize Socket.IO
var socket = io.listen(app, {log: null});

socket.on('connection', function(client) {
  usersConnected++;

  client.on('message', function(data) {
    //console.log('Message received');
    //console.log(data);


    if (data.action === 'message') {

      dtMessages += (1 + usersConnected);
      totalMessages += (1 + usersConnected);

      // set client email
      data.email = client.email;

      // broadcast message
      socket.broadcast(data);

    } else if (data.action === 'join') {
      // set client email
      client.email = data.email;

      // set that this is a new user
      data.newUser = true;

      // broadcast joined message
      socket.broadcast(data);

      // send all other clients to the new user
      for(var i in socket.clients) {
        var c = socket.clients[i];

        // Don't send duplicated message
        if (c.email === client.email) return;

        client.send({action: 'join', email: c.email, newUser: false});
      }
    }
  });

  client.on('disconnect', function() {
    var data = {};
    data.action = 'leave';
    data.email = client.email;

    usersConnected--;

    client.broadcast(data);
  });
});
