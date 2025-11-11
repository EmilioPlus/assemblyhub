import { Router, Request, Response } from "express";
import AssemblyDocument from "../models/AssemblyDocument";
import Assembly from "../models/Assembly";
import User from "../models/User";
import DocumentValidationHistory from "../models/DocumentValidationHistory";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";
import { documentUpload, handleDocumentUploadError } from "../config/documentUpload";
import fs from "fs";
import path from "path";
import { createEmailTransporter, getMailFrom } from "../utils/emailConfig";

const router = Router();

// Cargar documento de asamblea
// POST /api/documentos
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  documentUpload.single("document"),
  handleDocumentUploadError,
  async (req: any, res: Response) => {
    try {
      const { assemblyId, name } = req.body;
      const userId = req.user.id;

      // Validar campos obligatorios
      if (!assemblyId || !name) {
        // Eliminar archivo si se subió pero falta información
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          msg: "El ID de asamblea y el nombre del documento son obligatorios",
        });
      }

      // Validar que el archivo se haya subido
      if (!req.file) {
        return res.status(400).json({
          msg: "El documento es obligatorio",
        });
      }

      // Validar que la asamblea exista
      const assembly = await Assembly.findById(assemblyId);
      if (!assembly) {
        // Eliminar archivo si la asamblea no existe
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          msg: "Asamblea no encontrada",
        });
      }

      // Validar que el nombre sea único por asamblea
      const existingDocument = await AssemblyDocument.findOne({
        assembly: assemblyId,
        name: name.trim(),
      });

      if (existingDocument) {
        // Eliminar archivo si ya existe un documento con ese nombre
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          msg: "Ya existe un documento con ese nombre en esta asamblea",
        });
      }

      // Validar formato del archivo
      const allowedMimes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        // Eliminar archivo si el formato no es válido
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          msg: "El formato del archivo no es válido. Solo se permiten archivos PDF, JPG o PNG.",
        });
      }

      // Validar tamaño máximo (10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        // Eliminar archivo si excede el tamaño
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          msg: "El archivo supera el tamaño máximo permitido (10MB).",
        });
      }

      // Crear documento - usar path relativo desde la raíz del backend
      const relativePath = req.file.path.replace(/\\/g, "/"); // Normalizar separadores de ruta
      const document = await AssemblyDocument.create({
        assembly: assemblyId,
        name: name.trim(),
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: relativePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
        uploadedAt: new Date(),
        status: "pending", // Estado inicial: Pendiente
      });

      // Registrar en historial de validación
      await DocumentValidationHistory.create({
        documentId: document._id,
        assembly: assemblyId,
        action: "upload",
        userId: userId,
        newStatus: "pending",
      });

      // Populate para devolver información del usuario
      await document.populate("uploadedBy", "firstName lastName email");

      console.log(
        `[AUDITORÍA] Documento cargado: ${document._id}, Asamblea: ${assemblyId}, Usuario: ${userId}, Fecha: ${new Date().toISOString()}`
      );

      res.status(201).json({
        msg: "Documento cargado exitosamente",
        document: {
          _id: document._id,
          name: document.name,
          fileName: document.fileName,
          originalFileName: document.originalFileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          uploadedBy: document.uploadedBy,
          uploadedAt: document.uploadedAt,
          status: document.status,
          createdAt: document.createdAt,
        },
      });
    } catch (error: any) {
      // Eliminar archivo si hubo error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error al cargar documento:", error);
      
      // Manejar error de duplicado
      if (error.code === 11000) {
        return res.status(400).json({
          msg: "Ya existe un documento con ese nombre en esta asamblea",
        });
      }

      res.status(500).json({
        msg: "Error del servidor al cargar el documento",
        error: error.message,
      });
    }
  }
);

// Listar documentos pendientes de validación
// GET /api/documentos/pendientes
// IMPORTANTE: Esta ruta debe ir ANTES de /:assemblyId para evitar conflictos
router.get("/pendientes", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId } = req.query;

    // Construir query
    const query: any = { status: "pending" };
    if (assemblyId) {
      query.assembly = assemblyId;
    }

    // Obtener documentos pendientes
    const documents = await AssemblyDocument.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .populate("assembly", "name startDateTime endDateTime")
      .sort({ uploadedAt: -1 });

    res.json({
      msg: "Documentos pendientes obtenidos exitosamente",
      totalDocuments: documents.length,
      documents: documents.map((doc) => ({
        _id: doc._id,
        name: doc.name,
        fileName: doc.fileName,
        originalFileName: doc.originalFileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        assembly: doc.assembly,
        downloadUrl: `/api/documentos/download/${doc._id}`,
      })),
    });
  } catch (error: any) {
    console.error("Error al listar documentos pendientes:", error);
    res.status(500).json({
      msg: "Error del servidor al listar documentos pendientes",
      error: error.message,
    });
  }
});

