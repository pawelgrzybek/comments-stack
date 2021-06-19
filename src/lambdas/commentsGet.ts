import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getCurrentDate,
  getCommentsLinked,
  getCommentsGroupedBySlug,
  generateResponse,
} from "../utils";

interface IComment {
  twitter: string;
  website: string;
  github: string;
  slug: string;
  createdAt: number;
  comment: string;
  parent: string;
  id: string;
  name: string;
  title: string;
  comments?: IComment[];
}

interface ICommentsGroupedBySlug {
  [key: string]: {
    counter: number;
    comments: IComment[];
  };
}

const {
  AWS_REGION: region,
  SECRETS: secrets,
  TABLE_NAME: TableName,
  BUCKET_NAME: Bucket,
} = process.env;

// clients init
const dbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });

const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Lambda invoked: comments-get", event);

  try {
    const accessTokenQuery = event?.queryStringParameters?.accessToken;
    const { accessToken } = JSON.parse(secrets!);

    console.log("Access token compare");
    if (accessTokenQuery !== accessToken) {
      console.error("Access token incorrect");

      return generateResponse(403, {
        message: "You don't have necessary permissions. Bye!",
      });
    }
    console.log("Access token correct");

    console.log("DB: items scan");
    const { Items, Count } = await dbClient.send(
      new ScanCommand({
        TableName,
      })
    );
    console.log("DB: items received");

    const unmarshalledItems = Items?.map((i) => unmarshall(i)) as IComment[];

    const { year, month, date, hours, minutes, seconds } = getCurrentDate();
    const Key = `${year}.${month}.${date}, ${hours}:${minutes}:${seconds}, ${Count}.json`;

    console.log("S3: object save", Key);
    await s3Client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: JSON.stringify(unmarshalledItems, null, 2),
      })
    );
    console.log("S3: object saved");

    const commentsGroupedBySlug = getCommentsGroupedBySlug(unmarshalledItems);
    const commentsSlugs = Object.keys(commentsGroupedBySlug);

    const commentsFormatted = commentsSlugs.reduce((acc, slug) => {
      const { counter, comments } = commentsGroupedBySlug[slug];

      acc[slug] = {
        counter,
        comments: getCommentsLinked(comments),
      };
      return acc;
    }, {} as ICommentsGroupedBySlug);

    return generateResponse(200, commentsFormatted);
  } catch (error) {
    console.error(error.message);

    return generateResponse(400, { message: error.message });
  }
};

export { handler };
