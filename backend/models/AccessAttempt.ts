import mongoose, { Schema, Document } from "mongoose";

export interface IAccessAttempt extends Document {
  assembly: mongoose.Types.ObjectId;
  documentNumber?: string; // Número de documento del intento
  accessCode?: string; // Código de acceso usado
  verificationCode?: string; // Código de verificación usado
  status: "success" | "failed" | "blocked"; // Estado del intento
  reason?: string; // Razón del fallo
  ip?: string; // Dirección IP del intento
  userAgent?: string; // User agent del navegador
  createdAt: Date;
}

const AccessAttemptSchema = new Schema<IAccessAttempt>(
  {
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
      index: true,
    },
    documentNumber: {
      type: String,
      required: false,
      trim: true,
    },
    accessCode: {
      type: String,
      required: false,
      trim: true,
    },
    verificationCode: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "blocked"],
      required: true,
    },
    reason: {
      type: String,
      required: false,
      trim: true,
    },
    ip: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false, // Solo usamos createdAt
  }
);

// Índice para búsqueda por asamblea y fecha
AccessAttemptSchema.index({ assembly: 1, createdAt: -1 });

export default mongoose.model<IAccessAttempt>("AccessAttempt", AccessAttemptSchema);

