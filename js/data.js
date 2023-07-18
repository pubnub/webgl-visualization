function handleMsg(msg) {
  if (VISIBLE) {
    addData(msg.pub, msg.subs);
  }
}

var pubnub = PUBNUB.init({
  publish_key   : "demo",
  subscribe_key : "e19f2bb0-623a-11df-98a1-fbd39d75aa3f",
  ssl           : true
});
var timeStamps = [];
pubnub.subscribe({
  channel  : "rts-xNjiKP4Bg4jgElhhn9v9-geo-map",
  callback : function(msg){
    timeStamps = timeStamps.concat(msg.geo_map);
  }
});
setInterval(()=>{
    timeStamps = timeStamps.concat([{"lat":r()[0],"lng":r()[1],"geos":[r(),r(),r(),r()]}]);
},500);

function r() {
    var latitude = Math.random() * (90.0 - -90.0) + -90.0;
    var longitude = Math.random() * (180.0 - -180.0) + -180.0;
    return [+latitude.toFixed(6), +longitude.toFixed(6)];
}


function r2() {
    // Define bounding boxes for known countries
    var landAreas = [
        { lat: [36.1, 45.5], long: [-83.7, -116.4] }, // USA
        { lat: [20.6, 55.9], long: [-62.4, -172.9] }, // Canada
        { lat: [-33.8, -54.6], long: [112.0, 159.1] }, // Australia
        { lat: [35.8, 45.7], long: [130.3, 153.9] }, // Japan
        { lat: [36.0, 42.1], long: [-9.5, -3.2] }, // Spain
        { lat: [41.8, 47.5], long: [26.0, 40.2] }, // Romania
        { lat: [-22.7, -35.3], long: [14.2, 51.1] } // South Africa
        // Add more bounding boxes as needed
    ];

    // Pick a random land area
    var randomAreaIndex = Math.floor(Math.random() * landAreas.length);
    var randomArea = landAreas[randomAreaIndex];

    // Generate a random latitude and longitude within the selected land area
    var latitude = Math.random() * (randomArea.lat[1] - randomArea.lat[0]) + randomArea.lat[0];
    var longitude = Math.random() * (randomArea.long[1] - randomArea.long[0]) + randomArea.long[0];

    return [+latitude.toFixed(6), +longitude.toFixed(6)];
}

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
