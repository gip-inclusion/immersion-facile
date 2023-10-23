import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InclusionConnectJwt,
  MarkPartnersErroredConventionAsHandledRequest,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { partnersErroredConventionSlice } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.slice";

export const MarkPartnersErroredConventionAsHandledFormSection = ({
  jwt,
}: {
  jwt: InclusionConnectJwt;
}) => {
  const { register, handleSubmit, formState } =
    useForm<MarkPartnersErroredConventionAsHandledRequest>({
      resolver: zodResolver(
        markPartnersErroredConventionAsHandledRequestSchema,
      ),
      mode: "onTouched",
    });
  const dispatch = useDispatch();
  return (
    <section className={fr.cx("fr-mt-4w")}>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w")}>
        Marquer une convention comme traitée
      </h5>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ conventionId }) => {
            dispatch(
              partnersErroredConventionSlice.actions.markAsHandledRequested({
                jwt,
                markAsHandledParams: { conventionId },
              }),
            );
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
            title="Marquer la convention comme traitée"
            disabled={!formState.isValid}
            className={fr.cx("fr-mt-2w")}
          >
            Marquer la convention comme traitée
          </Button>
        </form>
      </div>
    </section>
  );
};
