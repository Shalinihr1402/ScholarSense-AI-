
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
console.log(typeof archiver, Object.keys(archiver));

