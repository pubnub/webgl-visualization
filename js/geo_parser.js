function exPubSub (series) {
  var pubs = {}; // Keys = Channel. Values = Pubs.
  var subs = {}; // Keys = Channel. Values = Subs.

  series.forEach(function(g) {
    var channel = g.channel;
    if (g.lat && g.lng) { // I'm a PUB
      if (validGeolocFilter([g.lat, g.lng])) {
        if (!(channel in subs)) {
          subs[channel] = [];
        }
        subs[channel].push([g.lat, g.lng]);
      }
    }
    if (g.geos.length) { // I'm a SUB
      g.geos.filter(validGeolocFilter).forEach(function(sub) {
        if (!(channel in pubs)) {
          pubs[channel] = [];
        }
        pubs[channel].push(sub);
      });
    }
  });
  
  var channels = Object.keys(pubs);
  var pubSubList = [];
  for (var i = 0; i < channels.length; i++) {
    var chan = channels[i];

    for (var j = 0; j < pubs[chan].length; j++) {
      var curPub = pubs[chan][j];
      var curSubss = subs[chan];
      if (curPub && curSubss && curSubss.length > 1) {
        var curSubs = curSubss;
        pubSubList.push({pub : curPub, subs: curSubs});
      }
    }
  }
  pubSubList = _.sortBy(pubSubList, function(n) {
    var dist = 0;
    n.subs.forEach(function(z) {
      dist += vecDiff(z, n.pub);
    });
    return dist;
  });
  pubSubList.reverse();
  return pubSubList;
}

var vecDiff = function(a, b) {
  var c = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  return c;
}

// prevents unresolvable geos from being drawn on the map. typically they come as integers between [-3, 3]
function validGeolocFilter (geo) {  
     var lat = Math.abs(geo[0]),
         lng = Math.abs(geo[1]);

    return lng <= 180 && lat <= 90;
    //return true;
};


// module.exports = extractPubSubSets;
