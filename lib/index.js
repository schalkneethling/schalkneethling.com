#!/usr/bin/env node
const fse = require("fs-extra");
const path = require("path");

const regex = /(?:{=)([\S\s]*?.+)(?:=})/g;
let fileContent = "";
let tmpl = "";

function loadTemplate(template) {
  try {
    return fse.readFileSync(`./templates/${template}`, "utf-8");
  } catch (error) {
    console.error(error);
  }
}

function writeFile(tmpl) {
  try {
    fse.outputFileSync("dist/first-post.html", tmpl);
  } catch (error) {
    console.error(error);
  }
}

function getMetaData(fileContent) {
  let match = regex.exec(fileContent);
  let metaData = JSON.parse(match[1]);
  return metaData;
}

function setCanonicalURL() {
  const siteURL = "https://schalkneethling.me";
  const postsURL = `${siteURL}/posts/`;
}

function setMetaData(tmpl, metaData) {
  const canonicalURL = `https://schalkneethling.me/posts/${metaData.filename}`;
  tmpl = tmpl.replace("%page.keywords%", metaData.metaKeywords);
  tmpl = tmpl.replace("%page.description%", metaData.metaDescription);
  tmpl = tmpl.replace("%page.title%", metaData.pageTitle);
  tmpl = tmpl.replace(
    "%canonical%",
    `<link rel="canonical" href="${canonicalURL}" />`
  );
  return tmpl;
}

function scrubFileContent(fileContent, matchesArray) {
  matchesArray.forEach(match => {
    fileContent = fileContent.replace(match, "");
  });
  return fileContent;
}

async function bundle(entryFile) {
  const bundlerOptions = {
    outfile: "index.html",
    publicUrl: "./",
    watch: false
  };
  console.log(entryFile);
  const bundler = new Parcel(`./templates/${entryFile}`, bundlerOptions);
  const bundle = await bundler.bundle();
  return bundle;
}

function parseTmpl(tmpl) {
  let resultsArray = [];

  while ((resultsArray = regex.exec(tmpl)) !== null) {
    let obj = JSON.parse(resultsArray[1]);

    if (obj.roboType === "include") {
      try {
        let include = fse.readFileSync(
          `./templates/includes/${obj.file}`,
          "utf-8"
        );
        tmpl = tmpl.replace(resultsArray[0], include);
      } catch (error) {
        console.error(`Error while loading include: ${error}`);
      }
    }
  }
  return tmpl;
}

function parseDoc() {
  const filePath = "./posts/first-post.html";

  try {
    fileContent = fse.readFileSync(filePath, "utf-8");
    let metaData = getMetaData(fileContent);
    let matchesArray = [];
    let resultsArray = [];

    regex.lastIndex = 0;
    matchesArray.push(regex.exec(fileContent)[0]);

    // add the filename without the file extension to metadata
    metaData["filename"] = path.basename(filePath, ".html");

    bundle(metaData.template).then(bundle => {
      tmpl = bundle.entryAsset.generated.html;
      tmpl = setMetaData(tmpl, metaData);
      tmpl = parseTmpl(tmpl);

      while ((resultsArray = regex.exec(fileContent)) !== null) {
        let obj = JSON.parse(resultsArray[1]);

        if (obj.roboType === "code-sample") {
          try {
            let codeSample = fse.readFileSync(
              `./posts/code/${obj.file}`,
              "utf-8"
            );
            let codeSampleHTML = prism.highlight(
              codeSample,
              Prism.languages[`${obj.type}`],
              obj.type
            );

            fileContent = fileContent.replace(resultsArray[0], codeSampleHTML);
          } catch (error) {
            console.error(`Error while loading code sample: ${error}`);
          }
        } else {
          matchesArray.push(resultsArray[0]);
        }
      }

      fileContent = scrubFileContent(fileContent, matchesArray);

      tmpl = tmpl.replace("%content%", fileContent);
      writeFile(tmpl);
    });
  } catch (error) {
    console.error(error);
  }
}

parseDoc();
