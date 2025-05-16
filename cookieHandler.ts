import type { APIContext } from "astro";

export function setCookieAndRedirect(
  context: APIContext,
  targetPath: string,
  cookies: Record<string, string>,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
  } = {},
): Response {
  const cookieStrings = Object.entries(cookies).map(([key, value]) => {
    const parts = [`${key}=${value}`];

    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.httpOnly !== false) parts.push("HttpOnly");
    if (options.secure !== false) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    parts.push(`Path=${options.path ?? "/"}`);

    return parts.join("; ");
  });

  const headers = new Headers();
  headers.append("Set-Cookie", cookieStrings.join(", "));
  headers.set("Location", targetPath);

  return new Response(null, {
    status: 302,
    headers,
  });
}

export function clearCookieAndRedirect(
  context: APIContext,
  location: string,
  cookieNames: string[],
  options: {
    path?: string;
  } = {},
): Response {
  const headers = new Headers();

  for (const name of cookieNames) {
    const parts = [
      `${name}=`,
      "Max-Age=0",
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      `Path=${options.path ?? "/"}`,
    ];
    headers.append("Set-Cookie", parts.join("; "));
  }

  headers.set("Location", location);

  return new Response(null, {
    status: 302,
    headers,
  });
}
