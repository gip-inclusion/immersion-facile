import React, { useRef, useState } from "react";
import { MainWrapper, SectionConventionNextSteps } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { Route } from "type-route";
import { routes } from "src/app/routes/routes";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";

interface ConventionSubmitedConfirmationPageProperties {
  route: Route<typeof routes.conventionSubmited>;
}

export const ConventionSubmitedConfirmationPage = ({
  route,
}: ConventionSubmitedConfirmationPageProperties) => {
  const [isCopied, setIsCopied] = useState(false);
  const {
    onCopyButtonClick,
    copyButtonLabel,
    copyButtonIsDisabled,
  } = useCopyButton();
  const onCopyButtonClick = () => {
    navigator.clipboard
      .writeText(route.params.conventionId)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3_000);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };
  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout="fullscreen"
        vSpacing={0}
        useBackground
        backgroundStyles={{
          top: "55%",
        }}
      >
        <div className={fr.cx("fr-container")}>
          <div className={fr.cx("fr-py-10w")}>
            <h1 className={fr.cx("fr-mb-md-7w")}>
              Votre demande de convention a bien été envoyée !
            </h1>
            <p className={fr.cx("fr-mb-4w", "fr-mb-md-7w")}>
              Conservez précieusement l'identifiant de votre convention, il vous
              permettra de la retrouver en cas de problème :
            </p>
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--center",
                "fr-grid-row--middle",
              )}
            >
              <strong className={fr.cx("fr-h2", "fr-mb-0")}>
                {route.params.conventionId}
              </strong>
              <Button
                disabled={isCopied}
                onClick={onCopyButtonClick}
                priority="secondary"
                size="large"
                className={fr.cx(
                  "fr-btn",
                  "fr-btn--sm",
                  "fr-icon-clipboard-fill",
                  "fr-btn--tertiary-no-outline",
                  "fr-btn--icon-left",
                  "fr-ml-md-2w",
                  "fr-mt-2w",
                  "fr-mt-md-0",
                )}
              >
                {isCopied ? "Copié !" : "Copier cet ID"}
              </Button>
            </div>
          </div>

          <SectionConventionNextSteps />

          <hr className={fr.cx("fr-hr")} />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
