// couple of constants
var POS_X = 1800;                   // Initial camera pos x
var POS_Y = 500;                    // Cam pos y
var POS_Z = 1800;                   // Cam pos z
var DISTANCE = 10000;               // Camera distance from globe
var WIDTH = window.innerWidth;      // Canvas width
var HEIGHT = window.innerHeight;    // Canvas height
var PI_HALF = Math.PI / 2;          // Minor perf calculation
var IDLE = true;                    // If user is using mouse to control
var IDLE_TIME = 1000 * 3;           // Time before idle becomes true again

var FOV = 45;                       // Camera field of view
var NEAR = 1;                       // Camera near
var FAR = 150000;                   // Draw distance

// Use the visibility API to avoid creating a ton of data when the user is not looking
var VISIBLE = true;

var DEBUG = false; // Show stats or not

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

// setup a camera that points to the center
var camera = new THREE.PerspectiveCamera(FOV,WIDTH/HEIGHT,NEAR,FAR);
camera.position.set(POS_X,POS_Y, POS_Z);
camera.lookAt(new THREE.Vector3(0,0,0));

// create a basic scene and add the camera
var scene = new THREE.Scene();
scene.add(camera);

// Create the background cube map
var urls = [
  'assets/pos-x.png',
  'assets/neg-x.png',
  'assets/pos-y.png',
  'assets/neg-y.png',
  'assets/pos-z.png',
  'assets/neg-z.png'
];

var cubemap = THREE.ImageUtils.loadTextureCube(urls);
cubemap.format = THREE.RGBFormat;

var shader = THREE.ShaderLib["cube"];
shader.uniforms["tCube"].value = cubemap;

var material = new THREE.ShaderMaterial({
  fragmentShader: shader.fragmentShader,
  vertexShader: shader.vertexShader,
  uniforms: shader.uniforms,
  depthWrite: false,
  side: THREE.BackSide
});

var skybox = new THREE.Mesh(new THREE.CubeGeometry(100000, 100000, 100000), material);
scene.add(skybox);

// Function for adding the earth, atmosphere, and the moon
var pivot;
function addEarth() {
  // Add sphere earth geometry
  var spGeo = new THREE.SphereGeometry(600,50,50);

  var shader = Shaders['earth'];
  var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  uniforms['texture'].value = THREE.ImageUtils.loadTexture('assets/world.jpg');

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });

  var mesh = new THREE.Mesh(spGeo, material);
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
  material = new THREE.MeshBasicMaterial({
    map: tex
  });

  mesh = new THREE.Mesh(geometry, material);
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

// Takes two points on the globe and turns them into a bezier curve point array
function bezierCurveBetween(startVec3, endVec3) {
  var distanceBetweenPoints = startVec3.clone().sub(endVec3).length();

  var anchorHeight = 600 + distanceBetweenPoints * 0.4;

  var mid = startVec3.clone().lerp(endVec3, 0.5);
  var midLength = mid.length();
  mid.normalize();
  mid.multiplyScalar(midLength + distanceBetweenPoints * 0.4);

  var normal = (new THREE.Vector3()).subVectors(startVec3, endVec3);
  normal.normalize();

  var anchorScalar = distanceBetweenPoints * 0.4;

  var startAnchor = startVec3;
  var midStartAnchor = mid.clone().add(normal.clone().multiplyScalar(anchorScalar));
  var midEndAnchor = mid.clone().add(normal.clone().multiplyScalar(-anchorScalar));
  var endAnchor = endVec3;

  // Now make a bezier curve
  var splineCurveA = new THREE.CubicBezierCurve3(startVec3, startAnchor, midStartAnchor, mid);
  var splineCurveB = new THREE.CubicBezierCurve3(mid, midEndAnchor, endAnchor, endVec3);

  var vertexCountDesired = Math.floor(distanceBetweenPoints * 0.02 + 6);

  var points = splineCurveA.getPoints(vertexCountDesired);
  points = points.splice(0, points.length - 1);
  points = points.concat(splineCurveB.getPoints(vertexCountDesired));

  return points;
}

var geoms = [];
(function () {
  for (var i = 0; i < 500; i++) {
    geoms[i] = [];
  }
})();
function getGeom(points) {
  var geometry;

  if (geoms[points.length].length > 0) {
    geometry = geoms[points.length].pop();

    var point = points[0];
    for (var i = 0; i < points.length; i++) {
      geometry.vertices[i].set(point.x, point.y, point.z);
    }
    geometry.verticesNeedUpdate = true;

    return geometry;
  }

  geometry = new THREE.Geometry();
  geometry.dynamic = true;
  geometry.size = 10.05477225575;

  for (var i = 0; i < points.length; i++) {
    geometry.vertices.push(new THREE.Vector3());
  }

  return geometry;
};

