// import required modules
var sio = require('socket.io');
var should = require('./common');
var parser = sio.parser;

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

  // This user email
  var testUserEmail = null;

  var joined = false;

  var cl = client(8080);
  var ws;

  cl.handshake(function(sid) {

    ws = websocket(cl, sid);
    
    ws.on('message', function(data) {

      if (data.type === 'connect') {
        
        // increment the users count and stores the current user id
        userId = ++users;
  
        // gererate the user email
        testUserEmail = 'user' + userId + '@benchamrk.com';
  
        // send the join event
        var eventJoin = parser.encodePacket({
          type: 'event',
          name: 'join',
          endpoint: '',
          args: [{'email': testUserEmail}]
        });
        ws.send(eventJoin);

      } else if (data.type === 'event') {

        if (joined && data.name === 'message') {

          var payload = parser.encodePacket(data);

          var d = new Date();
          var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
          // generate log that will be used on the experiment, the format is:
          // time stamp, SEND/RECEIVE, users, message length
          console.log(ts + ',' + userId + ',RECEIVE,' +  users + ',' + payload.length);

        } else if (!joined && data.name === 'joined' && data.args[0].email === testUserEmail) {

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
              cl.end();
              return;
            }
    
            // decrement the number of messages left
            numberOfMessages--;
    
            // generate the message
            var eventMessage =  parser.encodePacket({
              type: 'event',
              name: 'message',
              endpoint: '',
              args: [{'message': generateRandomMessage()}]
            });

            var d = new Date();
            var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
    
            // print the log message that will be used on the experiment, format is:
            // time stamp, SEND/RECEIVE, usuarios, tamanho mensagem
            console.log(ts + ',' + userId + ',SEND,' + users + ',' + eventMessage.length);
    
            // send it
            ws.send(eventMessage);
    
          }, 1000);
          
        }

      }

    });

  });
}
  
// This function will create as many parallel users as specified on parameters
for(var i=1; i<=parseInt(process.argv[2]); i++) {

  // Add one user every 1,1 seconds, so we don't fload the server
  setTimeout(function() {
    user();
  }, i * 1100);

}
