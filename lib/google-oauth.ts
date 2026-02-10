import { OAuth2Client } from "google-auth-library";

/**
 * Google OAuth Service - Handles id_token verification
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Create OAuth2 client
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Google user info from id_token
 */
export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Verify Google OAuth id_token and extract user info
 */
export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleUser | null> {
  try {
    if (!GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return null;
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      console.error("No payload in Google token");
      return null;
    }

    // Verify email is present and verified
    if (!payload.email) {
      console.error("No email in Google token");
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture,
      emailVerified: payload.email_verified || false,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}

/**
 * Check if Google OAuth is properly configured
 */
export function isGoogleAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}
