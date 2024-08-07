import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import React from "react";
import { MainWrapper } from "react-design-system";
import { contactUsButtonContent } from "src/app/contents/error/textSetup";

export const MinimalErrorPage = ({ error }: { error: Error }) => {
  return (
    <MainWrapper layout="default" vSpacing={4}>
      <Alert
        title="Une erreur est survenue"
        description={error.message}
        severity="error"
        className={fr.cx("fr-mb-2w")}
      />
      <ButtonsGroup
        inlineLayoutWhen="always"
        buttons={[
          {
            children: "Revenir à l'accueil",
            linkProps: {
              href: "/",
            },
          },
          {
            priority: "secondary",
            children: "Contactez-nous",
            linkProps: contactUsButtonContent({
              currentUrl: window.location.href,
              currentDate: new Date().toISOString(),
              error: error.message,
            }),
          },
        ]}
      />
    </MainWrapper>
  );
};
