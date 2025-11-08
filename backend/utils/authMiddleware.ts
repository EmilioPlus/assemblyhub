import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: "admin" | "participant";
}

export const authMiddleware = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) {
      return res.status(401).json({ msg: "No autenticado" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está configurado");
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (e: any) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ msg: "No autenticado" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "No autorizado - Se requiere rol de administrador" });
  }
  next();
};

export const adminMiddleware = requireAdmin;