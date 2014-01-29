// couple of constants
var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var WIDTH = 1000;
var HEIGHT = 600;

var FOV = 45;
var NEAR = 1;
var FAR = 4000;

// some global variables and initialization code
// simple basic renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(WIDTH,HEIGHT);
renderer.setClearColorHex(0x111111);

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
}

function addLights() {
    light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    //light = new THREE.DirectionalLight(0x3498DB, 3.5, 500 );
    //light = new THREE.DirectionalLight(0xBDC3C7, 2.5, 500 );
    scene.add(light);
    light.position.set(POS_X,POS_Y,POS_Z);
}

function addData(publish, subscribes) {

    var ctx = $('#canvas')[0].getContext("2d");
    ctx.clearRect(0,0,1024,512);

    var pub_lat = publish[0];
    var pub_lng = publish[1];
    var pub_x =   ((1024/360.0) * (180 + pub_lng));
    var pub_y =   ((512/180.0) * (90 - pub_lat));

    ctx.fillStyle = "#F1C40F";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(pub_x, pub_y, 7, 0, 2*Math.PI, false);
    ctx.fill();

    for (i = 0; i < subscribes.length; i++) {
      var sub_lat = subscribes[i][0];
      var sub_lng = subscribes[i][1];
      var sub_x =   ((1024/360.0) * (180 + sub_lng));
      var sub_y =   ((512/180.0) * (90 - sub_lat));

      ctx.strokeStyle = "#1ABC9C";
      ctx.lineWidth= 2;
      ctx.beginPath();
      ctx.moveTo(pub_x, pub_y);
      ctx.lineTo(sub_x, sub_y);
      ctx.stroke();

      ctx.fillStyle = "#F1C40F";
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(sub_x, sub_y, 3, 0, 2*Math.PI, false);
      ctx.fill();

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
    scene.add(meshOverlay);
}

var timer = 0;
var rotateSpeed = 0.008;
function render() {
    texture.needsUpdate = true;
    timer+=rotateSpeed;
    camera.position.x = (Math.cos( timer ) *  1800);
    camera.position.z = (Math.sin( timer ) *  1800);
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

