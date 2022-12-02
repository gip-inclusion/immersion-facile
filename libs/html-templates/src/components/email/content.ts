import { ignoreTabs, wrapElements } from "../../helpers/formatters";

export const renderContent = (
  content: string | undefined,
  wrap = true,
): string | undefined => {
  if (!content) return;
  const formattedContent = `<p>${ignoreTabs(content)
    .split("\n")
    .join("<br/>")}</p>`;

  return wrap ? wrapElements(formattedContent) : formattedContent;
};
