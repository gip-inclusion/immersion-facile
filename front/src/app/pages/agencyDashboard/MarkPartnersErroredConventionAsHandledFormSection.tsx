import React from "react";
import { useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MarkPartnersErroredConventionAsHandledRequest,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

export const MarkPartnersErroredConventionAsHandledFormSection = () => {
  const { register, handleSubmit, formState } =
    useForm<MarkPartnersErroredConventionAsHandledRequest>({
      resolver: zodResolver(
        markPartnersErroredConventionAsHandledRequestSchema,
      ),
      mode: "onTouched",
    });

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w")}>
        Marquer une convention comme traité
      </h5>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ conventionId }) => {
            console.log("submit!!!===>", conventionId);
          })}
        >
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Id de la convention *"
              nativeInputProps={{
                ...register("conventionId"),
                id: "MarkPartnersErroredConvention-conventionId",
                placeholder: "Id de la convention",
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("conventionId")}
            />
          </div>
          <Button
            title="Marquer la convention comme traité"
            disabled={!formState.isValid}
            className={fr.cx("fr-mt-2w")}
          >
            Marquer la convention comme traité
          </Button>
        </form>
      </div>
    </>
  );
};
