import { t } from "i18next";
import {
  DoneIcon,
  ExpandedIcon,
  InfoIcon,
  StarredIcon,
  WarningIcon,
} from "outline-icons";
import {
  NoticeDialect,
  NoticeTypes,
} from "@shared/editor/nodes/Notice";
import {
  GitHubAlertCautionIcon,
  GitHubAlertImportantIcon,
  GitHubAlertNoteIcon,
  GitHubAlertTipIcon,
  GitHubAlertWarningIcon,
} from "@shared/editor/components/GitHubAlertIcons";
import type { MenuItem, SelectionContext } from "@shared/editor/types";
import { CalloutStyle } from "@shared/types";

/**
 * Returns menu items for the notice/callout selection toolbar.
 *
 * @param ctx - the current selection context.
 * @returns an array of menu items.
 */
export default function noticeMenuItems(
  ctx: SelectionContext,
  calloutStyle = CalloutStyle.Outline
): MenuItem[] {
  const node = ctx.selection.$from.node(-1);
  const currentStyle = node?.attrs.style as NoticeTypes;
  const currentDialect =
    (node?.attrs.dialect as NoticeDialect) || NoticeDialect.Outline;

  const mapping = {
    [NoticeTypes.Info]: t("Info notice"),
    [NoticeTypes.Warning]: t("Warning notice"),
    [NoticeTypes.Success]: t("Success notice"),
    [NoticeTypes.Tip]: t("Tip notice"),
    [NoticeTypes.Note]: t("Note alert"),
    [NoticeTypes.Important]: t("Important alert"),
    [NoticeTypes.Caution]: t("Caution alert"),
  };

  const activeDialect =
    calloutStyle === CalloutStyle.GitHub
      ? NoticeDialect.GitHub
      : NoticeDialect.Outline;
  if (currentDialect !== activeDialect) {
    return [];
  }

  const children =
    calloutStyle === CalloutStyle.GitHub
      ? [
          {
            name: NoticeTypes.Note,
            icon: <GitHubAlertNoteIcon />,
            label: t("Note alert"),
            active: () => currentStyle === NoticeTypes.Note,
          },
          {
            name: NoticeTypes.Tip,
            icon: <GitHubAlertTipIcon />,
            label: t("Tip alert"),
            active: () => currentStyle === NoticeTypes.Tip,
          },
          {
            name: NoticeTypes.Important,
            icon: <GitHubAlertImportantIcon />,
            label: t("Important alert"),
            active: () => currentStyle === NoticeTypes.Important,
          },
          {
            name: NoticeTypes.Warning,
            icon: <GitHubAlertWarningIcon />,
            label: t("Warning alert"),
            active: () => currentStyle === NoticeTypes.Warning,
          },
          {
            name: NoticeTypes.Caution,
            icon: <GitHubAlertCautionIcon />,
            label: t("Caution alert"),
            active: () => currentStyle === NoticeTypes.Caution,
          },
        ]
      : [
          {
            name: NoticeTypes.Info,
            icon: <InfoIcon />,
            label: t("Info notice"),
            active: () => currentStyle === NoticeTypes.Info,
          },
          {
            name: NoticeTypes.Success,
            icon: <DoneIcon />,
            label: t("Success notice"),
            active: () => currentStyle === NoticeTypes.Success,
          },
          {
            name: NoticeTypes.Warning,
            icon: <WarningIcon />,
            label: t("Warning notice"),
            active: () => currentStyle === NoticeTypes.Warning,
          },
          {
            name: NoticeTypes.Tip,
            icon: <StarredIcon />,
            label: t("Tip notice"),
            active: () => currentStyle === NoticeTypes.Tip,
          },
        ];

  return [
    {
      name: "container_notice",
      visible: !ctx.readOnly,
      label: mapping[currentStyle],
      icon: <ExpandedIcon />,
      children,
    },
  ];
}
