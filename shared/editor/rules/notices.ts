import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import customFence from "markdown-it-container";

const githubAlertTypes = new Set([
  "NOTE",
  "TIP",
  "IMPORTANT",
  "WARNING",
  "CAUTION",
]);

export default function notice(md: MarkdownIt): void {
  customFence(md, "notice", {
    marker: ":",
    validate: () => true,
    render(tokens: Token[], idx: number) {
      const { info } = tokens[idx];

      if (tokens[idx].nesting === 1) {
        // opening tag
        return `<div class="notice notice-${md.utils.escapeHtml(info)}">\n`;
      } else {
        // closing tag
        return "</div>\n";
      }
    },
  });

  md.core.ruler.after("block", "github_alerts", (state) => {
    const { tokens } = state;

    for (let index = 0; index < tokens.length - 3; index++) {
      if (
        tokens[index].type !== "blockquote_open" ||
        tokens[index + 1].type !== "paragraph_open" ||
        tokens[index + 2].type !== "inline"
      ) {
        continue;
      }

      const match = tokens[index + 2].content.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n|\s+|$)/i
      );
      const type = match?.[1].toUpperCase();
      if (!match || !type || !githubAlertTypes.has(type)) {
        continue;
      }

      let depth = 0;
      let closeIndex = -1;
      for (let cursor = index; cursor < tokens.length; cursor++) {
        if (tokens[cursor].type === "blockquote_open") {
          depth++;
        } else if (tokens[cursor].type === "blockquote_close") {
          depth--;
          if (depth === 0) {
            closeIndex = cursor;
            break;
          }
        }
      }
      if (closeIndex === -1) {
        continue;
      }

      const open = tokens[index];
      open.type = "container_notice_open";
      open.tag = "div";
      open.info = type.toLowerCase();
      open.meta = { dialect: "github" };

      const inline = tokens[index + 2];
      inline.content = inline.content.slice(match[0].length);
      const children = inline.children;
      if (children?.[0]?.type === "text") {
        children[0].content = children[0].content.replace(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
          ""
        );
        if (!children[0].content) {
          children.shift();
        }
        if (children[0]?.type === "softbreak") {
          children.shift();
        }
      }

      const close = tokens[closeIndex];
      close.type = "container_notice_close";
      close.tag = "div";
      index = closeIndex;
    }
  });
}
