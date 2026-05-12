import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';

const plistPath = process.argv[2];
if (!plistPath) { console.error('Usage: node plist-to-atlas.mjs <file.plist>'); process.exit(1); }

const src = readFileSync(resolve(plistPath), 'utf-8');
const dir = dirname(resolve(plistPath));
const name = basename(plistPath, '.plist');

// Parse {{x,y},{w,h}} → {x,y,w,h}
function parseRect(s) {
  const m = s.match(/\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}/);
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}
// Parse {w,h}
function parseSize(s) {
  const m = s.match(/\{(\d+),(\d+)\}/);
  return { w: +m[1], h: +m[2] };
}

// Phaser TP JSON Hash format parser
function parseFrames(xml) {
  const framesBlock = xml.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata/)?.[1];
  if (!framesBlock) throw new Error('frames block not found');

  const frames = {};
  const frameRe = /<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let fm;
  while ((fm = frameRe.exec(framesBlock)) !== null) {
    const key = fm[1].trim().replace(/\.png$/, '');
    const body = fm[2];
    const get = (k) => {
      const m = new RegExp(`<key>${k}<\\/key>\\s*<(string|true|false)\\/?>([^<]*)?`).exec(body);
      if (!m) return null;
      return m[1] === 'string' ? m[2] : m[1];
    };
    const f = parseRect(get('frame'));
    const sc = parseRect(get('sourceColorRect'));
    const ss = parseSize(get('sourceSize'));
    frames[key] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: get('rotated') === 'true',
      trimmed: sc.x !== 0 || sc.y !== 0 || sc.w !== ss.w || sc.h !== ss.h,
      spriteSourceSize: { x: sc.x, y: sc.y, w: sc.w, h: sc.h },
      sourceSize: { w: ss.w, h: ss.h },
    };
  }
  return frames;
}

function parseMeta(xml) {
  const m = xml.match(/<key>size<\/key>\s*<string>\{(\d+),(\d+)\}<\/string>/);
  return m ? { w: +m[1], h: +m[2] } : { w: 1024, h: 1024 };
}

const frames = parseFrames(src);
const size = parseMeta(src);

const atlas = {
  frames,
  meta: {
    image: `${name}.png`,
    format: 'RGBA8888',
    size,
    scale: '1',
  },
};

const outPath = resolve(dir, `${name}_atlas.json`);
writeFileSync(outPath, JSON.stringify(atlas, null, 2));
console.log(`Wrote ${Object.keys(frames).length} frames → ${outPath}`);
