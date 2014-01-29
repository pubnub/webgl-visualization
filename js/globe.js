// couple of constants
var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var DISTANCE = 2500;
var WIDTH = 1000;
var HEIGHT = 600;
var PI_HALF = Math.PI / 2;

var FOV = 45;
var NEAR = 1;
var FAR = 4000;

var target = {
  x: 0,
  y: 0
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
renderer.setClearColorHex(0x000000);

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

function addEarth() {
    var spGeo = new THREE.SphereGeometry(600,50,50);
    var planetTexture = THREE.ImageUtils.loadTexture( "assets/world.jpg" );
    var mat2 =  new THREE.MeshPhongMaterial( {
        map: planetTexture,
        shininess: 0.2 } );
    sp = new THREE.Mesh(spGeo,mat2);
    scene.add(sp);

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
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
    scene.add(mesh);
}

function addLights() {
    light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    //light = new THREE.DirectionalLight(0x3498DB, 3.5, 500 );
    //light = new THREE.DirectionalLight(0xBDC3C7, 2.5, 500 );
    scene.add(light);
    light.position.set(POS_X,POS_Y,POS_Z);
}

// I have no idea what I'm doing
// This is from a chrome experiment
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

function bezierCurveBetween(startVec3, endVec3, value) {
  value = 10;
  var distanceBetweenPoints = startVec3.clone().sub(endVec3).length();

  var anchorHeight = 600 + distanceBetweenPoints * 0.7;

  var mid = startVec3.clone().lerp(endVec3, 0.5);
  var midLength = mid.length();
  mid.normalize();
  mid.multiplyScalar(midLength + distanceBetweenPoints * 0.7);

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

  // points.push(vec3_origin);

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

  var n = 0;
  function tweenPoint() {
    var point = points.shift();
    for (var j = n; j < geometry.vertices.length; j++) {
      geometry.vertices[j].set(point.x, point.y, point.z);
    }
    geometry.verticesNeedUpdate = true;
    n++;

    if (points.length > 0) {
      requestAnimationFrame(tweenPoint);
    } else {
      geometry.finishedAnimation = true;
    }
  }
  requestAnimationFrame(tweenPoint);

  return geometry;
};

function constrain(v, min, max){
  if( v < min )
    v = min;
  else
  if( v > max )
    v = max;
  return v;
}

var lines = [];
function addData(publish, subscribes) {
  // Remove current lines
  var i = lines.length;
  while(i--) {
    if (lines[i].geometry.finishedAnimation == true) {
      scene.remove(lines[i]);
      lines.splice(i, 1);
    }
  }

  var pubLatLon = { lat: publish[0], lon: publish[1] };
  var pubVec3 = latLonToVector3(pubLatLon.lat, pubLatLon.lon);
  var color = '#'+Math.floor(Math.random()*16777215).toString(16);

  for (var i = 0; i < subscribes.length; i++) {
    var subLatLon = { lat: subscribes[i][0], lon: subscribes[i][1] };
    var subVec3 = latLonToVector3(subLatLon.lat, subLatLon.lon);

    var material = new THREE.LineBasicMaterial({
      color: color
    });

    var geometry = bezierCurveBetween(pubVec3, subVec3);

    var line = new THREE.Line(geometry, material);
    lines.push(line);
    scene.add(line);
  }
}

var texture;
function addOverlay() {
    var spGeo = new THREE.SphereGeometry(604,50,50);
    texture = new THREE.Texture($('#canvas')[0]);

    var material = new THREE.MeshBasicMaterial({
        map : texture,
        transparent : true,
        opacity: 0.7,
        blending: THREE.AdditiveAlphaBlending

    });

    var meshOverlay = new THREE.Mesh(spGeo,material);
    //scene.add(meshOverlay);
}

var timer = 0;
var rotateSpeed = 0.008;
function render() {
    texture.needsUpdate = true;
    // timer+=rotateSpeed;
    camera.position.x = DISTANCE * Math.sin(target.x) * Math.cos(target.y);
    camera.position.y = DISTANCE * Math.sin(target.y);
    camera.position.z = DISTANCE * Math.cos(target.x) * Math.cos(target.y);
    camera.lookAt( scene.position );

    light.position = camera.position;
    light.lookAt(scene.position);

    renderer.render( scene, camera );
    requestAnimationFrame( render );
}

function handleMsg(msg) {
  addData(msg.pub, msg.subs);
}

var pubnub = PUBNUB.init({
  publish_key   : "demo",
  subscribe_key : "e19f2bb0-623a-11df-98a1-fbd39d75aa3f"
});

pubnub.subscribe({
  channel  : "real-time-stats-geostats",
  callback : function(message) {
      //console.log( " > ", message );
      handleMsg(message)
  }
});

addLights();
addEarth();
addOverlay();
render();

