require(`dotenv`).config();
const express = require(`express`);
const mongoose = require(`mongoose`);
const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
const path = require(`path`);
const measurementsRoutes = require(`./src/routes/measurements.routes`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

app.get(`/`, (req, res) => 
    res.sendFile(path.join(__dirname + '/views/index.html')));

app.use(`/api/measurements`, measurementsRoutes);

mongoose.connect(mongoURI, { dbName: "analytics" })
  .then(() => {
    console.log(`Connected to MongoDB`);
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error(`Failed to connect to MongoDB`, err);
  });