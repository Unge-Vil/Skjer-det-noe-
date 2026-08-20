(function () {
  "use strict";

  var script = document.currentScript;
  var origin = script ? new URL(script.src, location.href).origin : location.origin;
  var ID_SHAPE = /^[A-Za-z0-9_-]{8,32}$/;
  var frames = Object.create(null);

  function mount(container) {
    var id = container.getAttribute("data-sdn-embed");
    if (!id || !ID_SHAPE.test(id) || container.getAttribute("data-sdn-mounted")) return;
    container.setAttribute("data-sdn-mounted", "1");

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(id);
    iframe.title = "Skjer det noe?";
    iframe.loading = "lazy";
    // allow-same-origin only grants access to our own origin, never the host's.
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
    );
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.height = "420px";
    container.appendChild(iframe);
    frames[id] = iframe;
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.type !== "sdn-embed-height") return;
    var iframe = frames[data.id || data.publicId];
    // Only the frame we created may resize itself.
    if (!iframe || event.source !== iframe.contentWindow) return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0 || height > 20000) return;
    iframe.style.height = Math.ceil(height) + "px";
  });

  function mountAll() {
    var nodes = document.querySelectorAll("[data-sdn-embed]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();
