
import archiver from "archiver";
import fs from "fs";

const archive = archiver("zip", { zlib: { level: 6 } });
console.log("Success!");

