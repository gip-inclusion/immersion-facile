import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
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
  Signatory,
  signatoryTitleByRole,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
} from "shared";

export const JustificationModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
  convention,
  currentSignatoryRole,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: ConventionStatusWithJustification;
  convention: ConventionDto;
  currentSignatoryRole: Role;
}) => {
  const [areSignaturesMissing, setAreSignaturesMissing] = useState<
    boolean | null
  >(null);

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

  const conventionSignatories: Signatory[] = Object.values(
    convention.signatories,
  );
  const getSignatoryOptions = () => {
    const signatoryOptions = conventionSignatories.map((signatory) =>
      signatory && signatory.role !== currentSignatoryRole
        ? {
            label: `${signatory.firstName} ${signatory.lastName} - ${
              signatoryTitleByRole[signatory.role]
            }`,
            value: signatory.role,
          }
        : {
            label: `Vous même`,
            value: currentSignatoryRole,
          },
    );

    return [
      ...signatoryOptions,
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

  if (areSignaturesMissing === null) {
    return (
      <div>
        <ButtonsGroup
          buttons={[
            {
              type: "button",
              priority: "secondary",
              onClick: () => setAreSignaturesMissing(true),
              children: "Je veux relancer des signataires manquants",
            },
            {
              type: "button",
              priority: "secondary",
              onClick: () => setAreSignaturesMissing(false),
              children: "Il y a un problème sur le contenu de la convention",
            },
          ]}
        />
      </div>
    );
  }

  if (areSignaturesMissing === true) {
    const signatoriesWithMissingSignature = conventionSignatories.filter(
      ({ signedAt }) => signedAt === undefined,
    );

    const signatoryEmailsWithMissingSignature =
      signatoriesWithMissingSignature.map(({ email }) => email);

    const emailTitle =
      "Signature%20manquante%20pour%20la%20convention%20d%27immersion";
    const emailBody =
      "Bonjour,%0D%0A%0D%0AVous%20avez%20initi%C3%A9%20une%20convention%20d%27immersion%20professionnelle%20via%20le%20site%20d%27immersion%20facilit%C3%A9.%20Mais%20vous%20n%27avez%20pas%20encore%20sign%C3%A9%20cette%20convention.%0D%0A%0D%0APouvez-vous%20effectuer%20cette%20signature%20via%20le%20mail%20re%C3%A7u%20d%27immersion%20facilit%C3%A9e%20?%0D%0A%0D%0AJe%20vous%20remercie%20d%27avance,%0D%0A%0D%0ACordialement,";

    return (
      <div>
        <p>
          Dans ce cas, il ne faut pas réclamer de modification, car cela
          entraine la perte de toute les signatures déjà enregistrées.
        </p>

        {signatoryEmailsWithMissingSignature.length === 0 ? (
          <p>
            <strong>
              Tous les signataires ont bien signé, pas la peine de les relancer.
            </strong>
          </p>
        ) : (
          <>
            <div>
              Les signataires suivants n'ont pas encore signé :
              <ul>
                {signatoriesWithMissingSignature.map((signatory) => (
                  <li key={signatory.email}>
                    <strong>{signatoryTitleByRole[signatory.role]} :</strong>{" "}
                    {signatory.firstName} {signatory.lastName} -{" "}
                    {signatory.email} - {signatory.phone}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              linkProps={{
                href: `mailto:${signatoryEmailsWithMissingSignature.join(
                  ",",
                )}?subject=${emailTitle}&body=${emailBody}`,
              }}
            >
              Relancer les signataires qui n'ont pas signé
            </Button>
          </>
        )}
      </div>
    );
  }

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
        <form onSubmit={handleSubmit(onFormSubmit)}>
          {newStatus === "DRAFT" && (
            <Select
              label="À qui souhaitez-vous envoyer la demande de modification ?"
              placeholder="Sélectionnez un signataire"
              options={getSignatoryOptions()}
              nativeSelectProps={{
                ...register("modifierRole"),
                id: domElementIds.manageConvention.modifierRoleSelect,
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
                type: "submit",
                nativeButtonProps: {
                  id: domElementIds.manageConvention
                    .justificationModalSubmitButton,
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
