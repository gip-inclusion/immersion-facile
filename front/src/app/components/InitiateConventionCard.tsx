import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import { domElementIds, loginPeConnect } from "shared";
import { ConventionRequirements, PeConnectButton } from "react-design-system";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionImmersionPageRoute["params"],
) => {
  const { fedId, fedIdProvider, jwt, ...partialConvention } = routeParams;
  if (keys(partialConvention).length) {
    deviceRepository.set("partialConventionInUrl", partialConvention);
  }
};

type InitiateConventionCardProps = {
  title: string;
  peConnectNotice: string;
  showFormButtonLabel: string;
  otherCaseNotice: string;
  useSection?: boolean;
  onNotPeConnectButtonClick: () => void;
};

export const InitiateConventionCard = ({
  title,
  peConnectNotice,
  showFormButtonLabel,
  otherCaseNotice,
  useSection = true,
  onNotPeConnectButtonClick,
}: InitiateConventionCardProps) => {
  const { enablePeConnectApi } = useFeatureFlags();
  const currentRoute = useRoute();
  const cardContent = (
    <div>
      {enablePeConnectApi ? (
        <>
          <div>
            <p className={fr.cx("fr-h6", "fr-mb-2w")}>
              J’ai des identifiants Pôle emploi
            </p>
            <p dangerouslySetInnerHTML={{ __html: peConnectNotice }}></p>
            <div className={fr.cx("fr-mb-4w")}>
              <PeConnectButton
                onClick={() => {
                  if (currentRoute.name === "conventionImmersion")
                    storeConventionRouteParamsOnDevice(currentRoute.params);
                }}
                peConnectEndpoint={loginPeConnect}
              />
              <a
                className={fr.cx("fr-text--sm", "fr-mt-1v")}
                href="https://candidat.pole-emploi.fr/compte/identifiant/saisieinformations"
                target="_blank"
                rel="noreferrer"
              >
                Je ne connais pas mes identifiants
              </a>
            </div>
          </div>

          <strong className={fr.cx("fr-text--lead", "fr-hr-or")}>ou</strong>
          <div>
            <p className={fr.cx("fr-h6", "fr-mb-2w")}>
              Je suis dans une autre situation
            </p>
            <p dangerouslySetInnerHTML={{ __html: otherCaseNotice }}></p>

            <Button
              type="button"
              onClick={onNotPeConnectButtonClick}
              nativeButtonProps={{
                id: domElementIds.conventionImmersionRoute.showFormButton,
              }}
            >
              {showFormButtonLabel}
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          onClick={onNotPeConnectButtonClick}
          nativeButtonProps={{
            id: domElementIds.conventionImmersionRoute.showFormButton,
          }}
        >
          {showFormButtonLabel}
        </Button>
      )}
    </div>
  );
  const section = (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      <div className={fr.cx("fr-col-12", "fr-col-lg-7")}>
        <div
          className={fr.cx(
            "fr-card",
            "fr-card--grey",
            "fr-card--no-border",
            "fr-px-12w",
            "fr-py-8w",
          )}
        >
          <p className={fr.cx("fr-h4", "fr-mb-5w")}>{title}</p>
          {cardContent}
        </div>
      </div>
      <div className={fr.cx("fr-col-12", "fr-col-lg-5")}>
        <ConventionRequirements />
      </div>
    </div>
  );
  return useSection ? section : cardContent;
};
