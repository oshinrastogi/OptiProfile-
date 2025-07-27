import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from "url";
import authRoutes from './routes/authRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import cors from 'cors'
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import userModel from './models/userModel.js';
import adminRoutes from './routes/adminRoutes.js'

dotenv.config();// load env variables 
//dbconfig
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();


//middlewares
app.use(cors({
    origin: process.env.FRONTEND_API,
    credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser()); 

// Session Middleware 
app.use(session({
    secret: process.env.JWT_SECRET, // Use a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // `secure: true` in production
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// app.use(multer());

//routes
app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/auth',resumeRoutes);
app.use('/api/v1/auth',adminRoutes);
// app.use('/api/v1/product',productRoutes)
// app.use(express.static(path.join(__dirname,"public")));

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    scope: ['profile', 'email'] 
},

async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value; // Get email from profile

        // 1. Try to find user by Google ID
        let user = await userModel.findOne({ googleId: profile.id });

        if (user) {
            // Case 1: User found by Google ID (already linked)
            console.log("User found by Google ID:", user.email);
            return done(null, user); // Log them in
        }

        // 2. If not found by Google ID, try to find by Email
        user = await userModel.findOne({ email });

        if (user) {
            // Case 2: User found by email (already exists, likely traditional)
            // Link Google ID to existing account and save
            console.log("User found by email (linking Google ID):", user.email);
            user.googleId = profile.id;
            user.profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : user.profilePicture; // Update picture if available
            await user.save();
            return done(null, user); // Log them in
        }

        else {
            // New user, create an account
            user = new userModel({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value, // Assuming email is present and unique
                // profilePicture: profile.photos[0].value // Store profile picture if available
                // You might add a default password or mark as social login
            });
            await user.save();
            done(null, user);
        }
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Middleware to send JWT token as HTTP-only cookie
// You can reuse this from your manual login setup
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken(); // Assuming this method exists on your User model

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // e.g., 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax', // Adjust as needed, 'None' for cross-domain but requires secure:true
    };

    res.cookie('token', token, cookieOptions)
    
};


// Routes
app.get('/api/v1/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }) 
);

app.get('/api/v1/auth/google/callback',
    
    passport.authenticate('google'), // Removed session:false here for typical Passport flow, but if you don't want sessions, we'll handle it below.
    (req, res) => {
        // This block only runs on successful authentication
        sendTokenResponse(req.user, 200, res);
        return res.redirect(`${process.env.FRONTEND_API}`);

    },
    // Add an error handling middleware for Passport failures that don't redirect
    (err, req, res, next) => {
        console.error("Passport authentication error:", err);
        // You can send a specific error response or redirect here if needed
        res.status(500).send('Authentication failed');
    }
);
//rest api
app.get('/',(req,res)=>{
    res.send({
        message:'Welcome to Resume Master backend'
    })
})

const port =process.env.port || 8080;

app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
});


// installing morgan colors mongoose dotenv