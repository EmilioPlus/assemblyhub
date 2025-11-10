import { Router, Request, Response } from "express";
import multer from "multer";
import Delegate from "../models/Delegate";
import Assembly from "../models/Assembly";
import DelegateAuditLog from "../models/DelegateAuditLog";
import User from "../models/User";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";
import upload from "../config/upload";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const router = Router();

// Manejo de errores de multer para validación de archivo
const handleMulterError = (err: any, req: any, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        msg: "El archivo supera el tamaño máximo permitido (5MB)." 
      });
    }
  }
  if (err) {
    return res.status(400).json({ 
      msg: err.message || "Error al procesar el archivo" 
    });
  }
  next();
};

// Registro de delegado (Historia 1: DEL-001)
// Endpoint: /api/delegados/registrar
router.post("/registrar", authMiddleware, upload.single("powerOfAttorney"), handleMulterError, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { 
      assembly, 
      firstName, 
      secondName, 
      firstLastName, 
      secondLastName, 
      documentType, 
      documentNumber, 
      email,
      sharesDelegated 
    } = req.body;

    // Validar campos obligatorios
    if (!assembly || !firstName || !firstLastName || !documentType || !documentNumber || !email || !sharesDelegated) {
      return res.status(400).json({ 
        msg: "Debe completar todos los campos obligatorios" 
      });
    }

    // Validar que el archivo se haya subido (Historia 2: DEL-002)
    if (!req.file) {
      return res.status(400).json({ 
        msg: "El documento de poder es obligatorio" 
      });
    }

    // Verificar que el archivo se haya guardado correctamente
    const uploadedFilePath = req.file.path;
    const absoluteFilePath = path.isAbsolute(uploadedFilePath) 
      ? uploadedFilePath 
      : path.join(process.cwd(), uploadedFilePath);
    
    if (!fs.existsSync(absoluteFilePath)) {
      console.error(`❌ Archivo no encontrado después de upload: ${absoluteFilePath}`);
      return res.status(500).json({ 
        msg: "Error al guardar el archivo. Por favor, intente nuevamente." 
      });
    }

    // Validar formato PDF (Historia 2: DEL-002)
    if (path.extname(req.file.originalname).toLowerCase() !== ".pdf") {
      // Eliminar archivo si no es PDF
      if (fs.existsSync(absoluteFilePath)) {
        fs.unlinkSync(absoluteFilePath);
      }
      return res.status(400).json({ 
        msg: "El formato del archivo no es válido. Solo se permiten archivos PDF." 
      });
    }

    // Validar tamaño máximo 5MB (Historia 2: DEL-002)
    if (req.file.size > 5 * 1024 * 1024) {
      // Eliminar archivo si excede el tamaño
      if (fs.existsSync(absoluteFilePath)) {
        fs.unlinkSync(absoluteFilePath);
      }
      return res.status(400).json({ 
        msg: "El archivo supera el tamaño máximo permitido (5MB)." 
      });
    }

    // Validar que el participante esté inscrito en la asamblea
    const userAssembly = await Assembly.findById(assembly);
    if (!userAssembly) {
      // Eliminar archivo si la asamblea no existe
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Verificar si el usuario es participante (compatible con array de ObjectId o strings)
    const isParticipant = userAssembly.participants.some(
      (p: any) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      // Eliminar archivo si el usuario no es participante
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(403).json({ 
        msg: "Solo participantes inscritos pueden registrar delegados" 
      });
    }

    // Validar número de acciones (Historia 1: DEL-001)
    const shares = parseInt(sharesDelegated);
    if (isNaN(shares) || shares <= 0) {
      // Eliminar archivo si las acciones son inválidas
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(400).json({ 
        msg: "El número de acciones a delegar debe ser mayor a 0" 
      });
    }

    // Validar que no exceda acciones disponibles (asumiendo que el usuario tiene un campo shares)
    // Por ahora, validamos que el número sea razonable (máximo 1,000,000)
    // TODO: Implementar campo shares en modelo User cuando esté disponible
    if (shares > 1000000) {
      // Eliminar archivo si excede el límite
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(400).json({ 
        msg: "El número de acciones a delegar excede el límite permitido" 
      });
    }

    // Verificar si ya existe un delegado para este participante en esta asamblea
    const existingDelegate = await Delegate.findOne({
      participant: userId,
      assembly: assembly,
    });

    if (existingDelegate) {
      // Eliminar archivo si ya existe un delegado
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(400).json({ 
        msg: "Ya tienes un delegado registrado para esta asamblea" 
      });
    }

    // Verificar si el número de documento del delegado ya está registrado para esta asamblea
    const existingDocument = await Delegate.findOne({
      assembly: assembly,
      documentNumber: documentNumber,
    });

    if (existingDocument) {
      // Eliminar archivo si el documento ya está registrado
      if (req.file) {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }
      return res.status(400).json({ 
        msg: "Este documento ya está registrado como delegado para esta asamblea" 
      });
    }

    // Normalizar la ruta del archivo (usar ruta relativa desde process.cwd())
    // req.file.path ya es relativa desde donde se ejecuta el proceso
    let normalizedFilePath = uploadedFilePath;
    
    // Si es absoluta, convertir a relativa
    if (path.isAbsolute(normalizedFilePath)) {
      const cwd = process.cwd();
      normalizedFilePath = path.relative(cwd, normalizedFilePath);
    }
    
    // Normalizar separadores de ruta (usar / para consistencia)
    normalizedFilePath = normalizedFilePath.replace(/\\/g, "/");

    console.log(`📁 Archivo guardado: ${normalizedFilePath}`);
    console.log(`📁 Ruta absoluta: ${path.join(process.cwd(), normalizedFilePath)}`);
    console.log(`📁 Archivo existe: ${fs.existsSync(path.join(process.cwd(), normalizedFilePath))}`);

    // Crear el delegado
    const delegate = await Delegate.create({
      participant: userId,
      assembly: assembly,
      firstName,
      secondName,
      firstLastName,
      secondLastName,
      documentType,
      documentNumber,
      email,
      sharesDelegated: shares,
      powerOfAttorneyFile: normalizedFilePath,
    });

    // Enviar correo al delegado (Historia 4: DEL-004)
    let emailSent = false;
    let emailError = null;
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.MAIL_FROM || 'AssemblyHub <no-reply@assemblyhub.local>',
        to: email,
        subject: 'Has sido registrado como delegado para una asamblea',
        html: `
          <p>Hola ${firstName} ${firstLastName},</p>
          <p>Has sido registrado como delegado para la asamblea "${userAssembly.name}".</p>
          <p>Detalles:</p>
          <ul>
            <li>Asamblea: ${userAssembly.name}</li>
            <li>Fecha de inicio: ${new Date(userAssembly.startDateTime).toLocaleDateString()}</li>
            <li>Fecha de cierre: ${new Date(userAssembly.endDateTime).toLocaleDateString()}</li>
            <li>Acciones delegadas: ${shares}</li>
          </ul>
          <p>Por favor, valida tu documento de poder antes del inicio de la asamblea.</p>
          <p>Credenciales de acceso: Utiliza el correo ${email} para acceder al sistema.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (emailErr: any) {
      console.error("Error al enviar correo:", emailErr);
      emailError = emailErr.message;
      // No fallar el registro si el correo falla, solo loguear
    }

    // Registrar auditoría (Historia 7: DEL-007)
    await DelegateAuditLog.create({
      participant: userId,
      delegate: delegate._id,
      assembly: assembly,
      action: "register",
      registeredBy: userId,
      documentStatus: "pending",
      emailSent: emailSent,
      emailSentAt: emailSent ? new Date() : undefined,
      emailDestination: email,
      notes: emailError ? `Error al enviar correo: ${emailError}` : undefined,
    });

    res.status(201).json({ 
      msg: "Delegado registrado exitosamente. Se ha enviado una notificación al delegado.",
      delegate 
    });
  } catch (error: any) {
    console.error("Error al registrar delegado:", error);
    
    // Eliminar archivo si hay un error no manejado
    if (req.file) {
      try {
        const absoluteFilePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(process.cwd(), req.file.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
          console.log(`🗑️ Archivo eliminado después de error: ${absoluteFilePath}`);
        }
      } catch (deleteError) {
        console.error("Error al eliminar archivo después de error:", deleteError);
      }
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        msg: "Ya existe un delegado con estos datos para esta asamblea" 
      });
    }
    
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Validar documento de poder (Historia 6: DEL-006)
// Endpoint: /api/delegados/validar/:id
router.put("/validar/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: "approved" o "rejected"

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        msg: "Estado inválido. Debe ser 'approved' o 'rejected'" 
      });
    }

    const delegate = await Delegate.findById(id);
    if (!delegate) {
      return res.status(404).json({ msg: "Delegado no encontrado" });
    }

    // Actualizar estado de validación
    delegate.powerOfAttorneyValidation.status = status;
    delegate.powerOfAttorneyValidation.validatedBy = req.user.id;
    delegate.powerOfAttorneyValidation.validatedAt = new Date();
    if (notes) {
      delegate.powerOfAttorneyValidation.notes = notes;
    }

    await delegate.save();

    // Registrar auditoría (Historia 7: DEL-007)
    await DelegateAuditLog.create({
      participant: delegate.participant,
      delegate: delegate._id,
      assembly: delegate.assembly,
      action: "validate",
      registeredBy: req.user.id,
      documentStatus: status,
      notes: notes,
    });

    res.json({ 
      msg: `Documento ${status === "approved" ? "validado" : "rechazado"} exitosamente`,
      delegate 
    });
  } catch (error: any) {
    console.error("Error al validar documento:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener documento de poder (Historia 6: DEL-006)
router.get("/documento/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const delegate = await Delegate.findById(id);
    
    if (!delegate) {
      return res.status(404).json({ msg: "Delegado no encontrado" });
    }

    // Obtener la ruta del archivo (puede ser relativa o absoluta)
    let filePath = delegate.powerOfAttorneyFile;
    
    // Si la ruta es relativa, construir la ruta absoluta desde process.cwd()
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }
    
    // Normalizar la ruta
    filePath = path.normalize(filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${filePath}`);
      console.error(`   Ruta almacenada en BD: ${delegate.powerOfAttorneyFile}`);
      return res.status(404).json({ 
        msg: "El archivo no se encuentra en el servidor",
      });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error: any) {
    console.error("Error al obtener documento:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Listar todos los delegados para administradores (Historia 6: DEL-006)
// Nota: Esta ruta debe estar antes de las rutas con parámetros
router.get("/all", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { status, assembly } = req.query;
    let query: any = {};

    if (status) {
      query["powerOfAttorneyValidation.status"] = status;
    }
    if (assembly) {
      query.assembly = assembly;
    }

    const delegates = await Delegate.find(query)
      .populate("participant", "firstName lastName email")
      .populate("assembly", "name startDateTime endDateTime")
      .populate("powerOfAttorneyValidation.validatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ delegates });
  } catch (error: any) {
    console.error("Error al obtener delegados:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener delegados del participante actual
router.get("/my-delegates", authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const delegates = await Delegate.find({ participant: userId })
      .populate("assembly", "name startDateTime endDateTime")
      .populate("powerOfAttorneyValidation.validatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ delegates });
  } catch (error: any) {
    console.error("Error al obtener delegados:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener asambleas disponibles para el participante actual (inscrito y sin delegado)
router.get("/available-assemblies", authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Obtener asambleas en las que está inscrito
    const assemblies = await Assembly.find({
      participants: userId,
      endDateTime: { $gte: new Date() } // Solo asambleas futuras o en curso
    }).select("name startDateTime endDateTime");

    // Obtener asambleas que ya tienen delegado registrado
    const delegates = await Delegate.find({ participant: userId }).select("assembly");
    const assemblyIdsWithDelegate = delegates.map(d => d.assembly.toString());

    // Filtrar asambleas disponibles
    const availableAssemblies = assemblies.filter(
      (assembly) => !assemblyIdsWithDelegate.includes((assembly as any)._id.toString())
    );

    res.json({ assemblies: availableAssemblies });
  } catch (error: any) {
    console.error("Error al obtener asambleas disponibles:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Consultar delegado asignado a un participante (GET /delegados/:asamblea/:participante)
// IMPORTANTE: Esta ruta debe estar DESPUÉS de las rutas específicas como /all, /my-delegates, etc.
router.get("/:assemblyId/:participantId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId, participantId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar que la asamblea exista
    const assembly = await Assembly.findById(assemblyId);
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Validar que el participante exista
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ msg: "Participante no encontrado" });
    }

    // Validar permisos: solo administradores o el mismo participante pueden consultar
    if (userRole !== "admin" && userId !== participantId) {
      return res.status(403).json({ 
        msg: "No tiene permiso para consultar el delegado de este participante" 
      });
    }

    // Buscar delegado
    const delegate = await Delegate.findOne({
      assembly: assemblyId,
      participant: participantId,
    })
      .populate("participant", "firstName lastName email documentType documentNumber")
      .populate("assembly", "name startDateTime endDateTime")
      .populate("powerOfAttorneyValidation.validatedBy", "firstName lastName email");

    if (!delegate) {
      return res.status(404).json({ 
        msg: "No se encontró un delegado asignado a este participante para esta asamblea",
        hasDelegate: false
      });
    }

    res.json({ 
      msg: "Delegado encontrado",
      delegate,
      hasDelegate: true
    });
  } catch (error: any) {
    console.error("Error al consultar delegado:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener historial de auditoría (Historia 7: DEL-007)
router.get("/auditoria", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { participant, assembly, action } = req.query;
    let query: any = {};

    if (participant) query.participant = participant;
    if (assembly) query.assembly = assembly;
    if (action) query.action = action;

    const logs = await DelegateAuditLog.find(query)
      .populate("participant", "firstName lastName email")
      .populate("delegate")
      .populate("assembly", "name")
      .populate("registeredBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ logs });
  } catch (error: any) {
    console.error("Error al obtener auditoría:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Mantener endpoint anterior para compatibilidad (redirige a /registrar)
// Nota: Este endpoint debe estar después de las rutas específicas

export default router;
