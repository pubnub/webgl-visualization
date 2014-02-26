// Globals:
// target: { x, y }
// renderer: THREE.WebGLRenderer
(function () {
  var interval = -1;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function clamp_d(value) {
    return clamp(value, -30, 30);
  }

  function pause_idle_animation() {
    IDLE = false;
    clearTimeout(interval);
    interval = setTimeout(function () {
      IDLE = true;
    }, IDLE_TIME);
  }

  var p = PUBNUB.init({
    publish_key   : "demo",
    subscribe_key : "demo"
  });

  p.subscribe({
    channel   : "webgl-visualization-control",
    callback  : function (m) {
      // Handle message
      switch (m.type) {
        case "move":
          pause_idle_animation();
          target.x += clamp_d(m.x * 0.005);
          target.y = clamp(target.y - clamp_d(m.y * 0.005), -PI_HALF, PI_HALF);
          break;

        case "zoom":
          target.zoom = clamp(target.zoom - m.z * 0.3, 1300, 3000);
          break;
      }
    }
  });

})();
