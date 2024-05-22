import Button, { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { createPortal } from "react-dom";
import {
  ConventionDto,
  Role,
  Signatory,
  domElementIds,
  signatoryTitleByRole,
  validSignatoryRoles,
} from "shared";

const remindSignatoriesModal = createModal({
  id: domElementIds.manageConvention.remindSignatoriesModal,
  isOpenedByDefault: false,
});

type RemindSignatoriesButton = {
  convention: ConventionDto;
  id: string;
  priority: ButtonProps["priority"];
  className?: string;
};

export const RemindSignatoriesButton = ({
  convention,
  id,
  priority,
  className,
}: RemindSignatoriesButton) => (
  <>
    <Button
      iconId="fr-icon-mail-line"
      priority={priority}
      type="button"
      className={className}
      onClick={() => remindSignatoriesModal.open()}
      id={id}
    >
      Relancer les signataires
    </Button>

    {createPortal(
      <remindSignatoriesModal.Component title="Relancer les signataires">
        <ReminderModalContent convention={convention} />
      </remindSignatoriesModal.Component>,
      document.body,
    )}
  </>
);

export const isRemindingAllowed = (
  convention: ConventionDto,
  actingRole: Role,
): boolean => {
  const remindingAllowedStatus = ["READY_TO_SIGN", "PARTIALLY_SIGNED"];
  const validRemindingRoles = [
    "counsellor",
    "validator",
    "backOffice",
    ...validSignatoryRoles,
  ];

  return (
    remindingAllowedStatus.includes(convention.status) &&
    validRemindingRoles.includes(actingRole)
  );
};

const ReminderModalContent = ({
  convention,
}: {
  convention: ConventionDto;
}) => {
  const conventionSignatories: Signatory[] = Object.values(
    convention.signatories,
  );
  const signatoriesWithMissingSignature = conventionSignatories.filter(
    ({ signedAt }) => signedAt === undefined,
  );

  const signatoryEmailsWithMissingSignature =
    signatoriesWithMissingSignature.map(({ email }) => email);

  const emailTitle = "Signature manquante pour la convention d'immersion";
  const emailBody = `Bonjour,

    Vous avez initié une convention d'immersion professionnelle via le site d'immersion facilité (${convention.id}). Mais vous n'avez pas encore signé cette convention.
    
    Pouvez-vous effectuer cette signature via le mail reçu d'immersion facilitée ?
    
    Je vous remercie d'avance,
    
    Cordialement,
    `;

  return (
    <div>
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
                  {signatory.firstName} {signatory.lastName} - {signatory.email}{" "}
                  - {signatory.phone}
                </li>
              ))}
            </ul>
          </div>
          <Button
            linkProps={{
              href: `mailto:${signatoryEmailsWithMissingSignature.join(
                ",",
              )}?subject=${encodeURI(emailTitle)}&body=${encodeURI(emailBody)}`,
            }}
          >
            Relancer les signataires qui n'ont pas signé
          </Button>
        </>
      )}
    </div>
  );
};
