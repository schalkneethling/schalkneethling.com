/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "netlify/functions/server/build",
  serverDependenciesToBundle: ["marked"],
  devServerPort: 8002,
  ignoredRouteFiles: [".*"],
};
