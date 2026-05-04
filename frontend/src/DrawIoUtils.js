/**
 * Draw.io inspired geometric shape functions.
 * These functions calculate SVG paths for various shapes.
 */

export const DrawIoShapes = {
  /**
   * Generates a rectangle path.
   */
  getRectPath: (w, h, rounded = false, r = 10) => {
    if (rounded) {
      return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  },

  /**
   * Generates an ellipse path.
   */
  getEllipsePath: (w, h) => {
    const rx = w / 2;
    const ry = h / 2;
    return `M 0 ${ry} A ${rx} ${ry} 0 1 0 ${w} ${ry} A ${rx} ${ry} 0 1 0 0 ${ry} Z`;
  },

  /**
   * Generates a diamond (rhombus) path.
   */
  getDiamondPath: (w, h) => {
    const hw = w / 2;
    const hh = h / 2;
    return `M ${hw} 0 L ${w} ${hh} L ${hw} ${h} L 0 ${hh} Z`;
  },

  /**
   * Generates a cylinder path (for databases).
   */
  getCylinderPath: (w, h) => {
    const ry = Math.min(20, h * 0.2);
    return `M 0 ${ry} L 0 ${h - ry} A ${w / 2} ${ry} 0 0 0 ${w} ${h - ry} L ${w} ${ry} A ${w / 2} ${ry} 0 1 0 0 ${ry} A ${w / 2} ${ry} 0 1 0 ${w} ${ry}`;
  },

  /**
   * Generates a note path (with folded corner).
   */
  getNotePath: (w, h, s = 15) => {
    return `M 0 0 L ${w - s} 0 L ${w} ${s} L ${w} ${h} L 0 ${h} Z M ${w - s} 0 L ${w - s} ${s} L ${w} ${s}`;
  },

  /**
   * Generates a cloud path.
   */
  getCloudPath: (w, h) => {
    // Normalized cloud path scaled to width/height
    return `M 25 60 A 20 20 0 0 1 20 20 A 25 25 0 0 1 70 20 A 30 30 0 0 1 95 50 A 20 20 0 0 1 80 85 L 30 85 A 25 25 0 0 1 25 60 Z`;
  },

  /**
   * Generates a cube (3D) path.
   */
  getCubePath: (w, h, d = 15) => {
    return `M 0 ${d} L ${w - d} ${d} L ${w} 0 L ${d} 0 Z M ${w - d} ${d} L ${w} 0 L ${w} ${h - d} L ${w - d} ${h} Z M 0 ${d} L ${w - d} ${d} L ${w - d} ${h} L 0 ${h} Z`;
  }
};
