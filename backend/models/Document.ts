import { Schema, model } from "mongoose";

const DocumentSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  type: { type: String, enum: ["proposal", "resolution", "amendment"], required: true },
  assemblyId: { type: Schema.Types.ObjectId, ref: "Assembly" },
  submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default model("Document", DocumentSchema);
