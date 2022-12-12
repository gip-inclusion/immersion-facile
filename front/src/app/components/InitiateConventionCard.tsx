import { keys } from "ramda";
import React from "react";
import { ButtonHome, PeConnectButton } from "react-design-system";
import { loginPeConnect } from "shared";
import { EstablishmentSubTitle } from "src/app/components/EstablishmentSubTitle";
import { Section } from "src/app/components/Section";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";

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
          <div className="flex flex-col w-full h-full items-center justify-center text-center">
            <p
              className="align-center"
              dangerouslySetInnerHTML={{ __html: peConnectNotice }}
            ></p>
            <PeConnectButton
              onClick={() => {
                if (currentRoute.name === "conventionImmersion")
                  storeConventionRouteParamsOnDevice(currentRoute.params);
              }}
              peConnectEndpoint={loginPeConnect}
            />
            <a
              className="fr-text--sm fr-mt-1v"
              href="https://candidat.pole-emploi.fr/compte/identifiant/saisieinformations"
              target="_blank"
            >
              Je ne connais pas mes identifiants
            </a>
          </div>
          <div className="flex flex-col w-full h-full items-center justify-center">
            <strong className="fr-text--lead">ou bien</strong>
          </div>
          <div className="flex flex-col w-full h-full items-center justify-center">
            <p
              className="text-center"
              dangerouslySetInnerHTML={{ __html: otherCaseNotice }}
            ></p>
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
    <Section type="candidate">
      <EstablishmentSubTitle type={"candidateForm"} text={title} />
      {cardContent}
    </Section>
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
