// couple of constants
var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var DISTANCE = 10000;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var PI_HALF = Math.PI / 2;
var IDLE = true;
var IDLE_TIME = 1000 * 3;

var FOV = 45;
var NEAR = 1;
var FAR = 4000;

// Use the visibility API to avoid creating a ton of data when the user is not looking
var VISIBLE = true;

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

// If the page is hidden, pause the video;
// if the page is shown, play the video
function handleVisibilityChange() {
  if (document[hidden]) {
    VISIBLE = false;
  } else {
    VISIBLE = true;
  }
}

if (typeof document.addEventListener === "undefined" || 
  typeof hidden === "undefined") {
} else {
  // Handle page visibility change   
  document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

var target = {
  x: -2,
  y: 0,
  zoom: 2500
};

var Shaders = {
  'earth' : {
    uniforms: {
      'texture': { type: 't', value: null }
    },
    vertexShader: [
      'varying vec3 vNormal;',
      'varying vec2 vUv;',
      'void main() {',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        'vNormal = normalize( normalMatrix * normal );',
        'vUv = uv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D texture;',
      'varying vec3 vNormal;',
      'varying vec2 vUv;',
      'void main() {',
        'vec3 diffuse = texture2D( texture, vUv ).xyz;',
        'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
        'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
        'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
      '}'
    ].join('\n')
  },
  'atmosphere' : {
    uniforms: {},
    vertexShader: [
      'varying vec3 vNormal;',
      'void main() {',
        'vNormal = normalize( normalMatrix * normal );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vNormal;',
      'void main() {',
        'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
        'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
      '}'
    ].join('\n')
  }
};

// some global variables and initialization code
// simple basic renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(WIDTH,HEIGHT);
renderer.setClearColor(0x00000000, 0.0);

// add it to the target element
var mapDiv = document.getElementById("globe");
mapDiv.appendChild(renderer.domElement);

// Create background image scene
var txt = THREE.ImageUtils.loadTexture('assets/galaxy_starfield.png');
var bgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2, 0),
  new THREE.MeshBasicMaterial({
    map: txt,
    depthTest: false,
    depthWrite: false
  }));
bgMesh.material.depthTest = false;
bgMesh.material.depthWrite = false;
var bgScene = new THREE.Scene();
var bgCamera = new THREE.Camera();
bgScene.add(bgCamera);
bgScene.add(bgMesh);

// setup a camera that points to the center
var camera = new THREE.PerspectiveCamera(FOV,WIDTH/HEIGHT,NEAR,FAR);
camera.position.set(POS_X,POS_Y, POS_Z);
camera.lookAt(new THREE.Vector3(0,0,0));

// create a basic scene and add the camera
var scene = new THREE.Scene();
scene.add(camera);

var pivot;
function addEarth() {
  // Add sphere earth geometry
  var spGeo = new THREE.SphereGeometry(600,50,50);

  var shader = Shaders['earth'];
  uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  uniforms['texture'].value = THREE.ImageUtils.loadTexture('assets/world2.jpg');

  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });

  mesh = new THREE.Mesh(spGeo, material);
  scene.add(mesh);

  // Add atmosphere glow
  var shader = Shaders['atmosphere'];
  uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  mesh = new THREE.Mesh(spGeo, material);
  mesh.scale.set(1.1, 1.1, 1.1);
  scene.add(mesh);

  // Add moon
  pivot = new THREE.Object3D();
  var geometry = new THREE.SphereGeometry(60, 50, 50);

  var tex = THREE.ImageUtils.loadTexture('assets/pubnub.png');
  var material = new THREE.MeshBasicMaterial({
    map: tex
  });

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(300, 0, 1500);
  mesh.rotation.x -= 0.6;
  mesh.rotation.y -= 1;
  mesh.rotation.z += 0;
  pivot.add(mesh);
  scene.add(pivot);
}

// Calculate a Vector3 from given lat/long
function latLonToVector3(lat, lon) {
  var point = new THREE.Vector3(0, 0, 0);

  lon = lon + 10;
  lat = lat - 2;

  var phi = PI_HALF - lat * Math.PI / 180 - Math.PI * 0.01;
  var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06;
  var rad = 600;

  point.x = Math.sin(phi) * Math.cos(theta) * rad;
  point.y = Math.cos(phi) * rad;
  point.z = Math.sin(phi) * Math.sin(theta) * rad;

  return point;
};

// Takes two points on the globe and turns them into a geometry with points
function bezierCurveBetween(startVec3, endVec3, value) {
  var distanceBetweenPoints = startVec3.clone().sub(endVec3).length();

  var anchorHeight = 600 + distanceBetweenPoints * 0.5;

  var mid = startVec3.clone().lerp(endVec3, 0.5);
  var midLength = mid.length();
  mid.normalize();
  mid.multiplyScalar(midLength + distanceBetweenPoints * 0.5);

  var normal = (new THREE.Vector3()).subVectors(startVec3, endVec3);
  normal.normalize();

  var distanceHalf = distanceBetweenPoints * 0.5;

  var startAnchor = startVec3;
  var midStartAnchor = mid.clone().add(normal.clone().multiplyScalar(distanceHalf));
  var midEndAnchor = mid.clone().add(normal.clone().multiplyScalar(-distanceHalf));
  var endAnchor = endVec3;

  // Now make a bezier curve
  var splineCurveA = new THREE.CubicBezierCurve3(startVec3, startAnchor, midStartAnchor, mid);
  var splineCurveB = new THREE.CubicBezierCurve3(mid, midEndAnchor, endAnchor, endVec3);

  var vertexCountDesired = Math.floor(distanceBetweenPoints * 0.02 + 6) * 2;

  var points = splineCurveA.getPoints(vertexCountDesired);
  points = points.splice(0, points.length - 1);
  points = points.concat(splineCurveB.getPoints(vertexCountDesired));

  return points;
}

