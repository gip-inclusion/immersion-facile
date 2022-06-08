import React from "react";
import { Section } from "src/app/components/Section";
import { PeConnectButton } from "src/app/pages/Convention/PeConnect";
import { EstablishmentSubTitle } from "src/app/pages/home/components/EstablishmentSubTitle";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { LinkWithButtonStyle } from "./LinkWithButtonStyle";

export const InitiateConventionCard = () => {
  const { enablePeConnectApi } = useFeatureFlags();

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
              Je suis accompagné par une autre structure:
            </p>
          </>
        )}
        <LinkWithButtonStyle {...routes.search().link}>
          Je demande une convention
        </LinkWithButtonStyle>
      </div>
    </Section>
  );
};
