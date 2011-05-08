var sys = require('sys');
var WebSocket = require('websocket-client').WebSocket;
var utils = require('./utils.js');

var users = 0;

var randomMessage = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's";

var randomMessagesSize = 0;
var randomMessages = [];

function generateRandomMessage() {
  var extraSize = parseInt(Math.random() * 100);

  if (randomMessagesSize == 100) {
    return randomMessages[extraSize];

  } else {
    var m = "Benchmark Message: " + randomMessage.substring(0, extraSize);
    randomMessages.push(m);

    return m;
  }
}

function user() {
  var userId = -1;
  var heartBeats = 0;
  var testUserEmail = null;
  var ws = new WebSocket('ws://localhost:8080/socket.io/websocket');
  //var ws = new WebSocket('ws://173.203.127.245:8080/socket.io/websocket');
  
  var joined = false;

  ws.onmessage = function(message) {

    var payload = utils.decode(message.data)[0];
  
    if (joined) {
      var type = payload.substr(0, 3); 

      if (type === '~j~') {

        var data = JSON.parse(payload.substr(3));

        if (data.action == 'message') { 
          var d = new Date();
          var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
          // time stamp, SEND/RECEIVE, usuarios, tamanho mensagem
          console.log(ts + ',' + userId + ',RECEIVE,' +  users + ',' + payload.length);
        }
      } else if (type === '~h~') {
        ws.send(utils.encode('~h~' + ++heartBeats));
      }

    } else {
      userId = ++users;

      testUserEmail = 'user' + userId + '@benchamrk.com';
      ws.send(utils.encode({action: 'join', email: testUserEmail}));
  
      joined = true;

      // number of messages to send
      var numberOfMessages = parseInt(process.argv[3]);

      var si = setInterval(function() {

        if (numberOfMessages == 0) {
          clearInterval(si);
          ws.close();
          return;
        }

        numberOfMessages--;

        // generate message
        var m =  utils.encode({action: 'message', message: generateRandomMessage()})           

        var d = new Date();
        var ts = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

        // time stamp, SEND/RECEIVE, usuarios, tamanho mensagem
        console.log(ts + ',' + userId + ',SEND,' + users + ',' + m.length);

        // send it
        ws.send(m);

      }, 1000);
    }
  }
}

for(var i=1; i<=parseInt(process.argv[2]); i++) {
  //console.log('creating user ' + i);

  setTimeout(function() {
    user();
  }, i * 1100);
}
