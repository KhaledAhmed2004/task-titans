import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index';
import { User } from '../app/modules/user/user.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id as string,
      clientSecret: config.google_client_secret as string,
      callbackURL: config.google_redirect_uri as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log('Google OAuth Profile:', profile);

        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('No email found in Google profile');
          return done(new Error('No email found in Google profile'), undefined);
        }

        let user = await User.findOne({ email });

        if (!user) {
          try {
            // Create new user with Google OAuth data - no password needed
            user = await User.create({
              name: profile.displayName || 'Google User',
              email,
              verified: true,
              googleId: profile.id,
              location: '', // default empty location
              gender: 'male', // default gender, can be updated later
              dateOfBirth: '', // default empty date of birth
              phone: '', // default empty phone
            });
          } catch (createError) {
            console.error('❌ Error creating user:', createError);
            return done(createError as Error, undefined);
          }
        } else if (!user.googleId) {
          console.log('Linking existing user with Google account');
          // Link existing user with Google account
          user.googleId = profile.id;
          user.verified = true;
          await user.save();
          console.log('User linked with Google account:', user._id);
        } else {
          console.log('Existing Google user found:', user._id);
        }

        return done(null, user);
      } catch (err) {
        console.error('Google OAuth Strategy Error:', err);
        return done(err as Error);
      }
    }
  )
);

export default passport;
