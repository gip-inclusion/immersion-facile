import React from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { keys } from "ramda";
import { FeatureFlag } from "shared";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";

const labelsByFeatureFlag: Record<FeatureFlag, string> = {
  enableInseeApi: "API insee (siret)",
  enableLogoUpload: "Upload de logos (pour agences)",
  enablePeConnectApi: "PE Connect",
  enablePeConventionBroadcast: "Diffusion des Conventions à Pole Emploi",
  enableTemporaryOperation: "Activer l'offre temporaire",
  enableMaxContactPerWeek:
    "Activer le nombre de mise en contact maximum par semaine sur le formulaire entreprise",
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
                {keys(labelsByFeatureFlag).map((featureFlagName) => (
                  <ToggleSwitch
                    key={featureFlagName}
                    label={labelsByFeatureFlag[featureFlagName]}
                    checked={featureFlags[featureFlagName]}
                    showCheckedHint={false}
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
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
};
