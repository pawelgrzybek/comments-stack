import { APIGatewayProxyHandler } from "aws-lambda";
import { generateResponse } from "../utils";

const { ACCESS_TOKEN: accessToken, NETLIFY_BUILD_HOOK: netlifyBuildHook } =
  process.env as Record<string, string>;

const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Lambda invoked: comments-publish", event);

  if (!event?.queryStringParameters?.accessToken) {
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

    await fetch(netlifyBuildHook, {
      method: "POST",
    });

    return generateResponse(200, {
      message: "Publish triggered.",
    });
  } catch (error) {
    console.error(error);
    return generateResponse(400, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export { handler };
