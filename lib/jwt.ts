import { SignJWT, jwtVerify } from "jose";

// HMAC-signed JWT for stateless magic-link auth on serverless.
// In production, use AUTH_SECRET env var (Vercel: project settings).
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "ch-dev-secret-change-me-32-bytes!!"
);

export interface PortalToken {
  email: string;
  projectId: string;
}

export async function signPortalToken(
  payload: PortalToken,
  ttlSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(SECRET);
}

export async function verifyPortalToken(
  token: string
): Promise<PortalToken | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.email === "string" &&
      typeof payload.projectId === "string"
    ) {
      return { email: payload.email, projectId: payload.projectId };
    }
    return null;
  } catch {
    return null;
  }
}