import { Router, Request, Response } from "express";
import User from "../models/User";
import RoleChangeHistory from "../models/RoleChangeHistory";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";

const router = Router();

// Actualizar rol de usuario
router.put("/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    const modifierId = req.user.id;

    // Validar nuevo rol
    if (!newRole || !["admin", "participant", "guest"].includes(newRole)) {
      return res.status(400).json({ msg: "Rol inválido" });
    }

    // Buscar usuario a modificar
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Verificar si el usuario a modificar es otro admin
    if (user.role === "admin" && id !== modifierId) {
      return res.status(403).json({ 
        msg: "Solo administradores principales pueden modificar roles de otros administradores" 
      });
    }

    // Verificar si se intenta asignar el mismo rol
    if (user.role === newRole) {
      return res.status(400).json({ 
        msg: "El usuario ya tiene este rol asignado" 
      });
    }

    // Registrar cambio en historial
    const previousRole = user.role;
    
    // Actualizar rol
    user.role = newRole;
    await user.save();

    // Crear registro de auditoría
    await RoleChangeHistory.create({
      modifiedUser: id,
      previousRole,
      newRole,
      modifiedBy: modifierId,
    });

    res.json({ 
      msg: "Rol asignado exitosamente",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener historial de cambios de roles
router.get("/history", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const history = await RoleChangeHistory.find()
      .populate("modifiedUser", "firstName lastName email")
      .populate("modifiedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ history });
  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Buscar usuarios
router.get("/search", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ msg: "Query es requerido" });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    res.json({ users });
  } catch (error: any) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

export default router;
