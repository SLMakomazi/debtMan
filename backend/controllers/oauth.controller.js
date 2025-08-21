const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateToken } = require('../utils/auth');

// Generate JWT token for OAuth
const generateOAuthToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Handle OAuth success
const handleOAuthSuccess = (user, req, res) => {
  const token = generateOAuthToken(user);
  
  // Set cookie with token
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  // Redirect to frontend with token
  const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${token}${user.needsRegistration ? '&needsRegistration=true' : ''}`;
  res.redirect(redirectUrl);
};

// Complete OAuth registration
exports.completeOAuthRegistration = async (req, res, next) => {
  try {
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      idNumber, 
      dateOfBirth, 
      address, 
      city, 
      postalCode 
    } = req.body;

    // Get user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Update user in database
    const [updatedUser] = await db('users')
      .where({ id: decoded.id })
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        id_number: idNumber,
        date_of_birth: dateOfBirth,
        address,
        city,
        postal_code: postalCode,
        needs_registration: false,
        updated_at: db.fn.now()
      })
      .returning('*');

    // Generate new token with updated user data
    const newToken = generateToken(updatedUser);

    res.status(200).json({
      status: 'success',
      token: newToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        isAdmin: updatedUser.is_admin,
        needsRegistration: updatedUser.needs_registration
      }
    });
  } catch (error) {
    console.error('Complete OAuth registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to complete registration'
    });
  }
};

// Get OAuth user by email or create a new one
exports.findOrCreateOAuthUser = async (profile, provider) => {
  const { id, displayName, emails, name, photos } = profile;
  const email = emails && emails[0]?.value;
  
  if (!email) {
    throw new Error('No email provided by the OAuth provider');
  }

  // Check if user already exists
  const existingUser = await db('users')
    .where({ email })
    .first();

  if (existingUser) {
    // If user exists but registered with different provider
    if (existingUser.oauth_provider !== provider) {
      throw new Error(`This email is already registered with ${existingUser.oauth_provider}`);
    }
    
    // Update last login time
    await db('users')
      .where({ id: existingUser.id })
      .update({ last_login: db.fn.now() });
    
    return {
      ...existingUser,
      needsRegistration: existingUser.needs_registration
    };
  }

  // Create new user
  const [newUser] = await db('users')
    .insert({
      email,
      first_name: name?.givenName || displayName?.split(' ')[0] || 'User',
      last_name: name?.familyName || displayName?.split(' ').slice(1).join(' ') || 'Name',
      oauth_provider: provider,
      oauth_id: id,
      is_oauth: true,
      needs_registration: true,
      is_verified: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    })
    .returning('*');

  return {
    ...newUser,
    needsRegistration: true
  };
};

// Handle OAuth callback
exports.handleOAuthCallback = (req, res) => {
  if (req.user) {
    const token = generateToken(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${token}${req.user.needsRegistration ? '&needsRegistration=true' : ''}`;
    res.redirect(redirectUrl);
  } else {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};
