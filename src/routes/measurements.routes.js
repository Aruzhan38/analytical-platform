const express = require("express");
const router = express.Router();
const Measurement = require("../models/measurement");
const { getMeasurements, getMetrics } = require("../controllers/measurements.controller");

router.get("/", getMeasurements);
router.get("/metrics", getMetrics);

module.exports = router;