// Descargar/Visualizar documento
// GET /api/documentos/download/:documentId
// IMPORTANTE: Esta ruta debe ir ANTES de /:assemblyId para evitar conflictos
router.get("/download/:documentId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener documento
    const document = await AssemblyDocument.findById(documentId).populate("assembly");
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    const assembly = document.assembly as any;

    // Solo administradores o participantes inscritos pueden descargar
    if (userRole !== "admin") {
      const isParticipant = assembly.participants.some(
        (p: any) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          msg: "Solo los participantes inscritos pueden descargar los documentos de esta asamblea",
        });
      }
      // Participantes solo pueden ver documentos aprobados
      if (document.status !== "approved") {
        return res.status(403).json({
          msg: "Solo se pueden visualizar documentos aprobados",
        });
      }
    }

    // Verificar que el archivo existe
    const filePath = path.join(process.cwd(), document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        msg: "El archivo no se encuentra en el servidor",
      });
    }

    // Enviar archivo
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.originalFileName)}"`
    );
    res.sendFile(path.resolve(filePath));
  } catch (error: any) {
    console.error("Error al descargar documento:", error);
    res.status(500).json({
      msg: "Error del servidor al descargar el documento",
      error: error.message,
    });
  }
});

// Obtener historial de validación de un documento
// GET /api/documentos/history/:documentId
// IMPORTANTE: Esta ruta debe ir ANTES de /:assemblyId para evitar conflictos
router.get("/history/:documentId", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;

    // Verificar que el documento exista (o existió)
    const history = await DocumentValidationHistory.find({ documentId })
      .populate("userId", "firstName lastName email")
      .populate("assembly", "name")
      .sort({ createdAt: -1 });

    if (history.length === 0) {
      return res.status(404).json({
        msg: "No se encontró historial para este documento",
      });
    }

    res.json({
      msg: "Historial obtenido exitosamente",
      documentId: documentId,
      history: history.map((h) => ({
        _id: h._id,
        action: h.action,
        userId: h.userId,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        observations: h.observations,
        createdAt: h.createdAt,
        // Información del validador/usuario
        validator: h.userId,
        date: h.createdAt,
        time: h.createdAt,
        decision: h.newStatus || h.previousStatus,
      })),
    });
  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      msg: "Error del servidor al obtener el historial",
      error: error.message,
    });
  }
});

// Listar documentos de una asamblea
// GET /api/documentos/:assemblyId
router.get("/:assemblyId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar que la asamblea exista
    const assembly = await Assembly.findById(assemblyId);
    if (!assembly) {
      return res.status(404).json({
        msg: "Asamblea no encontrada",
      });
    }

    // Solo administradores o participantes inscritos pueden ver los documentos
    if (userRole !== "admin") {
      const isParticipant = assembly.participants.some(
        (p: any) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          msg: "Solo los participantes inscritos pueden ver los documentos de esta asamblea",
        });
      }
    }

    // Obtener documentos
    // Si es admin, puede ver todos los documentos
    // Si es participante, solo puede ver documentos aprobados
    const query: any = { assembly: assemblyId };
    if (userRole !== "admin") {
      query.status = "approved"; // Solo documentos aprobados para participantes
    }

    const documents = await AssemblyDocument.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .populate("validatedBy", "firstName lastName email")
      .sort({ uploadedAt: -1 }); // Ordenar del más reciente al más antiguo

    res.json({
      msg: "Documentos obtenidos exitosamente",
      assembly: {
        _id: assembly._id,
        name: assembly.name,
        startDateTime: assembly.startDateTime,
        endDateTime: assembly.endDateTime,
      },
      totalDocuments: documents.length,
      documents: documents.map((doc) => ({
        _id: doc._id,
        name: doc.name,
        fileName: doc.fileName,
        originalFileName: doc.originalFileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        validatedBy: doc.validatedBy,
        validatedAt: doc.validatedAt,
        observations: doc.observations,
        createdAt: doc.createdAt,
        // URL para descargar/visualizar
        downloadUrl: `/api/documentos/download/${doc._id}`,
      })),
    });
  } catch (error: any) {
    console.error("Error al listar documentos:", error);
    res.status(500).json({
      msg: "Error del servidor al listar documentos",
      error: error.message,
    });
  }
});

