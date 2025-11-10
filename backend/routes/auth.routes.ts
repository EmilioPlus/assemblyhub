import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/User";
import LoginAttempt from "../models/LoginAttempt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { authMiddleware, requireAdmin } from "../utils/authMiddleware";
import { Resend } from "resend";

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña son requeridos" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "El usuario ya existe" });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    // Validar rol permitido
    const roleToSave = role && ["admin", "participant"].includes(role) ? role : "participant";
    const user = await User.create({ firstName, lastName, email, password: hash, role: roleToSave });
    
    res.status(201).json({ 
      msg: "Usuario creado exitosamente",
      user: { _id: user._id, id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, documentType: user.documentType, documentNumber: user.documentNumber, createdAt: user.createdAt }
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña son requeridos" });
    }

    // Verificar JWT_SECRET antes de continuar
    if (!process.env.JWT_SECRET) {
      console.error("Error en login: JWT_SECRET no está configurado");
      return res.status(500).json({ 
        msg: "Error de configuración del servidor. Contacte al administrador.",
        error: "JWT_SECRET no configurado"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      try {
        await LoginAttempt.create({
          email,
          status: "user_not_found",
          message: "El correo no está registrado.",
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "unknown",
        });
      } catch (logError) {
        console.error("Error al crear log de intento:", logError);
      }
      return res.status(404).json({ msg: "El correo no está registrado." });
    }

    // Verificar si la cuenta está bloqueada
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      try {
        await LoginAttempt.create({
          userId: user._id,
          email,
          status: "locked",
          message: "Cuenta bloqueada por 10 minutos.",
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "unknown",
        });
      } catch (logError) {
        console.error("Error al crear log de intento:", logError);
      }
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - now.getTime()) / (60 * 1000));
      return res.status(423).json({ msg: `Cuenta bloqueada por 10 minutos. Intente en ${minutesLeft} min.` });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      user.loginAttempts = attempts;
      if (attempts >= 3) {
        user.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
        user.loginAttempts = 0; // reset contador al bloquear
        await user.save();
        try {
          await LoginAttempt.create({
            userId: user._id,
            email,
            status: "locked",
            message: "Cuenta bloqueada por 10 minutos.",
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"] || "unknown",
          });
        } catch (logError) {
          console.error("Error al crear log de intento:", logError);
        }
        return res.status(423).json({ msg: "Cuenta bloqueada por 10 minutos." });
      }
      await user.save();
      try {
        await LoginAttempt.create({
          userId: user._id,
          email,
          status: "wrong_password",
          message: `Contraseña incorrecta. Intento ${attempts} de 3.`,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "unknown",
        });
      } catch (logError) {
        console.error("Error al crear log de intento:", logError);
      }
      return res.status(401).json({ msg: `Contraseña incorrecta. Intento ${attempts} de 3.` });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as SignOptions
    );
    
    // Resetear intentos y bloqueo, actualizar último acceso
    user.loginAttempts = 0;
    user.lockUntil = null as any;
    user.lastLogin = new Date();
    await user.save();

    try {
      await LoginAttempt.create({
        userId: user._id,
        email,
        status: "success",
        message: "Inicio de sesión exitoso",
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"] || "unknown",
      });
    } catch (logError) {
      console.error("Error al crear log de intento (éxito):", logError);
      // No bloqueamos el login si falla el log
    }

    res.json({ 
      token, 
      user: { 
        _id: user._id,
        id: user._id, // Mantener compatibilidad
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        createdAt: user.createdAt
      } 
    });
  } catch (error: any) {
    console.error("Error en login:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      msg: "Error del servidor al procesar el login",
      error: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor"
    });
  }
});

