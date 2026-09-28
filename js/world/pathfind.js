// A* on the tile grid (4 directions) for click-to-move and scripted walking.
(function () {
  'use strict';
  const NR = window.NR;
  NR.pathfind = function (map, sx, sy, tx, ty, blocked, maxNodes = 5000) {
    if (sx === tx && sy === ty) return [];
    const W = map.w;
    const key = (x, y) => y * W + x;
    const open = [{ x: sx, y: sy, g: 0, f: Math.abs(tx - sx) + Math.abs(ty - sy) }];
    const came = new Map();
    const gs = new Map([[key(sx, sy), 0]]);
    const closed = new Set();
    let n = 0, best = null, bestH = Infinity;
    while (open.length && n++ < maxNodes) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      const ck = key(cur.x, cur.y);
      if (closed.has(ck)) continue;
      closed.add(ck);
      const h = Math.abs(tx - cur.x) + Math.abs(ty - cur.y);
      if (h < bestH) {
        bestH = h;
        best = cur;
      }
      if (cur.x === tx && cur.y === ty) {
        best = cur;
        break;
      }
      for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!map.inBounds(nx, ny)) continue;
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;
        const isGoal = nx === tx && ny === ty;
        if (blocked(nx, ny) && !isGoal) continue;
        if (isGoal && blocked(nx, ny)) continue;
        const g = cur.g + 1;
        if (g < (gs.get(nk) ?? Infinity)) {
          gs.set(nk, g);
          came.set(nk, ck);
          open.push({ x: nx, y: ny, g, f: g + Math.abs(tx - nx) + Math.abs(ty - ny) });
        }
      }
    }
    if (!best) return null;
    const path = [];
    let k = key(best.x, best.y);
    while (k !== key(sx, sy)) {
      path.push({ x: k % W, y: Math.floor(k / W) });
      k = came.get(k);
      if (k === undefined) return null;
    }
    path.reverse();
    return path;
  };
})();
