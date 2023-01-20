import { keys } from "ramda";
import React from "react";
import { ButtonHome, PeConnectButton } from "react-design-system";
import { loginPeConnect } from "shared";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";
import { fr } from "@codegouvfr/react-dsfr";

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionImmersionPageRoute["params"],
) => {
  const { federatedIdentity, jwt, ...partialConvention } = routeParams;
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
};

export const InitiateConventionCard = ({
  title,
  peConnectNotice,
  showFormButtonLabel,
  otherCaseNotice,
  useSection = true,
}: InitiateConventionCardProps) => {
  const { enablePeConnectApi } = useFeatureFlags();
  const currentRoute = useRoute();
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();
  const cardContent = (
    <div>
      {enablePeConnectApi ? (
        <>
          <div>
            <p dangerouslySetInnerHTML={{ __html: peConnectNotice }}></p>
            <div className={fr.cx("fr-btns-group--center", "fr-mb-4w")}>
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
              >
                Je ne connais pas mes identifiants
              </a>
            </div>
          </div>

          <strong className={fr.cx("fr-text--lead", "fr-hr-or")}>ou</strong>
          <div>
            <p dangerouslySetInnerHTML={{ __html: otherCaseNotice }}></p>
            <OtherChoiceButton
              label={showFormButtonLabel}
              onClick={redirectToConventionWithoutIdentityProvider}
            />
          </div>
        </>
      ) : (
        <OtherChoiceButton
          label={showFormButtonLabel}
          onClick={redirectToConventionWithoutIdentityProvider}
        />
      )}
    </div>
  );
  const section = (
    <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
      <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
        <div
          className={fr.cx("fr-card", "fr-card--grey", "fr-px-8w", "fr-py-4w")}
        >
          <span className={fr.cx("fr-h5")}>{title}</span>
          {cardContent}
        </div>
      </div>
    </div>
  );
  return useSection ? section : cardContent;
};

const OtherChoiceButton = (props: {
  onClick: () => void;
  label: string;
}): JSX.Element => (
  <>
    {/*TODO : change HomeButton to take 'candidate' and 'establishment' as type params ('error' is very confusing here...)*/}
    <ButtonHome type="candidate" onClick={props.onClick}>
      {props.label}
    </ButtonHome>
  </>
);
