// import required modules
var io = require('socket.io-client');

var host = '127.0.0.1';
var port = 8080;
var users = 0;

// Get parameters from commmand line
if (process.argv[2] == 'help' || process.argv[2] == '?') {
   console.log(' ');
   console.log(' ');
   console.log('Benchmark script Help');
   console.log('---------------------');
   console.log(' ');
   console.log('usage: node benchmark.js (a) (b) (c) (d) (e) (f)'); 
   console.log(' ');
   console.log('  (a) - Number of users to spawn (one every 0,5 seconds until reach this number)');
   console.log('  (b) - Number of messages to sent by each user before it quits the chat');
   console.log('  (c) - Size of the messages the users will send in bytes');
   console.log('  (d) - Time interval between messages when sending (miliseconds)');
   console.log('  (e) - Time interval between getting messages from the server (miliseconds)');
   console.log('  (f) - User behavior is regular or random - 0 for regular and 1 for random');
   console.log(' ');
   console.log(' ');
   process.exit();
} 
var maxUsers = parseInt(process.argv[2]); 
var maxMsgs = parseInt(process.argv[3]);
var msgSize = parseInt(process.argv[4]); // in bytes
var sendInterval = parseInt(process.argv[5]); // In miliseconds
var receiveInterval = parseInt(process.argv[6]); // In miliseconds
var randomBehavior = parseInt(process.argv[7]); // 0 for regular and 1 for random behavior when sendind messages

var readyMessage = null

// Utility function that generate a msg messages
function generateMessage() {
    if (readyMessage != null) {
        return readyMessage;
    } else {
        readyMessage = '';
        for (var i = 0 ; i < msgSize ; i++) {
            readyMessage += 'a';
        }
        return readyMessage;
    }
}

// Each call to this function will generate a new user to benchmark the
// WebSocket Chat Server
function user() {

  // This user id
  var userId = -1;

  // This user email
  var testUserEmail = null;

  var socket = io.connect('http://' + host + ':' + port, {'force new connection': true});

  socket.on('connect', function() {
    // increment the users count and stores the current user id
    userId = ++users;
  
    // gererate the user email
    testUserEmail = 'user' + userId + '@benchamrk.com';

    // send the join event
    socket.emit('join', {'email': testUserEmail });
  });

  socket.on('joined', function(data) {
    if (data.email !== testUserEmail) {
      return;
    }

    // number of messages to send
    var numberOfMessages = maxMsgs;

    // function to send new messages
    var sendMessage = function() {
    
      if (numberOfMessages == 0) {
        users--;
        socket.disconnect();
        return;
      }
    
      // decrement the number of messages left
      numberOfMessages--;
    
      var d = new Date();
      var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
    
      // print the log message that will be used on the experiment, format is:
      // time stamp, SEND/RECEIVE, usuarios, tamanho mensagem
      // TODO calcular o tamanho do payload
      console.log(ts + ',' + userId + ',SEND,' + users + ',' + 100);
    
      // send it
      socket.emit('message', {'message': generateMessage()});
    
      if (randomBehavior) {
        // Send a new message between 1 and 5 seconds
        setTimeout(sendMessage, Math.floor(Math.random() * 4000) + 1000);
      } else {
        // Send a new message on a regular period of time
        // defined by the CLI parameter
        setTimeout(sendMessage, sendInterval);
      }
    }

    sendMessage();
  });

  socket.on('message', function() {
    var d = new Date();
    var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
    // generate log that will be used on the experiment, the format is:
    // time stamp, SEND/RECEIVE, users, message length
    // TODO get payload size
    console.log(ts + ',' + userId + ',RECEIVE,' +  users + ',' + 100);
  });

}
  
// This function will create as many parallel users as specified on parameters
for(var i=1; i<=parseInt(process.argv[2]); i++) {

  // Add one user every 1,1 seconds, so we don't fload the server
  setTimeout(function() {
    user();
  }, i * 500);

}
