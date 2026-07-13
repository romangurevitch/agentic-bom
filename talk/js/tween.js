// Minimal tween helpers for camera flights and scalar animations.

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class Tween {
  constructor() {
    this.active = false;
  }

  start(from, to, duration, onUpdate, onDone) {
    this.from = { ...from };
    this.to = { ...to };
    this.duration = duration;
    this.elapsed = 0;
    this.onUpdate = onUpdate;
    this.onDone = onDone;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    const raw = Math.min(1, this.elapsed / this.duration);
    const k = easeInOutCubic(raw);
    const cur = {};
    for (const key of Object.keys(this.to)) {
      cur[key] = this.from[key] + (this.to[key] - this.from[key]) * k;
    }
    this.onUpdate(cur);
    if (raw >= 1) {
      this.active = false;
      if (this.onDone) this.onDone();
    }
  }
}
