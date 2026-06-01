import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  domElementIds,
  type EditConventionWithFinalStatusRequestDto,
  editConventionWithFinalStatusRequestSchema,
  toDateUTCString,
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

  const { register, handleSubmit, formState } =
    useForm<EditConventionWithFinalStatusRequestDto>({
      resolver: zodResolver(editConventionWithFinalStatusRequestSchema),
      mode: "onTouched",
      defaultValues: {
        conventionId: convention.id,
        updatedBeneficiaryBirthDate: beneficiary.birthdate,
        firstname: beneficiary.firstName,
        lastname: beneficiary.lastName,
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
        <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Personne en immersion</h3>
        <Input
          label="Date de naissance"
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

        <Input
          label="Prénom"
          nativeInputProps={{
            ...register("firstname"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalNewFirstNameInput,
          }}
          {...getFieldError("firstname")}
        />
        <Input
          label="Nom de famille"
          nativeInputProps={{
            ...register("lastname"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalNewLastNameInput,
          }}
          {...getFieldError("lastname")}
        />
      </div>

      <div className={fr.cx("fr-card", "fr-p-2w")}>
        <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Tuteur de l'immersion</h3>
      </div>
    </form>
  );
};
