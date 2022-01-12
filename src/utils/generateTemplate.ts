{
  /* <mjml>
  <mj-head>
    <mj-attributes>
      <mj-class name="p"  font-size="16px" color="#333" font-family="-apple-system,BlinkMacSystemFont,segoe ui,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol" padding="0 0 24px 0" line-height="24px" />
      <mj-class name="b"  font-size="16px" color="#333" font-family="-apple-system,BlinkMacSystemFont,segoe ui,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol" padding="0" line-height="24px" font-weight="700" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section padding="24px">
      <mj-column>
        <mj-text mj-class="p" >Hi 👋</mj-text>
        <mj-text mj-class="p" >New comment on "I abandoned Facebook and Instagram for a month" on your blog bro.</mj-text>
        <mj-divider border-width="1px" border-style="dashed" border-color="#ccc" padding="0 0 24px 0" />
        <mj-text mj-class="b" >Name:</mj-text>
        <mj-text mj-class="p" >Pawel Grzybek</mj-text>
        <mj-text mj-class="b" >Website:</mj-text>
        <mj-text mj-class="p" ><a href="http://pawelgrzybek.com">http://pawelgrzybek.com</a></mj-text>
        <mj-text mj-class="b" >Twitter:</mj-text>
        <mj-text mj-class="p" ><a href="https://twitter.com/pawelgrzybek">https://twitter.com/pawelgrzybek</a></mj-text>
        <mj-text mj-class="b" >GitHub:</mj-text>
        <mj-text mj-class="p" ><a href="https://github.com/pawelgrzybek">https://github.com/pawelgrzybek</a></mj-text>
        <mj-text mj-class="b" >Comment:</mj-text>
        <mj-text mj-class="p" >Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum modi nobis maiores numquam dolorem reprehenderit ut voluptatibus exercitationem, doloribus ab. 👋</mj-text>
        <mj-divider border-width="1px" border-style="dashed" border-color="#ccc" padding="0 0 24px 0" />
        <mj-text mj-class="p" >Have a good day 🐘💨</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml> */
}

const generateSectionB = (content: string): string => `
<tr>
  <td
    align="left"
    style="
      font-size: 0px;
      padding: 0;
      word-break: break-word;
    "
  >
    <div
      style="
        font-family: -apple-system, BlinkMacSystemFont,
          segoe ui, Helvetica, Arial, sans-serif,
          apple color emoji, segoe ui emoji, segoe ui symbol;
        font-size: 16px;
        font-weight: 700;
        line-height: 24px;
        text-align: left;
        color: #333333;
      "
    >
      ${content}:
    </div>
  </td>
</tr>
`;

const generateSectionP = (content: string): string => `
<tr>
  <td
    align="left"
    style="
      font-size: 0px;
      padding: 0 0 24px 0;
      word-break: break-word;
    "
  >
    <div
      style="
        font-family: -apple-system, BlinkMacSystemFont,
          segoe ui, Helvetica, Arial, sans-serif,
          apple color emoji, segoe ui emoji, segoe ui symbol;
        font-size: 16px;
        line-height: 24px;
        text-align: left;
        color: #333333;
      "
    >
      ${content}
    </div>
  </td>
</tr>
`;

const generateSectionDivider = () => `
<tr>
  <td
    style="
      font-size: 0px;
      padding: 0 0 24px 0;
      word-break: break-word;
    "
  >
    <p
      style="
        border-top: dashed 1px #cccccc;
        font-size: 1px;
        margin: 0px auto;
        width: 100%;
      "
    ></p>
    <!--[if mso | IE
      ]><table
        align="center"
        border="0"
        cellpadding="0"
        cellspacing="0"
        style="
          border-top: dashed 1px #cccccc;
          font-size: 1px;
          margin: 0px auto;
          width: 552px;
        "
        role="presentation"
        width="552px"
      >
        <tr>
          <td style="height: 0; line-height: 0">&nbsp;</td>
        </tr>
      </table><!
    [endif]-->
  </td>
</tr>
`;

