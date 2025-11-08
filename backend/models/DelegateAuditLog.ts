import mongoose, { Schema, Document } from "mongoose";

export interface IDelegateAuditLog extends Document {
  participant: mongoose.Types.ObjectId; // Usuario que registra el delegado
  delegate: mongoose.Types.ObjectId; // ID del delegado
  assembly: mongoose.Types.ObjectId; // Asamblea
  action: "register" | "validate" | "delete";
  registeredBy: mongoose.Types.ObjectId; // Usuario que realiza la acción
  documentStatus?: "pending" | "approved" | "rejected";
  emailSent?: boolean;
  emailSentAt?: Date;
  emailDestination?: string;
  notes?: string;
  createdAt: Date;
}

const DelegateAuditLogSchema = new Schema<IDelegateAuditLog>(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    delegate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delegate",
      required: true,
    },
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    action: {
      type: String,
      enum: ["register", "validate", "delete"],
      required: true,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    emailDestination: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDelegateAuditLog>("DelegateAuditLog", DelegateAuditLogSchema);

