// import required modules
var io = require('socket.io-client-benchmark');

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
   console.log('usage: node benchmark.js (a) (b) (c) (d) (e) (f) (g)'); 
   console.log(' ');
   console.log('  (a) - Number of users to spawn (one every 0,5 seconds until reach this number)');
   console.log('  (b) - Number of messages to sent by each user before it quits the chat');
   console.log('  (c) - Size of the messages the users will send in bytes');
   console.log('  (d) - Time interval between messages when sending (miliseconds)');
   console.log('  (e) - Time interval between getting messages from the server (miliseconds)');
   console.log('  (f) - User behavior is regular or random - 0 for regular and 1 for random');
   console.log('  (g) - Socket.IO transport to use (websocket or xhr-polling)');
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
var transport = process.argv[8];

// Sum message and email sizes on your code
var sizes = {
  'websocket': {
    'send': '5:::{"name":"message","args":[{"message":""}]}'.length,
    'receive': '5:::{"name":"message","args":[{"message":"","email":""}]}'.length,
    'noop': 0
  },
  'xhr-polling': {
    'send': ('' +
        'POST /socket.io/1/xhr-polling/12643751301538141714?t=1318986727328 HTTP/1.1' +
        'Host: 192.168.56.101:8080' +
        'Connection: keep-alive' +
        'Content-Length: 53' +
        'Origin: http://192.168.56.101:8080' +
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.202 Safari/535.1' +
        'Content-type: text/plain;charset=UTF-8' +
        'Accept: */*' +
        'Referer: http://192.168.56.101:8080/' +
        'Accept-Encoding: gzip,deflate,sdch' +
        'Accept-Language: pt-BR,en;q=0.8,en-US;q=0.6' +
        'Accept-Charset: UTF-8,*;q=0.5' +
        '5:::{"name":"message","args":[{"message":""}]}' +
        'HTTP/1.1 200 OK' +
        'Content-Length: 1' +
        'Access-Control-Allow-Origin: *' +
        'Connection: keep-alive' +
        '1').length,
    'receive': ('' +
        'GET /socket.io/1/xhr-polling/12643751301538141714?t=1318986712403 HTTP/1.1' +
        'Host: 192.168.56.101:8080' +
        'Connection: keep-alive' +
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.202 Safari/535.1' +
        'Accept: */*' +
        'Referer: http://192.168.56.101:8080/' +
        'Accept-Encoding: gzip,deflate,sdch' +
        'Accept-Language: pt-BR,en;q=0.8,en-US;q=0.6' +
        'Accept-Charset: UTF-8,*;q=0.5' +
        'HTTP/1.1 200 OK' +
        'Content-Type: text/plain; charset=UTF-8' +
        'Content-Length: 84' +
        'Connection: Keep-Alive' +
        '5:::{"name":"message","args":[{"message":"","email":""}]}').length,
    'noop': ('' +
        'GET /socket.io/1/xhr-polling/12643751301538141714?t=1318986652368 HTTP/1.1' +
        'Host: 192.168.56.101:8080' +
        'Connection: keep-alive' +
        'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.202 Safari/535.1' +
        'Accept: */*' +
        'Referer: http://192.168.56.101:8080/' +
        'Accept-Encoding: gzip,deflate,sdch' +
        'Accept-Language: pt-BR,en;q=0.8,en-US;q=0.6' +
        'Accept-Charset: UTF-8,*;q=0.5' +
        'HTTP/1.1 200 OK' +
        'Content-Type: text/plain; charset=UTF-8' +
        'Content-Length: 3' +
        'Connection: Keep-Alive' +
        '8::').length
  }
}

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

  var socket = io.connect('http://' + host + ':' + port, {
    'force new connection': true,
  });

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
      var message = generateMessage();
      var size = sizes[transport].send + message.length;

      console.log(ts + ',' + userId + ',SEND,' + users + ',' + size);
    
      // send it
      socket.emit('message', {'message': message});
    
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

  socket.on('message', function(data) {
    var d = new Date();
    var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
    // generate log that will be used on the experiment, the format is:
    // time stamp, SEND/RECEIVE, users, message length
    var size = sizes[transport].receive + data.message.length + data.email.length;
    console.log(ts + ',' + userId + ',RECEIVE,' +  users + ',' + size);
  });

}
 
// Log Noop Messages
// On XHR Polling, if the polling timeout is reached, the connection will be terminated
// and a new one will be opened
io.parser.benchmarkEventEmitter.on('noop', function() {
  var d = new Date();
  var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

  console.log(ts + ',' + 'NOOP' + ',RECEIVE,' +  users + ',' + sizes[transport].noop);
});
 
// This function will create as many parallel users as specified on parameters
for(var i=1; i<=parseInt(process.argv[2]); i++) {

  // Add one user every 1,1 seconds, so we don't fload the server
  setTimeout(function() {
    user();
  }, i * 500);

}
