import React, { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { domElementIds, UserAndPassword, userAndPasswordSchema } from "shared";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { AdminTab } from "./route-params";
import { routes } from "./routes";

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

  const { register, handleSubmit } = useForm<UserAndPassword>({
    resolver: zodResolver(userAndPasswordSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const onSubmit: SubmitHandler<UserAndPassword> = (values) => {
    dispatch(adminAuthSlice.actions.loginRequested(values));
  };

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <span className={fr.cx("fr-h5")}>Veuillez vous connecter</span>
          <div className={fr.cx("fr-card", "fr-py-4w", "fr-px-8w", "fr-mt-2w")}>
            <Input
              label="Utilisateur"
              nativeInputProps={{
                ...register("user"),
              }}
            />
            <Input
              label="Mot de passe"
              nativeInputProps={{
                type: "password",
                ...register("password"),
              }}
            />
            <Button
              disabled={isLoading}
              type="submit"
              nativeButtonProps={{
                id: domElementIds.admin.adminPrivateRoute.formLoginSubmitButton,
              }}
            >
              Se connecter
            </Button>
            {error && (
              <Alert
                severity="error"
                title="Une erreur est survenue"
                className={fr.cx("fr-mt-2w")}
                description={error}
              />
            )}
          </div>
        </form>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
