interface Response {
  statusCode: number;
  headers: {
    [key: string]: string;
  };
  body: string;
}

export default (
  statusCode: number,
  data: Record<string, unknown>
): Response => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(data, null, 2),
});
