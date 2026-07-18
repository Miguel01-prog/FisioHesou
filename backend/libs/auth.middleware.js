import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'mi_secreto_superseguro'; 

export const verifyToken = (req, res, next) => {
  let token = req.cookies?.token;

  // Soporte para Bearer token en cabecera Authorization (para peticiones Ajax locales sin cookies)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = decoded;
    next();
  });
};

export const checkRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado para este rol' });
  }
  next();
};
