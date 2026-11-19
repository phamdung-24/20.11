// Phấn bụi lấp lánh quanh dòng "Chạm một bông hoa để nhận lời chúc".
(() => {
  'use strict';
  const canvas = document.querySelector('.hint-dust');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const COUNT = 120;
  const PALETTE = ['#e9a2bb', '#d9708f', '#c7637d', '#f3b8cb', '#b85575'];
  const particles = [];
  let width = 0, height = 0, frame = 0, last = 0, elapsed = 0;

  const rand = (min, max) => min + Math.random() * (max - min);

  function reset(p, anywhere) {
    p.x = rand(0, width);
    p.y = anywhere ? rand(0, height) : height + rand(2, 10);
    p.size = rand(0.5, 1.3);
    p.rise = rand(6, 15);            // px mỗi giây
    p.drift = rand(-3, 3);
    p.phase = rand(0, TAU);
    p.speed = rand(1.4, 2.8);        // tốc độ nháy, radian mỗi giây
    p.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    p.star = Math.random() < 0.22;
    return p;
  }

  // Đo kích thước; trả về false nếu canvas chưa có kích thước (chưa layout xong).
  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) for (let i = 0; i < COUNT; i++) particles.push(reset({}, true));
    else particles.forEach(p => reset(p, true));
    return true;
  }

  function resize() {
    if (measure()) render();
  }

  function drawStar(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fill();
  }

  function draw(time) {
    frame = 0;
    const dt = last ? Math.min(0.25, (time - last) / 1000) : 0;
    last = time;
    elapsed += dt;
    ctx.clearRect(0, 0, width, height);
    // Phấn bụi hiện dần sau khi dòng chữ xuất hiện.
    const intro = Math.min(1, Math.max(0, (elapsed - 1.2) / 1.6));
    particles.forEach(p => {
      p.y -= p.rise * dt;
      p.x += (p.drift + Math.sin(elapsed * 0.7 + p.phase) * 2) * dt;
      if (p.y < -4 || p.x < -4 || p.x > width + 4) reset(p, false);
      const twinkle = 0.5 + 0.5 * Math.sin(elapsed * p.speed + p.phase);
      ctx.globalAlpha = intro * (0.2 + 0.8 * twinkle) * 0.95;
      ctx.fillStyle = p.color;
      if (p.star) drawStar(p.x, p.y, p.size * 3.6);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function render() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (motion.matches) { ctx.clearRect(0, 0, width, height); return; }
    if (!document.hidden && (width || measure())) frame = requestAnimationFrame(draw);
  }

  new ResizeObserver(resize).observe(canvas);
  motion.addEventListener('change', render);
  document.addEventListener('visibilitychange', render);
})();
