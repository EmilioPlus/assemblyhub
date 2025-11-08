import mongoose, { Schema, Document } from "mongoose";

export interface IVoteAuditLog extends Document {
  questionId: mongoose.Types.ObjectId;
  assembly: mongoose.Types.ObjectId;
  action: "create" | "activate" | "close" | "edit" | "delete";
  userId: mongoose.Types.ObjectId;
  details?: any;
  createdAt: Date;
}

const VoteAuditLogSchema = new Schema<IVoteAuditLog>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "activate", "close", "edit", "delete"],
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

export default mongoose.model<IVoteAuditLog>("VoteAuditLog", VoteAuditLogSchema);

