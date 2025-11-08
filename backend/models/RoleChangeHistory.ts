import mongoose, { Schema, Document } from "mongoose";

export interface IRoleChangeHistory extends Document {
  modifiedUser: mongoose.Types.ObjectId;
  previousRole: string;
  newRole: string;
  modifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RoleChangeHistorySchema = new Schema<IRoleChangeHistory>(
  {
    modifiedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousRole: {
      type: String,
      required: true,
      enum: ["admin", "participant", "guest"],
    },
    newRole: {
      type: String,
      required: true,
      enum: ["admin", "participant", "guest"],
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRoleChangeHistory>("RoleChangeHistory", RoleChangeHistorySchema);
