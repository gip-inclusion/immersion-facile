import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays, addDays } from "date-fns";
import { ErrorNotifications } from "react-design-system";
import { FormProvider, useForm } from "react-hook-form";
import {
  type ConventionDto,
  type DateIntervalDto,
  domElementIds,
  type RenewConventionParams,
  reasonableSchedule,
  renewConventionParamsSchema,
} from "shared";
import { ScheduleSection } from "src/app/components/forms/convention/sections/schedule/ScheduleSection";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { v4 as uuidV4 } from "uuid";

type RenewConventionParamsInForm = RenewConventionParams;

export const RenewConventionModalContent = ({
  onSubmit,
  convention,
}: {
  onSubmit: (params: RenewConventionParams) => void;
  closeModal: () => void;
  convention: ConventionDto;
}) => {
  const renewedDefaultDateStart = addBusinessDays(
    new Date(convention.dateEnd),
    1,
  );
  const defaultDateInterval: DateIntervalDto = {
    start: renewedDefaultDateStart,
    end: addDays(new Date(convention.dateEnd), convention.schedule.workedDays),
  };
  const defaultValues = {
    id: uuidV4(),
    dateStart: defaultDateInterval.start.toISOString(),
    dateEnd: defaultDateInterval.end.toISOString(),
    schedule: reasonableSchedule(defaultDateInterval),
    internshipKind: convention.internshipKind,
    renewed: {
      from: convention.id,
      justification: "",
    },
    signatories: convention.signatories,
  };

  const methods = useForm<RenewConventionParamsInForm>({
    defaultValues,
    resolver: zodResolver(renewConventionParamsSchema),
    mode: "onTouched",
  });
  const { errors, submitCount } = methods.formState;
  const getFieldError = makeFieldError(methods.formState);

  const { getFormErrors } = getFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id={domElementIds.manageConvention.renewModalForm}
      >
        <Input
          label="Identifiant de la convention renouvelée"
          hintText={
            "Il n'est pas modifiable, mais vous pouvez le copier pour le garder de côté"
          }
          nativeInputProps={{
            ...methods.register("id"),
            readOnly: true,
            defaultValue: defaultValues.id,
          }}
        />
        <ScheduleSection internshipKind={convention.internshipKind} />
        <Input
          label="Motif de renouvellement *"
          textArea
          nativeTextAreaProps={methods.register("renewed.justification")}
          {...getFieldError("renewed.justification")}
        />
        <ErrorNotifications
          errorsWithLabels={toErrorsWithLabels({
            labels: getFormErrors(),
            errors: displayReadableError(errors),
          })}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />
      </form>
    </FormProvider>
  );
};
