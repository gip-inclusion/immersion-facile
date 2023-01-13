import { Form, Formik } from "formik";
import React from "react";
import {
  Button,
  MainWrapper,
  Notification,
  SubTitle,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { UserAndPassword, userAndPasswordSchema } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";

export const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticatedAsAdmin = useAppSelector(
    adminSelectors.auth.isAuthenticated,
  );

  if (!isAuthenticatedAsAdmin) return <LoginForm />;
  return children;
};

const LoginForm = () => {
  const dispatch = useDispatch();
  const error = useAppSelector(adminSelectors.auth.error);
  const isLoading = useAppSelector(adminSelectors.auth.isLoading);
  const initialValues: UserAndPassword = { user: "", password: "" };

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(userAndPasswordSchema)}
          onSubmit={(values) => {
            dispatch(adminAuthSlice.actions.loginRequested(values));
          }}
        >
          {() => (
            <Form>
              <SubTitle>Veuillez vous connectez</SubTitle>
              <TextInput label="Utilisateur" name="user" />
              <TextInput label="Mot de passe" name="password" type="password" />
              <Button
                disable={isLoading}
                type="submit"
                id="im-login__submit-button"
              >
                Se connecter
              </Button>
              {error && (
                <Notification title="Une erreur est survenue" type="error">
                  {error}
                </Notification>
              )}
            </Form>
          )}
        </Formik>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
