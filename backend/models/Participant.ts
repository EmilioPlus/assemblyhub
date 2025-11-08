import { Schema, model } from "mongoose";

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assemblyId: { type: Schema.Types.ObjectId, ref: "Assembly", required: true },
  role: { type: String, enum: ["organizer", "voter", "observer"], default: "voter" },
  votedOn: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
  joinedAt: { type: Date, default: Date.now },
});

export default model("Participant", ParticipantSchema);
