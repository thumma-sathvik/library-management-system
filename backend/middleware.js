import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Additional middleware functions can be added here
export const checkAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.userId);
    if (!admin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(403).json({ message: "User access required" });
    }
    next();
  } catch (error) {
    console.error('User check error:', error);
    res.status(500).json({ message: "Server error" });
  }
};