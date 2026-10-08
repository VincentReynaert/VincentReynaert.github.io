/* Shared lifecycle and fullscreen owner. Loaded before scene scripts. */
(() => {
  const origin = window.location.origin;
  const host = document.documentElement.dataset.scene === "host";
  const embedded = !host && window.parent !== window;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let fullscreenRequest = null;
  async function requestFullscreen() {
    if (embedded) return window.parent.URPS_APP?.requestFullscreen();
    if (ios || document.fullscreenElement || !document.fullscreenEnabled || window.matchMedia("(display-mode: fullscreen)").matches) return;
    if (fullscreenRequest) return fullscreenRequest;
    fullscreenRequest = document.documentElement.requestFullscreen();
    try { await fullscreenRequest; } finally { fullscreenRequest = null; }
  }
  let automaticInstalled = false;
  function installAutomaticFullscreen() {
    if (automaticInstalled) return;
    automaticInstalled = true;
    // One click handler, after native controls have received their activation.
    window.addEventListener("click", (event) => {
      if (event.isTrusted && event.target.closest("button")) requestFullscreen().catch(() => {});
    });
  }
  window.URPS_APP = { requestFullscreen, installAutomaticFullscreen };

  if (!host) {
    let ready = false;
    let active = !embedded;
    let latestActivation = 0;
    const notifyReady = () => {
      if (ready && embedded) window.parent.postMessage({ type: "urps:scene-ready" }, origin);
    };
    window.URPS_SCENE = {
      ready() {
        ready = true;
        document.body.inert = embedded && !active;
        if (embedded) notifyReady();
        else window.dispatchEvent(new Event("urps:scene-activated"));
      },
      get active() { return active; },
    };
    window.addEventListener("message", (event) => {
      if (!embedded || event.source !== window.parent || event.origin !== origin) return;
      const data = event.data;
      if (data?.type === "urps:scene-query") { notifyReady(); return; }
      if (data?.type === "urps:scene-deactivated") {
        active = false;
        latestActivation++;
        document.activeElement?.blur?.();
        if (document.body) document.body.inert = true;
        window.dispatchEvent(new Event("urps:scene-deactivated"));
      }
      if (data?.type !== "urps:scene-activated" || !ready) return;
      active = true;
      const activation = ++latestActivation;
      document.body.inert = false;
      requestAnimationFrame(() => {
        if (!active || activation !== latestActivation) return;
        window.dispatchEvent(new Event("urps:scene-activated"));
        window.dispatchEvent(new Event("resize"));
        window.parent.postMessage({ type: "urps:scene-active", activationId: data.activationId }, origin);
      });
    });
    if (!embedded) {
      const refresh = () => { if (ready && !document.hidden) window.dispatchEvent(new Event("urps:scene-activated")); };
      window.addEventListener("pageshow", refresh);
      document.addEventListener("visibilitychange", refresh);
    }
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const frames = [...document.querySelectorAll(".scene-frame")];
    const ready = new Set();
    const labels = { hub: "Accueil", blocA: "Bloc A", blocB: "Bloc B" };
    const status = document.createElement("div");
    status.className = "scene-loading";
    status.setAttribute("role", "status");
    const message = document.createElement("p");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Réessayer";
    status.append(message, retry);
    document.getElementById("onepage").appendChild(status);
    let current = null;
    let activationId = 0;
    let timeout;
    const send = (frame, data) => frame.contentWindow?.postMessage(data, origin);
    function activate() {
      if (!current) return;
      activationId++;
      const id = activationId;
      current.inert = true;
      current.style.pointerEvents = "none";
      status.hidden = false;
      message.textContent = "Chargement…";
      retry.hidden = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (id !== activationId) return;
        message.textContent = "La scène ne répond pas encore.";
        retry.hidden = false;
      }, 10000);
      if (ready.has(current)) send(current, { type: "urps:scene-activated", activationId: id });
      else send(current, { type: "urps:scene-query" });
    }
    function showScene(scene, { replace = false, history = true } = {}) {
      const target = frames.find((frame) => frame.dataset.scene === scene) || frames[0];
      frames.forEach((frame) => {
        const selected = frame === target;
        if (!selected) {
          send(frame, { type: "urps:scene-deactivated" });
          frame.inert = true;
          frame.tabIndex = -1;
          frame.style.pointerEvents = "none";
          frame.setAttribute("aria-hidden", "true");
        } else {
          frame.removeAttribute("aria-hidden");
          frame.removeAttribute("tabindex");
        }
        frame.classList.toggle("is-active", selected);
      });
      current = target;
      document.title = `URPS Obésité — ${labels[target.dataset.scene]}`;
      if (history) {
        const url = new URL(location.href);
        url.searchParams.set("scene", target.dataset.scene);
        window.history[replace ? "replaceState" : "pushState"]({ scene: target.dataset.scene }, "", url);
      }
      activate();
    }
    window.addEventListener("message", (event) => {
      if (event.origin !== origin) return;
      const source = frames.find((frame) => frame.contentWindow === event.source);
      if (!source) return;
      const data = event.data;
      if (data?.type === "urps:scene-ready") {
        ready.add(source);
        if (source === current) activate();
        else send(source, { type: "urps:scene-deactivated" });
      } else if (data?.type === "urps:scene-active" && source === current && data.activationId === activationId) {
        clearTimeout(timeout);
        status.hidden = true;
        source.inert = false;
        source.style.pointerEvents = "auto";
      } else if (data?.type === "urps:navigate" && source === current && labels[data.scene] && data.scene !== current.dataset.scene) {
        showScene(data.scene);
      }
    });
    frames.forEach((frame) => frame.addEventListener("load", () => {
      ready.delete(frame);
      send(frame, { type: "urps:scene-query" });
    }));
    retry.addEventListener("click", activate);
    window.addEventListener("popstate", () => showScene(new URLSearchParams(location.search).get("scene"), { history: false }));
    window.addEventListener("pageshow", activate);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) activate(); });
    window.addEventListener("resize", activate);
    window.addEventListener("fullscreenchange", activate);
    showScene(new URLSearchParams(location.search).get("scene"), { replace: true });
  });
})();
