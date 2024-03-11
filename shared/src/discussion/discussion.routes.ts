import { defineRoute, defineRoutes } from "shared-routes";
import { withAuthorizationHeaders } from "../headers";

export const discussionRoutes = defineRoutes({
  getDiscussionByIdForEstablishment: defineRoute({
    method: "get",
    url: "/discussion-for-establishment/:discussionId",
    ...withAuthorizationHeaders,
    responses: {
      200: disc,
    },
  }),
});
