import React, { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears } from "date-fns";
import { keys } from "ramda";
import { v4 as uuidV4 } from "uuid";
import {
  AgencyKind,
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerKind,
  apiConsumerKinds,
  ApiConsumerName,
  ApiConsumerRights,
  apiConsumerSchema,
  ConventionScope,
  conventionScopeKeys,
  FeatureFlagName,
  NoScope,
  toDateString,
  toDisplayedDate,
} from "shared";
import { Loader } from "react-design-system";
import { allAgencyListOfOptions } from "src/app/components/forms/agency/agencyKindToLabel";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { commonContent } from "src/app/contents/commonContent";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
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

type ApiConsumerRow = [
  ReactNode,
  ReactNode,
  string,
  string,
  ReactNode,
  ReactNode,
];

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

const makeApiConsumerActionButtons = (
  apiConsumer: ApiConsumer,
  onClick: (apiConsumer: ApiConsumer) => void,
) => (
  <Button size="small" type="button" onClick={() => onClick(apiConsumer)}>
    Éditer
  </Button>
);

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
        type="button"
        onClick={() => {
          setIsDisplayed(!isScopeDisplayed);
        }}
      >
        {isScopeDisplayed ? "Cacher les scopes" : "Voir les scopes"}
      </Button>
      {isScopeDisplayed && (
        <ul className={fr.cx("fr-text--xs")}>
          {apiConsumerScopeName
            .filter((scopeName) => !!scope[scopeName])
            .map((scopeName) => {
              const scopeValues = scope[scopeName];
              if (!scopeValues) return null;
              return (
                <li key={scopeName}>
                  {scopeName} :{" "}
                  {scopeValues.length > 0 && (
                    <ul>
                      {scopeValues.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  )}
                  {scopeValues.length === 0 && <span>vide</span>}
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
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

  const onEditButtonClick = (apiConsumer: ApiConsumer) => {
    setCurrentApiConsumerToEdit({
      ...apiConsumer,
      expirationDate: toDateString(new Date(apiConsumer.expirationDate)),
      createdAt: toDateString(new Date(apiConsumer.createdAt)),
    });
    apiConsumerModal.open();
  };

  const tableDataFromApiConsumers: ApiConsumerRow[] = apiConsumers.map(
    (apiConsumer) => [
      formatApiConsumerName(apiConsumer.id, apiConsumer.consumer),
      formatApiConsumerDescription(apiConsumer.description),
      toDisplayedDate(new Date(apiConsumer.expirationDate), true),
      formatApiConsumerContact(apiConsumer.contact),
      formatApiConsumerRights(apiConsumer.rights),
      makeApiConsumerActionButtons(apiConsumer, onEditButtonClick),
    ],
  );

  useEffect(() => {
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
  }, []);

  useEffect(() => {
    if (isApiConsumerModalOpened) return;
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
            {lastCreatedToken && (
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
            {!lastCreatedToken && (
              <ApiConsumerForm initialValues={currentApiConsumerToEdit} />
            )}
          </apiConsumerModal.Component>,
          document.body,
        )}
      </div>
    </>
  );
};

const ApiConsumerForm = ({ initialValues }: { initialValues: ApiConsumer }) => {
  const dispatch = useDispatch();
  const methods = useForm<ApiConsumer>({
    resolver: zodResolver(apiConsumerSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const adminToken = useAdminToken();

  const { getValues, register, setValue, handleSubmit, formState, reset } =
    methods;

  const values = getValues();

  const getFieldError = makeFieldError(formState);

  const onValidSubmit = (values: ApiConsumer) => {
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: values,
          adminToken,
        }),
      );
  };

  useEffect(() => {
    reset(initialValues);
  }, [initialValues]);

  return (
    <form onSubmit={handleSubmit(onValidSubmit)}>
      <input type="hidden" {...register("id")} />
      <Input
        label="Nom du consommateur"
        nativeInputProps={{
          ...register("consumer"),
        }}
        {...getFieldError("consumer")}
      />
      <Input
        label="Nom du contact"
        nativeInputProps={{ ...register("contact.lastName") }}
        {...getFieldError("contact.lastName")}
      />
      <Input
        label="Prénom du contact"
        nativeInputProps={{ ...register("contact.firstName") }}
        {...getFieldError("contact.firstName")}
      />
      <Input
        label="Poste du contact"
        nativeInputProps={{ ...register("contact.job") }}
        {...getFieldError("contact.job")}
      />
      <Input
        label="Téléphone du contact"
        nativeInputProps={{ ...register("contact.phone") }}
        {...getFieldError("contact.phone")}
      />
      <MultipleEmailsInput
        label="Emails du contact"
        valuesInList={values.contact.emails}
        summaryHintText="Voici les emails qui seront ajoutés en contact pour ce consommateur API :"
        setValues={(values) => {
          setValue("contact.emails", values, { shouldValidate: true });
        }}
        {...register("contact.emails")}
        initialValue={values.contact.emails.join(", ")}
      />
      <Input
        label="Description"
        textArea
        nativeTextAreaProps={{ ...register("description") }}
        {...getFieldError("description")}
      />
      <input type="hidden" {...register("createdAt")} />
      <Input
        label="Date d'expiration"
        nativeInputProps={{ ...register("expirationDate"), type: "date" }}
        {...getFieldError("expirationDate")}
      />
      <ul>
        {keys(initialValues.rights).map((rightName) => (
          <li key={rightName}>
            {rightName}
            <Checkbox
              orientation="horizontal"
              className={fr.cx("fr-mt-1w")}
              options={apiConsumerKinds.map((apiConsumerKind) => ({
                label: apiConsumerKind,
                nativeInputProps: {
                  name: register(`rights.${rightName}.kinds`).name,
                  checked:
                    values.rights[rightName].kinds.includes(apiConsumerKind),
                  onChange: () => {
                    const rightsToSet = values.rights[rightName].kinds.includes(
                      apiConsumerKind,
                    )
                      ? values.rights[rightName].kinds.filter(
                          (kind) => kind !== apiConsumerKind,
                        )
                      : [...values.rights[rightName].kinds, apiConsumerKind];
                    setValue(`rights.${rightName}.kinds`, rightsToSet, {
                      shouldValidate: true,
                    });
                  },
                },
              }))}
            />
            {rightName === "convention" && (
              <>
                <RadioButtons
                  legend="Scopes de la convention"
                  options={conventionScopeKeys.map((scopeKey) => ({
                    label: scopeKey,
                    nativeInputProps: {
                      name: register(`rights.convention.scope`).name,
                      checked: keys(values.rights.convention.scope).includes(
                        scopeKey,
                      ),
                      onChange: () => {
                        setValue(
                          "rights.convention.scope",
                          scopeKey === "agencyIds"
                            ? { [scopeKey]: [] }
                            : { [scopeKey]: [] },
                          { shouldValidate: true },
                        );
                      },
                    },
                  }))}
                />
                {keys(values.rights.convention.scope).includes(
                  "agencyKinds",
                ) && (
                  <Select
                    label="Types d'agence autorisés"
                    nativeSelectProps={{
                      onChange: (event) => {
                        const selectedOptions = (
                          event.target as unknown as HTMLSelectElement
                        ).selectedOptions;
                        const selectedValues = Array.from(selectedOptions).map(
                          (option) => (option as HTMLOptionElement).value,
                        );
                        setValue(
                          "rights.convention.scope.agencyKinds",
                          selectedValues as AgencyKind[],
                        );
                      },
                      multiple: true,
                    }}
                    options={allAgencyListOfOptions}
                  />
                )}
                {keys(values.rights.convention.scope).includes("agencyIds") && (
                  <Input
                    textArea
                    label="Id des agences autorisées"
                    nativeTextAreaProps={{
                      name: register("rights.convention.scope.agencyIds").name,
                      placeholder:
                        "Veuillez entrer une liste d'id d'agences, séparés par des virgules",
                      onChange: (event) => {
                        setValue(
                          "rights.convention.scope.agencyIds",
                          event.target.value
                            .split(",")
                            .map((agencyId) => agencyId.trim()),
                        );
                      },
                    }}
                    {...getFieldError("rights.convention.scope.agencyIds")}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <Button>Envoyer</Button>
    </form>
  );
};
