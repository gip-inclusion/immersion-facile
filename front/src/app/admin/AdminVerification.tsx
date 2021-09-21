import React, { useEffect, useState } from "react";
import { FormAccordeon } from "src/components/admin/FormAccordeon";
import { DemandeImmersionDto } from "src/shared/DemandeImmersionDto";
import { Route } from "type-route";
import { demandeImmersionGateway } from "../main";
import { routes } from "../routes";

// Temporary "final verification" page for the admin to re-verify the form.

interface AdminVerificationProps {
  route: Route<typeof routes.adminVerification>;
}

export const AdminVerification = ({ route }: AdminVerificationProps) => {
  const [form, setForm] = useState<DemandeImmersionDto | null>(null);

  const id = route.params.demandeId;

  useEffect(() => {
    demandeImmersionGateway.get(id).then(setForm);
  }, []);

  const sendValidationRequest = () => {
    if (!form) return;
    demandeImmersionGateway.validate(form.id);
  };

  return (
    <>
      <div>Admin Verification Page</div>
      {form && (
        <>
          <FormAccordeon data={form} />
          <button
            className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
            type="button"
            onClick={sendValidationRequest}
            disabled={form.status !== "IN_REVIEW"}
          >
            Valider et envoyer la convention
          </button>
        </>
      )}
    </>
  );
};
