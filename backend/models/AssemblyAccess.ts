import mongoose, { Schema, Document } from "mongoose";

export interface IAssemblyAccess extends Document {
  assembly: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId; // Usuario participante
  isDelegate: boolean; // Si es un delegado
  delegateId?: mongoose.Types.ObjectId; // ID del delegado si aplica
  accessTime: Date; // Hora de ingreso
  ip?: string; // Dirección IP del acceso
  userAgent?: string; // User agent del navegador
  createdAt: Date;
}

const AssemblyAccessSchema = new Schema<IAssemblyAccess>(
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
    isDelegate: {
      type: Boolean,
      default: false,
    },
    delegateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delegate",
      required: false,
    },
    accessTime: {
      type: Date,
      default: Date.now,
      required: true,
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
    timestamps: true,
  }
);

// Índice compuesto para evitar duplicados (un participante solo puede tener un acceso por asamblea)
AssemblyAccessSchema.index({ assembly: 1, participant: 1 }, { unique: true });

// Índice para búsqueda por asamblea y fecha
AssemblyAccessSchema.index({ assembly: 1, accessTime: -1 });

export default mongoose.model<IAssemblyAccess>("AssemblyAccess", AssemblyAccessSchema);

