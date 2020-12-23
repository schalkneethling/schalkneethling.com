import fse from "fs-extra";
import path from "path";

require("dotenv").config();

function loadTemplate(templateName: string) {
  try {
    const tmplDir = `../../${process.env.TEMPLATE_DIR}`;
    const tmpl = path.resolve(__dirname, `${tmplDir}/${templateName}`);
    return fse.readFileSync(tmpl, "utf8");
  } catch (error) {
    throw new Error(`Error while reading template: ${error.toString()}`);
  }
}

function setMetadata(metadata, tmpl: string) {
  tmpl = tmpl.replace("{{ title }}", metadata.title);
  tmpl = tmpl.replace("{{ description }}", metadata.description);

  return tmpl;
}

function setMain(postHTML: string, tmpl: string) {
  return tmpl.replace("{{ main }}", postHTML);
}

export { loadTemplate, setMain, setMetadata };