// Stores a list of current line tweens
var tweens = [];
function tweenPoints(points) {
  var value = 10;
  var val = value * 0.0003;

  var size = (10 + Math.sqrt(val));
  size = constrain(size, 0.1, 60);

  var geometry = new THREE.Geometry();
  geometry.dynamic = true;
  geometry.finishedAnimation = false;
  for (var i = 0; i < points.length; i++) {
    geometry.vertices.push(new THREE.Vector3());
  }
  geometry.size = size;

  tweens.push({
    n: 0,
    points: points,
    geometry: geometry,
    time: Date.now()
  });

  return geometry;
}

function tweenPoint() {
  var i = tweens.length;
  while(i--) {
    var tween = tweens[i],
        point = tween.points[tween.n],
        geometry = tween.geometry;
    for (var j = tween.n; j < geometry.vertices.length; j++) {
      geometry.vertices[j].set(point.x, point.y, point.z);
    }
    geometry.verticesNeedUpdate = true;
    tween.n++;

    if (tween.points.length <= 0 || Date.now() - tween.time > 2000) {
      geometry.finishedAnimation = true;
      tweens.splice(i, 1);
    }
  }
}

function constrain(v, min, max){
  if( v < min )
    v = min;
  else
  if( v > max )
    v = max;
  return v;
}

var lines = [],
    points = [],
    lineColors = [],
    ctx = document.querySelector('#canvas').getContext('2d');

// Generate a set of colors to use
for (var i = 0; i < 10; i++) {
  var c = new THREE.Color();
  var x = Math.random();
  c.setHSL( (0.6 - ( x * 0.5 ) ), 1.0, 0.5);

  lineColors.push(new THREE.LineBasicMaterial({
    color: c,
    linewidth: 2
  }));
}

// Takes pub/sub data and converts them to lines
function addData(publish, subscribes) {
  // Remove current lines that are finished
  var i = lines.length;
  while(i--) {
    if (lines[i].geometry.finishedAnimation == true) {
      scene.remove(lines[i]);
      lines.splice(i, 1);
    }
  }

  // Stop drawing points that have been around too long
  var i = points.length;
  while(i--) {
    if (Date.now() - points[i].time > 1000) {
      points.splice(i, 1);
    }
  }

  var pubLatLon = { lat: publish[0], lon: publish[1] };
  var pubVec3 = latLonToVector3(pubLatLon.lat, pubLatLon.lon);
  var materialIndex = Math.floor(Math.random() * 11);

  var pub_x =   ((1024/360.0) * (180 + pubLatLon.lon));
  var pub_y =   ((512/180.0) * (90 - pubLatLon.lat));

  points.push({
    x: pub_x,
    y: pub_y,
    time: Date.now()
  });

  for (var i = 0; i < subscribes.length; i++) {
    var subLatLon = { lat: subscribes[i][0], lon: subscribes[i][1] };
    var subVec3 = latLonToVector3(subLatLon.lat, subLatLon.lon);

    var linePoints = bezierCurveBetween(pubVec3, subVec3);
    var geometry = tweenPoints(linePoints);

    var line = new THREE.Line(geometry, lineColors[materialIndex]);
    lines.push(line);
    scene.add(line);
  }
}

function checkIdle() {
  if (IDLE === true) {
    target.x -= 0.001;

    if (target.y > 0) target.y -= 0.001;
    if (target.y < 0) target.y += 0.001;

    if (Math.abs(target.y) < 0.01) target.y = 0;
  }
};

var overlay;
function addOverlay() {
  var spGeo = new THREE.SphereGeometry(604, 50, 50);
  overlay = new THREE.Texture(document.querySelector('#canvas'));

  var material = new THREE.MeshBasicMaterial({
    map: overlay,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });

  var meshOverlay = new THREE.Mesh(spGeo, material);
  scene.add(meshOverlay);
}

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

var rotation = { x: 0, y: 0 };
function render() {
  tweenPoint();

  ctx.clearRect(0,0,1024,512);
  for (var i = 0; i < points.length; i++) {
    ctx.fillStyle = "#F1C40F";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 7, 0, 2*Math.PI, false);
    ctx.fill();
  };

  overlay.needsUpdate = true;

  pivot.rotation.y += 0.01;

  rotation.x += (target.x - rotation.x) * 0.1;
  rotation.y += (target.y - rotation.y) * 0.1;
  DISTANCE += (target.zoom - DISTANCE) * 0.3;

  checkIdle();

  camera.position.x = DISTANCE * Math.sin(rotation.x) * Math.cos(rotation.y);
  camera.position.y = DISTANCE * Math.sin(rotation.y);
  camera.position.z = DISTANCE * Math.cos(rotation.x) * Math.cos(rotation.y);
  camera.lookAt( scene.position );

  renderer.autoClear = false;
  renderer.clear();
  renderer.render( bgScene, bgCamera );
  renderer.render( scene, camera );
}

function animate() {
  requestAnimationFrame(animate);
  if (VISIBLE) {
    render();
  }
}

window.addEventListener('resize', onWindowResize);

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

addEarth();
addOverlay();
animate();

