// Globals:
// target: { x, y }
// renderer: THREE.WebGLRenderer
(function () {
  var el = $(renderer.domElement),
      isDown = false,
      onDownMouse = { x: 0, y: 0 },
      targetDownMouse = { x: 0, y: 0 },
      interval = null;

  el.on('mousedown', function (event) {
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

  el.on('mouseup', function (event) {
    isDown = false;

    clearTimeout(interval);
    interval = setTimeout(function () {
      IDLE = true;
    }, IDLE_TIME);
  });

  el.on('mousemove', function (event) {
    if (isDown == true) {
      var mouseX = event.clientX,
          mouseY = -event.clientY;

      target.x = targetDownMouse.x + (onDownMouse.x - mouseX) * 0.005;
      target.y = targetDownMouse.y + (onDownMouse.y - mouseY) * 0.005;

      target.y = target.y > PI_HALF ? PI_HALF : target.y;
      target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
    }
  });
})();