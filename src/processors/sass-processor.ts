import fse from "fs-extra";

import * as cheerio from "cheerio";
import sass from "sass";

import dotenv from "dotenv";
dotenv.config();

export const processSASS = (tmpl) => {
  const environment = process.env.NODE_ENV || "development";
  const outputStyle = environment === "production" ? "compressed" : "expanded";
  const sourceMap = environment === "production" ? true : false;
  const $ = cheerio.load(tmpl, { xmlMode: true });
  const outputFile = "public/css/main.css";
  const sassEntry = $("link[type='text/sass']");

  if (sassEntry.length) {
    try {
      // for now, there will only ever be one sass entry
      const sassFile = sassEntry[0].attribs.href;
      const result = sass.compile(sassFile, {
        style: outputStyle,
        sourceMap: sourceMap,
      });

      fse.outputFileSync(outputFile, result.css, "utf8");

      sassEntry.attr("href", outputFile.replace("public", ".."));
      sassEntry.attr("type", "text/css");

      return $.html();
    } catch (error) {
      console.error(`Error while processing SASS: ${error.toString()}`);
    }
  }
};
