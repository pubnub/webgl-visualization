// Globals:
// target: { x, y }
// renderer: THREE.WebGLRenderer
(function () {
  var el = renderer.domElement,
      isDown = false,
      onDownMouse = { x: 0, y: 0 },
      targetDownMouse = { x: 0, y: 0 },
      interval = null;

  el.addEventListener('mousedown', function (event) {
    isDown = true;

    IDLE = false;
    clearTimeout(interval);

    onDownMouse = {
      x: event.clientX,
      y: -event.clientY
    };
    targetDownMouse = {
      x: target.x,
      y: target.y
    };
  });

  el.addEventListener('mouseup', function (event) {
    isDown = false;

    clearTimeout(interval);
    interval = setTimeout(function () {
      IDLE = true;
    }, IDLE_TIME);
  });

  el.addEventListener('mousemove', function (event) {
    if (isDown == true) {
      var mouseX = event.clientX,
          mouseY = -event.clientY;

      target.x = targetDownMouse.x + (onDownMouse.x - mouseX) * 0.005;
      target.y = targetDownMouse.y + (onDownMouse.y - mouseY) * 0.005;

      target.y = target.y > PI_HALF ? PI_HALF : target.y;
      target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
    }
  });

  renderer.domElement.addEventListener('mousewheel', function (event) {
    target.zoom -= event.wheelDeltaY * 0.3;
    if (target.zoom > 3000) target.zoom = 3000;
    if (target.zoom < 1300) target.zoom = 1300;
    event.preventDefault();
    return false;
  });

  document.querySelector('#fullscreen').addEventListener('click', function (event) {
    var el = document.querySelector('#globe');
    if (el.requestFullScreen) el.requestFullScreen();
    if (el.webkitRequestFullScreen) el.webkitRequestFullScreen();
    if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  });
})();