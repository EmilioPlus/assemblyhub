import mongoose, { Schema, Document } from "mongoose";

export interface IAssembly extends Document {
  name: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  processType: "assembly" | "voting";
  status: "scheduled" | "active" | "completed" | "cancelled";
  accessCode?: string; // Código de acceso único para la asamblea
  createdBy: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AssemblySchema = new Schema<IAssembly>(
  {
    name: {
      type: String,
      required: [true, "El nombre de la asamblea es obligatorio"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: [true, "La fecha y hora de inicio es obligatoria"],
    },
    endDateTime: {
      type: Date,
      required: [true, "La fecha y hora de cierre es obligatoria"],
      validate: {
        validator: function (this: IAssembly, value: Date) {
          return value > this.startDateTime;
        },
        message: "La fecha de cierre debe ser mayor a la fecha de inicio",
      },
    },
    processType: {
      type: String,
      enum: ["assembly", "voting"],
      required: [true, "El tipo de proceso es obligatorio"],
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    accessCode: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Permite múltiples documentos sin accessCode
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAssembly>("Assembly", AssemblySchema);