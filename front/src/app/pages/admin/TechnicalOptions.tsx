import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { keys } from "ramda";
import { FeatureFlagName } from "shared";
import { commonContent } from "src/app/contents/commonContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";

const labelsByFeatureFlag: Record<FeatureFlagName, string> = {
  enableInseeApi: "API insee (siret)",
  enableLogoUpload: "Upload de logos (pour agences)",
  enablePeConnectApi: "PE Connect",
  enablePeConventionBroadcast: "Diffusion des Conventions à Pole Emploi",
  enableTemporaryOperation: "Activer l'offre temporaire",
  enableMaxContactPerWeek:
    "Activer le nombre de mise en contact maximum par semaine sur le formulaire entreprise",
  enableMaintenance: "Activer le mode maintenance",
};

export const TechnicalOptions = () => {
  const { isLoading, ...featureFlags } = useFeatureFlags();
  const dispatch = useDispatch();
  const maintenanceMessageRef = useRef<HTMLDivElement>(null);
  const maintenanceMessage = useAppSelector(
    featureFlagSelectors.maintenanceMessage,
  );
  return (
    <div className={fr.cx("fr-container")}>
      <h4>Les fonctionnalités optionnelles :</h4>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col")}>
          <div className={fr.cx("fr-input-group")}>
            <fieldset className={fr.cx("fr-fieldset")}>
              <div className={fr.cx("fr-fieldset__content")}>
                {keys(labelsByFeatureFlag).map((featureFlagName) => (
                  <div key={featureFlagName}>
                    <ToggleSwitch
                      label={labelsByFeatureFlag[featureFlagName]}
                      checked={featureFlags[featureFlagName].isActive}
                      showCheckedHint={false}
                      onChange={() => {
                        const isConfirmed = window.confirm(
                          "Vous aller changer ce réglage pour tous les utilisateurs, voulez-vous confirmer ?",
                        );

                        if (isConfirmed)
                          dispatch(
                            featureFlagsSlice.actions.setFeatureFlagRequested({
                              flagName: featureFlagName,
                              flagContent: {
                                ...featureFlags[featureFlagName],
                                isActive:
                                  !featureFlags[featureFlagName].isActive,
                              },
                            }),
                          );
                      }}
                    />
                    {featureFlagName === "enableMaintenance" && (
                      <div className={fr.cx("fr-ml-9w")}>
                        <Input
                          ref={maintenanceMessageRef}
                          textArea
                          label="Message de maintenance"
                          hintText="Si aucun message n'est fourni, nous affichons le message de maintenance par défaut."
                          nativeTextAreaProps={{
                            placeholder: commonContent.maintenanceMessage,
                            defaultValue: maintenanceMessage,
                          }}
                        />
                        <Button
                          type="button"
                          size="small"
                          onClick={() => {
                            const message =
                              maintenanceMessageRef.current?.querySelector(
                                "textarea",
                              )?.value || "";
                            dispatch(
                              featureFlagsSlice.actions.setFeatureFlagRequested(
                                {
                                  flagName: featureFlagName,
                                  flagContent: {
                                    isActive:
                                      featureFlags[featureFlagName].isActive,
                                    value: {
                                      message,
                                    },
                                  },
                                },
                              ),
                            );
                          }}
                        >
                          Mettre à jour le message de maintenance
                        </Button>
                      </div>
                    )}
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
