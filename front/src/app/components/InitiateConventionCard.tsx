import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { keys } from "ramda";
import { loginPeConnect } from "shared";
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
  onNotPeConnectButtonClick: () => void;
};

export const InitiateConventionCard = ({
  onNotPeConnectButtonClick,
}: InitiateConventionCardProps) => {
  const { enablePeConnectApi } = useFeatureFlags();
  const currentRoute = useRoute();

  return (
    <div>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div
          className={fr.cx("fr-col-12", "fr-col-lg-4")}
          onClick={onNotPeConnectButtonClick}
        >
          <Card
            background
            border
            desc="Je suis une entreprise, un candidat sans identifiants Pôle emploi, un conseiller accompagnant un candidat."
            enlargeLink
            imageAlt=""
            imageUrl="/src/assets/img/fill-convention-form.png"
            linkProps={{
              href: "#",
            }}
            size="medium"
            title="Je remplis une convention sans identifiants Pôle emploi"
            titleAs="h2"
          />
        </div>
        {enablePeConnectApi && (
          <div
            className={fr.cx("fr-col-12", "fr-col-lg-4")}
            onClick={() => {
              if (currentRoute.name === "conventionImmersion")
                storeConventionRouteParamsOnDevice(currentRoute.params);
            }}
          >
            <Card
              background
              border
              desc="Je suis un candidat inscrit à Pôle emploi. Je me connecte avec Pôle emploi pour accélérer les démarches."
              enlargeLink
              imageAlt=""
              imageUrl="/src/assets/img/fill-convention-pe.png"
              linkProps={{
                href: `/api/${loginPeConnect}`,
              }}
              size="medium"
              title="Je remplis une convention avec mes identifiants Pôle emploi"
              titleAs="h2"
            />
          </div>
        )}
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
          <Card
            background
            border
            desc="Je ne reçois pas le lien de signature, je me suis trompé dans les informations, je souhaite modifier ou renouveler une convention."
            enlargeLink
            imageAlt=""
            imageUrl="/src/assets/img/fill-convention-help.png"
            linkProps={{
              href: "https://tally.so/r/mBdQQe",
            }}
            size="medium"
            title="J’ai déjà rempli une demande de convention mais j’ai un problème"
            titleAs="h2"
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
        className={fr.cx("fr-mt-5w")}
      >
        <a
          href="https://tally.so/r/w2X7xV"
          className={fr.cx(
            "fr-link",
            "fr-icon-arrow-right-line",
            "fr-link--icon-right",
          )}
        >
          Je ne sais pas si je peux remplir une convention en ligne dans mon cas
        </a>
      </div>
    </div>
  );
};
