import { Form, Formik } from "formik";
import React, { useEffect } from "react";
import { Button, MainWrapper, Notification } from "react-design-system";
import { useDispatch } from "react-redux";
import { UserAndPassword, userAndPasswordSchema } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { fr } from "@codegouvfr/react-dsfr";
import { routes } from "./routes";
import { AdminTab } from "./route-params";

export const AdminPrivateRoute = ({
  children,
}: {
  children: React.ReactElement;
}) =>
  useAppSelector(adminSelectors.auth.isAuthenticated) ? (
    children
  ) : (
    <LoginForm redirectRouteName={children.props.route.params.tab} />
  );

export const LoginForm = ({
  redirectRouteName,
}: {
  redirectRouteName?: AdminTab;
}) => {
  const dispatch = useDispatch();
  const error = useAppSelector(adminSelectors.auth.error);
  const isLoading = useAppSelector(adminSelectors.auth.isLoading);
  const isAuthenticated = useAppSelector(adminSelectors.auth.isAuthenticated);
  const initialValues: UserAndPassword = { user: "", password: "" };
  useEffect(() => {
    if (isAuthenticated) {
      routes
        .adminTab({
          tab: redirectRouteName || "conventions",
        })
        .push();
    }
  }, [isAuthenticated]);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(userAndPasswordSchema)}
          onSubmit={(values) => {
            dispatch(adminAuthSlice.actions.loginRequested(values));
          }}
        >
          {() => (
            <Form>
              <span className={fr.cx("fr-h5")}>Veuillez vous connecter</span>
              <div
                className={fr.cx("fr-card", "fr-py-4w", "fr-px-8w", "fr-mt-2w")}
              >
                <TextInput label="Utilisateur" name="user" />
                <TextInput
                  label="Mot de passe"
                  name="password"
                  type="password"
                />
                <Button
                  disable={isLoading}
                  type="submit"
                  id="im-login__submit-button"
                >
                  Se connecter
                </Button>
                {error && (
                  <Notification
                    className={fr.cx("fr-mt-2w")}
                    title="Une erreur est survenue"
                    type="error"
                  >
                    {error}
                  </Notification>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
