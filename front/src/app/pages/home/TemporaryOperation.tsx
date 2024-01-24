import React from "react";
import { FeatureFlagTextImageAndRedirect } from "shared";
import { FixedStamp } from "react-design-system";

type Props = {
  temporaryOperationFeatureFlag: FeatureFlagTextImageAndRedirect;
};
export const TemporaryOperation = ({
  temporaryOperationFeatureFlag,
}: Props) => (
  <FixedStamp
    image={
      <img
        src={
          temporaryOperationFeatureFlag.value.imageUrl
          // "https://immersion.cellar-c2.services.clever-cloud.com/logo_semaine_du_numerique.svg"
        }
        alt={temporaryOperationFeatureFlag.value.imageAlt}
        //"Illustration d'une développeuse informatique"
      />
    }
    subtitle={
      temporaryOperationFeatureFlag.value.message
      // <>
      //   Découvrez <strong>les métiers du numérique</strong> en réalisant une
      //   immersion en entreprise&nbsp;!
      // </>
    }
    link={{
      href: temporaryOperationFeatureFlag.value.redirectUrl,
      // "https://inclusion.beta.gouv.fr/nos-services/immersion-facilitee/22-26-janvier-2024-semaine-des-metiers-du-numerique/",
    }}
  />
);
