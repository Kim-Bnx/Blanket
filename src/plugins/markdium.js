import MarkdownItAsync from "markdown-it-async";
import markdownContainer from "markdown-it-container";
import { fromAsyncCodeToHtml } from "@shikijs/markdown-it/async";
import { codeToHtml } from "shiki";

const asideTypes = ["info", "warning", "tips"];
const linkTypes = ["img", "ref", "to", "cta", "demo"];

function createSpoilerContainer(md) {
  return [
    markdownContainer,
    "spoiler",
    {
      validate: (params) => /^spoiler\s+.+/.test(params.trim()),
      render: (tokens, idx) => {
        const m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
        if (tokens[idx].nesting === 1) {
          return `<details><summary>${md.utils.escapeHtml(m[1])}</summary>\n`;
        } else {
          return `</details>\n`;
        }
      },
    },
  ];
}

function createAsideContainer(type) {
  return [
    markdownContainer,
    type,
    {
      validate: (params) => params.trim() === type,
      render: (tokens, idx) => (tokens[idx].nesting === 1 ? `<aside class="${type}">\n` : `</aside>\n`),
    },
  ];
}

function createLinkRule() {
  return function link_open(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex("href");

    if (hrefIndex < 0) return self.renderToken(tokens, idx, options);

    const href = token.attrs[hrefIndex][1];
    const match = href.match(/^(\w+):(.*)$/);

    if (match && linkTypes.includes(match[1])) {
      const [_, type, realHref] = match;
      token.attrs[hrefIndex][1] = realHref;
      token.attrSet("class", type);
    }

    return self.renderToken(tokens, idx, options);
  };
}

async function copy(pre) {
  const button = document.createElement("button");
  button.className = "copy-code";
  button.innerHTML = "Copier";

  pre.appendChild(button);

  // Ajoute le comportement de copie
  button.addEventListener("click", async () => {
    const code = pre.querySelector("code");
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent);
      button.innerHTML = "Copié !";
      setTimeout(() => {
        button.innerHTML = "Copier";
      }, 2000);
    } catch (err) {
      console.error("Échec de la copie : ", err);
      button.innerHTML = "Erreur";
    }
  });
}

export default {
  async init() {
    const posts = document.querySelectorAll(".tuto");
    if (!posts) return;

    const md = MarkdownItAsync({ html: true });
    md.use(
      fromAsyncCodeToHtml(codeToHtml, {
        themes: {
          light: "catppuccin-latte",
          dark: "catppuccin-mocha",
        },
      })
    );
    md.use(...createSpoilerContainer(md));

    for (const type of asideTypes) {
      md.use(...createAsideContainer(type));
    }

    md.renderer.rules.link_open = createLinkRule();

    for (const post of posts) {
      const rawText = post.innerHTML;

      const plainText = rawText
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&#105;/g, "i")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

      const result = await md.renderAsync(plainText);
      post.innerHTML = result;
      document.querySelectorAll("pre.shiki").forEach((pre) => copy(pre));
      post.style.visibility = "visible";
    }
  },
};
