function handleMsg(msg) {
  if (VISIBLE) {
    addData(msg.pub, msg.subs);
  }
}

var pubnub = PUBNUB.init({
  publish_key   : "demo",
  subscribe_key : "e19f2bb0-623a-11df-98a1-fbd39d75aa3f"
});
var timeStamps = [];
pubnub.subscribe({
  channel  : "rts-xNjiKP4Bg4jgElhhn9v9-geo-map",
  callback : function(msg){
    timeStamps = timeStamps.concat(msg.geo_map);
  }
});
var k;
var z = setInterval(function() {
  var x = exPubSub(timeStamps);
  timeStamps = [];
  var count = 0;
  clearInterval(k);
  k = setInterval(function() {
    if (count >= 30) {
      clearInterval(k);
    }
    if (typeof(x[count]) === "undefined") {
      clearInterval(k);
    }
    else {
      handleMsg(x[count]);
      count++;
    }
  }, 100);
}, 3000);