// Aprobar documento
// PUT /api/documentos/:id/aprobar
// IMPORTANTE: Esta ruta debe ir ANTES de /:documentId para evitar conflictos
router.put("/:documentId/aprobar", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;
    const validatorId = req.user.id;
    const { observations } = req.body; // Observaciones opcionales

    // Obtener documento
    const document = await AssemblyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    // Validar que el documento esté pendiente
    if (document.status !== "pending") {
      return res.status(400).json({
        msg: `El documento ya está ${document.status === "approved" ? "aprobado" : "rechazado"}`,
      });
    }

    // Guardar estado anterior
    const previousStatus = document.status;

    // Actualizar documento
    document.status = "approved";
    document.validatedBy = validatorId;
    document.validatedAt = new Date();
    if (observations) {
      document.observations = observations.trim();
    }
    await document.save();

    // Registrar en historial de validación
    await DocumentValidationHistory.create({
      documentId: document._id,
      assembly: document.assembly,
      action: "approve",
      userId: validatorId,
      previousStatus: previousStatus,
      newStatus: "approved",
      observations: observations ? observations.trim() : undefined,
    });

    // Populate para obtener información del usuario que cargó el documento
    await document.populate("uploadedBy", "firstName lastName email");
    await document.populate("validatedBy", "firstName lastName email");
    await document.populate("assembly", "name");
    const uploadedByUser = document.uploadedBy as any;
    const validatorUser = document.validatedBy as any;
    const assemblyDoc = document.assembly as any;

    // Enviar notificación por email al usuario que cargó el documento
    let emailSent = false;
    let emailError = null;
    try {
      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: getMailFrom(),
        to: uploadedByUser.email,
        subject: `Documento aprobado: ${document.name}`,
        html: `
          <p>Hola ${uploadedByUser.firstName} ${uploadedByUser.lastName},</p>
          <p>Tu documento "<strong>${document.name}</strong>" ha sido aprobado.</p>
          <p>Detalles:</p>
          <ul>
            <li>Documento: ${document.name}</li>
            <li>Asamblea: ${assemblyDoc.name}</li>
            <li>Validador: ${validatorUser.firstName} ${validatorUser.lastName}</li>
            <li>Fecha de validación: ${new Date(document.validatedAt!).toLocaleString('es-ES')}</li>
            ${observations ? `<li>Observaciones: ${observations}</li>` : ''}
          </ul>
          <p>El documento ahora está disponible para los participantes de la asamblea.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log(
        `[NOTIFICACIÓN] Email enviado: Documento aprobado: ${document._id}, ` +
        `Usuario: ${uploadedByUser.email}, Fecha: ${new Date().toISOString()}`
      );
    } catch (emailErr: any) {
      console.error("Error al enviar correo de aprobación:", emailErr);
      emailError = emailErr.message;
      // No fallar la aprobación si el correo falla, solo loguear
      console.log(
        `[NOTIFICACIÓN] Error al enviar email: Documento aprobado: ${document._id}, ` +
        `Usuario: ${uploadedByUser.email}, Error: ${emailError}, Fecha: ${new Date().toISOString()}`
      );
    }

    res.json({
      msg: "Documento aprobado exitosamente. Se ha notificado al usuario.",
      document: {
        _id: document._id,
        name: document.name,
        status: document.status,
        validatedBy: document.validatedBy,
        validatedAt: document.validatedAt,
        observations: document.observations,
        assembly: document.assembly,
      },
    });
  } catch (error: any) {
    console.error("Error al aprobar documento:", error);
    res.status(500).json({
      msg: "Error del servidor al aprobar el documento",
      error: error.message,
    });
  }
});

// Rechazar documento
// PUT /api/documentos/:id/rechazar
// IMPORTANTE: Esta ruta debe ir ANTES de /:documentId para evitar conflictos
router.put("/:documentId/rechazar", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;
    const validatorId = req.user.id;
    const { observations } = req.body;

    // Validar que las observaciones sean obligatorias
    if (!observations || observations.trim() === "") {
      return res.status(400).json({
        msg: "Las observaciones son obligatorias para rechazar un documento",
      });
    }

    // Obtener documento
    const document = await AssemblyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    // Validar que el documento esté pendiente
    if (document.status !== "pending") {
      return res.status(400).json({
        msg: `El documento ya está ${document.status === "approved" ? "aprobado" : "rechazado"}`,
      });
    }

    // Guardar estado anterior
    const previousStatus = document.status;

    // Actualizar documento
    document.status = "rejected";
    document.validatedBy = validatorId;
    document.validatedAt = new Date();
    document.observations = observations.trim();
    await document.save();

    // Registrar en historial de validación
    await DocumentValidationHistory.create({
      documentId: document._id,
      assembly: document.assembly,
      action: "reject",
      userId: validatorId,
      previousStatus: previousStatus,
      newStatus: "rejected",
      observations: observations.trim(),
    });

    // Populate para obtener información del usuario que cargó el documento
    await document.populate("uploadedBy", "firstName lastName email");
    await document.populate("validatedBy", "firstName lastName email");
    await document.populate("assembly", "name");
    const uploadedByUser = document.uploadedBy as any;
    const validatorUser = document.validatedBy as any;
    const assemblyDoc = document.assembly as any;

    // Enviar notificación por email al usuario que cargó el documento con las razones del rechazo
    let emailSent = false;
    let emailError = null;
    try {
      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: getMailFrom(),
        to: uploadedByUser.email,
        subject: `Documento rechazado: ${document.name}`,
        html: `
          <p>Hola ${uploadedByUser.firstName} ${uploadedByUser.lastName},</p>
          <p>Tu documento "<strong>${document.name}</strong>" ha sido rechazado.</p>
          <p>Detalles:</p>
          <ul>
            <li>Documento: ${document.name}</li>
            <li>Asamblea: ${assemblyDoc.name}</li>
            <li>Validador: ${validatorUser.firstName} ${validatorUser.lastName}</li>
            <li>Fecha de validación: ${new Date(document.validatedAt!).toLocaleString('es-ES')}</li>
          </ul>
          <p><strong>Razones del rechazo:</strong></p>
          <p>${observations.trim()}</p>
          <p>Por favor, revisa el documento y vuelve a cargarlo con las correcciones necesarias.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log(
        `[NOTIFICACIÓN] Email enviado: Documento rechazado: ${document._id}, ` +
        `Usuario: ${uploadedByUser.email}, Fecha: ${new Date().toISOString()}`
      );
    } catch (emailErr: any) {
      console.error("Error al enviar correo de rechazo:", emailErr);
      emailError = emailErr.message;
      // No fallar el rechazo si el correo falla, solo loguear
      console.log(
        `[NOTIFICACIÓN] Error al enviar email: Documento rechazado: ${document._id}, ` +
        `Usuario: ${uploadedByUser.email}, Error: ${emailError}, Fecha: ${new Date().toISOString()}`
      );
    }

    res.json({
      msg: "Documento rechazado. Se ha notificado al usuario con las razones del rechazo.",
      document: {
        _id: document._id,
        name: document.name,
        status: document.status,
        validatedBy: document.validatedBy,
        validatedAt: document.validatedAt,
        observations: document.observations,
        assembly: document.assembly,
      },
    });
  } catch (error: any) {
    console.error("Error al rechazar documento:", error);
    res.status(500).json({
      msg: "Error del servidor al rechazar el documento",
      error: error.message,
    });
  }
});