// Forgot Password - genera token y almacena expiración
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email es requerido" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "El correo no está asociado a ninguna cuenta" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    user.resetToken = token;
    user.resetTokenExpires = expires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Si RESEND_API_KEY está configurada, usar Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.MAIL_FROM as string,
        to: email,
        subject: "Recupera tu contraseña",
        html: `<p>Hola,</p>
        <p>Para recuperar tu contraseña haz clic en el siguiente enlace:</p>
        <p><a href="${resetLink}">Recuperar contraseña</a></p>
        <p>Este enlace expirará en 15 minutos.</p>`,
      });
      return res.json({ msg: "Se ha enviado un enlace de recuperación a su correo electrónico", resetLink });
    }

    // Fallback SMTP / Ethereal
    let smtpUser = process.env.SMTP_USER;
    let smtpPass = process.env.SMTP_PASS;
    let smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
    let smtpPort = Number(process.env.SMTP_PORT || 587);
    let secure = false;

    if (!smtpUser || !smtpPass) {
      const testAccount = await (nodemailer as any).createTestAccount();
      smtpUser = testAccount.user;
      smtpPass = testAccount.pass;
      smtpHost = "smtp.ethereal.email";
      smtpPort = 587;
      secure = false;
      console.warn("SMTP_USER/SMTP_PASS no configurados. Usando cuenta Ethereal temporal para pruebas.");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'AssemblyHub <no-reply@assemblyhub.local>',
      to: email,
      subject: 'Recupera tu contraseña',
      html: `<p>Hola,</p>
      <p>Para recuperar tu contraseña haz clic en el siguiente enlace:</p>
      <p><a href="${resetLink}">Recuperar contraseña</a></p>
      <p>Este enlace expirará en 15 minutos.</p>`
    });

    return res.json({
      msg: "Se ha enviado un enlace de recuperación a su correo electrónico",
      previewUrl: (nodemailer as any).getTestMessageUrl?.(info),
      resetLink,
    });
  } catch (error: any) {
    console.error("Error en forgot-password:", error);
    return res.status(500).json({ msg: "Error enviando correo de recuperación", error: error.message });
  }
});

// Reset Password - valida token y actualiza contraseña
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    // Validar formato de contraseña: mínimo 8 caracteres, una mayúscula, una minúscula y un número
    if (newPassword.length < 8) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ msg: "La contraseña debe contener al menos una mayúscula" });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ msg: "La contraseña debe contener al menos una minúscula" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ msg: "La contraseña debe contener al menos un número" });
    }

    const user = await User.findOne({ email, resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ msg: "Token inválido o expirado" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined as unknown as string;
    user.resetTokenExpires = undefined as unknown as Date;
    user.passwordResetAt = new Date();
    await user.save();

    return res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error: any) {
    console.error("Error en reset-password:", error);
    return res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
});

// Listar intentos de login (solo admin)
router.get("/login-attempts", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email, status, page = 1, limit = 20 } = req.query as { [key: string]: string };
    const query: any = {};
    if (email) query.email = { $regex: new RegExp(email, "i") };
    if (status) query.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      LoginAttempt.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoginAttempt.countDocuments(query),
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (error: any) {
    console.error("Error listando intentos de login:", error);
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
});

// Eliminar un intento de acceso específico
router.delete("/login-attempts/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await LoginAttempt.findByIdAndDelete(id);
    if (!attempt) {
      return res.status(404).json({ msg: "Intento de acceso no encontrado" });
    }
    console.log(`[AUDITORÍA] Intento de acceso eliminado: ${id} - Email: ${attempt.email}`);
    res.json({ msg: "Intento de acceso eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error eliminando intento de acceso:", error);
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
});

// Eliminar todos los intentos de acceso de un email específico
router.delete("/login-attempts", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (email) {
      // Eliminar todos los intentos de un email específico
      const result = await LoginAttempt.deleteMany({ email: { $regex: new RegExp(email as string, "i") } });
      console.log(`[AUDITORÍA] Intentos de acceso eliminados para email: ${email} - Total eliminados: ${result.deletedCount}`);
      res.json({ 
        msg: `Se eliminaron ${result.deletedCount} intentos de acceso para el email ${email}`,
        deletedCount: result.deletedCount
      });
    } else {
      // Eliminar todo el historial
      const result = await LoginAttempt.deleteMany({});
      console.log(`[AUDITORÍA] Todo el historial de intentos de acceso eliminado - Total eliminados: ${result.deletedCount}`);
      res.json({ 
        msg: `Se eliminó todo el historial de intentos de acceso (${result.deletedCount} registros)`,
        deletedCount: result.deletedCount
      });
    }
  } catch (error: any) {
    console.error("Error eliminando intentos de acceso:", error);
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
});

export default router;
