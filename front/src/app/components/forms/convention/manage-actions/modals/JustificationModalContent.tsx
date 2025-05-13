import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  type ConventionStatusWithJustification,
  type Role,
  type UpdateConventionStatusRequestDto,
  doesStatusNeedsJustification,
  domElementIds,
  updateConventionStatusRequestSchema,
} from "shared";
import type { ModalWrapperProps } from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

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
  currentSignatoryRoles: Role[];
  onModalPropsChange: (props: Partial<ModalWrapperProps>) => void;
}) => {
  const { register, handleSubmit, formState } = useForm<
    Partial<UpdateConventionStatusRequestDto>
  >({
    resolver: zodResolver(updateConventionStatusRequestSchema),
    mode: "onTouched",
    defaultValues: {
      status: newStatus,
      conventionId: convention.id,
    },
  });

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
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Input
            textArea
            label={inputLabelByStatus[newStatus]}
            nativeTextAreaProps={{
              ...register("statusJustification"),
            }}
            {...getFieldError("statusJustification")}
          />
          <ButtonsGroup
            alignment="center"
            inlineLayoutWhen="always"
            buttons={[
              {
                type: "button",
                priority: "secondary",
                onClick: closeModal,
                nativeButtonProps: {
                  id: cancelButtonIdByStatus[newStatus],
                },
                children: "Annuler",
              },
              {
                type: "submit",
                nativeButtonProps: {
                  id: submitButtonIdByStatus[newStatus],
                },
                children: confirmByStatus[newStatus],
              },
            ]}
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

const confirmByStatus: Record<ConventionStatusWithJustification, string> = {
  REJECTED: "Confirmer le refus",
  CANCELLED: "Confirmer l'annulation",
  DEPRECATED: "Confirmer que la demande est obsolète",
};

const submitButtonIdByStatus: Record<
  ConventionStatusWithJustification,
  string
> = {
  REJECTED: domElementIds.manageConvention.rejectedModalSubmitButton,
  CANCELLED: domElementIds.manageConvention.cancelModalSubmitButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalSubmitButton,
};

const cancelButtonIdByStatus: Record<
  ConventionStatusWithJustification,
  string
> = {
  REJECTED: domElementIds.manageConvention.rejectedModalCancelButton,
  CANCELLED: domElementIds.manageConvention.cancelModalCancelButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalCancelButton,
};
