const express = require("express");
const Datastore = require("nedb");
const fetch = require("node-fetch");
const { json } = require("express");
require("dotenv").config();
console.log(process.env.API_KEY);

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.json({ limit: "5mb" }));

const database = new Datastore("database.db");
database.loadDatabase();

app.post("/api/:cityname", async (request, response) => {
  const city = request.params.cityname;
  const key = process.env.API_KEY;
  const API_URL = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`;
  const weather = await fetch(API_URL); //downloaded node-fetch to use fetch in server

  const jsonWeather = await weather.json();
  if (jsonWeather.cod == 404) {
    response.send("invalid input");
  } else {
    database.find({ city: `${city}` }, function (err, docs) {
      if (!docs.length) {
        database.insert({ city });
        response.send("submitted");
      } else {
        response.send("already submitted");
      }
    });
  }
});

app.get("/weather", (request, response) => {
  database.find({}, async (err, data) => {
    const details = {};
    if (err) {
      response.end();
      return;
    }
    const key = process.env.API_KEY;

    for (item of data) {
      const API_URL = `http://api.openweathermap.org/data/2.5/weather?q=${item.city}&appid=${key}`;
      const weather = await fetch(API_URL); //downloaded node-fetch to use fetch in server
      const weatherInfo = await weather.json();

      details[item.city] = weatherInfo;
    }
    response.json(details);
  });
});
app.post("/delete/:cityname", (request, response) => {
  const cityName = request.params.cityname;

  database.remove({ city: cityName }, (err, removed) => {
    if (err) return response(err);
  });
  response.send("removed");
});
app.listen(port, () =>
  console.log(`App listening at http://localhost: ${port}`)
);

//hot reload of webpage using "live-server"
//command live-server --port=PORT_NUMBER
