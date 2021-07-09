export default (username: string, domain: string) =>
  username.replace(domain, "").replace(new RegExp("/", "g"), "");
