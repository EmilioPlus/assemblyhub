import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionOption {
  text: string;
  value: string;
}

export interface IQuestion extends Document {
  assembly: mongoose.Types.ObjectId;
  questionText: string;
  questionType: "single" | "multiple"; // Una opción o múltiples opciones
  options: IQuestionOption[]; // Opciones de respuesta con texto y valor
  startTime?: Date; // Cuándo inicia la votación (opcional si se activa manualmente)
  endTime?: Date; // Cuándo termina la votación (opcional si se activa manualmente)
  duration: number; // Duración en segundos
  status: "scheduled" | "active" | "completed" | "cancelled";
  order: number; // Orden de la pregunta
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    startTime: {
      type: Date,
      required: false, // Opcional, se puede activar manualmente
    },
    endTime: {
      type: Date,
      required: false, // Opcional, se calcula automáticamente al activar
    },
    duration: {
      type: Number,
      required: true, // Duración en segundos
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    order: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestion>("Question", QuestionSchema);

