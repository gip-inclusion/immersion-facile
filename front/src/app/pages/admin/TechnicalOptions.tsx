import { keys } from "ramda";
import React from "react";
import { Switch } from "react-design-system";
import { useDispatch } from "react-redux";
import { FeatureFlag } from "shared";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { fr } from "@codegouvfr/react-dsfr";

const labelsByFeatureFlag: Record<FeatureFlag, string> = {
  enableAdminUi: "Ui Admin",
  enableInseeApi: "API insee (siret)",
  enableLogoUpload: "Upload de logos (pour agences)",
  enablePeConnectApi: "PE Connect",
  enablePeConventionBroadcast: "Diffusion des Conventions à Pole Emploi",
  enableTemporaryOperation: "Activer l'offre temporaire",
};

export const TechnicalOptions = () => {
  const { isLoading, ...featureFlags } = useFeatureFlags();
  const dispatch = useDispatch();

  return (
    <div className={fr.cx("fr-container")}>
      <h4>Les fonctionnalités optionnelles :</h4>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-6")}>
          <div className={fr.cx("fr-input-group")}>
            <fieldset className={fr.cx("fr-fieldset")}>
              <div className={fr.cx("fr-fieldset__content")}>
                {keys(featureFlags).map((featureFlagName) => (
                  <div
                    className={fr.cx("fr-radio-group", "fr-radio-rich")}
                    key={featureFlagName}
                  >
                    <Switch
                      label={labelsByFeatureFlag[featureFlagName]}
                      checked={featureFlags[featureFlagName]}
                      onChange={() => {
                        const isConfirmed = window.confirm(
                          "Vous aller changer ce réglage pour tous les utilisateurs, voulez-vous confirmer ?",
                        );

                        if (isConfirmed)
                          dispatch(
                            featureFlagsSlice.actions.setFeatureFlagRequested(
                              featureFlagName,
                            ),
                          );
                      }}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
};
