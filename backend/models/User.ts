import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  username: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin","participant","guest"], default: "participant" },
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // Intentos de login y bloqueo temporal
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null, required: false },
  lastLogin: { type: Date, default: null, required: false },
  passwordResetAt: { type: Date, default: null, required: false },
  shares: { type: Number, default: 1 }, // Número de acciones/participaciones del usuario
});

export default model("User", UserSchema);
