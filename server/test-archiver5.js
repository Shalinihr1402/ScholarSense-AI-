
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const archive = new ZipArchive({ zlib: { level: 6 } });
console.log(typeof archive.pipe, typeof archive.file, typeof archive.finalize);

