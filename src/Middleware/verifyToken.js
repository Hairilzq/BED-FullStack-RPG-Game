import jwt from 'jsonwebtoken';

// verifies JWT tokens and passes user Id forward
export const verifyToken = async (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ "error": "No Token provided" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}