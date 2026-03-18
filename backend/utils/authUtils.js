import JWT from 'jsonwebtoken';

export const setJwtCookie = (user, res) => {
    const token = JWT.sign({_id:user._id},process.env.JWT_SECRET,{
            expiresIn:"7d",}
        );
        
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax', 
    };

    res.cookie('token', token, cookieOptions)
};