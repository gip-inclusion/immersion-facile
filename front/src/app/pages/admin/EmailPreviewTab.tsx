import React from "react";
import { generateHtmlFromTemplate } from "html-templates";
import { DsfrTitle } from "react-design-system";
import "./Admin.css";

export const EmailPreviewTab = () => {
  const fakeContent = generateHtmlFromTemplate("FULL_PREVIEW_EMAIL", {
    beneficiaryName: "Jean-Louis",
    beneficiaryRepresentativeName: "beneficiaryRepresentativeName",
    establishmentRepresentativeName: "establishmentRepresentativeName",
    signatoryName: "signatoryName",
    magicLink: "magicLink",
    businessName: "businessName",
  });

  return (
    <div className="admin-tab__email-preview">
      <DsfrTitle level={5} text="Aperçu de template email" />
      <div
        className="admin-tab__email-preview-wrapper"
        dangerouslySetInnerHTML={{ __html: fakeContent.htmlContent }}
      ></div>
    </div>
  );
};
