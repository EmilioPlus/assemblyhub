import { Router, Request, Response } from "express";
import Assembly from "../models/Assembly";
import User from "../models/User";
import Delegate from "../models/Delegate";
import AssemblyAccessCode from "../models/AssemblyAccessCode";
import VerificationCode from "../models/VerificationCode";
import AccessAttempt from "../models/AccessAttempt";
import AssemblyAccess from "../models/AssemblyAccess";
import crypto from "crypto";
import { createEmailTransporter, getMailFrom } from "../utils/emailConfig";

const router = Router();

// Función para generar código de acceso único (8 caracteres alfanuméricos)
const generateAccessCode = (): string => {
  return crypto.randomBytes(4).toString("hex").toUpperCase().substring(0, 8);
};

// Función para generar código de verificación (6 dígitos)
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para obtener la IP del cliente
const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

// POST /api/asambleas/acceso - Verificar código de acceso
router.post("/acceso", async (req: Request, res: Response) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        msg: "El código de acceso es requerido",
      });
    }

    // Buscar asamblea por código de acceso
    const assembly = await Assembly.findOne({ accessCode: accessCode.trim().toUpperCase() });

    if (!assembly) {
      // No registrar intento si el código no existe (seguridad)
      return res.status(404).json({
        msg: "Código de acceso inválido",
      });
    }

    // Verificar estado de la asamblea
    const now = new Date();
    const startDate = new Date(assembly.startDateTime);
    const endDate = new Date(assembly.endDateTime);

    // Si la asamblea no ha iniciado
    if (now < startDate) {
      const startDateTime = new Date(assembly.startDateTime);
      const dateStr = startDateTime.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = startDateTime.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return res.status(200).json({
        msg: `El evento iniciará el ${dateStr} a las ${timeStr}. Por favor espere.`,
        assembly: {
          id: assembly._id,
          name: assembly.name,
          startDateTime: assembly.startDateTime,
          endDateTime: assembly.endDateTime,
          status: assembly.status,
        },
        canAccess: false,
        reason: "not_started",
      });
    }

    // Si la asamblea ya finalizó
    if (now > endDate) {
      return res.status(200).json({
        msg: "Este evento ha finalizado",
        assembly: {
          id: assembly._id,
          name: assembly.name,
          startDateTime: assembly.startDateTime,
          endDateTime: assembly.endDateTime,
          status: assembly.status,
        },
        canAccess: false,
        reason: "completed",
      });
    }

    // Asamblea activa o programada (pero dentro del rango de fechas)
    return res.status(200).json({
      msg: "Código de acceso válido",
      assembly: {
        id: assembly._id,
        name: assembly.name,
        startDateTime: assembly.startDateTime,
        endDateTime: assembly.endDateTime,
        status: assembly.status,
      },
      canAccess: true,
    });
  } catch (error: any) {
    console.error("Error al verificar código de acceso:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// POST /api/asambleas/verificar - Verificar número de documento
router.post("/verificar", async (req: Request, res: Response) => {
  try {
    const { assemblyId, documentNumber } = req.body;

    if (!assemblyId || !documentNumber) {
      return res.status(400).json({
        msg: "El ID de asamblea y el número de documento son requeridos",
      });
    }

    // Buscar asamblea
    const assembly = await Assembly.findById(assemblyId);
    if (!assembly) {
      return res.status(404).json({
        msg: "Asamblea no encontrada",
      });
    }

    // Buscar primero si es un delegado autorizado por número de documento
    const delegate = await Delegate.findOne({
      assembly: assemblyId,
      documentNumber: documentNumber.trim(),
      "powerOfAttorneyValidation.status": "approved",
    });

    let user: any = null;
    let participantId: any = null;
    let isDelegate = false;
    let delegateId = null;

    if (delegate) {
      // Es un delegado autorizado - obtener el participante original
      user = await User.findById(delegate.participant);
      if (!user) {
        return res.status(404).json({
          msg: "Participante no encontrado",
        });
      }
      participantId = delegate.participant;
      isDelegate = true;
      delegateId = delegate._id;
    } else {
      // Buscar usuario por email (el documentNumber puede ser el email)
      user = await User.findOne({
        email: documentNumber.trim().toLowerCase(),
      });

      if (!user) {
        // Registrar intento fallido
        await AccessAttempt.create({
          assembly: assembly._id,
          documentNumber: documentNumber,
          status: "failed",
          reason: "No está inscrito en esta asamblea",
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || "unknown",
        });

        return res.status(404).json({
          msg: "No está inscrito en esta asamblea",
        });
      }

      // Verificar si el usuario está inscrito en la asamblea
      const isParticipant = assembly.participants.some(
        (p: any) => p.toString() === user._id.toString()
      );

      if (!isParticipant) {
        // No está inscrito ni es delegado
        await AccessAttempt.create({
          assembly: assembly._id,
          documentNumber: documentNumber,
          status: "failed",
          reason: "No está inscrito en esta asamblea",
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || "unknown",
        });

        return res.status(403).json({
          msg: "No está inscrito en esta asamblea",
        });
      }

      participantId = user._id;
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    // Eliminar códigos anteriores no usados del mismo participante y asamblea
    await VerificationCode.deleteMany({
      assembly: assemblyId,
      participant: participantId,
      isUsed: false,
    });

    // Crear nuevo código de verificación
    const verification = await VerificationCode.create({
      assembly: assemblyId,
      participant: participantId,
      email: user.email,
      code: verificationCode,
      expiresAt: expiresAt,
      isUsed: false,
      attempts: 0,
      sentAt: new Date(),
    });

    // Enviar código por email
    try {
      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: getMailFrom(),
        to: user.email,
        subject: `Código de verificación - ${assembly.name}`,
        html: `
          <p>Hola ${user.firstName} ${user.lastName},</p>
          <p>Tu código de verificación para acceder a la asamblea "${assembly.name}" es:</p>
          <h2 style="text-align: center; font-size: 32px; letter-spacing: 5px; color: #1976d2;">${verificationCode}</h2>
          <p>Este código expira en 2 horas.</p>
          <p>Si no solicitaste este código, por favor ignora este mensaje.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Código de verificación enviado a ${user.email}`);
    } catch (emailError: any) {
      console.error("Error al enviar código de verificación:", emailError);
      // No fallar si el email no se puede enviar, pero registrar el error
    }

    res.status(200).json({
      msg: "Código de verificación enviado a tu correo electrónico",
      verificationId: verification._id,
      email: user.email, // En desarrollo, puedes devolver el email para pruebas
    });
  } catch (error: any) {
    console.error("Error al verificar documento:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// POST /api/asambleas/codigo-verificacion - Verificar código de verificación
router.post("/codigo-verificacion", async (req: Request, res: Response) => {
  try {
    const { assemblyId, verificationId, code } = req.body;

    if (!assemblyId || !verificationId || !code) {
      return res.status(400).json({
        msg: "El ID de asamblea, ID de verificación y el código son requeridos",
      });
    }

    // Buscar código de verificación
    const verification = await VerificationCode.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        msg: "Código de verificación no encontrado",
      });
    }

    // Verificar que corresponda a la asamblea
    if (verification.assembly.toString() !== assemblyId) {
      return res.status(400).json({
        msg: "Código de verificación inválido",
      });
    }

    // Verificar si el código ya fue usado
    if (verification.isUsed) {
      return res.status(400).json({
        msg: "Este código de verificación ya fue utilizado",
      });
    }

    // Verificar si el código expiró
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        msg: "El código de verificación ha expirado",
      });
    }

    // Verificar bloqueo temporal
    const now = new Date();
    if (verification.lockUntil && verification.lockUntil > now) {
      const minutesLeft = Math.ceil(
        (verification.lockUntil.getTime() - now.getTime()) / (60 * 1000)
      );
      return res.status(423).json({
        msg: `Acceso bloqueado. Intente nuevamente en ${minutesLeft} minutos.`,
        attempts: verification.attempts,
      });
    }

    // Verificar código
    if (verification.code !== code.trim()) {
      // Incrementar intentos
      verification.attempts = (verification.attempts || 0) + 1;

      // Bloquear después de 3 intentos fallidos
      if (verification.attempts >= 3) {
        verification.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
        verification.attempts = 0; // Reset contador
        await verification.save();

        // Registrar intento bloqueado
        await AccessAttempt.create({
          assembly: assemblyId,
          verificationCode: code,
          status: "blocked",
          reason: "Código de verificación incorrecto. Bloqueado por 10 minutos.",
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || "unknown",
        });

        return res.status(423).json({
          msg: "Código de verificación incorrecto. Acceso bloqueado por 10 minutos.",
          attempts: 3,
          locked: true,
        });
      }

      await verification.save();

      // Registrar intento fallido
      await AccessAttempt.create({
        assembly: assemblyId,
        verificationCode: code,
        status: "failed",
        reason: `Código de verificación incorrecto. Intento ${verification.attempts} de 3.`,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] || "unknown",
      });

      return res.status(400).json({
        msg: `Código de verificación incorrecto. Intento ${verification.attempts} de 3.`,
        attempts: verification.attempts,
      });
    }

    // Código correcto - marcar como usado
    verification.isUsed = true;
    verification.usedAt = new Date();
    await verification.save();

    // Obtener información del participante
    const participant = await User.findById(verification.participant);
    if (!participant) {
      return res.status(404).json({
        msg: "Participante no encontrado",
      });
    }

    // Verificar si es delegado
    const delegate = await Delegate.findOne({
      assembly: assemblyId,
      participant: verification.participant,
    });

    let isDelegate = false;
    let delegateId = null;

    if (delegate && delegate.powerOfAttorneyValidation.status === "approved") {
      isDelegate = true;
      delegateId = delegate._id;
    }

    // Registrar acceso
    try {
      await AssemblyAccess.create({
        assembly: assemblyId,
        participant: verification.participant,
        isDelegate: isDelegate,
        delegateId: delegateId,
        accessTime: new Date(),
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] || "unknown",
      });
    } catch (accessError: any) {
      // Si ya existe un acceso, no es un error crítico
      if (accessError.code !== 11000) {
        console.error("Error al registrar acceso:", accessError);
      }
    }

    // Registrar intento exitoso
    await AccessAttempt.create({
      assembly: assemblyId,
      verificationCode: code,
      status: "success",
      reason: "Acceso exitoso",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Obtener información de la asamblea
    const assembly = await Assembly.findById(assemblyId);

    res.status(200).json({
      msg: `Bienvenido a ${assembly?.name || "la asamblea"}`,
      assembly: {
        id: assembly?._id,
        name: assembly?.name,
      },
      participant: {
        id: participant._id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
      },
      isDelegate: isDelegate,
      accessGranted: true,
    });
  } catch (error: any) {
    console.error("Error al verificar código de verificación:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

export default router;

