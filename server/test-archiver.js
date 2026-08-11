
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import fs from "fs";

const archive = archiver("zip", { zlib: { level: 6 } });
archive.on("error", err => console.error("Archive error:", err));

const out = fs.createWriteStream("test.zip");
archive.pipe(out);

const testFilePath = "D:\\ScholarSense AI\\server\\uploads\\documents\\1782398453508-250084-markscard.jpeg";
archive.file(testFilePath, { name: "Marksheet.jpeg" });

archive.finalize().then(() => console.log("Done")).catch(console.error);

