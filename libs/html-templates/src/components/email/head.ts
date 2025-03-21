// The following comes from : http://htmlemailboilerplate.com/
export const renderHead = (subject: string) => `
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style type="text/css">
    #outlook a {padding:0;}
    body{width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0;}
    .ExternalClass {width:100%;}
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
    #backgroundTable {margin:0; padding:0; width:100% !important; line-height: 100% !important;}
    img {outline:none; text-decoration:none; -ms-interpolation-mode: bicubic;}
    a img {border:none;}
    .image_fix {display:block;}
    p {margin: 1em 0;}
    h1, h2, h3, h4, h5, h6 {color: black !important;}
    h1 a, h2 a, h3 a, h4 a, h5 a, h6 a {color: blue !important;}
    h1 a:active, h2 a:active,  h3 a:active, h4 a:active, h5 a:active, h6 a:active {
      color: #000091 !important;
     }
    h1 a:visited, h2 a:visited,  h3 a:visited, h4 a:visited, h5 a:visited, h6 a:visited {
      color: #000091 !important;
    }
    ul {margin: 0;}
    ul li {margin: 0;}
    table td {border-collapse: collapse;}
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    a {color: #000091;}
    @media only screen and (max-device-width: 480px) {
      a[href^="tel"], a[href^="sms"] {
            text-decoration: none;
            color: #000091; /* or whatever your want */
            pointer-events: none;
            cursor: default;
          }
      .mobile_link a[href^="tel"], .mobile_link a[href^="sms"] {
            text-decoration: default;
            color: #000091 !important; /* or whatever your want */
            pointer-events: auto;
            cursor: default;
          }
    }
    @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
      a[href^="tel"], a[href^="sms"] {
            text-decoration: none;
            color: #000091;
            pointer-events: none;
            cursor: default;
          }
      .mobile_link a[href^="tel"], .mobile_link a[href^="sms"] {
            text-decoration: default;
            color: #000091 !important;
            pointer-events: auto;
            cursor: default;
          }
    }
  </style>
</head>
`;
