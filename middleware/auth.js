const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let decoded;
  const header = req.get("Authorization");

  try {
    if (!header) {
      const err = new Error("No header found");
      err.status = 404;
      throw err;
    }
    const token = header.split(" ")[1];

    try {
      decoded = jwt.verify(
        token,
        "SuperStrongSecretnooneCancrackbecauseitissoRandom"
      );
    } catch (err) {
      req.isAuth = false;
      throw err;
    }

    if (!decoded) {
      req.isAuth = false;
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    }
    req.isAuth = true;
    req.userId = decoded.user_id;
    next();
  } catch (err) {
    next(err);
  }
};
