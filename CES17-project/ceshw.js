var https = require("https");
var firebase = require("firebase");
var request = require('request');
var config = {
    apiKey: "AIzaSyA3F6WJEYeiMNYEHl5_ldLBSUP4BZLJU_k",
    authDomain: "ces-17.firebaseapp.com",
    databaseURL: "https://ces-17.firebaseio.com",
    storageBucket: "ces-17.appspot.com",
    messagingSenderId: "121146090505"
};
var defaultApp = firebase.initializeApp(config);

var token = "AC50d0976724efffae3522bfe6afd1811c";
var refToken = "28f9bd1ef6d383dbe3240e5e194d0cd0";
var ref64 = "YnR1YWt6S2pVQU5oSWNOUWhOQXEzWjhPaHFpV0VBTTY6RGdCd0FBMkFaeVJqSkE2dQ==";
var thermAvg = 0.0;
var thermNums = [];
var humAvg = 0.0;
var humNums = [];
var textCount = 0;
var textCount2 = 0;

setInterval(function() {
  getLoc();
}, 3000);

function getLoc(){
    var req = https.get({
    host: "api.honeywell.com",
    path: "/v2/locations?apikey=btuakzKjUANhIcNQhNAq3Z8OhqiWEAM6",
    headers: {"Content-Type" : "application/json", "Authorization" : "Bearer " + token}
  }, function(res) {
       console.log("getloc callback");
        var bodyChunks = [];
        res.on('data', function(chunk) {
          bodyChunks.push(chunk);
        }).on('end', function() {
          var body = Buffer.concat(bodyChunks);
          var json = JSON.parse(body);
          if(res.statusCode == 200){
             console.log(json);
            for (var i = 0; i < json.length; i++) {
                // for each location
                if (typeof json[i].devices != "undefined" && json[i].devices != null && json[i].devices.length != null && json[i].devices.length > 0){
                    for (var j = 0; j < json[i].devices.length; j++) {
                      
                      var options = { method: 'GET',
                        url: 'https://opendata.lasvegasnevada.gov/resource/kte4-s45x.json',
                        headers: 
                         { 'postman-token': '70536db2-00d6-aeb8-e6aa-fc4c7b4d6ed7',
                           'cache-control': 'no-cache' } };

                      request(options, function (error, response, body) {
                        if (error) throw new Error(error);
                        console.log(body);
//                        var res = JSON.parse(response);
                        for(var x in response){
                          console.log("kw used by solar places: " + x);
                        }
                      });

                        // for each device
                        console.log("found device %s  %s", json[i].devices[j].deviceID, json[i].devices[j].name);
                        if ('Thermostat' == json[i].devices[j].deviceClass) {
                          if(json[i].devices[j].indoorTemperature != undefined){
                            thermNums.push(json[i].devices[j].indoorTemperature);
                             
                            if(textCount < 3){
                               var msg = 'Warning: Your home may have a heat or fire problem. Sensors indicate an abnormal value of ' + json[i].devices[j].indoorTemperature + " degrees Fahrenheit. Please check the live camera stream! Local authorities may be alerted if this issue is not addressed soon.";
                               var options ="https://api.tropo.com/1.0/sessions?action=create&token=78456d77534674795162714f6c6750456f617a466a5379436a586a58594854596c6c42554c424266694a7373&phonenumber=+9253369798&phoneMessage="+msg;

                              request(options,
                              function (err, res, body) {
                                textCount++;
                                console.log("err",err);
                                console.log("res",res);
                                console.log("body",body);
                              });
                            }
                          }
                          console.log("thermsNums: "+thermNums);
                          var tepAvg = 0;
                          for(var x = 0; x < thermNums.length; x++){
                            tepAvg = tepAvg + thermNums[x];
                          }
                          thermAvg = tepAvg/thermNums.length;
                          
                          console.log("tempAvg/thermNums.length: "+thermAvg);
                          var updates = {};
                          updates['tempary'] = thermNums;
                          updates['tempavg'] = thermAvg;
                          firebase.database().ref().update(updates);
                          console.log('thermAvg: '+thermAvg);
                          console.log('thermNums length: '+thermNums.length);
                        }
                      else if('LeakDetector' == json[i].devices[j].deviceClass) {
                        console.log('in hum: '+json[i].devices[j]);
                        if(json[i].devices[j].currentSensorReadings.humidity != undefined){
                            humNums.push(json[i].devices[j].currentSensorReadings.humidity);
                          
                          if(textCount2 < 3){
                            var msg = 'Warning: Your home may have a water problem, such as a leak or flood. Sensors indicate an abnormal value of ' + json[i].devices[j].currentSensorReadings.humidity + "%25 humidity. Please check the live camera stream! Local authorities may be alerted if this issue is not addressed soon.";
                               var options ="https://api.tropo.com/1.0/sessions?action=create&token= 6b726b455958624b6458687272625548624c5a6b5665627441666f6b50547267627a4646616c506472657a68&phonenumber=+9253369798&phoneMessage="+msg;

                              request(options,
                              function (err, res, body) {
                                textCount2++;
                                console.log("err",err);
                                console.log("res",res);
                                console.log("body",body);
                              });
                            }
                          }
                          console.log("humNums: "+humNums);
                          var tepAvg = 0;
                          for(var x = 0; x < humNums.length; x++){
                            tepAvg = tepAvg + humNums[x];
                          }
                          humAvg = tepAvg/humNums.length;
                          var updates = {};
                          updates['humary'] = humNums;
                          updates['humavg'] = humAvg;
                          firebase.database().ref().update(updates);
                          console.log('humAvg: '+humAvg);
                          console.log('humNums length: '+humNums.length);
                      }
                    }
                }
            }
          }
                
          else{
            console.log(res.statusCode);
            restartRequest();
          }
        });
  });
}

function restartRequest(){
  console.log("inrefreq");
 var options = {
  "method": "POST",
  "hostname": "api.honeywell.com",
  "path": "/oauth2/token",
  "headers": {
    "authorization": "Basic YnR1YWt6S2pVQU5oSWNOUWhOQXEzWjhPaHFpV0VBTTY6RGdCd0FBMkFaeVJqSkE2dQ==",
    "content-type": "application/x-www-form-urlencoded"
  }
};

var req = https.request(options, function (res) {
  var chunks = [];

 res.on("data", function (chunk) {
    chunks.push(chunk);
  });

 res.on("end", function () {
    var body = Buffer.concat(chunks);
    var json = JSON.parse(body);
    console.log(body.toString());
    token = json.access_token;
  });
});
var reqBody = "grant_type=refresh_token&refresh_token=bSXtQhq74lZQIyoduI6JG7X4MAkgrNRs";

req.write(reqBody);
req.end(getLoc());
}