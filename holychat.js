// required modules
var express = require('express'); // web framework
var jade = require('jade'); // template framework
var io = require('socket.io'); // websockets implementation
var os = require('os');
var exec = require('child_process').exec; // used to call other system processes

// command to read process consumed memory and cpu time
var getCpuCommand = "ps -p " + process.pid + " -u | grep " + process.pid;

// indicate the number of connected users
var usersConnected = 0;

// indicate the number of messages since last printed log
var dtMessages = 0;

// indicate the total number of messages
var totalMessages = 0;


// print the log used by the experiment
function printLog() {

  // call a system command (ps) to get current process resources utilization
  var child = exec(getCpuCommand, function(error, stdout, stderr) {
       var d = new Date();
       var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

      var s = stdout.split(/\s+/);
      var cpu = s[2];
      var memory = s[3];

      // print log line 
      console.log(ts + ',' + usersConnected + ',' + memory + ',' + cpu + ',' + totalMessages + ',' + dtMessages);

      // reset dt messages
      dtMessages = 0;
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


// Log cpu and memory utilization every second
setInterval(function() {
  printLog();
  
}, 1000);


// Initialize Socket.IO
var socket = io.listen(app, {log: null});

// Socket.IO handlers
socket.on('connection', function(client) {

  // increment number of connected users
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
