import type Token from "markdown-it/lib/token.mjs";
import { WarningIcon, InfoIcon, StarredIcon, DoneIcon } from "outline-icons";
import { wrappingInputRule } from "prosemirror-inputrules";
import type {
  NodeSpec,
  Node as ProsemirrorNode,
  NodeType,
} from "prosemirror-model";
import type { Command, EditorState, Transaction } from "prosemirror-state";
import * as React from "react";
import ReactDOM from "react-dom";
import type { Primitive } from "utility-types";
import { CalloutStyle } from "@shared/types";
import {
  GitHubAlertCautionIcon,
  GitHubAlertImportantIcon,
  GitHubAlertNoteIcon,
  GitHubAlertTipIcon,
  GitHubAlertWarningIcon,
} from "../components/GitHubAlertIcons";
import toggleWrap from "../commands/toggleWrap";
import type { MarkdownSerializerState } from "../lib/markdown/serializer";
import noticesRule from "../rules/notices";
import Node from "./Node";

export enum NoticeDialect {
  Outline = "outline",
  GitHub = "github",
}

export enum NoticeTypes {
  Info = "info",
  Success = "success",
  Tip = "tip",
  Warning = "warning",
  Note = "note",
  Important = "important",
  Caution = "caution",
}

const githubAlertLabels: Record<string, string> = {
  [NoticeTypes.Note]: "Note",
  [NoticeTypes.Tip]: "Tip",
  [NoticeTypes.Important]: "Important",
  [NoticeTypes.Warning]: "Warning",
  [NoticeTypes.Caution]: "Caution",
};

export default class Notice extends Node {
  get name() {
    return "container_notice";
  }

