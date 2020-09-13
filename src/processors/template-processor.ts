import fse from "fs-extra";
import path from "path";

require("dotenv").config();

function loadTemplate() {
  try {
    const tmpl = path.resolve(
      __dirname,
      `../../${process.env.TEMPLATE_DIR}/_base.html`
    );
    return fse.readFileSync(tmpl, "utf8");
  } catch (error) {
    throw new Error(`Error while reading template: ${error.toString()}`);
  }
}

function addMain(markdown: string, tmpl: string) {
  return tmpl.replace("{{ main }}", markdown);
}

export { loadTemplate, addMain };
