import { useCallback, useState } from "react";
import { sanitizeHtmlForPdf } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

const relativeLinkHrefRegex = /(<link\b[^>]*\bhref=["'])\/(?!\/)/gi;
const relativeImgSrcRegex = /(<img\b[^>]*\bsrc=["'])\/(?!\/)/gi;

const absolutizeRelativeUrls = (html: string, origin: string): string =>
  html
    .replace(relativeLinkHrefRegex, `$1${origin}/`)
    .replace(relativeImgSrcRegex, `$1${origin}/`);

const removeUnwantedElements = (
  html: string,
  querySelectors: string[],
): string => {
  if (querySelectors.length === 0) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(querySelectors.join(",")).forEach((element) => {
    element.remove();
  });
  return doc.documentElement.outerHTML;
};

const prepareContentForPdfGenerator = (rawHtml: string): string => {
  const origin = window.location.origin;
  const htmlWithoutUnwantedElements = removeUnwantedElements(rawHtml, [
    ".crisp-client",
  ]);
  const htmlWithAbsoluteUrls = absolutizeRelativeUrls(
    htmlWithoutUnwantedElements,
    origin,
  );
  return sanitizeHtmlForPdf(htmlWithAbsoluteUrls, window.location.hostname);
};

export const usePdfGenerator = () => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { technicalGateway } = outOfReduxDependencies;

  const generateAndDownloadPdf = useCallback(
    async ({
      conventionId,
      prefix,
      jwt,
    }: {
      conventionId: string;
      prefix: string;
      jwt: string;
    }) => {
      try {
        setIsPdfLoading(true);

        const htmlContent = prepareContentForPdfGenerator(
          document.documentElement.outerHTML,
        );

        const pdfContent = await technicalGateway.htmlToPdf(
          { htmlContent, conventionId },
          jwt,
        );

        const downloadLink = document.createElement("a");
        downloadLink.href = `data:application/pdf;base64,${pdfContent}`;
        downloadLink.download = `${prefix}-${conventionId}.pdf`;
        downloadLink.click();
      } catch (e) {
        alert("Erreur lors de la génération du PDF >> voir la console.");
        // biome-ignore lint/suspicious/noConsole: debug purpose
        console.error(JSON.stringify(e));
      } finally {
        setIsPdfLoading(false);
      }
    },
    [technicalGateway],
  );

  return { isPdfLoading, generateAndDownloadPdf };
};
