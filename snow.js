// Decorative snow stays inside the invitation column and never intercepts taps.
(() => {
  const layer = document.createElement('div');
  layer.className = 'snow-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const flake = document.createElement('span');
    flake.className = 'snow-flake';
    const duration = 15 + Math.random() * 15;
    flake.style.cssText = `left:${Math.random()*100}%;--size:${2+Math.random()*3.5}px;--opacity:${0.28+Math.random()*0.42};--duration:${duration}s;--delay:${-Math.random()*duration}s;--sway:${3+Math.random()*4}s;--drift:${8+Math.random()*16}px;`;
    flake.append(document.createElement('i'));
    layer.append(flake);
  }
  document.body.append(layer);
  const update = () => layer.classList.toggle('snow-paused', document.hidden);
  document.addEventListener('visibilitychange', update);
  update();
})();
