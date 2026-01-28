const Measurement = require("../models/measurement");

const allowedFields = ["totalIncidents", "midnightIncidents", "vehicleThefts"];

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function parseDateOrNull(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validateField(field, res) {
  if (!allowedFields.includes(field)) {
    return res.status(400).json({
      error: "Invalid field name",
      allowedFields
    });
  }
  return null;
}

function validateDates(startStr, endStr, res) {
  if (!startStr || !endStr) {
    return badRequest(res, "Please select both start_date and end_date (YYYY-MM-DD).");
  }

  const start = parseDateOrNull(startStr);
  const end = parseDateOrNull(endStr);

  if (!start || !end) {
    return badRequest(res, "Invalid date format. Use YYYY-MM-DD.");
  }

  if (start > end) {
    return badRequest(res, "start_date must be earlier than or equal to end_date.");
  }

  end.setHours(23, 59, 59, 999);

  return { start, end };
}

exports.getMeasurements = async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    const fieldErr = validateField(field, res);
    if (fieldErr) return;

    const dates = validateDates(start_date, end_date, res);
    if (!dates || dates.error) return;

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "200", 10), 1), 1000);
    const skip = (page - 1) * limit;

    const filter = {
      timestamp: { $gte: dates.start, $lte: dates.end }
    };

    const total = await Measurement.countDocuments(filter);

    if (total === 0) {
      return res.status(404).json({ error: "No data found in the specified date range." });
    }

    const data = await Measurement.find(filter)
      .select(`timestamp ${field} -_id`)
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    const fieldErr = validateField(field, res);
    if (fieldErr) return;

    const dates = validateDates(start_date, end_date, res);
    if (!dates || dates.error) return;

    const match = {
      timestamp: { $gte: dates.start, $lte: dates.end }
    };

    const result = await Measurement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          stdDev: { $stdDevPop: `$${field}` }
        }
      },
      { $project: { _id: 0, avg: 1, min: 1, max: 1, stdDev: 1 } }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ error: "No data found in the specified date range." });
    }

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
