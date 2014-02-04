function handleMsg(msg) {
  if (VISIBLE) {
    addData(msg.pub, msg.subs);
  }
}

var pubnub = PUBNUB.init({
  publish_key   : "demo",
  subscribe_key : "e19f2bb0-623a-11df-98a1-fbd39d75aa3f"
});

pubnub.subscribe({
  channel  : "real-time-stats-geostats",
  callback : function(message) {
    handleMsg(message);
  }
});