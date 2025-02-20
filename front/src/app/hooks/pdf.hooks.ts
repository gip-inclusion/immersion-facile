import { useCallback, useState } from "react";
import { outOfReduxDependencies } from "src/config/dependencies";

const replaceContentsUrlWithAbsoluteUrl = (htmlContent: string): string =>
  htmlContent
    .replaceAll(
      /(<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'])\/([^'"]*["'][^>]*>)/gm,
      `<link rel="stylesheet" href="${window.location.origin}/$2`,
    )
    .replaceAll(/<img src="\//gm, `<img src="${window.location.origin}/`);

const prepareContentForPdfGenerator = (content: string) => {
  const contentWithoutScripts = content.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi,
    "",
  );
  return replaceContentsUrlWithAbsoluteUrl(contentWithoutScripts);
};

export const usePdfGenerator = () => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { technicalGateway } = outOfReduxDependencies; // Récupération directe des dépendances externes

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
        console.error(JSON.stringify(e));
      } finally {
        setIsPdfLoading(false);
      }
    },
    [technicalGateway],
  );

  return { isPdfLoading, generateAndDownloadPdf };
};
