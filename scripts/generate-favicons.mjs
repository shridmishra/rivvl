import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public/images/rivvl-favicon.png");
const publicDir = join(root, "public");

async function main() {
  // favicon-32x32.png
  await sharp(source)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, "favicon-32x32.png"));
  console.log("Created favicon-32x32.png");

  // favicon-16x16.png
  await sharp(source)
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, "favicon-16x16.png"));
  console.log("Created favicon-16x16.png");

  // apple-touch-icon.png (180x180)
  await sharp(source)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png");

  // favicon.ico (32x32 PNG wrapped as ICO)
  // Generate a 32x32 PNG buffer and wrap it in ICO format
  const png32 = await sharp(source).resize(32, 32).png().toBuffer();

  // ICO file format: header + directory entry + image data
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // number of images

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0);  // width
  dirEntry.writeUInt8(32, 1);  // height
  dirEntry.writeUInt8(0, 2);   // color palette
  dirEntry.writeUInt8(0, 3);   // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(png32.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12); // offset (6 header + 16 dir entry)

  const ico = Buffer.concat([icoHeader, dirEntry, png32]);
  writeFileSync(join(publicDir, "favicon.ico"), ico);
  console.log("Created favicon.ico");

  // OG image (1200x630) - dark background with logo centered
  const logoSource = join(root, "public/images/rivvl-logo-white.png");
  const logoBuf = await sharp(logoSource)
    .resize({ width: 400, withoutEnlargement: true })
    .toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();

  const ogWidth = 1200;
  const ogHeight = 630;
  const logoW = logoMeta.width || 400;
  const logoH = logoMeta.height || 100;

  const ogImage = await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 4,
      background: { r: 15, g: 15, b: 26, alpha: 1 }, // #0F0F1A
    },
  })
    .composite([
      {
        input: logoBuf,
        left: Math.round((ogWidth - logoW) / 2),
        top: Math.round((ogHeight - logoH) / 2),
      },
    ])
    .png()
    .toFile(join(root, "public/images/og-image.png"));

  console.log("Created og-image.png");
  console.log("All done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
