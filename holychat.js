// required modules
var express = require('express'); // web framework
var jade = require('jade'); // template framework
var socketIO = require('socket.io'); // websockets implementation
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
  app.set('log level', 0);
});

// Express - Routes
app.get('/', function(req, res) {

  res.render('chat', {
    layout: 'chatLayout',
    title: 'Holy Chat!',
    data: {
      pageTitle: 'Holy Chat!'
    }
  });

});

// Log cpu and memory utilization every second
setInterval(function() {
  printLog();
  
}, 1000);


// Initialize Socket.IO
var io = socketIO.listen(app);

// Socket.IO Reduce Log
io.set('log level', 0);

// Initialize http server
app.listen(8080);

// Socket.IO handlers
io.sockets.on('connection', function(socket) {

//console.log("Conectado");

  // increment number of connected users
  usersConnected++;

  socket.on('join', function(data) {
    //console.log('Join: ' + data);

    socket.set('email', data.email, function() {
      // send user joined event to everybody
      data.newUser = true;
      io.sockets.emit('joined', data);

      // send existing users to joined user
      for(var i in io.sockets.sockets) {
        var otherSocket = io.sockets.sockets[i];

        otherSocket.get('email', function(err, otherEmail) {

          // Don't send my own email
          if (otherEmail === data.email) return;

          socket.emit('joined', {email: otherEmail, newUser: false});
        });
      }
    });
  });

  socket.on('message', function(data) {
    //console.log('Message: ' + data);

    dtMessages += (1 + usersConnected);
    totalMessages += (1 + usersConnected);

    socket.get('email', function(err, email) {
      // set client email
      data.email = email;

      // broadcast message to everybody
      io.sockets.emit('message', data);
    }); 
  });

  socket.on('disconnect', function() {
    usersConnected--;

    socket.get('email', function(err, email) {
      socket.broadcast.emit('leave', {email: email});
    });
  });

});
