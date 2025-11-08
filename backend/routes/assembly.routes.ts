import { Router, Request, Response } from "express";
import Assembly from "../models/Assembly";
import AssemblyAuditLog from "../models/AssemblyAuditLog";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";

const router = Router();

// Crear asamblea (solo admin)
router.post("/", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { name, description, startDateTime, endDateTime, processType } = req.body;

    // Validar campos obligatorios
    if (!name || !startDateTime || !endDateTime || !processType) {
      return res.status(400).json({ 
        error: "Debe completar los campos obligatorios" 
      });
    }

    // Validar que fecha de cierre > fecha de inicio
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (endDate <= startDate) {
      return res.status(400).json({ 
        error: "Fechas inválidas" 
      });
    }

    // Validar tipo de proceso
    if (!["assembly", "voting"].includes(processType)) {
      return res.status(400).json({ 
        error: "Tipo de proceso inválido" 
      });
    }

    // Validar que no exista una asamblea activa con el mismo nombre y tipo
    const existingAssembly = await Assembly.findOne({
      name,
      processType,
      status: { $in: ["scheduled", "active"] }
    });

    if (existingAssembly) {
      return res.status(400).json({ 
        error: "Ya existe una asamblea activa con el mismo nombre y tipo" 
      });
    }

    const assembly = new Assembly({
      name,
      description,
      startDateTime,
      endDateTime,
      processType,
      createdBy: req.user.id,
    });

    await assembly.save();

    // Registrar log de auditoría en base de datos (Historia 10: ADM-ASAMBLEAS-010)
    await AssemblyAuditLog.create({
      assemblyId: assembly._id,
      action: "create",
      userId: req.user.id,
      details: {
        newData: {
          name: assembly.name,
          description: assembly.description,
          startDateTime: assembly.startDateTime,
          endDateTime: assembly.endDateTime,
          processType: assembly.processType,
        },
      },
    });

    console.log(`[AUDITORÍA] Asamblea creada: ${assembly._id}, Usuario: ${req.user.id}, Fecha: ${new Date().toISOString()}`);

    res.status(201).json({ 
      message: "Asamblea creada exitosamente",
      assembly 
    });
  } catch (error: any) {
    console.error("Error al crear asamblea:", error);
    
    // Manejo específico de errores de duplicidad
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "Ya existe una asamblea con estos datos" 
      });
    }
    
    res.status(500).json({ 
      error: "Error del servidor al crear la asamblea" 
    });
  }
});

