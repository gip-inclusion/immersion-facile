import React from "react";
import { ButtonHome } from "react-design-system";
import { useDispatch } from "react-redux";
import { Section } from "src/app/components/Section";
import { PeConnectButton } from "src/app/pages/Convention/PeConnectButton";
import { EstablishmentSubTitle } from "src/app/pages/home/components/EstablishmentSubTitle";
import { routes, useRoute } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";

export const InitiateConventionCard = () => {
  const { enablePeConnectApi } = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();

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
            <PeConnectButton />
            <span className="pt-4">ou bien</span>
            <p className="text-center text-sm py-3">
              Je suis accompagné par une autre structure :
            </p>
          </>
        )}
        {/*TODO : change HomeButton to take 'candidate' and 'establishment' as type params ('error' is very confusing here...)*/}
        <ButtonHome
          type="error"
          onClick={() => {
            dispatch(
              authSlice.actions.federatedIdentityProvided("noIdentityProvider"),
            );
            if (currentRoute.name !== "convention") routes.convention().push();
          }}
        >
          Je demande une convention
        </ButtonHome>
      </div>
    </Section>
  );
};
