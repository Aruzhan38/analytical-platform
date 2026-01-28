const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const measurementSchema = new Schema({
  timestamp: { type: Date, required: true },
  totalIncidents: { type: Number, required: true },
  midnightIncidents: { type: Number, required: true },
  vehicleThefts: { type: Number, required: true }
}, { versionKey: false });

const Measurement = mongoose.model("Measurement", measurementSchema);
module.exports = Measurement;