// Listar asambleas (Historia 1: ADM-ASAMBLEAS-001)
// Endpoint /api/asambleas/listar para administradores
router.get("/listar", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { estado, tipo } = req.query;

    let query: any = {};
    
    // Filtrar por estado
    if (estado) {
      query.status = estado;
    }
    
    // Filtrar por tipo
    if (tipo) {
      query.processType = tipo;
    }

    const assemblies = await Assembly.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("participants", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Formatear respuesta según criterios y calcular estado real basado en fechas
    const now = new Date();
    const formattedAssemblies = assemblies.map((assembly) => {
      // Calcular estado real basado en fechas
      let estadoCalculado = assembly.status;
      const startDate = new Date(assembly.startDateTime);
      const endDate = new Date(assembly.endDateTime);
      
      // Solo recalcular si no está cancelada
      if (assembly.status !== "cancelled") {
        if (now < startDate) {
          estadoCalculado = "scheduled";
        } else if (now >= startDate && now <= endDate) {
          estadoCalculado = "active";
        } else if (now > endDate) {
          estadoCalculado = "completed";
        }
      }

      return {
        _id: assembly._id,
        Nombre: assembly.name,
        FechaInicio: assembly.startDateTime,
        FechaCierre: assembly.endDateTime,
        Tipo: assembly.processType,
        Estado: estadoCalculado,
        NumeroInscritos: assembly.participants.length,
        description: assembly.description,
        createdBy: assembly.createdBy,
        participants: assembly.participants,
        createdAt: assembly.createdAt,
        updatedAt: assembly.updatedAt,
      };
    });

    res.json({ assemblies: formattedAssemblies });
  } catch (error: any) {
    console.error("Error al listar asambleas:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Listar asambleas (endpoint original para participantes)
router.get("/", authMiddleware, async (req: any, res: Response) => {
  try {
    const { role } = req.user;

    let query: any = {};
    
    if (role === "participant") {
      // Participantes ven asambleas activas disponibles (sin filtrar por inscripción)
      const now = new Date();
      query = {
        $or: [
          { startDateTime: { $gte: now } }, // Próximas
          {
            startDateTime: { $lte: now },
            endDateTime: { $gte: now }
          } // En curso
        ]
      };
    }
    // Admin ve todas las asambleas (query vacío)

    const assemblies = await Assembly.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("participants", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ assemblies });
  } catch (error: any) {
    console.error("Error al listar asambleas:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Inscribirse a una asamblea (solo participants)
router.post("/:id/register", authMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (req.user.role === "admin") {
      return res.status(403).json({ 
        msg: "Los administradores no pueden inscribirse a asambleas" 
      });
    }

    const assembly = await Assembly.findById(id);
    
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Verificar si ya está inscrito
    const isAlreadyRegistered = assembly.participants.some(
      (p: any) => p.toString() === userId
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ msg: "Ya estás inscrito en esta asamblea" });
    }

    // Verificar que la asamblea aún no haya terminado
    const now = new Date();
    if (new Date(assembly.endDateTime) < now) {
      return res.status(400).json({ msg: "Esta asamblea ya ha finalizado" });
    }

    // Inscribir al participante
    assembly.participants.push(userId);
    await assembly.save();

    res.json({ 
      msg: "Te has inscrito exitosamente a la asamblea",
      assembly 
    });
  } catch (error: any) {
    console.error("Error al inscribirse:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Detalle de asamblea (Historia 2: ADM-ASAMBLEAS-002)
// Endpoint /api/asambleas/detalle/:id para administradores
router.get("/detalle/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const assembly = await Assembly.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("participants", "firstName lastName email");

    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    res.json({ assembly });
  } catch (error: any) {
    console.error("Error al obtener detalle de asamblea:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Editar asamblea (Historia 3: ADM-ASAMBLEAS-003)
// Endpoint /api/asambleas/editar/:id
router.put("/editar/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, startDateTime, endDateTime } = req.body;

    const assembly = await Assembly.findById(id);
    
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Validar que la asamblea no haya iniciado
    const now = new Date();
    const startDate = new Date(assembly.startDateTime);
    
    if (startDate <= now) {
      return res.status(400).json({ 
        msg: "No se puede editar una asamblea que ya inició." 
      });
    }

    // Guardar datos anteriores para auditoría
    const previousData = {
      name: assembly.name,
      description: assembly.description,
      startDateTime: assembly.startDateTime,
      endDateTime: assembly.endDateTime,
    };

    // Actualizar solo los campos permitidos
    if (name) assembly.name = name;
    if (description !== undefined) assembly.description = description;
    if (startDateTime) {
      const newStartDate = new Date(startDateTime);
      if (newStartDate >= now) {
        assembly.startDateTime = newStartDate;
      } else {
        return res.status(400).json({ 
          msg: "La fecha de inicio no puede ser anterior a la fecha actual" 
        });
      }
    }
    if (endDateTime) {
      const newEndDate = new Date(endDateTime);
      const currentStartDate = startDateTime ? new Date(startDateTime) : assembly.startDateTime;
      if (newEndDate <= currentStartDate) {
        return res.status(400).json({ 
          msg: "La fecha de cierre debe ser mayor a la fecha de inicio" 
        });
      }
      assembly.endDateTime = newEndDate;
    }

    await assembly.save();

    // Registrar log de auditoría
    await AssemblyAuditLog.create({
      assemblyId: assembly._id,
      action: "edit",
      userId: req.user.id,
      details: {
        previousData,
        newData: {
          name: assembly.name,
          description: assembly.description,
          startDateTime: assembly.startDateTime,
          endDateTime: assembly.endDateTime,
        },
      },
    });

    console.log(`[AUDITORÍA] Asamblea editada: ${assembly._id}, Usuario: ${req.user.id}, Fecha: ${new Date().toISOString()}`);

    res.json({ 
      msg: "Asamblea editada exitosamente",
      assembly 
    });
  } catch (error: any) {
    console.error("Error al editar asamblea:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Eliminar asamblea (Historia 4: ADM-ASAMBLEAS-004)
// Endpoint /api/asambleas/eliminar/:id
router.delete("/eliminar/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const assembly = await Assembly.findById(id);
    
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Validar que la asamblea no esté activa
    const now = new Date();
    const startDate = new Date(assembly.startDateTime);
    const endDate = new Date(assembly.endDateTime);
    const isActive = now >= startDate && now <= endDate;
    const isCompleted = now > endDate;

    if (assembly.status === "active" || isActive) {
      return res.status(400).json({ 
        msg: "No se puede eliminar una asamblea que está activa" 
      });
    }

    // Permitir eliminar asambleas finalizadas incluso si tienen participantes
    // Solo bloquear si la asamblea está programada y tiene participantes
    if (!isCompleted && assembly.status !== "completed" && assembly.participants.length > 0) {
      return res.status(400).json({ 
        msg: "No se puede eliminar una asamblea programada con participantes registrados" 
      });
    }

    // Guardar datos para auditoría antes de eliminar
    const assemblyData = {
      name: assembly.name,
      description: assembly.description,
      startDateTime: assembly.startDateTime,
      endDateTime: assembly.endDateTime,
      processType: assembly.processType,
      status: assembly.status,
    };

    await Assembly.findByIdAndDelete(id);

    // Registrar log de auditoría
    await AssemblyAuditLog.create({
      assemblyId: id,
      action: "delete",
      userId: req.user.id,
      details: {
        deletedData: assemblyData,
      },
    });

    console.log(`[AUDITORÍA] Asamblea eliminada: ${id}, Usuario: ${req.user.id}, Fecha: ${new Date().toISOString()}`);

    res.json({ 
      msg: "Asamblea eliminada exitosamente."
    });
  } catch (error: any) {
    console.error("Error al eliminar asamblea:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener historial de auditoría de una asamblea
router.get("/auditoria/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const logs = await AssemblyAuditLog.find({ assemblyId: id })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error: any) {
    console.error("Error al obtener auditoría:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener asamblea por ID (endpoint original)
router.get("/:id", authMiddleware, async (req: any, res: Response) => {
  try {
    const assembly = await Assembly.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("participants", "firstName lastName email");

    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Verificar permisos
    const isParticipant = assembly.participants.some(
      (p: any) => p._id.toString() === req.user.id
    );

    if (req.user.role !== "admin" && !isParticipant) {
      return res.status(403).json({ 
        msg: "No tiene permiso para ver esta asamblea" 
      });
    }

    res.json({ assembly });
  } catch (error: any) {
    console.error("Error al obtener asamblea:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

export default router;
