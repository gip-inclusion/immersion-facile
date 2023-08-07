import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConventionDto,
  ConventionStatusWithJustification,
  doesStatusNeedsJustification,
  domElementIds,
  Role,
  Signatories,
  Signatory,
  SignatoryRole,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
} from "shared";
import { VerificationActions } from "./VerificationActionButton";

export const JustificationModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
  convention,
  currentSignatoryRole,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: VerificationActions;
  convention: ConventionDto;
  currentSignatoryRole: Role;
}) => {
  const { register, handleSubmit } = useForm<
    Partial<UpdateConventionStatusRequestDto>
  >({
    resolver: zodResolver(updateConventionStatusRequestSchema),
    mode: "onTouched",
    defaultValues: {
      status: newStatus,
      conventionId: convention.id,
    },
  });

  const onFormSubmit: SubmitHandler<
    Partial<UpdateConventionStatusRequestDto>
  > = (values) => {
    onSubmit(updateConventionStatusRequestSchema.parse(values));
    closeModal();
  };

  const getSignatoriesOption = (signatories: Signatories) => {
    const getSignatoryTitleByRole = (role: SignatoryRole): string => {
      switch (role) {
        case "beneficiary":
          return "Le bénéficiaire";
        case "establishment":
          return "Le représentant de l'entreprise";
        case "establishment-representative":
          return "Le représentant de l'entreprise";
        case "beneficiary-representative":
          return "Le représentant légal du bénéficiaire";
        case "legal-representative":
          return "Le représentant légal du bénéficiaire";
        case "beneficiary-current-employer":
          return "Le représentant de l'entreprise actuelle du candidat";
      }
    };

    const getOptionLabelAndValue = (
      currentSignatoryRole: Role,
      signatory: Signatory | undefined,
    ) => {
      if (!signatory) return [];

      if (currentSignatoryRole === signatory.role) {
        return [
          {
            label: `Vous même`,
            value: currentSignatoryRole,
          },
        ];
      }
      return [
        {
          label: `${signatory.firstName} ${
            signatory.lastName
          } - ${getSignatoryTitleByRole(signatory.role)}`,
          value: signatory.role,
        },
      ];
    };

    return [
      ...getOptionLabelAndValue(currentSignatoryRole, signatories.beneficiary),
      ...getOptionLabelAndValue(
        currentSignatoryRole,
        signatories.establishmentRepresentative,
      ),
      ...getOptionLabelAndValue(
        currentSignatoryRole,
        signatories.beneficiaryCurrentEmployer,
      ),
      ...getOptionLabelAndValue(
        currentSignatoryRole,
        signatories.beneficiaryRepresentative,
      ),
      ...(currentSignatoryRole === "validator" ||
      currentSignatoryRole === "counsellor"
        ? [
            {
              label: `Vous même`,
              value: currentSignatoryRole,
            },
          ]
        : []),
    ];
  };

  return (
    <>
      {newStatus === "DRAFT" && (
        <>
          <Alert
            severity="warning"
            title="Attention !"
            className={fr.cx("fr-mb-2w")}
            description="Ne surtout pas demander de modification pour relancer un signataire manquant. 
            Cela revient à annuler les signatures déjà enregistrées. 
            Si vous souhaitez le relancer, contactez-le directement par e-mail ou par téléphone."
          />
        </>
      )}
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
        <form>
          {newStatus === "DRAFT" && (
            <Select
              label="À qui souhaitez-vous envoyer la demande de modification ?"
              placeholder="Sélectionnez un signataire"
              options={getSignatoriesOption(convention.signatories)}
              nativeSelectProps={{
                ...register("modifierRole"),
              }}
            />
          )}
          <Input
            textArea
            label={inputLabelByStatus[newStatus]}
            nativeTextAreaProps={{
              ...register("statusJustification"),
            }}
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
                  id: domElementIds.manageConvention
                    .justificationModalCancelButton,
                },
                children: "Annuler",
              },
              {
                type: "button",
                nativeButtonProps: {
                  id: domElementIds.manageConvention
                    .justificationModalSubmitButton,
                },
                onClick: handleSubmit(onFormSubmit),
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
  DRAFT: "Précisez la raison et la modification nécessaire",
  REJECTED: "Pourquoi l'immersion est-elle refusée ?",
  CANCELLED: "Pourquoi souhaitez-vous annuler cette convention ?",
  DEPRECATED: "Pourquoi l'immersion est-elle obsolète ?",
};

const confirmByStatus: Record<ConventionStatusWithJustification, string> = {
  DRAFT: "Confirmer la demande de modification",
  REJECTED: "Confirmer le refus",
  CANCELLED: "Confirmer l'annulation",
  DEPRECATED: "Confirmer que la demande est obsolète",
};
