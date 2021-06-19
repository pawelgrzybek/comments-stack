import { v4 as uuidv4 } from "uuid";
import marked from "marked";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { generateTemplate, obfuscateId, generateResponse } from "../utils";

const {
  AWS_REGION: region,
  SECRETS: secrets,
  TABLE_NAME: TableName,
  API_URL: apiUrl,
} = process.env as { [key: string]: string };

// clients init
const dbClient = new DynamoDBClient({ region });
const sesClient = new SESClient({ region });

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
      twitter,
      github,
      comment: marked(comment),
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

    const { accessToken, netlifyBuildHook, email } = JSON.parse(secrets);

    const emailParams = {
      Source: email,
      Destination: {
        ToAddresses: [email],
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
    console.error(error.message);

    return generateResponse(400, { message: error.message });
  }
};

export { handler };
