const jwt = require("jsonwebtoken")

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization

  // Expect header like: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, "supersecretkey")
    req.admin = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" })
  }
}
