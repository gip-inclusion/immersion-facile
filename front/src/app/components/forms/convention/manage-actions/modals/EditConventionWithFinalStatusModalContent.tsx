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
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";

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
  const establishmentTutor = convention.establishmentTutor;
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  const canEditBeneficiary = currentUser?.isBackofficeAdmin ?? false;

  const { register, handleSubmit, formState } =
    useForm<EditConventionWithFinalStatusRequestDto>({
      resolver: zodResolver(editConventionWithFinalStatusRequestSchema),
      mode: "onTouched",
      defaultValues: {
        conventionId: convention.id,
        establishmentTutor: {
          firstname: establishmentTutor.firstName,
          lastname: establishmentTutor.lastName,
          job: establishmentTutor.job,
          email: establishmentTutor.email,
          phone: establishmentTutor.phone,
        },
        ...(canEditBeneficiary && {
          beneficiary: {
            updatedBeneficiaryBirthDate: beneficiary.birthdate,
            firstname: beneficiary.firstName,
            lastname: beneficiary.lastName,
          },
        }),
      },
    });

  const onFormSubmit: SubmitHandler<EditConventionWithFinalStatusRequestDto> = (
    values,
  ) => {
    onSubmit({
      conventionId: values.conventionId,
      establishmentTutor: values.establishmentTutor,
      ...(canEditBeneficiary && values.beneficiary
        ? { beneficiary: values.beneficiary }
        : {}),
    });
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

      {canEditBeneficiary && (
        <div className={fr.cx("fr-card", "fr-p-2w", "fr-mb-3w")}>
          <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Personne en immersion</h3>
          <Input
            label="Date de naissance"
            nativeInputProps={{
              ...register("beneficiary.updatedBeneficiaryBirthDate"),
              id: domElementIds.manageConvention
                .editConventionWithFinalStatusModalNewDateInput,
              type: "date",
              max: toDateUTCString(new Date()),
            }}
            {...getFieldError("beneficiary.updatedBeneficiaryBirthDate")}
          />

          <Input
            label="Prénom"
            nativeInputProps={{
              ...register("beneficiary.firstname"),
              id: domElementIds.manageConvention
                .editConventionWithFinalStatusModalNewFirstNameInput,
            }}
            {...getFieldError("beneficiary.firstname")}
          />
          <Input
            label="Nom de famille"
            nativeInputProps={{
              ...register("beneficiary.lastname"),
              id: domElementIds.manageConvention
                .editConventionWithFinalStatusModalNewLastNameInput,
            }}
            {...getFieldError("beneficiary.lastname")}
          />
        </div>
      )}

      <div className={fr.cx("fr-card", "fr-p-2w")}>
        <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Tuteur de l'immersion</h3>
        <Input
          label="Prénom"
          nativeInputProps={{
            ...register("establishmentTutor.firstname"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalTutorFirstNameInput,
          }}
          {...getFieldError("establishmentTutor.firstname")}
        />
        <Input
          label="Nom de famille"
          nativeInputProps={{
            ...register("establishmentTutor.lastname"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalTutorLastNameInput,
          }}
          {...getFieldError("establishmentTutor.lastname")}
        />
        <Input
          label="Fonction"
          nativeInputProps={{
            ...register("establishmentTutor.job"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalTutorJobInput,
          }}
          {...getFieldError("establishmentTutor.job")}
        />
        <Input
          label="Email"
          nativeInputProps={{
            ...register("establishmentTutor.email"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalTutorEmailInput,
          }}
          {...getFieldError("establishmentTutor.email")}
        />
        <Input
          label="Téléphone"
          nativeInputProps={{
            ...register("establishmentTutor.phone"),
            id: domElementIds.manageConvention
              .editConventionWithFinalStatusModalTutorPhoneInput,
          }}
          {...getFieldError("establishmentTutor.phone")}
        />
      </div>
    </form>
  );
};
