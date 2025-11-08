import { Router, Request, Response } from "express";
import Vote from "../models/Vote";
import Question from "../models/Question";
import Assembly from "../models/Assembly";
import Delegate from "../models/Delegate";
import User from "../models/User";
import VoteLog from "../models/VoteLog";
import VoteAuditLog from "../models/VoteAuditLog";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";
import crypto from "crypto";

const router = Router();

// Función para generar ID anónimo (Historia 8: VOT-008)
const generateAnonymousId = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

// Función para obtener IP del cliente
const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

// Emitir voto (Historia 1: VOT-001)
// Endpoint: /api/votaciones/emitir
router.post("/emitir", authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { idPregunta, respuesta } = req.body;

    // Validar campos obligatorios
    if (!idPregunta || !respuesta) {
      return res.status(400).json({
        msg: "Debe proporcionar la pregunta y al menos una respuesta",
      });
    }

    // Validar que al menos una opción esté seleccionada
    if (!Array.isArray(respuesta) || respuesta.length === 0) {
      return res.status(400).json({
        msg: "Debe seleccionar al menos una opción",
      });
    }

    // Obtener pregunta
    const question = await Question.findById(idPregunta).populate("assembly");
    if (!question) {
      return res.status(404).json({ msg: "Pregunta no encontrada" });
    }

    const assembly = question.assembly as any;

    // Validar que la pregunta esté activa y dentro del tiempo permitido (Historia 1: VOT-001)
    const now = new Date();
    const startTime = new Date(question.startTime);
    const endTime = new Date(question.endTime);

    if (question.status !== "active") {
      // Registrar log de intento bloqueado
      await VoteLog.create({
        idParticipante: userId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "blocked",
        message: "La pregunta no está activa",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      return res.status(400).json({
        msg: "La pregunta no está activa actualmente",
      });
    }

    if (now < startTime) {
      await VoteLog.create({
        idParticipante: userId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "blocked",
        message: "La votación aún no ha iniciado",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      return res.status(400).json({
        msg: "La votación aún no ha iniciado",
      });
    }

    if (now > endTime) {
      // Registrar log de timeout
      await VoteLog.create({
        idParticipante: userId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "timeout",
        message: "Tiempo agotado para esta pregunta",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      return res.status(400).json({
        msg: "Tiempo agotado para esta pregunta.",
      });
    }

    // Validar que las respuestas sean válidas (Historia 1: VOT-001)
    const validOptionValues = question.options.map((opt: any) => opt.value || opt);
    const invalidOptions = respuesta.filter((opt: string) => !validOptionValues.includes(opt));
    if (invalidOptions.length > 0) {
      return res.status(400).json({
        msg: "Una o más opciones seleccionadas no son válidas",
      });
    }

    // Validar relación participante-delegado (Historia 6: VOT-006)
    // Primero verificar si tiene delegado (si es participante original)
    const delegate = await Delegate.findOne({
      participant: userId,
      assembly: assembly._id,
      "powerOfAttorneyValidation.status": "approved",
    });

    // Verificar si el usuario es delegado de alguien (Historia 6: VOT-006)
    // El delegado se identifica por email, ya que no necesariamente tiene cuenta en el sistema
    // Si el usuario actual tiene el mismo email que un delegado registrado, puede votar
    const delegateAsDelegate = await Delegate.findOne({
      assembly: assembly._id,
      email: req.user.email,
      "powerOfAttorneyValidation.status": "approved",
    });

    // Validar que el participante esté inscrito en la asamblea (Historia 1: VOT-001)
    const isParticipant = assembly.participants.includes(userId);
    
    if (!isParticipant && !delegateAsDelegate) {
      // No es participante ni delegado
      await VoteLog.create({
        idParticipante: userId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "blocked",
        message: "Usuario no está inscrito en la asamblea",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      return res.status(403).json({
        msg: "No está inscrito en esta asamblea",
      });
    }

    if (delegate && !delegateAsDelegate) {
      // El participante tiene un delegado aprobado, no puede votar
      await VoteLog.create({
        idParticipante: userId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "blocked",
        message: "Participante tiene delegado registrado, solo el delegado puede votar",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
        isDelegate: false,
        originalParticipant: userId,
      });

      return res.status(403).json({
        msg: "Tiene un delegado registrado. Solo el delegado puede emitir el voto.",
      });
    }

    let votingUserId = userId;
    let isDelegateVote = false;
    let originalParticipant = null;

    if (delegateAsDelegate) {
      // El usuario es un delegado, puede votar en nombre del participante original
      // Verificar que el participante original esté inscrito en la asamblea
      const originalParticipantId = delegateAsDelegate.participant;
      const originalIsParticipant = assembly.participants.includes(originalParticipantId);
      
      if (!originalIsParticipant) {
        await VoteLog.create({
          idParticipante: userId,
          idPregunta: idPregunta,
          assembly: assembly._id,
          action: "blocked",
          message: "El participante original no está inscrito en la asamblea",
          ipOrigen: getClientIp(req),
          userAgent: req.headers["user-agent"],
          isDelegate: true,
          originalParticipant: originalParticipantId,
        });

        return res.status(403).json({
          msg: "El participante original no está inscrito en esta asamblea",
        });
      }

      votingUserId = originalParticipantId; // Usar el ID del participante original para el voto
      isDelegateVote = true;
      originalParticipant = originalParticipantId;
    }

    // Validar voto único (Historia 5: VOT-005)
    const existingVote = await Vote.findOne({
      idParticipante: votingUserId,
      idPregunta: idPregunta,
    });

    if (existingVote) {
      // Registrar log de intento duplicado
      await VoteLog.create({
        idParticipante: votingUserId,
        idPregunta: idPregunta,
        assembly: assembly._id,
        action: "duplicate",
        message: "Intento de voto duplicado",
        ipOrigen: getClientIp(req),
        userAgent: req.headers["user-agent"],
        isDelegate: isDelegateVote,
        originalParticipant: originalParticipant,
      });

      return res.status(400).json({
        msg: "Ya ha emitido su voto para esta pregunta",
      });
    }

    // Obtener usuario para calcular peso del voto (Historia 7: VOT-007)
    const user = await User.findById(votingUserId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Calcular peso del voto según acciones (Historia 7: VOT-007)
    let pesoVoto = (user as any).shares || 1; // Por defecto 1 si no tiene acciones definidas

    // Si es delegado, usar las acciones delegadas
    if (isDelegateVote && delegateAsDelegate) {
      pesoVoto = delegateAsDelegate.sharesDelegated;
    }

    // Crear voto con ID anónimo (Historia 8: VOT-008)
    const anonymousId = generateAnonymousId();
    const vote = await Vote.create({
      idParticipante: votingUserId,
      idPregunta: idPregunta,
      assembly: assembly._id,
      respuesta: respuesta,
      horaEmision: now,
      ipOrigen: getClientIp(req),
      pesoVoto: pesoVoto,
      isDelegate: isDelegateVote,
      originalParticipant: originalParticipant,
      anonymousId: anonymousId,
    });

    // Registrar log de éxito
    await VoteLog.create({
      idParticipante: votingUserId,
      idPregunta: idPregunta,
      assembly: assembly._id,
      action: "success",
      message: "Voto registrado exitosamente",
      ipOrigen: getClientIp(req),
      userAgent: req.headers["user-agent"],
      isDelegate: isDelegateVote,
      originalParticipant: originalParticipant,
    });

    res.status(201).json({
      msg: "Voto registrado exitosamente.",
      vote: {
        id: vote._id,
        anonymousId: vote.anonymousId,
        respuesta: vote.respuesta,
        horaEmision: vote.horaEmision,
      },
    });
  } catch (error: any) {
    console.error("Error al emitir voto:", error);

    // Registrar log de error
    if (req.body.idPregunta) {
      try {
        await VoteLog.create({
          idParticipante: req.user.id,
          idPregunta: req.body.idPregunta,
          assembly: null,
          action: "attempt",
          message: `Error al procesar voto: ${error.message}`,
          ipOrigen: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });
      } catch (logError) {
        console.error("Error al registrar log:", logError);
      }
    }

    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// Listar votaciones de una asamblea para administradores (VOT-BE-02)
// IMPORTANTE: Este endpoint debe ir ANTES de /preguntas/:assemblyId para evitar conflictos
router.get("/listar/:asambleaId", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { asambleaId } = req.params;

    const assembly = await Assembly.findById(asambleaId);
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    const questions = await Question.find({ assembly: asambleaId })
      .populate("createdBy", "firstName lastName email")
      .sort({ order: 1 });

    res.json({
      questions: questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        duration: q.duration,
        order: q.order,
        status: q.status,
        startTime: q.startTime,
        endTime: q.endTime,
        createdBy: q.createdBy,
        createdAt: q.createdAt,
      })),
      total: questions.length,
    });
  } catch (error: any) {
    console.error("Error al listar votaciones:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// Obtener preguntas activas de una asamblea (para participantes)
router.get("/preguntas/:assemblyId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId } = req.params;
    const userId = req.user.id;

    // Validar que el usuario esté inscrito o sea delegado
    const assembly = await Assembly.findById(assemblyId);
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Verificar si tiene delegado (si es participante original)
    const delegate = await Delegate.findOne({
      participant: userId,
      assembly: assemblyId,
      "powerOfAttorneyValidation.status": "approved",
    });

    // Verificar si es delegado de alguien
    const isDelegate = await Delegate.findOne({
      assembly: assemblyId,
      email: req.user.email,
      "powerOfAttorneyValidation.status": "approved",
    });

    const isParticipant = assembly.participants.includes(userId);
    
    // Si no es participante ni delegado, no puede acceder
    if (!isParticipant && !isDelegate) {
      return res.status(403).json({ msg: "No está inscrito en esta asamblea" });
    }

    if (delegate && !isDelegate) {
      // Es participante original con delegado, no puede votar
      return res.status(403).json({
        msg: "Tiene un delegado registrado. Solo el delegado puede votar.",
        hasDelegate: true,
      });
    }

    // Si es delegado, usar el ID del participante original para obtener votos
    let participantIdForVotes = userId;
    if (isDelegate) {
      participantIdForVotes = isDelegate.participant;
    }

    // Obtener preguntas de la asamblea
    const questions = await Question.find({
      assembly: assemblyId,
      status: { $in: ["scheduled", "active"] },
    })
      .sort({ order: 1 })
      .select("-createdBy -createdAt -updatedAt");

    // Verificar votos ya emitidos (usar el ID correcto según si es delegado o participante)
    const votes = await Vote.find({
      idParticipante: participantIdForVotes,
      assembly: assemblyId,
    }).select("idPregunta");

    const answeredQuestionIds = votes.map((v) => v.idPregunta.toString());

    // Agregar información de tiempo restante
    const now = new Date();
    const questionsWithTime = questions.map((q) => {
      const startTime = new Date(q.startTime);
      const endTime = new Date(q.endTime);
      const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
      const isActive = now >= startTime && now <= endTime;
      const hasVoted = answeredQuestionIds.includes(q._id.toString());

      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options.map((opt: any) => ({
          text: opt.text || opt,
          value: opt.value || opt,
        })),
        startTime: q.startTime,
        endTime: q.endTime,
        duration: q.duration,
        status: q.status,
        order: q.order,
        timeRemaining: timeRemaining, // en milisegundos
        isActive: isActive,
        hasVoted: hasVoted,
      };
    });

    res.json({
      questions: questionsWithTime,
      total: questionsWithTime.length,
    });
  } catch (error: any) {
    console.error("Error al obtener preguntas:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// Obtener resultados de una pregunta (anonimizado para reportes) (Historia 8: VOT-008)
router.get("/resultados/:questionId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId).populate("assembly");
    if (!question) {
      return res.status(404).json({ msg: "Pregunta no encontrada" });
    }

    const assembly = question.assembly as any;

    // Solo administradores pueden ver resultados antes de que termine
    if (req.user.role !== "admin" && question.status !== "completed") {
      return res.status(403).json({
        msg: "Los resultados estarán disponibles cuando la pregunta esté completada",
      });
    }

    // Obtener votos (sin exponer información del participante)
    const votes = await Vote.find({ idPregunta: questionId }).select(
      "respuesta pesoVoto anonymousId horaEmision -idParticipante"
    );

    // Calcular resultados por opción
    const results: { [key: string]: { count: number; totalWeight: number } } = {};

    question.options.forEach((option: any) => {
      const optionValue = option.value || option;
      results[optionValue] = { count: 0, totalWeight: 0 };
    });

    votes.forEach((vote) => {
      vote.respuesta.forEach((respuesta) => {
        if (results[respuesta]) {
          results[respuesta].count++;
          results[respuesta].totalWeight += vote.pesoVoto;
        }
      });
    });

    res.json({
      question: {
        _id: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options.map((opt: any) => ({
          text: opt.text || opt,
          value: opt.value || opt,
        })),
      },
      results: results,
      totalVotes: votes.length,
      totalWeight: votes.reduce((sum, v) => sum + v.pesoVoto, 0),
    });
  } catch (error: any) {
    console.error("Error al obtener resultados:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// ========== ENDPOINTS DE ADMINISTRACIÓN DE VOTACIONES ==========

// Crear pregunta/votación (Historia 2: HU-ASM-02, VOT-BE-01)
// Endpoint: POST /api/votaciones/crear
router.post("/crear", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId, questionText, questionType, options, duration, order } = req.body;
    const userId = req.user.id;

    // Validar campos obligatorios
    if (!assemblyId || !questionText || !questionType || !options || !duration) {
      return res.status(400).json({
        msg: "Debe completar todos los campos obligatorios",
      });
    }

    // Validar que la asamblea exista y esté activa o programada (VOT-BE-03)
    const assembly = await Assembly.findById(assemblyId);
    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    const now = new Date();
    const startDate = new Date(assembly.startDateTime);
    
    // Solo permitir crear votaciones si la asamblea está programada o activa
    if (assembly.status === "completed" || assembly.status === "cancelled") {
      return res.status(400).json({
        msg: "No se pueden crear votaciones para asambleas finalizadas o canceladas",
      });
    }

    // Validar tipo de pregunta
    if (!["single", "multiple"].includes(questionType)) {
      return res.status(400).json({
        msg: "Tipo de pregunta inválido. Debe ser 'single' o 'multiple'",
      });
    }

    // Validar opciones
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        msg: "Debe proporcionar al menos 2 opciones",
      });
    }

    // Validar estructura de opciones (deben tener text y value)
    const validatedOptions = options.map((opt: any, index: number) => {
      if (typeof opt === "string") {
        // Si es string, convertir a objeto con text y value
        return {
          text: opt,
          value: opt.toLowerCase().replace(/\s+/g, "_"),
        };
      } else if (opt.text && opt.value) {
        return {
          text: opt.text,
          value: opt.value,
        };
      } else {
        throw new Error(`Opción ${index + 1} no tiene formato válido`);
      }
    });

    // Validar duración
    if (duration <= 0) {
      return res.status(400).json({
        msg: "La duración debe ser mayor a 0",
      });
    }

    // Obtener el siguiente orden si no se proporciona
    let questionOrder = order;
    if (!questionOrder) {
      const lastQuestion = await Question.findOne({ assembly: assemblyId })
        .sort({ order: -1 })
        .select("order");
      questionOrder = lastQuestion ? (lastQuestion.order || 0) + 1 : 1;
    }

    // Crear pregunta
    const question = await Question.create({
      assembly: assemblyId,
      questionText,
      questionType,
      options: validatedOptions,
      duration,
      order: questionOrder,
      status: "scheduled", // Por defecto programada, se activa manualmente
      createdBy: userId,
    });

    // Registrar log de auditoría (Historia 6: HU-ASM-06)
    await VoteAuditLog.create({
      questionId: question._id,
      assembly: assemblyId,
      action: "create",
      userId: userId,
      details: {
        questionText,
        questionType,
        options: validatedOptions,
        duration,
        order: questionOrder,
      },
    });

    res.status(201).json({
      msg: "Votación creada exitosamente",
      question: {
        _id: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        duration: question.duration,
        order: question.order,
        status: question.status,
      },
    });
  } catch (error: any) {
    console.error("Error al crear votación:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

// Activar o cerrar votación (Historia 4: HU-ASM-04, RES-BE-01)
// Endpoint: PUT /api/votaciones/estado/:id
router.put("/estado/:id", authMiddleware, adminMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "activate" o "close"
    const userId = req.user.id;

    if (!["activate", "close"].includes(action)) {
      return res.status(400).json({
        msg: "Acción inválida. Debe ser 'activate' o 'close'",
      });
    }

    const question = await Question.findById(id).populate("assembly");
    if (!question) {
      return res.status(404).json({ msg: "Pregunta no encontrada" });
    }

    const assembly = question.assembly as any;

    // Validar que no se pueda modificar una votación en curso si está activa (HU-ASM-02)
    if (action === "activate") {
      if (question.status === "active") {
        return res.status(400).json({
          msg: "La votación ya está activa",
        });
      }

      if (question.status === "completed" || question.status === "cancelled") {
        return res.status(400).json({
          msg: "No se puede activar una votación que ya está completada o cancelada",
        });
      }

      // Activar: establecer startTime y endTime
      const now = new Date();
      const endTime = new Date(now.getTime() + question.duration * 1000);

      question.status = "active";
      question.startTime = now;
      question.endTime = endTime;

      await question.save();

      // Registrar log de auditoría
      await VoteAuditLog.create({
        questionId: question._id,
        assembly: assembly._id,
        action: "activate",
        userId: userId,
        details: {
          startTime: now,
          endTime: endTime,
        },
      });

      res.json({
        msg: "Votación activada exitosamente",
        question: {
          _id: question._id,
          status: question.status,
          startTime: question.startTime,
          endTime: question.endTime,
        },
      });
    } else if (action === "close") {
      if (question.status === "completed") {
        return res.status(400).json({
          msg: "La votación ya está cerrada",
        });
      }

      // Cerrar: cambiar estado a completed
      question.status = "completed";
      if (!question.endTime) {
        question.endTime = new Date();
      }

      await question.save();

      // Registrar log de auditoría
      await VoteAuditLog.create({
        questionId: question._id,
        assembly: assembly._id,
        action: "close",
        userId: userId,
        details: {
          closedAt: new Date(),
        },
      });

      res.json({
        msg: "Votación cerrada exitosamente",
        question: {
          _id: question._id,
          status: question.status,
          endTime: question.endTime,
        },
      });
    }
  } catch (error: any) {
    console.error("Error al cambiar estado de votación:", error);
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message,
    });
  }
});

export default router;

