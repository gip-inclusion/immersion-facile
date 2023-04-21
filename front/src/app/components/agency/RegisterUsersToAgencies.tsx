import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { match, P } from "ts-pattern";
import { AgencyRole, allAgencyRoles, AuthenticatedUserId } from "shared";
import { DsfrTitle } from "react-design-system";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

export const RegisterUsersToAgencies = () => {
  const dispatch = useDispatch();
  const icUsersNeedingReview = useAppSelector(
    icUsersAdminSelectors.icUsersNeedingReview,
  );
  const agenciesNeedingReviewForUser = useAppSelector(
    icUsersAdminSelectors.agenciesNeedingReviewForSelectedUser,
  );
  const selectedUserId = useAppSelector(icUsersAdminSelectors.selectedUserId);
  const feedback = useAppSelector(icUsersAdminSelectors.feedback);

  useEffect(() => {
    dispatch(
      icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(),
    );
  }, []);

  const defaultRoleOnAssociation: AgencyRole = "validator";

  return (
    <>
      <DsfrTitle
        level={5}
        text="Rapprocher un utilisateur d'une agence"
        className={fr.cx("fr-mt-4w")}
      />
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <>
          {feedback.kind}
          <Select
            label={`Sélectionner un utilisateur (${icUsersNeedingReview.length} en attente de validation)`}
            options={[
              {
                value: "",
                label: "Sélectionner un utilisateur",
                disabled: true,
              },
              ...icUsersNeedingReview.map((user) => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName}`,
              })),
            ]}
            nativeSelectProps={{
              defaultValue: "",
              onChange: (event) => {
                dispatch(
                  icUsersAdminSlice.actions.inclusionConnectedUserSelected(
                    event.currentTarget.value as AuthenticatedUserId,
                  ),
                );
              },
            }}
          />
          {match({ agenciesNeedingReviewForUser, feedback })
            .with(
              {
                agenciesNeedingReviewForUser: P.when(
                  (agenciesNeedingReviewForUser) =>
                    agenciesNeedingReviewForUser.length > 0,
                ),
                feedback: P.when(
                  (feedback) =>
                    feedback.kind === "agencyRegisterToUserSuccess" ||
                    feedback.kind === "usersToReviewFetchSuccess",
                ),
              },
              () => (
                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                  {agenciesNeedingReviewForUser.map(({ agency }) => (
                    <div key={agency.id} className={fr.cx("fr-col-4")}>
                      <div className={fr.cx("fr-card")}>
                        <div className={fr.cx("fr-card__body")}>
                          <div className={fr.cx("fr-card__content")}>
                            <h3 className={fr.cx("fr-card__title")}>
                              {agency.name}
                            </h3>
                            <p className={fr.cx("fr-card__desc")}>
                              {agency.address.streetNumberAndAddress}{" "}
                              {agency.address.postcode} {agency.address.city}
                            </p>
                            <div className={fr.cx("fr-card__desc")}>
                              <Select
                                label="Sélectionner un rôle"
                                disabled={true}
                                options={[
                                  {
                                    value: "",
                                    label: "Sélectionner un rôle",
                                    disabled: true,
                                  },
                                  ...allAgencyRoles.map((roleValue) => ({
                                    value: roleValue,
                                    label: labelByRole[roleValue],
                                  })),
                                ]}
                                nativeSelectProps={{
                                  value: defaultRoleOnAssociation, // change to role when feature ready
                                }}
                              />
                            </div>
                          </div>
                          <div className={fr.cx("fr-card__footer")}>
                            <Button
                              size="small"
                              type="button"
                              onClick={() => {
                                if (!selectedUserId) return;
                                dispatch(
                                  icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested(
                                    {
                                      agencyId: agency.id,
                                      userId: selectedUserId,
                                      role: defaultRoleOnAssociation,
                                    },
                                  ),
                                );
                              }}
                            >
                              Associer à cette agence
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

const labelByRole: Record<AgencyRole, string> = {
  counsellor: "Conseiller",
  validator: "Validateur",
  agencyOwner: "Administrateur d'agence",
  toReview: "À valider",
};
