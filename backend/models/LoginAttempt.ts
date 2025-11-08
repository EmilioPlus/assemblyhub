import { Schema, model, Types } from "mongoose";

const LoginAttemptSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User" },
  email: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ["success", "wrong_password", "user_not_found", "locked"], required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model("LoginAttempt", LoginAttemptSchema);


