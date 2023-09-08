import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { addYears } from "date-fns";
import { keys } from "ramda";
import { v4 as uuidV4 } from "uuid";
import {
  ApiConsumer,
  FeatureFlagName,
  toDateString,
  toDisplayedDate,
} from "shared";
import { Loader } from "react-design-system";
import { ApiConsumerForm } from "src/app/components/admin/technical-options/ApiConsumerForm";
import {
  formatApiConsumerContact,
  formatApiConsumerDescription,
  formatApiConsumerName,
  formatApiConsumerRights,
  makeApiConsumerActionButtons,
} from "src/app/contents/admin/apiConsumer";
import { commonContent } from "src/app/contents/commonContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useAdminToken } from "src/app/hooks/useAdminToken";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
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

const apiConsumerModal = createModal({
  id: "api-consumer-modal",
  isOpenedByDefault: false,
});

const defaultApiConsumerValues: ApiConsumer = {
  id: uuidV4(),
  consumer: "",
  contact: {
    lastName: "",
    firstName: "",
    job: "",
    phone: "",
    emails: [],
  },
  rights: {
    searchEstablishment: {
      kinds: [],
      scope: "no-scope",
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
      },
    },
  },
  createdAt: toDateString(new Date()),
  expirationDate: toDateString(addYears(new Date(), 1)),
};

export const TechnicalOptionsTab = () => {
  const { isLoading: isFeatureFlagsLoading, ...featureFlags } =
    useFeatureFlags();
  const adminToken = useAdminToken();
  const dispatch = useDispatch();
  const lastCreatedToken = useAppSelector(
    apiConsumerSelectors.lastCreatedToken,
  );
  const maintenanceMessageRef = useRef<HTMLDivElement>(null);
  const maintenanceMessage = useAppSelector(
    featureFlagSelectors.maintenanceMessage,
  );
  const [currentApiConsumerToEdit, setCurrentApiConsumerToEdit] =
    useState<ApiConsumer>(defaultApiConsumerValues);
  const apiConsumers = useAppSelector(apiConsumerSelectors.apiConsumers);
  const isApiConsumersLoading = useAppSelector(apiConsumerSelectors.isLoading);
  const isApiConsumerModalOpened = useIsModalOpen(apiConsumerModal);
  const saveConsumerFeedback = useAppSelector(apiConsumerSelectors.feedback);

  const onEditButtonClick = (apiConsumer: ApiConsumer) => {
    setCurrentApiConsumerToEdit({
      ...apiConsumer,
      expirationDate: toDateString(new Date(apiConsumer.expirationDate)),
      createdAt: toDateString(new Date(apiConsumer.createdAt)),
    });
    apiConsumerModal.open();
  };

  const sortedApiConsumers = [...apiConsumers].sort(
    (apiConsumer1, apiConsumer2) =>
      new Date(apiConsumer2.createdAt).getTime() -
      new Date(apiConsumer1.createdAt).getTime(),
  );

  const tableDataFromApiConsumers = sortedApiConsumers.map((apiConsumer) => [
    formatApiConsumerName(apiConsumer.id, apiConsumer.consumer),
    formatApiConsumerDescription(apiConsumer.description),
    toDisplayedDate(new Date(apiConsumer.expirationDate), true),
    formatApiConsumerContact(apiConsumer.contact),
    formatApiConsumerRights(apiConsumer.rights),
    makeApiConsumerActionButtons(apiConsumer, onEditButtonClick),
  ]);

  useEffect(() => {
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
  }, []);

  useEffect(() => {
    if (isApiConsumerModalOpened) return;
    dispatch(apiConsumerSlice.actions.clearFeedbackTriggered());
    dispatch(apiConsumerSlice.actions.clearLastCreatedToken());
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
  }, [isApiConsumerModalOpened]);

  const onConfirmTokenModalClose = () => {
    dispatch(apiConsumerSlice.actions.clearLastCreatedToken());
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
    apiConsumerModal.close();
  };

  const onApiConsumerAddClick = () => {
    setCurrentApiConsumerToEdit(defaultApiConsumerValues);
    apiConsumerModal.open();
  };

  return (
    <>
      {(isFeatureFlagsLoading || isApiConsumersLoading) && <Loader />}
      <div className={fr.cx("fr-container")}>
        <h4>Les fonctionnalités optionnelles</h4>
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
                              featureFlagsSlice.actions.setFeatureFlagRequested(
                                {
                                  flagName: featureFlagName,
                                  flagContent: {
                                    ...featureFlags[featureFlagName],
                                    isActive:
                                      !featureFlags[featureFlagName].isActive,
                                  },
                                },
                              ),
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
      <div className={fr.cx("fr-container", "fr-mt-6w")}>
        <h4>Consommateurs API</h4>
        <Button type="button" onClick={onApiConsumerAddClick}>
          Ajouter un nouveau consommateur
        </Button>
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col")}>
            <Table
              fixed
              data={tableDataFromApiConsumers}
              headers={[
                "Id (Nom)",
                "Description",
                "Date d'expiration",
                "Contact",
                "Droits",
                "Actions",
              ]}
            />
          </div>
        </div>
        {createPortal(
          <apiConsumerModal.Component title="Ajout consommateur api">
            {lastCreatedToken &&
              saveConsumerFeedback.kind === "createSuccess" && (
                <>
                  <Alert
                    severity="success"
                    title="Consommateur Api ajouté !"
                    className={"fr-mb-2w"}
                  />
                  <Input
                    textArea
                    label="Token généré"
                    hintText="Ce token est à conserver précieusement, il ne sera plus affiché par la suite."
                    nativeTextAreaProps={{
                      readOnly: true,
                      value: lastCreatedToken,
                      rows: 5,
                    }}
                  />
                  <Button type="button" onClick={onConfirmTokenModalClose}>
                    J'ai bien copié le token, je peux fermer la fenêtre
                  </Button>
                </>
              )}
            {!lastCreatedToken &&
              saveConsumerFeedback.kind === "updateSuccess" && (
                <>
                  <Alert
                    severity="success"
                    title="Consommateur Api mis à jour !"
                    className={"fr-mb-2w"}
                  />
                  <Button type="button" onClick={onConfirmTokenModalClose}>
                    Fermer la fenêtre
                  </Button>
                </>
              )}
            {saveConsumerFeedback.kind !== "createSuccess" &&
              saveConsumerFeedback.kind !== "updateSuccess" && (
                <ApiConsumerForm initialValues={currentApiConsumerToEdit} />
              )}
          </apiConsumerModal.Component>,
          document.body,
        )}
      </div>
    </>
  );
};
