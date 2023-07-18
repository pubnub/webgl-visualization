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
},200);

function rOld() {
    var latitude = Math.random() * (90.0 - -90.0) + -90.0;
    var longitude = Math.random() * (180.0 - -180.0) + -180.0;
    return [+latitude.toFixed(6), +longitude.toFixed(6)];
}

function r() {
    // Define bounding boxes for known countries
    var landAreas = [
        { lat: [36.1, 45.5], long: [-83.7, -116.4] }, // USA
        { lat: [20.6, 55.9], long: [-62.4, -172.9] }, // Canada
        { lat: [-33.8, -54.6], long: [112.0, 159.1] }, // Australia
        { lat: [35.8, 45.7], long: [130.3, 153.9] }, // Japan
        { lat: [36.0, 42.1], long: [-9.5, -3.2] }, // Spain
        { lat: [41.8, 47.5], long: [26.0, 40.2] }, // Romania
        { lat: [-22.7, -35.3], long: [14.2, 51.1] }, // South Africa
        { lat: [0.92, 11.2], long: [96.8, 101.2] }, // Thailand
        { lat: [-59.47, -20.39], long: [-73.58, -28.84] }, // Argentina
        { lat: [32.54, 45.91], long: [-9.62, 24.01] }, // Algeria
        { lat: [35.88, 41.11], long: [26.04, 44.82] }, // Turkey
        { lat: [53.64, 72.55], long: [20.93, 31.52] }, // Russia
        { lat: [7.75, 37.09], long: [-25.36, 4.63] }, // Ethiopia
        { lat: [-33.74, 5.64], long: [16.45, 33.02] }, // Angola
        { lat: [-30.11, -21.48], long: [28.89, 32.89] }, // Botswana
        { lat: [-56.15, -17.51], long: [66.93, 87.68] }, // Madagascar
        { lat: [20.77, 26.84], long: [88.05, 92.67] }, // Bangladesh
        { lat: [-26.74, 9.08], long: [-82.56, -66.92] }  // Peru
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
