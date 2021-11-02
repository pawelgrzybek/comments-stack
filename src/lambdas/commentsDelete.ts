import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { generateResponse } from "../utils";
import { captureAWSv3Client } from "aws-xray-sdk-core";

const {
  AWS_REGION: region,
  TABLE_NAME: TableName,
  ACCESS_TOKEN: accessToken,
} = process.env;

// clients init
// as any as a temporarly workaround for
// https://github.com/aws/aws-xray-sdk-node/issues/439
const dbClient = captureAWSv3Client(new DynamoDBClient({ region }) as any);

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

    console.log("Access token compare");
    if (accessTokenQuery !== accessToken) {
      console.error("Access token incorrect");

      return generateResponse(403, {
        message: "You don't have necessary permissions. Bye!",
      });
    }
    console.log("Access token matches");

    console.log("DB: record delete");
    const deleteItemCommandOutput = await dbClient.send(
      new DeleteItemCommand({
        TableName,
        Key: {
          id: {
            S: event.queryStringParameters.id,
          },
        },
        ReturnValues: "ALL_OLD",
      })
    );
    console.log(`Output: ${JSON.stringify(deleteItemCommandOutput, null, 2)}`);
    console.log("DB: record deleted");

    return generateResponse(200, {
      message: deleteItemCommandOutput?.Attributes
        ? `Comment ${deleteItemCommandOutput.Attributes.id.S} sucessfully deleted.`
        : `Comment not found.`,
    });
  } catch (error) {
    console.error(error);
    return generateResponse(400, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export { handler };
