import { sanitizeHtmlForPdf } from "./sanitizeHtmlForPdf";

const allowedOrigin = "https://immersion-facile.beta.gouv.fr";

describe("sanitizeHtmlForPdf", () => {
  it.each([
    {
      case: "clean HTML unchanged",
      input: "<h1>Hello</h1>",
      expected: "<h1>Hello</h1>",
    },
    {
      case: "strips inline script",
      input: '<p>ok</p><script>console.log("x")</script><p>end</p>',
      expected: "<p>ok</p><p>end</p>",
    },
    {
      case: "strips script with src",
      input:
        '<p>ok</p><script type="text/javascript" src="https://ext.com/inject.js"></script><p>end</p>',
      expected: "<p>ok</p><p>end</p>",
    },
    {
      case: "strips nested/overlapping script injections",
      input:
        '<p>ok</p><scr<script>alert("x")</script>ipt>alert("y")</script><p>end</p>',
      expected: "<p>ok</p><p>end</p>",
    },
    {
      case: "keeps allowed-origin link, removes external link",
      input: `<link rel="stylesheet" href="${allowedOrigin}/assets/dsfr.css"><link rel="stylesheet" href="https://external.com/inject.css">`,
      expected: `<link rel="stylesheet" href="${allowedOrigin}/assets/dsfr.css">`,
    },
    {
      case: "removes dns-prefetch and preconnect external links",
      input:
        '<link rel="dns-prefetch" href="https://client.crisp.chat"><link rel="preconnect" href="https://client.crisp.chat">',
      expected: "",
    },
    {
      case: "keeps link tags without href",
      input: '<link rel="icon" type="image/png">',
      expected: '<link rel="icon" type="image/png">',
    },
    {
      case: "strips chrome_annotation keeping content",
      input: "<p>Hello <chrome_annotation>world</chrome_annotation></p>",
      expected: "<p>Hello world</p>",
    },
    {
      case: "removes relative-path links (not absolutized)",
      input: '<link rel="stylesheet" href="/assets/app.css">',
      expected: "",
    },
    {
      case: "full document with all injection types",
      input: [
        "<html><head>",
        `<link rel="stylesheet" href="${allowedOrigin}/assets/dsfr.css">`,
        '<link rel="stylesheet" href="https://gc.kis.v2.scr.kaspersky-labs.com/main.css">',
        '<link rel="dns-prefetch" href="https://client.crisp.chat">',
        '<link rel="dns-prefetch" href="/local-assets/test.css">',
        "</head><body>",
        "<p>Hello <chrome_annotation>world</chrome_annotation></p>",
        '<script>console.log("injected")</script>',
        "</body></html>",
      ].join(""),
      expected: [
        "<html><head>",
        `<link rel="stylesheet" href="${allowedOrigin}/assets/dsfr.css">`,
        "</head><body>",
        "<p>Hello world</p>",
        "</body></html>",
      ].join(""),
    },
  ])("$case", ({ input, expected }) => {
    expect(sanitizeHtmlForPdf(input, allowedOrigin)).toBe(expected);
  });
});
