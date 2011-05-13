// import required modules
var WebSocket = require('websocket-client').WebSocket; // WebSocket client implementation
var utils = require('./utils.js'); // Socket.IO protocol utils

// Number of parallel benchmark users
var users = 0;

// String to generate random messages
var randomMessage = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's";

// Random messages buffer (to improve peformance)
var randomMessagesSize = 0;
var randomMessages = [];

// Funciton to generate (and buffer) random messages
function generateRandomMessage() {
  var extraSize = parseInt(Math.random() * 100);

  // if the buffer is full, read from it, otherwise generate and buffer a new one
  if (randomMessagesSize == 100) {
    return randomMessages[extraSize];

  } else {
    var m = "Benchmark Message: " + randomMessage.substring(0, extraSize);
    randomMessages.push(m);

    return m;
  }
}

// Each call to this function will generate a new user to benchmark the
// WebSocket Chat Server
function user() {

  // This user id
  var userId = -1;

  // Heart Beat (to keep WebSocket connection alive - needed by Socket.IO)
  var heartBeats = 0;

  // This user email
  var testUserEmail = null;

  // WebSocket connection URL (development)
  var ws = new WebSocket('ws://localhost:8080/socket.io/websocket');

  // WebSocket connection URL (production)
  //var ws = new WebSocket('ws://173.203.127.245:8080/socket.io/websocket');
  
  // indicates if this user has joined the chat server
  var joined = false;

  // handlers for WebSocket onmessage event
  ws.onmessage = function(message) {

    // Decode Socket.IO message, to get the payload
    var payload = utils.decode(message.data)[0];
  
    if (joined) {
      // If user has already joined, get the message type from the payload
      var type = payload.substr(0, 3); 

      if (type === '~j~') {
        // ~j~ indicates a JSON message on Socket.IO protocol

        // get the JSON from the payload String
        var data = JSON.parse(payload.substr(3));

        // Only process chat messages (discard join and leave messages)
        if (data.action == 'message') { 
          var d = new Date();
          var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
          // generate log that will be used on the experiment, the format is:
          // time stamp, SEND/RECEIVE, users, message length
          console.log(ts + ',' + userId + ',RECEIVE,' +  users + ',' + payload.length);
        }

      } else if (type === '~h~') {
        // ~h~ indicates a heartbeat, which we should answer back
        ws.send(utils.encode('~h~' + ++heartBeats));
      }

    } else {
      // send the join message

      // increment the users count and stores the current user id
      userId = ++users;

      // gererate the user email
      testUserEmail = 'user' + userId + '@benchamrk.com';

      // send the
      ws.send(utils.encode({action: 'join', email: testUserEmail}));
  
      joined = true;

      // number of messages to send
      var numberOfMessages = parseInt(process.argv[3]);

      // this funciton will be called each second to send a generated message
      // if will stop after the specified number of messages is reached
      var si = setInterval(function() {

        // clear the setInterval if the number of messages was reached
        if (numberOfMessages == 0) {
          clearInterval(si);
          ws.close();
          return;
        }

        // decrement the number of messages left
        numberOfMessages--;

        // generate the message
        var m =  utils.encode({action: 'message', message: generateRandomMessage()})           

        var d = new Date();
        var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

        // print the log message that will be used on the experiment, format is:
        // time stamp, SEND/RECEIVE, usuarios, tamanho mensagem
        console.log(ts + ',' + userId + ',SEND,' + users + ',' + m.length);

        // send it
        ws.send(m);

      }, 1000);
    }
  }
}

// This function will create as many parallel users as specified on parameters
for(var i=1; i<=parseInt(process.argv[2]); i++) {
  //console.log('creating user ' + i);

  // Add one user every 1,1 seconds, so we don't fload the server
  setTimeout(function() {
    user();
  }, i * 1100);

}
