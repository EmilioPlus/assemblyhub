import { Router, Request, Response } from "express";
import Assembly from "../models/Assembly";
import Delegate from "../models/Delegate";
import User from "../models/User";
import Vote from "../models/Vote";
import { authMiddleware, adminMiddleware } from "../utils/authMiddleware";

const router = Router();

// Listar todos los participantes de una asamblea (GET /participantes/:asambleaId)
router.get("/:assemblyId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { assemblyId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar que la asamblea exista
    const assembly = await Assembly.findById(assemblyId)
      .populate("participants", "firstName lastName email documentType documentNumber role");

    if (!assembly) {
      return res.status(404).json({ msg: "Asamblea no encontrada" });
    }

    // Validar permisos: solo administradores o participantes inscritos pueden ver la lista
    if (userRole !== "admin") {
      const isParticipant = assembly.participants.some(
        (p: any) => p._id.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({ 
          msg: "No tiene permiso para ver los participantes de esta asamblea" 
        });
      }
    }

    // Obtener información de delegados para cada participante
    const participantsWithDelegateInfo = await Promise.all(
      assembly.participants.map(async (participant: any) => {
        const delegate = await Delegate.findOne({
          assembly: assemblyId,
          participant: participant._id,
        })
          .populate("powerOfAttorneyValidation.validatedBy", "firstName lastName email")
          .select("firstName firstLastName documentNumber email sharesDelegated powerOfAttorneyValidation");

        return {
          _id: participant._id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          documentType: participant.documentType,
          documentNumber: participant.documentNumber,
          role: participant.role,
          hasDelegate: !!delegate,
          delegate: delegate ? {
            firstName: delegate.firstName,
            firstLastName: delegate.firstLastName,
            documentNumber: delegate.documentNumber,
            email: delegate.email,
            sharesDelegated: delegate.sharesDelegated,
            validationStatus: delegate.powerOfAttorneyValidation.status,
            validatedBy: delegate.powerOfAttorneyValidation.validatedBy,
            validatedAt: delegate.powerOfAttorneyValidation.validatedAt,
            notes: delegate.powerOfAttorneyValidation.notes,
          } : null,
        };
      })
    );

    res.json({
      msg: "Participantes obtenidos exitosamente",
      assembly: {
        _id: assembly._id,
        name: assembly.name,
        startDateTime: assembly.startDateTime,
        endDateTime: assembly.endDateTime,
      },
      totalParticipants: participantsWithDelegateInfo.length,
      participants: participantsWithDelegateInfo,
    });
  } catch (error: any) {
    console.error("Error al listar participantes:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener detalles de un participante en una asamblea (GET /participantes/:asambleaId/:participanteId)
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
    const participant = await User.findById(participantId)
      .select("firstName lastName email documentType documentNumber role createdAt");

    if (!participant) {
      return res.status(404).json({ msg: "Participante no encontrado" });
    }

    // Validar que el participante esté inscrito en la asamblea
    const isParticipant = assembly.participants.some(
      (p: any) => p.toString() === participantId
    );

    if (!isParticipant) {
      return res.status(400).json({ 
        msg: "Este usuario no está inscrito en la asamblea" 
      });
    }

    // Validar permisos: solo administradores o el mismo participante pueden ver los detalles
    if (userRole !== "admin" && userId !== participantId) {
      return res.status(403).json({ 
        msg: "No tiene permiso para ver los detalles de este participante" 
      });
    }

    // Obtener información del delegado (si existe)
    const delegate = await Delegate.findOne({
      assembly: assemblyId,
      participant: participantId,
    })
      .populate("powerOfAttorneyValidation.validatedBy", "firstName lastName email");

    // Obtener información de votos del participante (solo para administradores)
    let votesInfo = null;
    if (userRole === "admin") {
      const votes = await Vote.find({
        idParticipante: participantId,
      })
        .populate("idPregunta", "questionText questionType order")
        .select("respuesta pesoVoto horaEmision")
        .sort({ horaEmision: -1 });

      votesInfo = {
        totalVotes: votes.length,
        votes: votes.map((vote: any) => ({
          questionText: vote.idPregunta?.questionText,
          questionType: vote.idPregunta?.questionType,
          order: vote.idPregunta?.order,
          respuesta: vote.respuesta,
          pesoVoto: vote.pesoVoto,
          horaEmision: vote.horaEmision,
        })),
      };
    }

    res.json({
      msg: "Detalles del participante obtenidos exitosamente",
      assembly: {
        _id: assembly._id,
        name: assembly.name,
        startDateTime: assembly.startDateTime,
        endDateTime: assembly.endDateTime,
      },
      participant: {
        _id: participant._id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        documentType: participant.documentType,
        documentNumber: participant.documentNumber,
        role: participant.role,
        createdAt: participant.createdAt,
      },
      hasDelegate: !!delegate,
      delegate: delegate ? {
        _id: delegate._id,
        firstName: delegate.firstName,
        secondName: delegate.secondName,
        firstLastName: delegate.firstLastName,
        secondLastName: delegate.secondLastName,
        documentType: delegate.documentType,
        documentNumber: delegate.documentNumber,
        email: delegate.email,
        sharesDelegated: delegate.sharesDelegated,
        validationStatus: delegate.powerOfAttorneyValidation.status,
        validatedBy: delegate.powerOfAttorneyValidation.validatedBy,
        validatedAt: delegate.powerOfAttorneyValidation.validatedAt,
        notes: delegate.powerOfAttorneyValidation.notes,
        createdAt: delegate.createdAt,
      } : null,
      votes: votesInfo,
    });
  } catch (error: any) {
    console.error("Error al obtener detalles del participante:", error);
    res.status(500).json({ 
      msg: "Error del servidor", 
      error: error.message 
    });
  }
});

// Obtener delegado de un participante (GET /participantes/:asambleaId/:participanteId/delegado)
router.get("/:assemblyId/:participantId/delegado", authMiddleware, async (req: any, res: Response) => {
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

export default router;

