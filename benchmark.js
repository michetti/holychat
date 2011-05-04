var sys = require('sys');
var WebSocket = require('websocket-client').WebSocket;
var utils = require('./utils.js');

var users = 0;

var randomMessage = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's";

function generateRandomMessage() {
  var extraSize = parseInt(Math.random() * 100);
  return "Benchmark Message: " + randomMessage.substring(0, extraSize);
}

function user() {
  var heartBeats = 0;
  var testUserEmail = null;
  var ws = new WebSocket('ws://localhost:8080/socket.io/websocket');
  //var ws = new WebSocket('ws://173.203.127.245:8080/socket.io/websocket');
  
  var tss = [];
  var joined = false;
  
  ws.onmessage = function(message) {
    var payload = utils.decode(message.data)[0];
  
    if (joined == false) {
      testUserEmail = 'user' + ++users + '@benchamrk.com';
      ws.send(utils.encode({action: 'join', email: testUserEmail}));
  
      joined = true;
  
    } else if (payload.substr(0, 3) === '~j~') {
      var data = JSON.parse(payload.substr(3));
  
      if (data.action === 'join' && data.email === testUserEmail) {
        setInterval(function() {
          tss.push(new Date());
          ws.send(utils.encode({action: 'message', message: generateRandomMessage()}));
        }, 100);
  
      } else if (data.action === 'message' && data.email === testUserEmail) { 
          var d = new Date();
          var ts = d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

          var sended = tss.shift();
          var dt = d.getTime() - sended.getTime();

          console.log(ts + ',' + users + ',' + payload.length + ',' + dt);
      }
    } else if (payload.substr(0, 3) === '~h~') {
      ws.send(utils.encode('~h~' + ++heartBeats));
    }
  }
}

for(var i=1; i<=50; i++) {
  console.log('creating user ' + i);

  setTimeout(function() {
    user();
  }, i * 1100);
}