function returnGeom(geometry) {
  geoms[geometry.vertices.length].push(geometry);
}

/* Tween functions */

// Linear
function tweenFnLinear(elapsed) {
  return elapsed;
}

// Ease In
function tweenFnEaseIn(elapsed) {
  return elapsed * elapsed * elapsed * elapsed;
}

// Ease Out
function tweenFnEaseOut(elapsed) {
  return 1 - (--elapsed * elapsed * elapsed * elapsed);
}

// Stores a list of current line tweens
var tweens = [];
function tweenPoints(geometry, points, duration, tweenFn) {
  var tween = {
    n: 0,
    points: points,
    geometry: geometry,
    time: Date.now(),
    duration: duration,
    tweenFn: tweenFn,
    line: null
  };
  tweens.push(tween);
  return tween;
}

// Steps the animations forward
function tweenPoint() {
  var i = tweens.length,
      now = Date.now();
  while(i--) {
    var tween = tweens[i],
        point = tween.points[tween.n],
        geometry = tween.geometry,
        geo_length = geometry.vertices.length,
        elapsed = (now - tween.time) / tween.duration,
        value = tween.tweenFn(elapsed > 1 ? 1 : elapsed),
        next_n = Math.floor(geo_length * value);

    if (next_n > tween.n) {
      for (var j = tween.n; j < geo_length; j++) {
        if (j < next_n)
          point = tween.points[j];
        geometry.vertices[j].set(point.x, point.y, point.z);
      }
      tween.n = next_n;

      geometry.verticesNeedUpdate = true;
    }

    if (elapsed >= 1) {
      var line = tween.line;
      scene.remove(line);
      lines.splice(lines.indexOf(line), 1);
      returnGeom(geometry);
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
(function (){
  for (var i = 0; i < 10; i++) {
    var c = new THREE.Color();
    var x = Math.random();
    c.setHSL( (0.6 - ( x * 0.5 ) ), 1.0, 0.5);

    lineColors.push(new THREE.LineBasicMaterial({
      color: c,
      linewidth: 2
    }));
  }
})();

// Takes pub/sub data and converts them to lines
function addData(publish, subscribes) {
  // Stop drawing points that have been around too long
  var i = points.length;
  while(i--) {
    if (Date.now() - points[i].time > 1000) {
      points.splice(i, 1);
    }
  }

  // Convert lat/lon into 3d bezier curve and 2d texture point for drawing
  var pubLatLon = { lat: publish[0], lon: publish[1] };
  var pubVec3 = latLonToVector3(pubLatLon.lat, pubLatLon.lon);
  var materialIndex = Math.floor(Math.random() * 10);

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
    var geometry = getGeom(linePoints);

    var tween = tweenPoints(
      geometry,
      linePoints,
      Math.random() * 500 + 200,
      tweenFnEaseOut
    );

    var line = new THREE.Line(geometry, lineColors[materialIndex]);
    lines.push(line);
    tween.line = line;
    scene.add(line);
  }
}

// Move the globe automatically if idle
function checkIdle() {
  if (IDLE === true) {
    target.x -= 0.001;

    if (target.y > 0) target.y -= 0.001;
    if (target.y < 0) target.y += 0.001;

    if (Math.abs(target.y) < 0.01) target.y = 0;
  }
};

// Add a canvas-based overlay to the globe that we can draw points on
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

// Main render loop
var rotation = { x: 0, y: 0 };
function render() {
  tweenPoint();

  // Draw our publish points every frame
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

  // Convert our 2d camera target into 3d world coords
  camera.position.x = DISTANCE * Math.sin(rotation.x) * Math.cos(rotation.y);
  camera.position.y = DISTANCE * Math.sin(rotation.y);
  camera.position.z = DISTANCE * Math.cos(rotation.x) * Math.cos(rotation.y);
  camera.lookAt( scene.position );

  renderer.autoClear = false;
  renderer.clear();
  renderer.render( scene, camera );
}

var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms

// Align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';

if (DEBUG) {
  document.body.appendChild( stats.domElement );
}

function animate() {
  requestAnimationFrame(animate);
  if (VISIBLE) {
    if (DEBUG) stats.begin();
    render();
    if (DEBUG) stats.end();
  }
}

// Resizing the canvas based on window size
function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

addEarth();
addOverlay();
animate();

