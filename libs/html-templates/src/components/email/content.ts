import { ignoreTabs, wrapElements } from "../../helpers/formatters";

export const renderContent = (
  content: string | undefined,
  options: { wrapInTable: boolean } = { wrapInTable: true },
): string | undefined => {
  if (!content) return;
  const formattedContent = `<p>${ignoreTabs(content)
    .split("\n")
    .join("<br/>")}</p>`;

  return options.wrapInTable
    ? wrapElements(formattedContent)
    : formattedContent;
};
