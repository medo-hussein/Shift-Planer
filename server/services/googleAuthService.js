import { OAuth2Client } from 'google-auth-library';
import dotenv from "dotenv";
dotenv.config();
import User from '../models/userModel.js';
import Company from '../models/companyModel.js';
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET);
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Get Google Auth URL for user to authenticate
 */
export const getGoogleAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return googleClient.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: scopes,
    prompt: 'consent' // Force consent to get refresh token
  });
};

/**
 * Exchange Google authorization code for tokens
 */
export const getGoogleTokens = async (code) => {
  try {
    const { tokens } = await googleClient.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Failed to get access token from Google');
    }

    return tokens;
  } catch (error) {
    console.error('Google token exchange error:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
};

/**
 * Get Google user profile from access token
 */
export const getGoogleUserProfile = async (accessToken) => {
  try {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Get user info from Google
    const response = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    return response.data;
  } catch (error) {
    console.error('Google user profile error:', error);
    throw new Error('Failed to get user profile from Google');
  }
};

/**
 * Find or create user from Google profile
 */
export const findOrCreateGoogleUser = async (googleProfile, tokens) => {
  try {
    const { id, email, name, picture } = googleProfile;

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId: id });

    if (user) {
      // Update existing Google user's tokens
      user.googleAccessToken = tokens.access_token;
      user.googleRefreshToken = tokens.refresh_token || user.googleRefreshToken;
      user.googleProfilePicture = picture;
      await user.save();
      
      return user;
    }

    // Check if user exists with same email
    user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Link Google account to existing user
      user.googleId = id;
      user.authProvider = 'google';
      user.googleAccessToken = tokens.access_token;
      user.googleRefreshToken = tokens.refresh_token;
      user.googleProfilePicture = picture;
      user.email_verified = true; // Google emails are verified
      user.is_active = true;
      await user.save();
      
      return user;
    }

    // Create new user from Google
    // For Google users, we need to create a company first
    const company = await Company.create({ 
      name: `${name}'s Company` 
    });

    user = await User.create({
      name: name,
      email: email.toLowerCase(),
      googleId: id,
      authProvider: 'google',
      googleProfilePicture: picture,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      email_verified: true, // Google emails are verified
      is_active: true,
      role: 'super_admin', // First Google user becomes superAdmin
      company: company._id,
      password: Math.random().toString(36).slice(-8) // Random password for Google users
    });

    return user;
  } catch (error) {
    console.error('Find/create Google user error:', error);
    throw new Error('Failed to create or find user from Google profile');
  }
};

/**
 * Refresh Google access token
 */
export const refreshGoogleToken = async (refreshToken) => {
  try {
    googleClient.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await googleClient.refreshAccessToken();
    
    return credentials;
  } catch (error) {
    console.error('Google token refresh error:', error);
    throw new Error('Failed to refresh Google access token');
  }
};

/**
 * Verify Google ID token (for client-side token validation)
 */
export const verifyGoogleIdToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
  } catch (error) {
    console.error('Google ID token verification error:', error);
    throw new Error('Invalid Google ID token');
  }
};

/**
 * Unlink Google account from user
 */
export const unlinkGoogleAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.authProvider !== 'google') {
      throw new Error('User is not linked with Google account');
    }

    // Remove Google-specific fields
    user.googleId = undefined;
    user.authProvider = 'local';
    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;
    user.googleProfilePicture = undefined;
    
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Unlink Google account error:', error);
    throw new Error('Failed to unlink Google account');
  }
};
