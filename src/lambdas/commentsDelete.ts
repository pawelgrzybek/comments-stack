import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { generateResponse } from "../utils";
import { captureAWSv3Client } from "aws-xray-sdk-core";

const {
  AWS_REGION: region,
  TABLE_NAME: TableName,
  SECRETS: secrets,
} = process.env as { [key: string]: string };

// clients init
const dbClient = captureAWSv3Client(new DynamoDBClient({ region }));

const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Lambda invoked: comments-delete", event);

  if (
    !event?.queryStringParameters?.id ||
    !event?.queryStringParameters?.accessToken
  ) {
    console.error("Required param is missing.");

    return generateResponse(403, { message: "Required param is missing." });
  }

  try {
    const accessTokenQuery = event.queryStringParameters.accessToken;
    const { accessToken } = JSON.parse(secrets!);

    console.log("Access token compare");
    if (accessTokenQuery !== accessToken) {
      console.error("Access token incorrect");

      return generateResponse(403, {
        message: "You don't have necessary permissions. Bye!",
      });
    }
    console.log("Access token matches");

    console.log("DB: record delete");
    await dbClient.send(
      new DeleteItemCommand({
        TableName,
        Key: {
          id: {
            S: event.queryStringParameters.id,
          },
        },
      })
    );
    console.log("DB: record deleted");

    return generateResponse(200, { message: "Comment deleted." });
  } catch (error) {
    console.error(error);

    return generateResponse(400, { message: "Uuuups!" });
  }
};

export { handler };
