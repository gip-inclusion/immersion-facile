import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  convertLocaleDateToUtcTimezoneDate,
  domElementIds,
  type EditConventionWithFinalStatusRequestDto,
  editConventionWithFinalStatusRequestSchema,
  toDateUTCString,
  toDisplayedDate,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

export const EditConventionWithFinalStatusModalContent = ({
  convention,
  onSubmit,
  closeModal,
}: {
  convention: ConventionDto;
  onSubmit: (params: EditConventionWithFinalStatusRequestDto) => void;
  closeModal: () => void;
}) => {
  const beneficiary = convention.signatories.beneficiary;
  const currentDateDisplay = toDisplayedDate({
    date: convertLocaleDateToUtcTimezoneDate(new Date(beneficiary.birthdate)),
  });

  const { register, handleSubmit, formState } =
    useForm<EditConventionWithFinalStatusRequestDto>({
      resolver: zodResolver(editConventionWithFinalStatusRequestSchema),
      mode: "onTouched",
      defaultValues: {
        conventionId: convention.id,
        updatedBeneficiaryBirthDate: undefined,
        firstname: undefined,
        lastname: undefined,
      },
    });

  const onFormSubmit: SubmitHandler<EditConventionWithFinalStatusRequestDto> = (
    values,
  ) => {
    onSubmit(values);
    closeModal();
  };

  const getFieldError = makeFieldError(formState);
  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      id={domElementIds.manageConvention.editConventionWithFinalStatusModalForm}
    >
      <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
        <strong>ID :</strong> {convention.id}
      </p>

      <div className={fr.cx("fr-card", "fr-p-2w", "fr-mb-3w")}>
        <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Date de naissance</h3>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Date de naissance actuelle"
              nativeInputProps={{
                value: currentDateDisplay,
                readOnly: true,
              }}
              disabled={true}
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Nouvelle date de naissance"
              nativeInputProps={{
                ...register("updatedBeneficiaryBirthDate", {
                  setValueAs: (value) => (value ? value : undefined),
                }),
                id: domElementIds.manageConvention
                  .editConventionWithFinalStatusModalNewDateInput,
                type: "date",
                max: toDateUTCString(new Date()),
              }}
              {...getFieldError("updatedBeneficiaryBirthDate")}
            />
          </div>
        </div>
      </div>

      <div className={fr.cx("fr-card", "fr-p-2w")}>
        <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
          Prénom ou nom de la personne en immersion
        </h3>
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-2w")}
        >
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Prénom actuel du candidat"
              nativeInputProps={{
                value: beneficiary.firstName,
                readOnly: true,
              }}
              disabled={true}
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Nouveau prénom du candidat"
              nativeInputProps={{
                ...register("firstname"),
                id: domElementIds.manageConvention
                  .editConventionWithFinalStatusModalNewFirstNameInput,
              }}
              {...getFieldError("firstname")}
            />
          </div>
        </div>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Nom de famille actuel du candidat"
              nativeInputProps={{
                value: beneficiary.lastName,
                readOnly: true,
              }}
              disabled={true}
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              label="Nouveau nom de famille du candidat"
              nativeInputProps={{
                ...register("lastname"),
                id: domElementIds.manageConvention
                  .editConventionWithFinalStatusModalNewLastNameInput,
              }}
              {...getFieldError("lastname")}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
