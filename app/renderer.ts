import { Renderer } from "marked";
import hljs from "highlight.js";

export const renderer = new Renderer();
renderer.code = (code, language) => {
  if (language) {
    const highlighted = hljs.highlight(code, { language }).value;
    return `<pre><code class="hljs ${language}">${highlighted}</code></pre>`;
  }

  return code;
};