// Eliminar documento
// DELETE /api/documentos/:id
// IMPORTANTE: Esta ruta debe ir AL FINAL, después de todas las rutas específicas
router.delete("/:documentId", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Obtener documento
    const document = await AssemblyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    // Guardar información del documento antes de eliminar para el historial
    const documentInfo = {
      _id: document._id,
      name: document.name,
      assembly: document.assembly,
      fileName: document.fileName,
      originalFileName: document.originalFileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt,
      status: document.status,
    };

    // Eliminar archivo del sistema de archivos
    const filePath = path.join(process.cwd(), document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Registrar en historial antes de eliminar
    await DocumentValidationHistory.create({
      documentId: document._id,
      assembly: document.assembly,
      action: "delete",
      userId: userId,
      previousStatus: document.status,
      newStatus: undefined,
      observations: `Documento eliminado: ${document.name}`,
    });

    // Eliminar documento de la base de datos
    await AssemblyDocument.findByIdAndDelete(documentId);

    console.log(
      `[AUDITORÍA] Documento eliminado: ${documentId}, Asamblea: ${document.assembly}, Usuario: ${userId}, Fecha: ${new Date().toISOString()}`
    );

    res.json({
      msg: "Documento eliminado exitosamente",
      deletedDocument: documentInfo,
    });
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    res.status(500).json({
      msg: "Error del servidor al eliminar el documento",
      error: error.message,
    });
  }
});

export default router;
