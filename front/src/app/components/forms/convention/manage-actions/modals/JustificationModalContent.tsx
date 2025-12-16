import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  type ConventionStatusWithJustification,
  doesStatusNeedsJustification,
  type UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useFormModal } from "src/app/utils/createFormModal";

export const JustificationModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
  convention,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: ConventionStatusWithJustification;
  convention: ConventionDto;
}) => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(updateConventionStatusRequestSchema),
    mode: "onTouched",
    defaultValues: {
      status: newStatus,
      conventionId: convention.id,
    },
  });
  const { formId } = useFormModal();

  const getFieldError = makeFieldError(formState);

  const onFormSubmit: SubmitHandler<
    Partial<UpdateConventionStatusRequestDto>
  > = (values) => {
    onSubmit(updateConventionStatusRequestSchema.parse(values));
    closeModal();
  };

  return (
    <>
      {newStatus === "REJECTED" && (
        <Alert
          severity="warning"
          title="Attention !"
          className={fr.cx("fr-mb-2w")}
          description="Ne surtout pas refuser une immersion si une signature manque ! Cela
  revient à annuler les signatures déjà enregistrées. Pour relancer un
  signataire manquant, le contacter par mail."
        />
      )}
      {newStatus === "CANCELLED" && (
        <Alert
          severity="warning"
          title="Attention ! Cette opération est irréversible !"
          className={fr.cx("fr-mb-2w")}
          description="Vous souhaitez annuler une convention qui a déjà été validée. Veuillez indiquer votre nom et prénom afin de garantir un suivi des annulations de convention."
        />
      )}
      {doesStatusNeedsJustification(newStatus) && (
        <form id={formId} onSubmit={handleSubmit(onFormSubmit)}>
          <Input
            textArea
            label={inputLabelByStatus[newStatus]}
            nativeTextAreaProps={{
              ...register("statusJustification"),
            }}
            {...getFieldError("statusJustification")}
          />
        </form>
      )}
    </>
  );
};

const inputLabelByStatus: Record<ConventionStatusWithJustification, string> = {
  REJECTED: "Pourquoi l'immersion est-elle refusée ?",
  CANCELLED: "Pourquoi souhaitez-vous annuler cette convention ?",
  DEPRECATED: "Pourquoi l'immersion est-elle obsolète ?",
};
