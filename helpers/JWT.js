const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");

const genAccessToken = (user) => {
  return new Promise((resolve, reject) => {
    if (user._id) {
      resolve(
        jwt.sign(
          { _id: user._id, role: user.role },
          process.env.JWT_AUTH_SECRET,
          { expiresIn: "1d" }
        )
      );
    }
  });
};

const genRefreshToken = ({ _id,role }) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { _id: _id, role:role },
      process.env.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
      async (err, token) => {
        if (err) reject(createHttpError[500]);
        resolve(token);
      }
    );
  });
};

module.exports = { genAccessToken, genRefreshToken };
