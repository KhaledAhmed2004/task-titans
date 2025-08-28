// // src/config/passport.ts
// import passport from 'passport';
// import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
// import config from '../config';
// import { User } from '../app/modules/user/user.model';

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: config.google.clientID!,
//       clientSecret: config.google.clientSecret!,
//       callbackURL: config.google.callbackURL!,
//     },
//     // verify callback
//     async (accessToken: string, refreshToken: string, profile: GoogleProfile, done) => {
//       try {
//         const email = profile.emails?.[0]?.value;
//         if (!email) {
//           return done(new Error('No email found in Google profile'), undefined);
//         }

//         // find existing user
//         let user = await User.findOne({ email });

//         if (!user) {
//           // create new user (adjust fields for your User model)
//           user = await User.create({
//             name: profile.displayName,
//             email,
//             verified: true,      // social -> consider verified
//             googleId: profile.id,
//             // no password
//           });
//         } else if (!user.googleId) {
//           // update googleId if missing
//           user.googleId = profile.id;
//           await user.save();
//         }

//         return done(null, user);
//       } catch (err) {
//         return done(err as Error);
//       }
//     }
//   )
// );

// // we do NOT need serialize/deserialize for JWT flow (we'll use session: false)
// export default passport;

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
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found'), undefined);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            verified: true,
            googleId: profile.id,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
