import mongoose, { Schema, Document } from "mongoose";

export interface IVote extends Document {
  idParticipante: mongoose.Types.ObjectId; // ID del participante o delegado que vota
  idPregunta: mongoose.Types.ObjectId; // ID de la pregunta
  assembly: mongoose.Types.ObjectId; // ID de la asamblea
  respuesta: string[]; // Respuestas seleccionadas (puede ser múltiple)
  horaEmision: Date; // Hora de emisión del voto
  ipOrigen: string; // IP desde donde se emitió el voto
  pesoVoto: number; // Peso del voto según acciones
  isDelegate: boolean; // Si el voto fue emitido por un delegado
  originalParticipant?: mongoose.Types.ObjectId; // Si es delegado, el participante original
  anonymousId: string; // ID anónimo para reportes
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    idParticipante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idPregunta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    respuesta: [
      {
        type: String,
        required: true,
      },
    ],
    horaEmision: {
      type: Date,
      default: Date.now,
    },
    ipOrigen: {
      type: String,
      required: true,
    },
    pesoVoto: {
      type: Number,
      required: true,
      default: 1,
    },
    isDelegate: {
      type: Boolean,
      default: false,
    },
    originalParticipant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    anonymousId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para asegurar voto único por participante/delegado y pregunta
VoteSchema.index({ idParticipante: 1, idPregunta: 1 }, { unique: true });

// Índice para búsquedas por pregunta
VoteSchema.index({ idPregunta: 1 });

// Índice para búsquedas por asamblea
VoteSchema.index({ assembly: 1 });

export default mongoose.model<IVote>("Vote", VoteSchema);
