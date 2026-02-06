import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";

import { ErrorNotifications } from "react-design-system";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type AgencyDto,
  type AgencyStatus,
  agencyKindToLabel,
  agencyStatusToLabel,
  allAgencyStatuses,
  type CreateAgencyDto,
  closedOrRejectedAgencyStatuses,
  delegationAgencyKindList,
  domElementIds,
  editAgencySchema,
} from "shared";
import { AgencyFormCommonFields } from "src/app/components/forms/agency/AgencyFormCommonFields";
import type { AgencyOverviewRouteName } from "src/app/components/forms/agency/AgencyOverview";
import { UploadFile } from "src/app/components/UploadFile";
import {
  type FormAgencyFieldsLabels,
  formAgencyFieldsLabels,
} from "src/app/contents/forms/agency/formAgency";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import "src/assets/admin.css";
import { updateAgencySelectors } from "src/core-logic/domain/agencies/update-agency/updateAgency.selectors";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";

type EditAgencyFormProperties = {
  agency: AgencyDto;
  routeName: AgencyOverviewRouteName;
};

const kindOptions = Object.entries(agencyKindToLabel).map(([value, label]) => ({
  label,
  value: value,
}));

const statusListOfOptions = allAgencyStatuses.map((agencyStatus) => ({
  value: agencyStatus,
  label: agencyStatusToLabel[agencyStatus],
}));

const delegationAgencyKindOptions = delegationAgencyKindList.map((kind) => ({
  value: kind,
  label: agencyKindToLabel[kind],
}));

export const EditAgencyForm = ({
  agency,
  routeName,
}: EditAgencyFormProperties): JSX.Element => {
  const dispatch = useDispatch();
  const isLoading = useAppSelector(updateAgencySelectors.isLoading);
  const { getFormErrors } = getFormContents(formAgencyFieldsLabels);
  const methods = useForm<AgencyDto>({
    resolver: zodResolver(editAgencySchema),
    mode: "onTouched",
    defaultValues: {
      ...agency,
      delegationAgencyInfo: agency.delegationAgencyInfo ?? {
        delegationEndDate: null,
        delegationAgencyName: null,
        delegationAgencyKind: null,
      },
    },
  });
  const { register, handleSubmit, formState, getValues, setValue, control } =
    methods;

  const getFieldError = makeFieldError(formState);

  const adminAgencyIds = domElementIds.admin.agencyTab;

  const agencyDashboardAgencyIds = domElementIds.agencyDashboard.agencyDetails;

  const isRouteAdmin =
    routeName === "adminAgencies" || routeName === "adminAgencyDetail";

  const refersToOtherAgency = !!agency.refersToAgencyId;

  const formValues = getValues();

  const [status, kind] = useWatch({
    control,
    name: ["status", "kind"],
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit((values) => {
          dispatch(
            updateAgencySlice.actions.updateAgencyRequested({
              ...values,
              feedbackTopic: isRouteAdmin
                ? "agency-admin"
                : "agency-for-dashboard",
            }),
          );
        })}
        id={
          isRouteAdmin
            ? adminAgencyIds.editAgencyForm
            : agencyDashboardAgencyIds.editAgencyForm
        }
      >
        <div className={fr.cx("fr-mb-4w")}>
          <AgencyFormCommonFields
            addressInitialValue={agency.address}
            refersToOtherAgency={refersToOtherAgency}
            mode="edit"
            disableAgencyKeyFields={!isRouteAdmin}
          />

          {isRouteAdmin && (
            <>
              <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>Section admin IF</h2>

              <Select
                label={"!Type de structure!"}
                options={kindOptions}
                nativeSelectProps={{
                  ...register("kind"),
                  id: adminAgencyIds.editAgencyFormKindSelector,
                }}
              />

              <Select
                label="!Statut de l'agence !"
                options={statusListOfOptions}
                placeholder="Sélectionner un statut"
                nativeSelectProps={{
                  id: adminAgencyIds.editAgencyFormStatusSelector,
                  value: status,
                  onChange: (event) => {
                    const agencyStatus = event.currentTarget
                      .value as AgencyStatus;
                    if (
                      !closedOrRejectedAgencyStatuses.includes(agencyStatus)
                    ) {
                      setValue("statusJustification", null);
                    }
                    setValue("status", agencyStatus);
                  },
                }}
                {...getFieldError("status")}
              />
              {closedOrRejectedAgencyStatuses.includes(formValues.status) && (
                <Input
                  textArea
                  label="!Justification du statut !"
                  nativeTextAreaProps={{
                    ...register("statusJustification"),
                    id: adminAgencyIds.editAgencyFormStatusJustificationInput,
                  }}
                  {...getFieldError("statusJustification")}
                />
              )}

              <Input
                label="!Code Safir de l'agence !"
                nativeInputProps={{
                  ...register("codeSafir"),
                  placeholder: "Code Safir ",
                  id: adminAgencyIds.editAgencyFormSafirCodeInput,
                }}
                {...getFieldError("codeSafir")}
              />
            </>
          )}

          {kind === "autre" && !refersToOtherAgency && (
            <>
              <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
                Convention de délégation
              </h2>

              <Input
                label="Date d'expiration de la convention de délégation"
                disabled={!isRouteAdmin}
                nativeInputProps={{
                  type: "date",
                  ...register("delegationAgencyInfo.delegationEndDate"),
                }}
                {...getFieldError("delegationAgencyInfo.delegationEndDate")}
              />

              <Input
                label="Nom de l'organisme délégataire"
                disabled={!isRouteAdmin}
                nativeInputProps={{
                  ...register("delegationAgencyInfo.delegationAgencyName"),
                  placeholder: "Nom de l'organisme délégataire",
                }}
                {...getFieldError("delegationAgencyInfo.delegationAgencyName")}
              />

              <Select
                label="Type de l'organisme délégataire"
                options={delegationAgencyKindOptions}
                placeholder="Sélectionner un type"
                nativeSelectProps={{
                  ...register("delegationAgencyInfo.delegationAgencyKind"),
                  disabled: !isRouteAdmin,
                }}
                {...getFieldError("delegationAgencyInfo.delegationAgencyKind")}
              />
            </>
          )}

          <AgencyLogoUpload />
        </div>
        <ErrorNotifications
          errorsWithLabels={toErrorsWithLabels({
            labels: getFormErrors(),
            errors: displayReadableError(formState.errors),
          })}
          visible={
            formState.submitCount !== 0 &&
            Object.values(formState.errors).length > 0
          }
        />

        <div className={fr.cx("fr-mt-4w")}>
          <Button
            type="submit"
            disabled={isLoading}
            nativeButtonProps={{
              id: isRouteAdmin
                ? adminAgencyIds.editAgencyFormEditSubmitButton
                : agencyDashboardAgencyIds.editAgencyFormEditSubmitButton,
            }}
          >
            Mettre à jour
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

const AgencyLogoUpload = () => {
  const { getValues, setValue } = useFormContext<CreateAgencyDto>();
  const { getFormFields } = getFormContents(formAgencyFieldsLabels);
  const fieldsContent: FormAgencyFieldsLabels = getFormFields();
  const formValues = getValues();

  return (
    <UploadFile
      setUploadedFileUrl={(value) => setValue("logoUrl", value)}
      {...(formValues.logoUrl ? { initialFileUrl: formValues.logoUrl } : {})}
      maxSize_Mo={2}
      {...formAgencyFieldsLabels.logoUrl}
      hint={fieldsContent.logoUrl.hintText}
      id={domElementIds.addAgency.uploadLogoInput}
      shouldDisplayFeedback={false}
    />
  );
};
