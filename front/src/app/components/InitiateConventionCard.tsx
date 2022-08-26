import { keys } from "ramda";
import React from "react";
import { ButtonHome } from "react-design-system";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { Section } from "src/app/components/Section";
import { deviceRepository } from "src/app/config/dependencies";
import { ConventionPageRoute } from "src/app/pages/Convention/ConventionPage";
import { PeConnectButton } from "src/app/pages/Convention/PeConnectButton";
import { EstablishmentSubTitle } from "src/app/pages/home/components/EstablishmentSubTitle";
import { useRoute } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { useRedirectToConventionWithoutIdentityProvider } from "src/hooks/redirections.hooks";

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionPageRoute["params"],
) => {
  const { federatedIdentity, ...partialConvention } = routeParams;
  if (keys(partialConvention).length) {
    deviceRepository.set(
      "partialConvention",
      partialConvention as Partial<ConventionDto>,
    );
  }
};

export const InitiateConventionCard = () => {
  const { enablePeConnectApi } = useFeatureFlags();
  const currentRoute = useRoute();
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();

  return (
    <Section type="candidate">
      <EstablishmentSubTitle
        type={"candidate"}
        text="J'ai trouvé mon entreprise et je veux initier ma demande de convention"
      />
      <div className="flex flex-col w-full h-full items-center justify-center">
        {enablePeConnectApi && (
          <>
            <p className="text-center text-sm py-3">
              Je suis inscrit à Pôle Emploi, je demande une convention avec :
            </p>
            <PeConnectButton
              onClick={() => {
                if (currentRoute.name === "convention")
                  storeConventionRouteParamsOnDevice(currentRoute.params);
              }}
            />
            <a
              className="small mt-1"
              href="https://candidat.pole-emploi.fr/compte/identifiant/choixcontact"
              target="_blank">
              Je ne connais pas mes identifiants
            </a>
            <span className="pt-4">ou bien</span>
            <p className="text-center text-sm py-3">
              Je suis accompagné par une autre structure :
            </p>
          </>
        )}
        {/*TODO : change HomeButton to take 'candidate' and 'establishment' as type params ('error' is very confusing here...)*/}
        <ButtonHome
          type="error"
          onClick={redirectToConventionWithoutIdentityProvider}>
          Je demande une convention
        </ButtonHome>
      </div>
    </Section>
  );
};
