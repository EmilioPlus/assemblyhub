import { Router, Request, Response } from "express";
import AssemblyDocument from "../models/AssemblyDocument";
import Assembly from "../models/Assembly";
import User from "../models/User";
import DocumentValidationHistory from "../models/DocumentValidationHistory";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";
import { documentUpload, handleDocumentUploadError } from "../config/documentUpload";
import fs from "fs";
import path from "path";

const router = Router();

// Cargar documento de asamblea (HU-ASM-DOC-01)
// POST /api/assembly-documents/upload
router.post(
  "/upload",
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

// Listar documentos pendientes de validación (para administradores)
// GET /api/assembly-documents/pending/list
// IMPORTANTE: Esta ruta debe ir ANTES de /:assemblyId para que no se confunda con el parámetro
router.get("/pending/list", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId, status } = req.query;

    // Construir query
    const query: any = { status: status || "pending" };
    if (assemblyId) {
      query.assembly = assemblyId;
    }

    // Obtener documentos pendientes
    const documents = await AssemblyDocument.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .populate("assembly", "name")
      .sort({ uploadedAt: -1 });

    res.json({
      msg: "Documentos obtenidos exitosamente",
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
        downloadUrl: `/api/assembly-documents/download/${doc._id}`,
      })),
    });
  } catch (error: any) {
    console.error("Error al listar documentos pendientes:", error);
    res.status(500).json({
      msg: "Error del servidor al listar documentos",
      error: error.message,
    });
  }
});

// Obtener historial de validación de un documento
// GET /api/assembly-documents/history/:documentId
// IMPORTANTE: Esta ruta debe ir ANTES de /:assemblyId
router.get("/history/:documentId", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId } = req.params;

    // Verificar que el documento exista
    const document = await AssemblyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    // Obtener historial
    const history = await DocumentValidationHistory.find({ documentId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      msg: "Historial obtenido exitosamente",
      history: history.map((h) => ({
        _id: h._id,
        action: h.action,
        userId: h.userId,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        observations: h.observations,
        createdAt: h.createdAt,
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

// Listar documentos de una asamblea (HU-ASM-DOC-01)
// GET /api/assembly-documents/:assemblyId
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
        downloadUrl: `/api/assembly-documents/download/${doc._id}`,
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

// Descargar/Visualizar documento (HU-ASM-DOC-01)
// GET /api/assembly-documents/download/:documentId
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
    // document.filePath es relativo desde la raíz del backend (uploads/assembly-documents/...)
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

// Eliminar documento (HU-ASM-DOC-01)
// DELETE /api/assembly-documents/:documentId
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

// Validar documento (Aprobar o Rechazar) - HU-ASM-DOC-01
// POST /api/assembly-documents/validate
router.post("/validate", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { documentId, status, observations } = req.body;
    const validatorId = req.user.id;

    // Validar campos obligatorios
    if (!documentId || !status) {
      return res.status(400).json({
        msg: "El ID del documento y el estado son obligatorios",
      });
    }

    // Validar que el estado sea válido
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        msg: "El estado debe ser 'approved' o 'rejected'",
      });
    }

    // Validar que si es rechazo, haya observaciones
    if (status === "rejected" && (!observations || observations.trim() === "")) {
      return res.status(400).json({
        msg: "Debe incluir observaciones para rechazar un documento",
      });
    }

    // Obtener documento
    const document = await AssemblyDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        msg: "Documento no encontrado",
      });
    }

    // Guardar estado anterior
    const previousStatus = document.status;

    // Actualizar documento
    document.status = status as "approved" | "rejected";
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
      action: status === "approved" ? "approve" : "reject",
      userId: validatorId,
      previousStatus: previousStatus,
      newStatus: status,
      observations: observations ? observations.trim() : undefined,
    });

    // Populate para obtener información del usuario que cargó el documento
    await document.populate("uploadedBy", "firstName lastName email");
    const uploadedByUser = document.uploadedBy as any;

    // TODO: Enviar notificación por email al usuario que cargó el documento
    // Por ahora solo logueamos
    console.log(
      `[NOTIFICACIÓN] Documento ${status === "approved" ? "aprobado" : "rechazado"}: ${document._id}, ` +
      `Usuario: ${uploadedByUser.email}, Validador: ${validatorId}, Fecha: ${new Date().toISOString()}`
    );

    const message =
      status === "approved"
        ? "Documento aprobado exitosamente."
        : "Documento rechazado. Se ha notificado al usuario.";

    res.json({
      msg: message,
      document: {
        _id: document._id,
        name: document.name,
        status: document.status,
        validatedBy: document.validatedBy,
        validatedAt: document.validatedAt,
        observations: document.observations,
      },
    });
  } catch (error: any) {
    console.error("Error al validar documento:", error);
    res.status(500).json({
      msg: "Error del servidor al validar el documento",
      error: error.message,
    });
  }
});

export default router;

