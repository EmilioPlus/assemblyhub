import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationCode extends Document {
  assembly: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId; // Usuario participante o delegado
  email: string; // Email al que se envió el código
  code: string; // Código de verificación (6 dígitos)
  expiresAt: Date; // Fecha de expiración (2 horas desde el envío)
  isUsed: boolean; // Si el código ya fue usado
  usedAt?: Date; // Fecha en que se usó el código
  attempts: number; // Número de intentos fallidos
  lockUntil?: Date; // Bloqueo temporal después de 3 intentos (10 minutos)
  sentAt: Date; // Fecha en que se envió el código
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
      index: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Índice para limpiar códigos expirados
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      required: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      required: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsqueda rápida
VerificationCodeSchema.index({ assembly: 1, participant: 1, isUsed: 1 });
VerificationCodeSchema.index({ code: 1, assembly: 1 });

export default mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema);

