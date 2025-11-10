import mongoose, { Schema, Document } from "mongoose";

export interface IDocumentValidationHistory extends Document {
  documentId: mongoose.Types.ObjectId;
  assembly: mongoose.Types.ObjectId;
  action: "upload" | "approve" | "reject" | "delete";
  userId: mongoose.Types.ObjectId; // Usuario que realizó la acción (cargó, validó o eliminó)
  previousStatus?: "pending" | "approved" | "rejected";
  newStatus?: "pending" | "approved" | "rejected";
  observations?: string; // Observaciones (obligatorio si es rechazo)
  createdAt: Date;
}

const DocumentValidationHistorySchema = new Schema<IDocumentValidationHistory>(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssemblyDocument",
      required: true,
      index: true,
    },
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["upload", "approve", "reject", "delete"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: false,
    },
    newStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: false,
    },
    observations: {
      type: String,
      required: false,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Solo usamos createdAt
  }
);

// Índices para búsquedas eficientes
DocumentValidationHistorySchema.index({ documentId: 1, createdAt: -1 });
DocumentValidationHistorySchema.index({ assembly: 1, createdAt: -1 });

export default mongoose.model<IDocumentValidationHistory>(
  "DocumentValidationHistory",
  DocumentValidationHistorySchema
);

