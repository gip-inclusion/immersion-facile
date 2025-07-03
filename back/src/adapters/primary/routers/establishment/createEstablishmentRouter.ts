import { Router } from "express";
import { errors, establishmentRoutes, formCompletionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  //TODO: Move this route to createFormCompletionRouter OR move isSiretAlreadySaved route on EstablishmentRoutes
  const sharedSiretRouter = createExpressSharedRouter(
    formCompletionRoutes,
    establishmentRouter,
  );

  sharedSiretRouter.isSiretAlreadySaved((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
        req.params.siret,
      ),
    ),
  );

  const establishmentSharedRouter = createExpressSharedRouter(
    establishmentRoutes,
    establishmentRouter,
  );

  establishmentSharedRouter.addFormEstablishment(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.insertEstablishmentAggregateFromForm.execute(
          {
            formEstablishment: req.body,
          },
          req.payloads?.currentUser,
        ),
      ),
  );

  establishmentSharedRouter.getFormEstablishment(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          req.payloads?.connectedUser,
        ),
      ),
  );

  establishmentSharedRouter.getEstablishmentNameAndAdmins(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getEstablishmentNameAndAdmins.execute(
          { siret: req.params.siret },
          currentUser,
        );
      }),
  );

  establishmentSharedRouter.updateFormEstablishment(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateEstablishmentAggregateFromForm.execute(
          { formEstablishment: req.body },
          req.payloads?.connectedUser,
        ),
      ),
  );

  establishmentSharedRouter.deleteEstablishment(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(204), () =>
        deps.useCases.deleteEstablishment.execute(
          req.params,
          req.payloads?.currentUser,
        ),
      ),
  );

  establishmentSharedRouter.getDiscussionByIdForEstablishment(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getDiscussionByIdForEstablishment.execute(
          req.params.discussionId,
          req.payloads?.connectedUser,
        ),
      ),
  );

  establishmentSharedRouter.getDiscussions(
    deps.connectedUserAuthMiddleware,
    (req, res) => {
      const currentUser = req.payloads?.currentUser;
      if (!currentUser) throw errors.user.unauthorized();
      return sendHttpResponse(req, res, () =>
        deps.useCases.getDiscussions.execute(req.query, currentUser),
      );
    },
  );

  establishmentSharedRouter.updateDiscussionStatus(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.currentUser) throw errors.user.unauthorized();
        return deps.useCases.updateDiscussionStatus.execute(
          {
            discussionId: req.params.discussionId,
            ...req.body,
          },
          req.payloads.currentUser,
        );
      }),
  );

  establishmentSharedRouter.replyToDiscussion(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.payloads?.currentUser) throw errors.user.unauthorized();
        const discussionId = req.params.discussionId;
        const result = await deps.useCases.addExchangeToDiscussion.execute(
          {
            source: "dashboard",
            messageInputs: [
              {
                ...req.body,
                discussionId,
                attachments: [],
                recipientRole: "potentialBeneficiary",
              },
            ],
          },
          req.payloads.currentUser,
        );
        if ("reason" in result) {
          res.status(202);
        }
        return result;
      }),
  );

  return establishmentRouter;
};
