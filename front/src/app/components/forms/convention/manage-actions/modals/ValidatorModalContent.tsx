import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { pick } from "ramda";
import type { Dispatch, SetStateAction } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionId,
  type ConventionStatusWithValidator,
  domElementIds,
  type UpdateConventionStatusRequestDto,
  type WithFirstnameAndLastname,
  withFirstnameAndLastnameSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

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
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const fetchedConvention = useAppSelector(conventionSelectors.convention);

  const currentUserName =
    currentUser?.firstName && currentUser?.lastName
      ? pick(["firstname", "lastname"], {
          firstname: currentUser.firstName,
          lastname: currentUser.lastName,
        })
      : undefined;

  const counsellorNameInConvention = fetchedConvention?.agencyReferent
    ? pick(["firstname", "lastname"], fetchedConvention.agencyReferent)
    : undefined;

  const { register, handleSubmit, formState } =
    useForm<WithFirstnameAndLastname>({
      resolver: zodResolver(withFirstnameAndLastnameSchema),
      mode: "onTouched",
      defaultValues: currentUserName ?? counsellorNameInConvention,
    });
  const onFormSubmit: SubmitHandler<WithFirstnameAndLastname> = ({
    firstname,
    lastname,
  }) => {
    onSubmit({ status: newStatus, conventionId, firstname, lastname });
    closeModal();
  };
  const getFieldError = makeFieldError(formState);
  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <p>
        Pour {newStatus === "ACCEPTED_BY_VALIDATOR" ? "valider" : "pré-valider"}{" "}
        la convention, veuillez saisir les informations de la personne qui
        valide la demande. Ces informations apparaitront sur la convention
        finale au format PDF.
      </p>
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
        {...getFieldError("firstname")}
      />
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
        {...getFieldError("lastname")}
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
