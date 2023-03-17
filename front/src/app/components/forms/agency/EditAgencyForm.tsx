import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { ErrorNotifications } from "react-design-system";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  AgencyStatus,
  allAgencyStatuses,
  editAgencySchema,
  toDotNotation,
  zEmail,
} from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
} from "src/app/components/forms/agency/AgencyFormCommonFields";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import {
  formErrorsToFlatErrors,
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { domElementIds } from "shared";

type EditAgencyFormProperties = {
  agency: AgencyDto;
};

const agencyStatusToLabel: Record<AgencyStatus, string> = {
  active: "Active",
  closed: "Fermée",
  rejected: "Rejetée",
  needsReview: "En attende d'activation",
  "from-api-PE": "Import Api",
};

const statusListOfOptions = allAgencyStatuses.map((agencyStatus) => ({
  value: agencyStatus,
  label: agencyStatusToLabel[agencyStatus],
}));

export const EditAgencyForm = ({
  agency,
}: EditAgencyFormProperties): JSX.Element => {
  const dispatch = useDispatch();
  const agencyState = useAppSelector(agencyAdminSelectors.agencyState);
  const { getFormErrors } = useFormContents(formAgencyFieldsLabels);
  const methods = useForm<AgencyDto>({
    resolver: zodResolver(editAgencySchema),
    mode: "onTouched",
    defaultValues: agency,
  });
  const {
    register,
    setValue,
    handleSubmit,
    formState,
    watch,
    formState: { errors, submitCount },
  } = methods;

  const getFieldError = makeFieldError(formState);
  return (
    <FormProvider {...methods}>
      <form
        className={fr.cx("fr-my-4w")}
        onSubmit={handleSubmit((values) =>
          dispatch(agencyAdminSlice.actions.updateAgencyRequested(values)),
        )}
      >
        <div className={fr.cx("fr-mb-4w")}>
          <AgencyFormCommonFields addressInitialValue={agency.address} />
          <MultipleEmailsInput
            name="agency-admin-emails"
            label="⚠️Emails administrateur de l'agence ⚠️"
            description="Ces emails auront le droit d'accéder aux tableaux de bord et d'éditer les informations et accès du personnel de l'agence"
            placeholder="admin.agence@mail.com"
            valuesInList={watch("adminEmails")}
            setValues={(values) => setValue("adminEmails", values)}
            validationSchema={zEmail}
          />

          <Select
            label="⚠️Statut de l'agence ⚠️"
            options={statusListOfOptions}
            placeholder="Sélectionner un statut"
            nativeSelectProps={{
              id: domElementIds.admin.agencyTab.editAgencyFormStatusSelector,
              name: register("status").name,
              onChange: register("status").onChange,
            }}
          />

          <Input
            label="⚠️Code Safir de l'agence ⚠️"
            nativeInputProps={{
              ...register("codeSafir"),
              placeholder: "Code Safir ",
              id: domElementIds.admin.agencyTab.editAgencyFormSafirCodeInput,
            }}
            {...getFieldError("codeSafir")}
          />

          <AgencyLogoUpload />
        </div>
        <ErrorNotifications
          labels={getFormErrors()}
          errors={toDotNotation(formErrorsToFlatErrors(errors))}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />

        <div className={fr.cx("fr-mt-4w")}>
          <Button
            type="submit"
            disabled={agencyState.isUpdating}
            nativeButtonProps={{
              id: domElementIds.admin.agencyTab.editAgencyFormEditSubmitButton,
            }}
          >
            Mettre à jour
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
