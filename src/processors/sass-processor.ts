import fse from "fs-extra";

import * as cheerio from "cheerio";
import sass from "sass";

require("dotenv").config();

export const processSASS = (tmpl) => {
  const outputStyle =
    process.env.NODE_ENV === "production" ? "compressed" : "nested";
  const sourceMap = process.env.NODE_ENV === "production" ? true : false;
  const $ = cheerio.load(tmpl);
  const sassEntry = $("link[type='text/sass']");
  const sassFile = sassEntry.attr("href");

  try {
    const result = sass.renderSync({
      file: fse.readFileSync(sassFile, "utf-8"),
      outputStyle: outputStyle,
      sourceMap: sourceMap,
    });
    return result.css.toString();
  } catch (error) {
    console.log(error);
  }
};
