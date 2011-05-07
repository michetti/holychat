var sys = require('sys');
var WebSocket = require('websocket-client').WebSocket;
var utils = require('./utils.js');

var users = parseInt(process.argv[2]);

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
  var heartBeats = 0;
  var testUserEmail = null;
  var ws = new WebSocket('ws://localhost:8080/socket.io/websocket');
  //var ws = new WebSocket('ws://173.203.127.245:8080/socket.io/websocket');
  
  var tss = [];
  var joined = false;

  ws.onmessage = function(message) {
    var d = new Date();
    var payload = utils.decode(message.data)[0];
  
    if (joined) {
      var type = payload.substr(0, 3); 

      if (type === '~j~') {

        var data = JSON.parse(payload.substr(3));

        if (data.email != testUserEmail) {
          //console.log('discartando mensagem');
          return;
        }

        if (data.action == 'message') { 
          var ts = d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
  
          var sended = tss.shift();
          var dt = d.getTime() - sended.getTime();
  
          // time stamp, usuarios, tamanho mensagem, tempo resposta
          console.log(ts + ',' + users + ',' + ((payload.length * 2) - (testUserEmail.length + 9)) + ',' + dt);
    
        } else if (data.action === 'join') {

          setInterval(function() {
            tss.push(new Date());
            ws.send(utils.encode({action: 'message', message: generateRandomMessage()}));
          }, 1000);

        }
      } else if (type === '~h~') {
        ws.send(utils.encode('~h~' + ++heartBeats));
      }

    } else {
      testUserEmail = 'user' + ++users + '@benchamrk.com';
      ws.send(utils.encode({action: 'join', email: testUserEmail}));
  
      joined = true;
    }
  }
}

for(var i=1; i<=parseInt(process.argv[3]); i++) {
  //console.log('creating user ' + i);

  setTimeout(function() {
    user();
  }, i * 1100);
}
