import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { keys } from "ramda";
import {
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerKind,
  ApiConsumerName,
  ApiConsumerRights,
  ConventionScope,
  FeatureFlagName,
  NoScope,
  toDisplayedDate,
} from "shared";
import { Loader } from "react-design-system";
import { commonContent } from "src/app/contents/commonContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
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

type ApiConsumerRow = [ReactNode, ReactNode, string, string, ReactNode];

const formatApiConsumerContact = (apiConsumerContact: ApiConsumerContact) => `${
  apiConsumerContact.lastName
} ${apiConsumerContact.firstName}
  ${apiConsumerContact.job}
  ${apiConsumerContact.phone}
  ${apiConsumerContact.emails.join(", ")}`;

const apiConsumerKindSeverity: Record<ApiConsumerKind, AlertProps.Severity> = {
  READ: "success",
  WRITE: "warning",
};

const formatApiConsumerRights = (apiConsumerRights: ApiConsumerRights) => {
  const apiConsumerNames = keys(apiConsumerRights);
  return (
    <ul>
      {apiConsumerNames.map((name, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>
          <strong>{name}</strong>
          <ul className={fr.cx("fr-badge-group")}>
            {apiConsumerRights[name].kinds.map((kind) => (
              <li key={kind}>
                <Badge severity={apiConsumerKindSeverity[kind]}>{kind}</Badge>
              </li>
            ))}
          </ul>
          {formatApiConsumerScope(apiConsumerRights[name].scope)}
        </li>
      ))}
    </ul>
  );
};

const formatApiConsumerDescription = (description: string | undefined) => {
  if (!description) return "";
  return (
    <span title={description}>
      {description.length <= 15
        ? description
        : `${description.slice(0, 15)}...`}
    </span>
  );
};

const formatApiConsumerName = (id: ApiConsumerId, name: ApiConsumerName) => (
  <>
    <strong>{id}</strong>
    <br />({name})
  </>
);

const formatApiConsumerScope = (scope: NoScope | ConventionScope) => {
  if (scope === "no-scope") return "";
  return <ApiConsumerConventionScopeDisplayed scope={scope} />;
};

const ApiConsumerConventionScopeDisplayed = ({
  scope,
}: {
  scope: ConventionScope;
}) => {
  const apiConsumerScopeName = keys(scope);
  const [isScopeDisplayed, setIsDisplayed] = useState(false);
  return (
    <>
      <Button
        className={fr.cx("fr-my-1w")}
        size="small"
        priority="secondary"
        onClick={() => {
          setIsDisplayed(!isScopeDisplayed);
        }}
      >
        {isScopeDisplayed ? "Cacher les scopes" : "Voir les scopes"}
      </Button>
      {isScopeDisplayed && (
        <ul className={fr.cx("fr-text--xs")}>
          {apiConsumerScopeName.map((scopeName) => (
            <li key={scopeName}>
              {scopeName}:
              <ul>
                {scope[scopeName].map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export const TechnicalOptionsTab = () => {
  const { isLoading: isFeatureFlagsLoading, ...featureFlags } =
    useFeatureFlags();
  const dispatch = useDispatch();
  const maintenanceMessageRef = useRef<HTMLDivElement>(null);
  const maintenanceMessage = useAppSelector(
    featureFlagSelectors.maintenanceMessage,
  );
  const apiConsumers = useAppSelector(apiConsumerSelectors.apiConsumers);
  const isApiConsumersLoading = useAppSelector(apiConsumerSelectors.isLoading);

  const tableDataFromApiConsumers: ApiConsumerRow[] = apiConsumers.map(
    (apiConsumer) => [
      formatApiConsumerName(apiConsumer.id, apiConsumer.consumer),
      formatApiConsumerDescription(apiConsumer.description),
      toDisplayedDate(new Date(apiConsumer.expirationDate), true),
      formatApiConsumerContact(apiConsumer.contact),
      formatApiConsumerRights(apiConsumer.rights),
    ],
  );

  useEffect(() => {
    dispatch(apiConsumerSlice.actions.retrieveApiConsumersRequested());
  }, []);

  return (
    <>
      {(isFeatureFlagsLoading || isApiConsumersLoading) && <Loader />}
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
        <h4>Consommateurs API :</h4>
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col")}>
            <Table
              fixed
              caption="Résumé du tableau (accessibilité)"
              data={tableDataFromApiConsumers}
              headers={[
                "Id (Nom)",
                "Description",
                "Date d'expiration",
                "Contact",
                "Droits",
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
};
