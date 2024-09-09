import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  WithDiscussionId,
  domElementIds,
  withDiscussionSchemaId,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";

export const ManageDiscussionFormSection = (): JSX.Element => {
  const { register, handleSubmit, formState, setValue } =
    useForm<WithDiscussionId>({
      resolver: zodResolver(withDiscussionSchemaId),
      mode: "onTouched",
    });
  const { isValid } = formState;
  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w")}>
        Piloter une mise en relation
      </h5>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ discussionId }) => {
            routes
              .establishmentDashboard({ discussionId, tab: "discussions" })
              .push();
          })}
        >
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Id de la mise en relation *"
              nativeInputProps={{
                ...register("discussionId"),
                id: domElementIds.establishmentDashboard.manageDiscussion
                  .discussionIdInput,
                placeholder: "Id de la mise en relation",
                onChange: (event) => {
                  setValue("discussionId", event.currentTarget.value.trim(), {
                    shouldValidate: true,
                  });
                },
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("discussionId")}
            />
          </div>
          <Button
            title="Piloter la mise en relation"
            disabled={!isValid}
            className={fr.cx("fr-mt-2w")}
            id={
              domElementIds.establishmentDashboard.manageDiscussion.submitButton
            }
          >
            Piloter la mise en relation
          </Button>
        </form>
      </div>
    </>
  );
};
