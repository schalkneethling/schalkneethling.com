import fse from "fs-extra";

import * as cheerio from "cheerio";
import sass from "sass";

require("dotenv").config();

export const processSASS = (tmpl) => {
  const environment = process.env.NODE_ENV || "development";
  const outputStyle = environment === "production" ? "compressed" : "expanded";
  const sourceMap = environment === "production" ? true : false;
  const $ = cheerio.load(tmpl, { xmlMode: true });
  const outputFile = "public/css/main.css";
  const sassEntry = $("link[type='text/sass']");
  const sassFile = sassEntry.attr("href");

  try {
    const result = sass.renderSync({
      file: sassFile,
      outputStyle: outputStyle,
      sourceMap: sourceMap,
      outfile: outputFile,
    });

    fse.outputFileSync(outputFile, result.css, "utf8");

    sassEntry.attr("href", outputFile.replace("public", ".."));
    sassEntry.attr("type", "text/css");

    return $.html();
  } catch (error) {
    console.error(`Error while processing SASS: ${error.toString()}`);
  }
};
