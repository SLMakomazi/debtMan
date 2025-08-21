const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const db = require('../config/db');
const oauthController = require('../controllers/oauth.controller');

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db('users').where({ id }).first();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const user = await oauthController.findOrCreateOAuthUser(profile, 'google');
    done(null, user);
  } catch (error) {
    done(error, false, { message: error.message });
  }
}));

// Microsoft OAuth Strategy
passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: process.env.MICROSOFT_CALLBACK_URL,
  scope: ['user.read'],
  tenant: process.env.MICROSOFT_TENANT_ID || 'common',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const user = await oauthController.findOrCreateOAuthUser(profile, 'microsoft');
    done(null, user);
  } catch (error) {
    done(error, false, { message: error.message });
  }
}));

// Microsoft OAuth Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorizationURL: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
    tokenURL: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    scope: ['user.read'],
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ where: { email: profile.emails[0].value } });
        
        if (!user) {
            // Create a new user with OAuth data
            const newUser = {
                id: uuidv4(),
                email: profile.emails[0].value,
                firstName: profile.name.givenName || '',
                lastName: profile.name.familyName || '',
                isOAuthUser: true,
                oauthProvider: 'microsoft',
                oauthId: profile.id,
                isVerified: true
            };
            
            // Create a temporary user in the database
            user = await User.create(newUser);
            
            // Return the user with needsRegistration flag
            return done(null, { ...user.get({ plain: true }), needsRegistration: true });
        }
        
        // If user exists but signed up with different provider
        if (user.oauthProvider && user.oauthProvider !== 'microsoft') {
            return done(null, false, { message: `You previously signed up with ${user.oauthProvider}. Please use that provider to log in.` });
        }
        
        // Update last login time
        await user.update({ lastLoginAt: new Date() });
        
        return done(null, user);
    } catch (error) {
        return done(error, false, { message: 'Error during Microsoft authentication' });
    }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
