import mongoose, { Schema, Document } from "mongoose";

export interface IAssemblyAuditLog extends Document {
  assemblyId: mongoose.Types.ObjectId;
  action: "create" | "edit" | "delete";
  userId: mongoose.Types.ObjectId;
  details?: {
    previousData?: any;
    newData?: any;
  };
  createdAt: Date;
}

const AssemblyAuditLogSchema = new Schema<IAssemblyAuditLog>(
  {
    assemblyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "edit", "delete"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAssemblyAuditLog>("AssemblyAuditLog", AssemblyAuditLogSchema);