  get rulePlugins() {
    return [noticesRule];
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        style: {
          default: NoticeTypes.Info,
        },
        dialect: {
          default: NoticeDialect.Outline,
        },
      },
      content:
        "(list | blockquote | hr | paragraph | heading | code_block | code_fence | attachment)+",
      group: "block",
      defining: true,
      draggable: true,
      parseDOM: [
        {
          tag: "div.notice-block",
          preserveWhitespace: "full",
          contentElement: (node: HTMLDivElement) =>
            node.querySelector("div.content") || node,
          getAttrs: (dom: HTMLDivElement) => ({
            dialect:
              dom.dataset.dialect === NoticeDialect.GitHub
                ? NoticeDialect.GitHub
                : NoticeDialect.Outline,
            style: dom.dataset.style || (dom.className.includes(NoticeTypes.Tip)
              ? NoticeTypes.Tip
              : dom.className.includes(NoticeTypes.Warning)
                ? NoticeTypes.Warning
                : dom.className.includes(NoticeTypes.Success)
                  ? NoticeTypes.Success
                  : undefined),
          }),
        },
        // Quill editor parsing
        {
          tag: "div.ql-hint",
          preserveWhitespace: "full",
          getAttrs: (dom: HTMLDivElement) => ({
            style: dom.dataset.hint,
          }),
        },
        // GitBook parsing
        {
          tag: "div.alert.theme-admonition",
          preserveWhitespace: "full",
          getAttrs: (dom: HTMLDivElement) => ({
            style: dom.className.includes(NoticeTypes.Warning)
              ? NoticeTypes.Warning
              : dom.className.includes(NoticeTypes.Success)
                ? NoticeTypes.Success
                : undefined,
          }),
        },
        // Confluence parsing
        {
          tag: "div.confluence-information-macro",
          preserveWhitespace: "full",
          getAttrs: (dom: HTMLDivElement) => ({
            style: dom.className.includes("confluence-information-macro-tip")
              ? NoticeTypes.Success
              : dom.className.includes("confluence-information-macro-note")
                ? NoticeTypes.Tip
                : dom.className.includes("confluence-information-macro-warning")
                  ? NoticeTypes.Warning
                  : undefined,
          }),
        },
      ],
      toDOM: (node) => {
        let icon;
        let title;
        if (typeof document !== "undefined") {
          let component;

          if (node.attrs.dialect === NoticeDialect.GitHub) {
            if (node.attrs.style === NoticeTypes.Tip) {
              component = <GitHubAlertTipIcon />;
            } else if (node.attrs.style === NoticeTypes.Important) {
              component = <GitHubAlertImportantIcon />;
            } else if (node.attrs.style === NoticeTypes.Warning) {
              component = <GitHubAlertWarningIcon />;
            } else if (node.attrs.style === NoticeTypes.Caution) {
              component = <GitHubAlertCautionIcon />;
            } else {
              component = <GitHubAlertNoteIcon />;
            }
          } else {
            if (node.attrs.style === NoticeTypes.Tip) {
              component = <StarredIcon />;
            } else if (node.attrs.style === NoticeTypes.Warning) {
              component = <WarningIcon />;
            } else if (node.attrs.style === NoticeTypes.Success) {
              component = <DoneIcon />;
            } else {
              component = <InfoIcon />;
            }
          }

          icon = document.createElement("div");
          icon.className = "icon";
          ReactDOM.render(component, icon);

          if (node.attrs.dialect === NoticeDialect.GitHub) {
            title = document.createElement("div");
            title.className = "github-alert-title";
            title.contentEditable = "false";
            title.appendChild(icon);

            const label = document.createElement("span");
            label.textContent =
              githubAlertLabels[node.attrs.style] || githubAlertLabels.note;
            title.appendChild(label);
          }
        }

        return [
          "div",
          {
            class: `notice-block ${node.attrs.dialect} ${node.attrs.style}`,
            "data-dialect": node.attrs.dialect,
            "data-style": node.attrs.style,
          },
          ...(title ? [title] : icon ? [icon] : []),
          ["div", { class: "content" }, 0],
        ];
      },
    };
  }

  commands({ type }: { type: NodeType }) {
    return {
      container_notice: (attrs: Record<string, Primitive>) =>
        toggleWrap(type, attrs),
      info: (): Command => (state, dispatch) =>
        this.handleStyleChange(state, dispatch, NoticeTypes.Info),
      warning: (): Command => (state, dispatch) =>
        this.handleStyleChange(state, dispatch, NoticeTypes.Warning),
      success: (): Command => (state, dispatch) =>
        this.handleStyleChange(state, dispatch, NoticeTypes.Success),
      tip: (): Command => (state, dispatch) =>
        this.handleStyleChange(state, dispatch, NoticeTypes.Tip),
      note: (): Command => (state, dispatch) =>
        this.handleStyleChange(
          state,
          dispatch,
          NoticeTypes.Note,
          NoticeDialect.GitHub
        ),
      important: (): Command => (state, dispatch) =>
        this.handleStyleChange(
          state,
          dispatch,
          NoticeTypes.Important,
          NoticeDialect.GitHub
        ),
      caution: (): Command => (state, dispatch) =>
        this.handleStyleChange(
          state,
          dispatch,
          NoticeTypes.Caution,
          NoticeDialect.GitHub
        ),
    };
  }

  handleStyleChange = (
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined,
    style: NoticeTypes,
    dialect = this.editor?.props.calloutStyle === CalloutStyle.GitHub
      ? NoticeDialect.GitHub
      : NoticeDialect.Outline
  ): boolean => {
    const { tr, selection } = state;
    const { $from } = selection;
    const node = $from.node(-1);

    if (node?.type.name === this.name) {
      if (dispatch) {
        const transaction = tr.setNodeMarkup($from.before(-1), undefined, {
          ...node.attrs,
          style,
          dialect,
        });
        dispatch(transaction);
      }
      return true;
    }
    return false;
  };

  inputRules({ type }: { type: NodeType }) {
    return [wrappingInputRule(/^:::$/, type)];
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    const selectedDialect =
      state.options.calloutStyle === CalloutStyle.GitHub
        ? NoticeDialect.GitHub
        : NoticeDialect.Outline;
    const dialect = node.attrs.dialect || NoticeDialect.Outline;

    if (dialect !== selectedDialect) {
      state.renderContent(node);
      state.closeBlock(node);
      return;
    }

    if (selectedDialect === NoticeDialect.GitHub) {
      state.write(`\n> [!${String(node.attrs.style).toUpperCase()}]\n`);
      state.wrapBlock("> ", null, node, () => state.renderContent(node));
      return;
    }

    state.write("\n:::" + (node.attrs.style || "info") + "\n");
    state.renderContent(node);
    state.ensureNewLine();
    state.write(":::");
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "container_notice",
      getAttrs: (tok: Token) => ({
        style: tok.info,
        dialect: tok.meta?.dialect || NoticeDialect.Outline,
      }),
    };
  }
}
