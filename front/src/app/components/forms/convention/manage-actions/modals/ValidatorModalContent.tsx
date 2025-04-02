import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dispatch, SetStateAction } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionId,
  type ConventionStatusWithValidator,
  type UpdateConventionStatusRequestDto,
  type WithValidatorInfo,
  domElementIds,
  withValidatorInfoSchema,
} from "shared";

export const ValidatorModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
  conventionId,
  onCloseValidatorModalWithoutValidatorInfo,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: ConventionStatusWithValidator;
  conventionId: ConventionId;
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
}) => {
  const { register, handleSubmit } = useForm<WithValidatorInfo>({
    resolver: zodResolver(withValidatorInfoSchema),
    mode: "onTouched",
  });
  const onFormSubmit: SubmitHandler<WithValidatorInfo> = ({
    firstname,
    lastname,
  }) => {
    onSubmit({ status: newStatus, conventionId, firstname, lastname });
    closeModal();
  };
  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Input
          label={
            newStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Nom de la personne qui valide la demande *"
              : "Nom de la personne qui pré-valide la demande *"
          }
          nativeInputProps={{
            ...register("lastname"),
            required: true,
            id: domElementIds.manageConvention.validatorModalLastNameInput,
          }}
        />
        <Input
          label={
            newStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Prénom de la personne qui valide la demande *"
              : "Prénom de la personne qui pré-valide la demande *"
          }
          nativeInputProps={{
            ...register("firstname"),
            required: true,
            id: domElementIds.manageConvention.validatorModalFirstNameInput,
          }}
        />
        <ButtonsGroup
          alignment="center"
          inlineLayoutWhen="always"
          buttons={[
            {
              type: "button",
              priority: "secondary",
              onClick: () => {
                if (onCloseValidatorModalWithoutValidatorInfo) {
                  onCloseValidatorModalWithoutValidatorInfo(
                    warningMessagesByConventionStatus[newStatus],
                  );
                }
                closeModal();
              },
              nativeButtonProps: {
                id: domElementIds.manageConvention.validatorModalCancelButton,
              },
              children: "Annuler et revenir en arrière",
            },
            {
              type: "submit",
              nativeButtonProps: {
                id: domElementIds.manageConvention.validatorModalSubmitButton,
              },
              children: "Terminer",
            },
          ]}
        />
      </form>
    </>
  );
};

const warningMessagesByConventionStatus: Record<
  ConventionStatusWithValidator,
  string
> = {
  ACCEPTED_BY_COUNSELLOR:
    'Vous n\'avez pas pré-validé la demande. Pour le faire, cliquez sur "Pré-valider la demande" puis sur "Terminer"',
  ACCEPTED_BY_VALIDATOR:
    'Vous n\'avez pas marqué la validation de la demande. Pour le faire, cliquez sur "Valider la demande" puis sur "Terminer la validation"',
};