const generateSectionParent = (parent: string): string =>
  parent === ""
    ? ""
    : `
${generateSectionB("Parent")}
${generateSectionP(`${parent}`)}
`;

const generateSectionWebsite = (website: string): string =>
  website === ""
    ? ""
    : `
${generateSectionB("Website")}
${generateSectionP(`<a href="${website}">${website}</a>`)}
`;

const generateSectionTwitter = (twitter: string): string =>
  twitter === ""
    ? ""
    : `
${generateSectionB("Twitter")}
${generateSectionP(
  `<a href="https://twitter.com/${twitter}">https://twitter.com/${twitter}</a>`
)}
`;

const generateSectionGitHub = (github: string): string =>
  github === ""
    ? ""
    : `
${generateSectionB("GitHub")}
${generateSectionP(
  `<a href="https://github.com/${github}">https://github.com/${github}</a>`
)}
`;

interface ITemplateInfo {
  id: string;
  obfuscatedId: string;
  name: string;
  website: string;
  twitter: string;
  github: string;
  comment: string;
  slug: string;
  title: string;
  parent: string;
  apiUrl: string;
  accessToken: string;
}

export default ({
  id,
  obfuscatedId,
  name,
  website,
  twitter,
  github,
  comment,
  slug,
  title,
  parent,
  apiUrl,
  accessToken,
}: ITemplateInfo): string => `<!DOCTYPE html>
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <title></title>
    <!--[if !mso]><!-- -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!--<![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style type="text/css">
      #outlook a {
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
      p {
        display: block;
        margin: 13px 0;
      }
    </style>
    <!--[if mso]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if lte mso 11]>
      <style type="text/css">
        .mj-outlook-group-fix {
          width: 100% !important;
        }
      </style>
    <![endif]-->
    <style type="text/css">
      @media only screen and (min-width: 480px) {
        .mj-column-per-100 {
          width: 100% !important;
          max-width: 100%;
        }
      }
    </style>
    <style type="text/css"></style>
  </head>
  <body>
    <div>
      <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
      <div style="margin: 0px auto; max-width: 600px">
        <table
          align="center"
          border="0"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="width: 100%"
        >
          <tbody>
            <tr>
              <td
                style="
                  direction: ltr;
                  font-size: 0px;
                  padding: 24px;
                  text-align: center;
                "
              >
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:552px;" ><![endif]-->
                <div
                  class="mj-column-per-100 mj-outlook-group-fix"
                  style="
                    font-size: 0px;
                    text-align: left;
                    direction: ltr;
                    display: inline-block;
                    vertical-align: top;
                    width: 100%;
                  "
                >
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                    style="vertical-align: top"
                    width="100%"
                  >
                    ${generateSectionP("Hi 👋")}
                    ${generateSectionP(
                      `New comment on <a href="https://pawelgrzybek.com/${slug}/#comment-${obfuscatedId}">"${title}"</a> on your blog bro.`
                    )}

                    ${generateSectionDivider()}

                    ${generateSectionB("ID")}
                    ${generateSectionP(id)}

                    ${generateSectionParent(parent)}

                    ${generateSectionDivider()}

                    ${generateSectionB("Name")}
                    ${generateSectionP(name)}

                    ${generateSectionWebsite(website)}

                    ${generateSectionTwitter(twitter)}

                    ${generateSectionGitHub(github)}

                    ${generateSectionB("Comment")}
                    ${generateSectionP(comment)}

                    ${generateSectionDivider}

                    ${generateSectionB("Accept and re-deploy the website")}
                    ${generateSectionP(
                      `<a href="${apiUrl}publish?id=${id}&accessToken=${accessToken}">${apiUrl}publish</a>`
                    )}

                    ${generateSectionB("Delete the comment")}
                    ${generateSectionP(
                      `<a href="${apiUrl}delete?id=${id}&accessToken=${accessToken}">${apiUrl}delete?id=${id}</a>`
                    )}

                    ${generateSectionDivider}

                    ${generateSectionP("Have a good day 🐘💨")}
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--[if mso | IE]></td></tr></table><![endif]-->
    </div>
  </body>
</html>`;
