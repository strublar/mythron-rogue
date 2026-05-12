import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UNITS_DIR = resolve(__dirname, '..', 'public', 'resources', 'units');

function parseRect(s) {
  const m = s.match(/\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}/);
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}

function parseSize(s) {
  const m = s.match(/\{(\d+),(\d+)\}/);
  return { w: +m[1], h: +m[2] };
}

function parsePlist(xml, name) {
  const framesBlock = xml.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata/)?.[1];
  if (!framesBlock) throw new Error(`frames block not found in ${name}.plist`);

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

  const sm = xml.match(/<key>size<\/key>\s*<string>\{(\d+),(\d+)\}<\/string>/);
  const size = sm ? { w: +sm[1], h: +sm[2] } : { w: 1024, h: 1024 };

  return { frames, size };
}

const plists = readdirSync(UNITS_DIR).filter(f => f.endsWith('.plist'));
let done = 0;

for (const file of plists) {
  const name = basename(file, '.plist');
  const src = readFileSync(join(UNITS_DIR, file), 'utf-8');
  const { frames, size } = parsePlist(src, name);
  const atlas = {
    frames,
    meta: {
      image: `${name}.png`,
      format: 'RGBA8888',
      size,
      scale: '1',
    },
  };
  writeFileSync(join(UNITS_DIR, `${name}_atlas.json`), JSON.stringify(atlas));
  process.stdout.write(`\r${++done}/${plists.length}  ${name} (${Object.keys(frames).length} frames)   `);
}
console.log('\nDone.');
