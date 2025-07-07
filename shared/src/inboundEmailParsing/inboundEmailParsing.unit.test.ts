import { createOpaqueEmail } from "./inboundEmailParsing.utils";

describe("inboundEmailParsing", () => {
  it("should create opaque email with long fullname truncated", () => {
    const opaqueEmail = createOpaqueEmail({
      discussionId: "ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274",
      replyDomain: "reply.immersion-facile.beta.gouv.fr",
      recipient: {
        kind: "establishment",
        firstname: "Fulgence Antoinette",
        lastname: "Pourroy de L'Auberivière de Quinsonas-Oudinot de Reggio",
      },
    });

    expect(opaqueEmail).toBe(
      "fulgence-antoinette_pou__ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274_e@reply.immersion-facile.beta.gouv.fr",
    );
  });

  it("shouldn't truncate fullname if it's short", () => {
    const opaqueEmail = createOpaqueEmail({
      discussionId: "ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274",
      replyDomain: "reply.immersion-facile.beta.gouv.fr",
      recipient: {
        kind: "establishment",
        firstname: "Philippe",
        lastname: "Didier",
      },
    });

    expect(opaqueEmail).toBe(
      "philippe_didier__ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274_e@reply.immersion-facile.beta.gouv.fr",
    );
  });
});
