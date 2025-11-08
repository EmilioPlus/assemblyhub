import mongoose, { Schema, Document } from "mongoose";

export interface IVoteLog extends Document {
  idParticipante: mongoose.Types.ObjectId;
  idPregunta: mongoose.Types.ObjectId;
  assembly: mongoose.Types.ObjectId;
  action: "attempt" | "success" | "duplicate" | "timeout" | "blocked";
  message: string;
  ipOrigen: string;
  userAgent?: string;
  isDelegate: boolean;
  originalParticipant?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const VoteLogSchema = new Schema<IVoteLog>(
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
    action: {
      type: String,
      enum: ["attempt", "success", "duplicate", "timeout", "blocked"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    ipOrigen: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    isDelegate: {
      type: Boolean,
      default: false,
    },
    originalParticipant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVoteLog>("VoteLog", VoteLogSchema);

