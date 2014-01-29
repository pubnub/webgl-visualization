// Globals:
// target: { x, y }
// renderer: THREE.WebGLRenderer
(function () {
  var el = $(renderer.domElement),
      isDown = false,
      onDownMouse = { x: 0, y: 0 },
      targetDownMouse = { x: 0, y: 0 };

  el.on('mousedown', function (event) {
    isDown = true;
    onDownMouse = {
      x: event.clientX,
      y: event.clientY
    };
    targetDownMouse = {
      x: target.x,
      y: target.y
    };
  });

  el.on('mouseup', function (event) {
    isDown = false;
  });

  el.on('mousemove', function (event) {
    if (isDown == true) {
      var mouseX = event.clientX,
          mouseY = event.clientY;

      target.x = targetDownMouse.x + (onDownMouse.x - mouseX) * 0.005;
      target.y = targetDownMouse.y + (onDownMouse.y - mouseY) * 0.005;
    }
  });
})();