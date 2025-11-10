import mongoose, { Schema, Document } from "mongoose";

export interface IAssemblyDocument extends Document {
  assembly: mongoose.Types.ObjectId;
  name: string; // Nombre del documento (obligatorio y único por asamblea)
  fileName: string; // Nombre del archivo en el servidor
  originalFileName: string; // Nombre original del archivo
  filePath: string; // Ruta del archivo en el servidor
  fileSize: number; // Tamaño del archivo en bytes
  mimeType: string; // Tipo MIME del archivo (application/pdf, image/jpeg, image/png)
  uploadedBy: mongoose.Types.ObjectId; // Usuario que cargó el documento
  uploadedAt: Date;
  // Campos de validación
  status: "pending" | "approved" | "rejected"; // Estado del documento
  validatedBy?: mongoose.Types.ObjectId; // Usuario que validó el documento (admin)
  validatedAt?: Date; // Fecha y hora de validación
  observations?: string; // Observaciones (obligatorio si rechazado)
  createdAt: Date;
  updatedAt: Date;
}

const AssemblyDocumentSchema = new Schema<IAssemblyDocument>(
  {
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "El nombre del documento es obligatorio"],
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ["application/pdf", "image/jpeg", "image/png"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    // Campos de validación
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    validatedAt: {
      type: Date,
      required: false,
    },
    observations: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para nombre por asamblea (el nombre debe ser único por asamblea)
AssemblyDocumentSchema.index({ assembly: 1, name: 1 }, { unique: true });

export default mongoose.model<IAssemblyDocument>("AssemblyDocument", AssemblyDocumentSchema);

