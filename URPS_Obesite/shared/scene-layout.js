(() => {
  const embedded = window.parent !== window;
  document.documentElement.classList.toggle("urps-embedded", embedded);
  if (embedded) return;
  const stage = document.querySelector(".urps-stage");
  const gate = document.createElement("section");
  gate.className = "orientation-gate";
  gate.hidden = true;
  gate.setAttribute("role", "status");
  gate.textContent = "Tournez votre appareil en paysage pour continuer. Votre progression est conservée.";
  document.body.appendChild(gate);
  const help = document.getElementById("install-help");
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (help && ios && !navigator.standalone && !matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches) {
    // Direct Hub access also keeps installation help usable in portrait.
    document.body.appendChild(help);
    help.classList.add("viewport-install-help");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Installer sur iPhone ou iPad";
    button.addEventListener("click", () => {
      help.classList.remove("is-hidden");
      document.getElementById("install-help-close").focus();
    });
    gate.appendChild(button);
  }
  const portrait = window.matchMedia("(orientation: portrait)");
  function update() {
    // Do not mistake the on-screen keyboard for a change of orientation.
    const touchDevice = window.matchMedia("(pointer: coarse)").matches;
    const blocked = touchDevice && portrait.matches;
    gate.hidden = !blocked;
    stage.inert = blocked;
  }
  portrait.addEventListener("change", update);
  window.addEventListener("resize", update);
  window.addEventListener("pageshow", update);
  update();
})();
