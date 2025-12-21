import {
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleUserProfile,
  findOrCreateGoogleUser,
  verifyGoogleIdToken,
  unlinkGoogleAccount,
} from "../services/googleAuthService.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

/**
 * Get Google OAuth URL for authentication
 */
export const getGoogleAuthUrlController = async (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();

    return res.json({
      success: true,
      data: {
        authUrl,
        message: "Use this URL to authenticate with Google",
      },
    });
  } catch (error) {
    console.error("Get Google auth URL error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to generate Google authentication URL",
    });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleAuthCallbackController = async (req, res) => {
  try {
    const { code, error } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/auth/error?message=${encodeURIComponent(
          "Google authentication failed"
        )}`
      );
    }

    if (!code) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/auth/error?message=${encodeURIComponent(
          "Authorization code not provided"
        )}`
      );
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);

    // Get user profile from Google
    const googleProfile = await getGoogleUserProfile(tokens.access_token);

    // Find or create user
    const user = await findOrCreateGoogleUser(googleProfile, tokens);

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendUrl}/auth/success?token=${accessToken}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google auth callback error:", error);
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/error?message=${encodeURIComponent("Authentication failed")}`
    );
  }
};

/**
 * Handle Google Sign-In with ID Token (for client-side flow)
 */
export const googleSignInController = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "MISSING_ID_TOKEN",
        message: "Google ID token is required",
      });
    }

    // Verify ID token with Google
    const googleProfile = await verifyGoogleIdToken(idToken);

    // Create mock tokens object for consistency
    const tokens = {
      access_token: "id_token_flow", // ID token flow doesn't provide access token
      refresh_token: null,
    };

    // Find or create user
    const user = await findOrCreateGoogleUser(googleProfile, tokens);

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({
      success: true,
      message: "Google authentication successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        googleProfilePicture: user.googleProfilePicture,
        company: user.company,
      },
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Google authentication failed",
    });
  }
};

/**
 * Link Google account to existing user
 */
export const linkGoogleAccountController = async (req, res) => {
  try {
    const { idToken } = req.body;
    const userId = req.user.id; // From authentication middleware

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "MISSING_ID_TOKEN",
        message: "Google ID token is required",
      });
    }

    // Verify ID token with Google
    const googleProfile = await verifyGoogleIdToken(idToken);

    // Check if Google account is already linked
    const existingGoogleUser = await User.findOne({
      googleId: googleProfile.id,
    });
    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: "GOOGLE_ACCOUNT_ALREADY_LINKED",
        message: "This Google account is already linked to another user",
      });
    }

    // Update user with Google info
    const user = await User.findByIdAndUpdate(
      userId,
      {
        googleId: googleProfile.id,
        authProvider: "google",
        googleProfilePicture: googleProfile.picture,
        emailVerified: true, // Google emails are verified
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Google account linked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        googleProfilePicture: user.googleProfilePicture,
      },
    });
  } catch (error) {
    console.error("Link Google account error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to link Google account",
    });
  }
};

/**
 * Unlink Google account from user
 */
export const unlinkGoogleAccountController = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware

    const user = await unlinkGoogleAccount(userId);

    return res.json({
      success: true,
      message: "Google account unlinked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Unlink Google account error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    if (error.message === "User is not linked with Google account") {
      return res.status(400).json({
        success: false,
        error: "NOT_LINKED_WITH_GOOGLE",
        message: "User is not linked with Google account",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to unlink Google account",
    });
  }
};

/**
 * Get Google authentication status
 */
export const getGoogleAuthStatusController = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware

    const user = await User.findById(userId).select(
      "authProvider googleId googleProfilePicture emailVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        isGoogleLinked: !!user.googleId,
        authProvider: user.authProvider,
        googleProfilePicture: user.googleProfilePicture,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Get Google auth status error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to get Google authentication status",
    });
  }
};
