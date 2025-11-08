import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import RoleChangeHistory from "../models/RoleChangeHistory";
import { authMiddleware, requireAdmin } from "../utils/authMiddleware";

const router = Router();

// Obtener perfil propio
router.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password -resetToken -resetTokenExpires");
    if (!me) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(me);
  } catch (e: any) {
    res.status(500).json({ msg: "Error del servidor", error: e.message });
  }
});

// Actualizar perfil propio (no permite cambiar rol)
router.put("/me", authMiddleware, async (req: any, res) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    // Email y documentos no son editables desde el perfil propio
    const update: any = { firstName, lastName, username };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("-password -resetToken -resetTokenExpires");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ msg: "Error del servidor", error: e.message });
  }
});

// Listar todos los usuarios (solo admin)
router.get("/", authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().select("firstName lastName username email role createdAt");
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ msg: "Error del servidor", error: e.message });
  }
});

// Obtener un usuario por id (admin o el mismo usuario)
router.get("/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({ msg: "No autorizado" });
    }
    const user = await User.findById(id).select("-password -resetToken -resetTokenExpires");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ msg: "Error del servidor", error: e.message });
  }
});

// Actualizar usuario por id (admin puede todo; no admin solo si es él mismo y sin cambiar rol)
router.put("/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, email, password, role } = req.body;

    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({ msg: "No autorizado" });
    }

    const update: any = { firstName, lastName, username, email };
    if (req.user.role === "admin" && role) update.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const updated = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-password -resetToken -resetTokenExpires");
    if (!updated) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ msg: "Error del servidor", error: e.message });
  }
});

// Asignar o modificar rol de usuario (Tarea 2.3)
router.put("/rol", authMiddleware, requireAdmin, async (req: any, res) => {
  try {
    const { userId, newRole } = req.body;
    const modifierId = req.user.id;

    if (!userId || !newRole) {
      return res.status(400).json({ msg: "userId y newRole son requeridos" });
    }

    // Validar nuevo rol
    if (!["admin", "participant", "guest"].includes(newRole)) {
      return res.status(400).json({ msg: "Rol inválido" });
    }

    // Buscar usuario a modificar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Validar que solo administradores principales puedan modificar otros administradores
    // Si el usuario a modificar es admin y NO es el mismo que está modificando, no permitir
    // (a menos que sea el mismo usuario modificándose a sí mismo)
    if (user.role === "admin" && userId !== modifierId) {
      return res.status(403).json({ 
        msg: "Solo administradores principales pueden modificar roles de otros administradores" 
      });
    }

    // Evitar asignar el mismo rol
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

    // Crear registro de auditoría en HistorialRoles
    await RoleChangeHistory.create({
      modifiedUser: userId,
      previousRole,
      newRole,
      modifiedBy: modifierId,
    });

    // Log de auditoría
    console.log(`[AUDITORÍA] Rol modificado: Usuario ${userId}, Rol anterior: ${previousRole}, Rol nuevo: ${newRole}, Modificado por: ${modifierId}, Fecha: ${new Date().toISOString()}`);

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

export default router;


