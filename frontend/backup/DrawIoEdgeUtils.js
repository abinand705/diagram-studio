export const getSharpPath = (points) => {
  if (!points || points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
};

export const getStraightPath = (points) => {
  if (!points || points.length < 2) return '';
  const start = points[0];
  const end = points[points.length - 1];
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

export const getOrthogonalPath = (points) => {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = p1.x;
    const midY = p2.y;
    d += ` L ${midX} ${midY} L ${p2.x} ${p2.y}`;
  }
  return d;
};

export const getRoundedPath = (points, radius = 8) => {
  if (!points || points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Vector from curr to prev
    const vx1 = prev.x - curr.x;
    const vy1 = prev.y - curr.y;
    const len1 = Math.sqrt(vx1 * vx1 + vy1 * vy1);
    
    // Vector from curr to next
    const vx2 = next.x - curr.x;
    const vy2 = next.y - curr.y;
    const len2 = Math.sqrt(vx2 * vx2 + vy2 * vy2);

    // If segments are too short, just do a sharp corner
    if (len1 < radius * 2 || len2 < radius * 2) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Normalize
    const nx1 = vx1 / len1;
    const ny1 = vy1 / len1;
    const nx2 = vx2 / len2;
    const ny2 = vy2 / len2;

    // Start point of arc
    const startArcX = curr.x + nx1 * radius;
    const startArcY = curr.y + ny1 * radius;

    // End point of arc
    const endArcX = curr.x + nx2 * radius;
    const endArcY = curr.y + ny2 * radius;

    d += ` L ${startArcX} ${startArcY} Q ${curr.x} ${curr.y} ${endArcX} ${endArcY}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
};

// Smooth curve using Catmull-Rom to Cubic Bezier conversion
export const getCurvedPath = (points, tension = 1.0) => {
  if (!points || points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return d;
};

// Helper to get midpoint of a line segment
export const getMidpoint = (p1, p2) => {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
};

// Helper to find which segment index a point is closest to
export const findSegmentIndex = (points, clickPoint) => {
  let minDistance = Infinity;
  let segmentIndex = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Distance from point to line segment
    const distance = getPointToSegmentDistance(clickPoint, p1, p2);
    if (distance < minDistance) {
      minDistance = distance;
      segmentIndex = i;
    }
  }
  return segmentIndex;
};

const getPointToSegmentDistance = (p, v, w) => {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
};

// Find intersection of two segments (p1, p2) and (p3, p4)
export const getSegmentIntersection = (p1, p2, p3, p4) => {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // Parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
};

// Insert 6px arcs at all intersection points on a path
export const getJumpsPathData = (pts, otherEdgesPoints, radius = 6) => {
  let segments = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segments.push({ p1: pts[i], p2: pts[i + 1] });
  }

  let finalPath = `M ${pts[0].x} ${pts[0].y}`;

  segments.forEach((seg, sIdx) => {
    let intersections = [];
    otherEdgesPoints.forEach(otherPts => {
      for (let j = 0; j < otherPts.length - 1; j++) {
        const inter = getSegmentIntersection(seg.p1, seg.p2, otherPts[j], otherPts[j + 1]);
        if (inter) {
          // Check distance from segment start to intersection
          const dist = Math.sqrt((inter.x - seg.p1.x)**2 + (inter.y - seg.p1.y)**2);
          intersections.push({ ...inter, dist });
        }
      }
    });

    // Sort intersections by distance along segment
    intersections.sort((a, b) => a.dist - b.dist);

    let currentPos = seg.p1;
    intersections.forEach(inter => {
      // Vector of segment
      const dx = seg.p2.x - seg.p1.x;
      const dy = seg.p2.y - seg.p1.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len < radius * 2) return;

      const ux = dx / len;
      const uy = dy / len;

      // Point before intersection
      const pBefore = { x: inter.x - ux * radius, y: inter.y - uy * radius };
      // Point after intersection
      const pAfter = { x: inter.x + ux * radius, y: inter.y + uy * radius };

      finalPath += ` L ${pBefore.x} ${pBefore.y} A ${radius} ${radius} 0 0 1 ${pAfter.x} ${pAfter.y}`;
      currentPos = pAfter;
    });

    finalPath += ` L ${seg.p2.x} ${seg.p2.y}`;
  });

  return finalPath;
};
