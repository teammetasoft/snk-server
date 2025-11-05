const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const createError = require("http-errors");

const verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Access denied. No token." });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token." });
    }
};


const verifyJwt = (req, res, next) => {
    try {
        //checking if the cookies found in header
        if (!req.headers.cookie) {
            throw createError(403, "No cookies in header");
        }
        const cookies = req.headers.cookie.split(/[ =]+/);
        //checking cookies has the accessToken
        if (!cookies.includes("accessToken"))
            throw createError.Forbidden("No access token in the cookie.");

        //finding the index and accessing the authToken
        const index = cookies.indexOf("accessToken");
        // const token = cookies[index + 1];
        const jwtWithSemicolon = cookies[index + 1]
        const token = jwtWithSemicolon.replace(';', '');

        //verfiying authToken with jwt
        jwt.verify(token, process.env.JWT_AUTH_SECRET, async (err, user) => {
            try {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        // Log the expired token error
                        console.error('Token expired:', err);
                        return res.status(403).json({
                            success: false,
                            message: "Token expired, please log in again."
                        });
                    } else {
                        // Log the invalid token error
                        console.error('Invalid token:', err);
                        return res.status(403).json({
                            success: false,
                            message: "Invalid token, please log in again."
                        });
                    }
                }
                //putting that user to request header to access in the protected route
                req.user = user;

                const userData = await User.findById(req.user._id);
                if (userData) {
                    // block or unblock checking
                    if (userData?.status !== "active")
                        throw createError.Forbidden("Your Account is Suspended");

                    // Go to next middleware or route handler
                    next();
                } else {
                    throw createError.Forbidden("Invalid Account");
                }
            } catch (error) {
                console.log(error);

                res.status(error.status || 500).json({
                    success: false,
                    message: error.message || "Something went wrong",
                });
            }
        });
    } catch (error) {
        // Send error response to the client
        next(error);
    }
};

const checkRole = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Insufficient role" });
        }
        next();
    };
};

module.exports = { verifyToken, verifyJwt, checkRole };
