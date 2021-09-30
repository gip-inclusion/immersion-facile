import React, { useEffect, useState } from "react";
import { FormAccordeon } from "src/components/admin/FormAccordeon";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { DemandeImmersionDto } from "src/shared/DemandeImmersionDto";
import { Route } from "type-route";
import { demandeImmersionGateway } from "../main";
import { routes } from "../routes";
import { InfoMessage } from "src/components/form/InfoMessage";

// Temporary "final verification" page for the admin to re-verify the form.

interface AdminVerificationProps {
  route: Route<typeof routes.adminVerification>;
}

export const AdminVerification = ({ route }: AdminVerificationProps) => {
  const [form, setForm] = useState<DemandeImmersionDto | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const id = route.params.demandeId;

  const validationDisabled = () => {
    return !form || form.status !== "IN_REVIEW";
  };

  useEffect(() => {
    demandeImmersionGateway
      .get(id)
      .then((data) => {
        setForm(data);
        if (form) {
          switch (form.status) {
            case "DRAFT":
              setInfoMessage(
                "La demande n'est pas encore prête pour validation",
              );
              break;
            case "IN_REVIEW":
              setInfoMessage(null);
              break;
            case "VALIDATED":
              setInfoMessage("La demande est déjà validée");
              break;
          }
        }
      })
      .catch((error) => {
        setError(error);
      });
  }, []);

  const sendValidationRequest = () => {
    if (!form) return;
    setSubmitting(true);
    demandeImmersionGateway
      .validate(form.id)
      .then(() => {
        setSuccessMessage(
          "La demande est validée et les mails de confirmation vont être envoyés au tuteur et demandeur.",
        );
        setForm({ ...form, status: "VALIDATED" });
      })
      .catch((error: React.SetStateAction<Error | null>) => {
        setError(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <div>Admin Verification Page</div>
      {form && (
        <>
          {infoMessage && <InfoMessage title="Attention" text={infoMessage} />}
          <FormAccordeon data={form} />
          {!validationDisabled() && (
            <button
              className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
              type="button"
              onClick={sendValidationRequest}
              disabled={validationDisabled() || isSubmitting}
            >
              Valider et envoyer la convention
            </button>
          )}
          {successMessage && (
            <SuccessMessage title="Succès">{successMessage}</SuccessMessage>
          )}
        </>
      )}
      {error && (
        <ErrorMessage title="Erreur de serveur">{error.message}</ErrorMessage>
      )}
    </>
  );
};
