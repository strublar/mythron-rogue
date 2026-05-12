import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const AseFile = require('ase-parser');

const __dirname = dirname(fileURLToPath(import.meta.url));
const UNITS_DIR = join(__dirname, '..', 'public', 'assets', 'units');

function compositeFrame(ase, frameIndex) {
    const { width, height, colorDepth, palette } = ase;
    const frame = ase.frames[frameIndex];
    const buf = Buffer.alloc(width * height * 4, 0);

    for (const cel of frame.cels) {
        if (!cel.rawCelData || cel.w === 0 || cel.h === 0) continue;
        for (let py = 0; py < cel.h; py++) {
            for (let px = 0; px < cel.w; px++) {
                const dstX = cel.xpos + px;
                const dstY = cel.ypos + py;
                if (dstX < 0 || dstY < 0 || dstX >= width || dstY >= height) continue;
                const srcIdx = py * cel.w + px;
                const dstOff = (dstY * width + dstX) * 4;
                if (colorDepth === 32) {
                    const s = srcIdx * 4;
                    buf[dstOff]   = cel.rawCelData[s];
                    buf[dstOff+1] = cel.rawCelData[s+1];
                    buf[dstOff+2] = cel.rawCelData[s+2];
                    buf[dstOff+3] = cel.rawCelData[s+3];
                } else if (colorDepth === 8) {
                    const c = palette[cel.rawCelData[srcIdx]];
                    buf[dstOff]   = c.red;
                    buf[dstOff+1] = c.green;
                    buf[dstOff+2] = c.blue;
                    buf[dstOff+3] = c.alpha ?? 255;
                } else if (colorDepth === 16) {
                    const s = srcIdx * 2;
                    const g = cel.rawCelData[s];
                    buf[dstOff]   = g;
                    buf[dstOff+1] = g;
                    buf[dstOff+2] = g;
                    buf[dstOff+3] = cel.rawCelData[s+1];
                }
            }
        }
    }
    return buf;
}

async function processAse(asePath) {
    const ase = new AseFile(readFileSync(asePath));
    ase.parse();

    const { width, height, numFrames } = ase;
    const name = basename(asePath, '.ase');
    const outDir = dirname(asePath);

    const composite = [];
    for (let i = 0; i < numFrames; i++) {
        composite.push({
            input: { data: compositeFrame(ase, i), raw: { width, height, channels: 4 } },
            left: i * width,
            top: 0,
        });
    }

    await sharp({
        create: { width: width * numFrames, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite(composite)
        .png()
        .toFile(join(outDir, `${name}.png`));

    writeFileSync(
        join(outDir, `${name}.json`),
        JSON.stringify({
            frameWidth: width,
            frameHeight: height,
            frameCount: numFrames,
            durations: ase.frames.map(f => f.frameDuration),
            tags: ase.tags.map(t => ({ name: t.name, from: t.from, to: t.to })),
        }),
    );
}

const units = readdirSync(UNITS_DIR).filter(u => statSync(join(UNITS_DIR, u)).isDirectory());
let done = 0;
const aseFiles = units.flatMap(u =>
    readdirSync(join(UNITS_DIR, u))
        .filter(f => f.endsWith('.ase'))
        .map(f => join(UNITS_DIR, u, f)),
);

for (const path of aseFiles) {
    await processAse(path);
    process.stdout.write(`\r${++done}/${aseFiles.length}  ${basename(path)}                `);
}
console.log('\nDone.');
