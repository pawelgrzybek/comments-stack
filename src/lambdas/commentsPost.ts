import { v4 as uuidv4 } from "uuid";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  generateTemplate,
  obfuscateId,
  generateResponse,
  normalizeUsername,
} from "../utils";
import { captureAWSv3Client } from "aws-xray-sdk-core";

const {
  AWS_REGION: region,
  TABLE_NAME: TableName,
  ACCESS_TOKEN: accessToken,
  NETLIFY_BUILD_HOOK: netlifyBuildHook,
  EMAIL_NOTIFICATIONS: emailNotifications,
} = process.env as Record<string, string>;

const dbClient = captureAWSv3Client(new DynamoDBClient({ region }) as any);
const sesClient = captureAWSv3Client(new SESClient({ region }) as any);

const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Lambda invoked: comments-post", event);

  if (!event?.body) {
    console.error("Required body is missing.");

    return generateResponse(403, { message: "Required body is missing." });
  }

  try {
    const { name, website, twitter, github, comment, parent, slug, title } =
      JSON.parse(event.body);

    if (parent !== "") {
      console.log(`Child comment reqest received for commend ID: ${parent}`);

      console.log("DB: items scan");
      const { Count } = await dbClient.send(
        new ScanCommand({
          TableName,
          FilterExpression: "contains( #commentid , :parentid)",
          ExpressionAttributeNames: {
            "#commentid": "id",
          },
          ExpressionAttributeValues: {
            ":parentid": { S: parent },
          },
        })
      );
      console.log("DB: items received");

      if (Count !== 1) {
        console.error("Incorrect parent ID provided", parent);
        throw new Error("Incorrect parent ID provided");
      }
    }

    const input = {
      id: uuidv4(),
      name,
      website,
      twitter: normalizeUsername(twitter, "https://twitter.com"),
      github: normalizeUsername(github, "https://github.com"),
      comment: sanitizeHtml(marked(comment)),
      parent,
      slug,
      title,
      createdAt: new Date().getTime().toString(),
    };

    console.log("DB: items save");
    await dbClient.send(
      new PutItemCommand({
        TableName,
        Item: marshall(input),
      })
    );
    console.log("DB: items saved");

    const obfuscatedId = obfuscateId(input.id);
    const obfuscatedParent = obfuscateId(input.parent);

    const apiUrl = `https://${event.requestContext.domainPrefix}.execute-api.${region}.amazonaws.com/${event.requestContext.stage}/`;
    console.log("apiUrl", apiUrl);

    const emailParams = {
      Source: emailNotifications,
      Destination: {
        ToAddresses: [emailNotifications],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: generateTemplate({
              ...input,
              obfuscatedId,
              comment,
              apiUrl,
              accessToken,
              netlifyBuildHook,
            }),
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `New comment from ${name} on "${title}"`,
        },
      },
    };

    console.log("Email: send", emailParams);
    await sesClient.send(new SendEmailCommand(emailParams));
    console.log("Email: sent");

    return generateResponse(200, {
      ...input,
      id: obfuscatedId,
      parent: obfuscatedParent,
    });
  } catch (error) {
    console.error(error);

    return generateResponse(400, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export { handler };
