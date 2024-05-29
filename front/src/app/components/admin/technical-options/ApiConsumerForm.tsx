import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyKind,
  ApiConsumer,
  ConventionScope,
  apiConsumerKinds,
  apiConsumerSchema,
  conventionScopeKeys,
  domElementIds,
} from "shared";
import { allAgencyListOfOptions } from "src/app/components/forms/agency/agencyKindToLabel";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";

export const ApiConsumerForm = ({
  initialValues,
}: {
  initialValues: ApiConsumer;
}) => {
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
          feedbackTopic: "api-consumer-global",
        }),
      );
  };

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onValidSubmit)}>
      <input type="hidden" {...register("id")} />
      <Input
        label="Nom du consommateur"
        nativeInputProps={{
          ...register("name"),
          id: domElementIds.admin.technicalOptionsTab.apiConsumerNameInput,
        }}
        {...getFieldError("name")}
      />
      <Input
        label="Nom du contact"
        nativeInputProps={{
          ...register("contact.lastName"),
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerContactLastNameInput,
        }}
        {...getFieldError("contact.lastName")}
      />
      <Input
        label="Prénom du contact"
        nativeInputProps={{
          ...register("contact.firstName"),
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerContactFirstNameInput,
        }}
        {...getFieldError("contact.firstName")}
      />
      <Input
        label="Poste du contact"
        nativeInputProps={{
          ...register("contact.job"),
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerContactJobInput,
        }}
        {...getFieldError("contact.job")}
      />
      <Input
        label="Téléphone du contact"
        nativeInputProps={{
          ...register("contact.phone"),
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerContactPhoneInput,
        }}
        {...getFieldError("contact.phone")}
      />
      <MultipleEmailsInput
        id={
          domElementIds.admin.technicalOptionsTab.apiConsumerContactEmailsInput
        }
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
        nativeTextAreaProps={{
          ...register("description"),
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerDescriptionInput,
        }}
        {...getFieldError("description")}
      />
      <input type="hidden" {...register("createdAt")} />
      <Input
        label="Date d'expiration"
        nativeInputProps={{
          ...register("expirationDate"),
          type: "date",
          id: domElementIds.admin.technicalOptionsTab
            .apiConsumerExpirationDateInput,
        }}
        {...getFieldError("expirationDate")}
      />
      <ul>
        {keys(initialValues.rights).map((rightName) => (
          <li key={rightName}>
            {rightName}
            <Checkbox
              orientation="horizontal"
              id={domElementIds.admin.technicalOptionsTab.apiConsumerRightInput(
                {
                  rightName,
                },
              )}
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
                  id={
                    domElementIds.admin.technicalOptionsTab
                      .apiConsumerConventionScopeInput
                  }
                  options={conventionScopeKeys.map((scopeKey) => ({
                    label: scopeKey,
                    nativeInputProps: {
                      name: register("rights.convention.scope").name,
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
                {isScopeKeyInConventionScope(
                  values.rights.convention.scope,
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
                      defaultValue: values.rights.convention.scope.agencyKinds,
                      multiple: true,
                      id: domElementIds.admin.technicalOptionsTab
                        .apiConsumerConventionScopeAgencyKindsInput,
                    }}
                    options={allAgencyListOfOptions}
                  />
                )}
                {isScopeKeyInConventionScope(
                  values.rights.convention.scope,
                  "agencyIds",
                ) && (
                  <Input
                    textArea
                    label="Id des agences autorisées"
                    nativeTextAreaProps={{
                      name: register("rights.convention.scope.agencyIds").name,
                      placeholder:
                        "Veuillez entrer une liste d'id d'agences, séparés par des virgules",
                      defaultValue:
                        values.rights.convention.scope.agencyIds?.join(", "),
                      onChange: (event) => {
                        setValue(
                          "rights.convention.scope.agencyIds",
                          event.target.value
                            .split(",")
                            .map((agencyId) => agencyId.trim()),
                        );
                      },
                      id: domElementIds.admin.technicalOptionsTab
                        .apiConsumerConventionScopeAgencyIdsInput,
                    }}
                    {...getFieldError("rights.convention.scope.agencyIds")}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <Button
        id={domElementIds.admin.technicalOptionsTab.apiConsumerSubmitButton}
      >
        Envoyer
      </Button>
    </form>
  );
};

const isScopeKeyInConventionScope = (
  conventionScope: ConventionScope,
  scopeKey: keyof ConventionScope,
) => keys(conventionScope).includes(scopeKey);
