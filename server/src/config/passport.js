const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        
        if (user) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value,
            isEmailVerified: true
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
  

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: '/api/auth/facebook/callback',
//       profileFields: ['id', 'displayName', 'photos', 'email']
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if user already exists
//         let user = await User.findOne({ email: profile.emails?.[0]?.value });
        
//         if (user) {
//           // If user exists but doesn't have facebookId, update it
//           if (!user.facebookId) {
//             user.facebookId = profile.id;
//             if (!user.avatar && profile.photos?.[0]?.value) {
//               user.avatar = profile.photos[0].value;
//             }
//             await user.save();
//           }
//         } else {
//           // Create new user if doesn't exist
//           user = await User.create({
//             name: profile.displayName,
//             email: profile.emails?.[0]?.value,
//             facebookId: profile.id,
//             avatar: profile.photos?.[0]?.value || '',
//             password: undefined // No password for social auth
//           });
//         }
        
//         return done(null, user);
//       } catch (error) {
//         return done(error, false);
//       }
//     }
//   )
// );
};