import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  type DeleteAssessmentRequestDto,
  deleteAssessmentRequestDtoSchema,
  getFormattedFirstnameAndLastname,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useFormModal } from "src/app/utils/createFormModal";

export const DeleteAssessmentModalContent = ({
  convention,
  onSubmit,
  closeModal,
}: {
  convention: ConventionDto;
  onSubmit: (params: DeleteAssessmentRequestDto) => void;
  closeModal: () => void;
}) => {
  const { register, handleSubmit, formState } =
    useForm<DeleteAssessmentRequestDto>({
      resolver: zodResolver(deleteAssessmentRequestDtoSchema),
      mode: "onTouched",
      defaultValues: {
        conventionId: convention.id,
        deleteAssessmentJustification: "",
      },
    });

  const { formId } = useFormModal();
  const getFieldError = makeFieldError(formState);

  const beneficiaryName = getFormattedFirstnameAndLastname({
    firstname: convention.signatories.beneficiary.firstName,
    lastname: convention.signatories.beneficiary.lastName,
  });

  const immersionLabel =
    convention.internshipKind === "immersion"
      ? "de l’immersion"
      : "du mini-stage";

  const onFormSubmit: SubmitHandler<DeleteAssessmentRequestDto> = (values) => {
    onSubmit(values);
    closeModal();
  };

  return (
    <>
      <p className={fr.cx("fr-mb-3w")}>
        Vous êtes sur le point de supprimer le bilan {immersionLabel} de{" "}
        <strong>{beneficiaryName}</strong>. Veuillez expliquer la raison et
        confirmer la suppression.
      </p>
      <p>Le message sera transmis au tuteur de l’entreprise.</p>
      <form id={formId} onSubmit={handleSubmit(onFormSubmit)}>
        <Input
          textArea
          label="Raison de la suppression"
          nativeTextAreaProps={{
            ...register("deleteAssessmentJustification"),
          }}
          {...getFieldError("deleteAssessmentJustification")}
        />
      </form>
    </>
  );
};
