import { ignoreTabs, wrapElements } from "../../helpers/formatters";

export const renderContent = (
  content: string | undefined,
): string | undefined => {
  if (!content) return;
  const formattedContent = `<p>${ignoreTabs(content)
    .split("\n")
    .join("<br/>")}</p>`;

  return wrapElements(formattedContent);
};
