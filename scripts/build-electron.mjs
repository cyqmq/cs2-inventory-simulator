import { execSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import ts from "typescript";
import { minify_sync } from "terser";

const root = resolve(import.meta.dirname, "..");

const markerFile = resolve(root, ".electron-build");
const commands = [
  `npx react-router build`,
  `npx esbuild electron/main.ts --bundle --platform=node --format=esm --outfile=dist-electron/main.js --external:electron`,
  `npx esbuild electron/preload.ts --bundle --platform=node --format=esm --outfile=dist-electron/preload.js --external:electron`
];

try {
  writeFileSync(markerFile, "");
  for (const cmd of commands) {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd: root, stdio: "inherit" });
  }

  const indexPath = resolve(root, "build", "client", "index.html");
  let html = readFileSync(indexPath, "utf-8");

  // Fix SPA HTML streaming for Electron HTTP server.
  const refMapMatch = html.match(/window\.__reactRouterContext\.streamController\.enqueue\("(\[.*?\])\\n"\)/);
  let refMap = '{"_1":2,"_3":-5,"_4":-5}';
  if (refMapMatch) {
    try {
      const parsed = JSON.parse(refMapMatch[1]);
      refMap = JSON.stringify(parsed[0]);
    } catch {}
  }
  const streamingScript = `</main><script>
(function(){
  var data = JSON.stringify([${refMap},"loaderData",{},"actionData",null,"errors",null])+"\\n";
  window.__reactRouterContext.stream = new ReadableStream({
    start: function(c){
      c.enqueue(new TextEncoder().encode(data));
      c.close();
    }
  });
})();
</script>`;
  html = html.replace(/<\/main>[\s\S]*?<\/script>\s*<\/body>/, streamingScript + "</body>");
  console.log("> Fixed SPA streaming");

  // Inject splash HTML + script into <body> (SPA mode: React doesn't render the splash).
  const splashSource = readFileSync(resolve(root, "app/utils/splash.ts"), "utf-8");
  const splashJs = ts.transpileModule(splashSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, noImplicitUseStrict: true, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const splashMinified = minify_sync(splashJs).code;
  const splashHtml = `<div id="splash" style="align-items:center;background-color:#121212;color:white;display:flex;height:100%;justify-content:center;left:0;position:fixed;top:0;transition:opacity 1s ease-in-out;width:100%;z-index:100"><div style="border:1px solid transparent;border-radius:4px;min-width:216.859px;min-height:44px"><div style="padding:0.25em 0.5em 0 0.5em"><svg class="m-auto h-8" style="margin:auto;height:2rem" viewBox="0 0 140 36" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path fill="#F5F5F5" d="M0 0v36h10V12.5l-5 8.5h5V26H0v-4.5l5-8.5H0zM15 0h4v36h-4zM22 0h11.5c1.1 0 2.3.3 3.5 1 1.2.6 2.1 1.7 2.6 3.2.6 1.5.9 3.6.9 6.3 0 2.7-.3 4.8-.9 6.3-.5 1.5-1.4 2.6-2.6 3.2-1.2.6-2.4 1-3.5 1H22V0zm10 19c.8 0 1.5-.2 1.9-.7.5-.5.8-1.4.8-2.8v-5c0-1.4-.3-2.3-.8-2.8-.4-.5-1.1-.7-1.9-.7h-6v12h6zM37 28h-4l7 8h4zM49 0h13c1 0 2.1.2 3.3.7 1.2.5 2.2 1.3 3 2.5.8 1.2 1.1 2.8 1.1 4.8 0 2-.3 3.6-1.1 4.8-.8 1.2-1.8 2-3 2.5-1.2.5-2.4.7-3.3.7h-9V0zm12 12c.7 0 1.3-.2 1.7-.5.5-.3.7-.9.7-1.5 0-.6-.2-1.1-.7-1.5-.4-.3-1-.5-1.7-.5h-8v4h8zM49 20h4v16h-4zM65 0h4v36h-4zM72 0h13c1 0 2.1.2 3.3.7 1.2.5 2.2 1.3 3 2.5.8 1.2 1.1 2.8 1.1 4.8 0 2-.3 3.6-1.1 4.8-.8 1.2-1.8 2-3 2.5-1.2.5-2.4.7-3.3.7h-9V0zm12 12c.7 0 1.3-.2 1.7-.5.5-.3.7-.9.7-1.5 0-.6-.2-1.1-.7-1.5-.4-.3-1-.5-1.7-.5h-8v4h8zM72 20h4v16h-4zM89 0h4l7 8 6-8h4l-9 12v14h-4V12zM105 0h4v36h-4zM112 0h11.5c1.1 0 2.3.3 3.5 1 1.2.6 2.1 1.7 2.6 3.2.6 1.5.9 3.6.9 6.3 0 2.7-.3 4.8-.9 6.3-.5 1.5-1.4 2.6-2.6 3.2-1.2.6-2.4 1-3.5 1H112V0zm10 19c.8 0 1.5-.2 1.9-.7.5-.5.8-1.4.8-2.8v-5c0-1.4-.3-2.3-.8-2.8-.4-.5-1.1-.7-1.9-.7h-6v12h6z" opacity=".7"/><path fill="#FAFAFA" d="M128 28h4l7 8h-4z"/></g></svg></div><div style="background-color:rgba(0,0,0,0.1);border-radius:2px;margin-top:16px;overflow:hidden;padding:2px"><div id="splash-progress" style="background:white;border-radius:2px;height:4px;transition:width 500ms ease-in-out;width:0%"></div></div></div><style>:root{color-scheme:dark;}</style></div>`;
  html = html.replace("<body>", `<body>${splashHtml}`);
  html = html.replace("</script></body>", `</script><script>${splashMinified}</script></body>`);

  writeFileSync(indexPath, html);
  console.log("> Injected splash HTML + script");
} finally {
  if (existsSync(markerFile)) {
    unlinkSync(markerFile);
  }
}
