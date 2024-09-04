import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { User, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { P, match } from "ts-pattern";
import { IcUserAgenciesToReview } from "./IcUserAgenciesToReview";

export const RegisterUsersToAgencies = () => {
  const dispatch = useDispatch();
  const icUsersNeedingReview = useAppSelector(
    icUsersAdminSelectors.icUsersNeedingReview,
  );
  const agenciesNeedingReviewForUser = useAppSelector(
    icUsersAdminSelectors.agenciesNeedingReviewForSelectedUser,
  );
  const selectedUser = useAppSelector(icUsersAdminSelectors.selectedUser);
  const feedback = useAppSelector(icUsersAdminSelectors.feedback);

  useEffect(() => {
    dispatch(
      icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested({
        agencyRole: "toReview",
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    if (agenciesNeedingReviewForUser.length === 0) {
      dispatch(icUsersAdminSlice.actions.inclusionConnectedUserSelected(null));
    }
  }, [agenciesNeedingReviewForUser, dispatch]);

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w", "fr-mt-4w")}>
        Rapprocher un utilisateur d'une agence
      </h5>
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card", "fr-mb-4w")}>
        <>
          <Select
            label={`Sélectionner un utilisateur (${icUsersNeedingReview.length} en attente de validation)`}
            options={[
              ...icUsersNeedingReview
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((user) => ({
                  value: user.id,
                  label: `${user.lastName} ${user.firstName} - ${user.email}`,
                })),
            ]}
            placeholder="Sélectionner un utilisateur"
            nativeSelectProps={{
              defaultValue: "",
              value: selectedUser?.id || "",
              id: domElementIds.admin.agencyTab.selectIcUserToReview,
              onChange: (event) => {
                dispatch(
                  icUsersAdminSlice.actions.inclusionConnectedUserSelected(
                    icUsersNeedingReview.find(
                      (icUser) => icUser.id === event.currentTarget.value,
                    ) as User,
                  ),
                );
              },
            }}
          />
          {match({ agenciesNeedingReviewForUser, feedback, selectedUser })
            .with(
              {
                agenciesNeedingReviewForUser: P.when(
                  (agenciesNeedingReviewForUser) =>
                    agenciesNeedingReviewForUser.length > 0,
                ),
                feedback: P.when(
                  (feedback) =>
                    feedback.kind === "agencyRegisterToUserSuccess" ||
                    feedback.kind === "usersToReviewFetchSuccess" ||
                    feedback.kind === "agencyRejectionForUserSuccess",
                ),
                selectedUser: P.not(P.nullish),
              },
              ({ selectedUser }) => (
                <IcUserAgenciesToReview
                  agenciesNeedingReviewForUser={agenciesNeedingReviewForUser}
                  selectedUser={selectedUser}
                />
              ),
            )
            .with(
              {
                feedback: P.when(
                  (feedback) =>
                    feedback.kind === "agencyRejectionForUserSuccess",
                ),
              },
              () => (
                <Alert
                  severity="success"
                  title="Beau travail !"
                  description="Le rattachement de cet utilisateur à l'agence a bien été rejeté"
                />
              ),
            )
            .with(
              {
                agenciesNeedingReviewForUser: P.when(
                  (agenciesNeedingReviewForUser) =>
                    agenciesNeedingReviewForUser.length === 0,
                ),
                feedback: P.when(
                  (feedback) => feedback.kind === "agencyRegisterToUserSuccess",
                ),
              },
              () => (
                <Alert
                  severity="success"
                  title="Beau travail !"
                  description="Toutes les agences disponibles ont été associées à cet utilisateur."
                />
              ),
            )
            .with(
              {
                agenciesNeedingReviewForUser: P.when(
                  (agenciesNeedingReviewForUser) =>
                    agenciesNeedingReviewForUser.length === 0,
                ),
                feedback: P.when(
                  (feedback) => feedback.kind === "usersToReviewFetchSuccess",
                ),
              },
              () => <></>,
            )
            .with(
              {
                feedback: P.when((feedback) => feedback.kind === "errored"),
              },
              () => (
                <Alert
                  severity="error"
                  title="Une erreur est survenue"
                  description={
                    feedback.kind === "errored" && feedback.errorMessage
                  }
                />
              ),
            )
            .otherwise(() => (
              <Alert
                severity="error"
                title="Un cas non géré a été rencontré"
                description={
                  <img
                    src="https://media.giphy.com/media/fAo1Tv1OGE6AQZ2s0T/giphy.gif"
                    width={200}
                    alt=""
                  />
                }
              />
            ))}
        </>
      </div>
    </>
  );
};
