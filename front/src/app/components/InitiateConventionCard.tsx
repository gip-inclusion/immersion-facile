import { keys } from "ramda";
import React from "react";
import { ButtonHome } from "react-design-system";
import { Section } from "src/app/components/Section";
import { deviceRepository } from "src/config/dependencies";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { PeConnectButton } from "react-design-system/immersionFacile";
import { EstablishmentSubTitle } from "src/app/components/EstablishmentSubTitle";
import { useRoute } from "src/app/routes/routes";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";
import { loginPeConnect } from "shared";

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
    <div className="flex flex-col w-full h-full items-center justify-center">
      {enablePeConnectApi && (
        <>
          <p className="text-center  fr-mb-2w">{peConnectNotice}</p>
          <PeConnectButton
            onClick={() => {
              if (currentRoute.name === "conventionImmersion")
                storeConventionRouteParamsOnDevice(currentRoute.params);
            }}
            peConnectEndpoint={loginPeConnect}
          />
          <a
            className="small mt-1"
            href="https://candidat.pole-emploi.fr/compte/identifiant/saisieinformations"
            target="_blank"
          >
            Je ne connais pas mes identifiants
          </a>
          <strong className="pt-4">ou bien</strong>
          <p
            className="text-center fr-my-2w"
            dangerouslySetInnerHTML={{ __html: otherCaseNotice }}
          ></p>
        </>
      )}
      <ButtonHome
        type="candidate"
        onClick={redirectToConventionWithoutIdentityProvider}
      >
        {showFormButtonLabel}
      </ButtonHome>
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
