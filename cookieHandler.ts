import type { APIContext } from "astro";

export function setCookieAndRedirect(
  _context: APIContext,
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
  const headers = new Headers();
  
  // Set each cookie with its own Set-Cookie header
  Object.entries(cookies).forEach(([key, value]) => {
    const parts = [`${key}=${value}`];

    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.httpOnly !== false) parts.push("HttpOnly");
    if (options.secure !== false) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    parts.push(`Path=${options.path ?? "/"}`);

    // Append each cookie as a separate Set-Cookie header
    headers.append("Set-Cookie", parts.join("; "));
  });

  headers.set("Location", targetPath);

  return new Response(null, {
    status: 302,
    headers,
  });
}

export function clearCookieAndRedirect(
  _context: APIContext,
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
      "SameSite=Strict", // Changed from Strict to Lax to be more compatible with Netlify's CDN
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
