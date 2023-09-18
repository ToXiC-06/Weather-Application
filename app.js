require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const https = require('https');
const mongoose = require('mongoose'); 
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");



var cityName = "Enter city name to fetch data!";
var pressure = '';
var temperature = '';
var humidity = '';
var speed = '';
var description = '';
var icon = '';

//////        authentication----------------------------------
app.use(session({
    secret: "Our little Secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


//database connection------------------------------
mongoose.connect("mongodb+srv://"+ process.env.MONGO +"@cluster0.mhaamym.mongodb.net/weatherDB");


const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.post("/user/weather", (req,res) => {
    var cityName = req.body.cityName;
    console.log(cityName);

    const url = "https://api.openweathermap.org/data/2.5/weather?q="+ cityName + "&appid=" + process.env.API_KEY + "&units=metric";
    https.get(url, function(response) {
        console.log(response.statusCode);
        if(response.statusCode === 404) {
            return res.redirect("/user/weather");
        };
        response.on("data", function(data) {
            const weatherData = JSON.parse(data);
            humidity = weatherData.main.humidity;
            temperature = weatherData.main.temp;
            pressure = weatherData.main.pressure;
            speed = weatherData.wind.speed;
            description = weatherData.weather[0].description;
            icon = "https://openweathermap.org/img/wn/"+ weatherData.weather[0].icon + "@2x.png";
        
            console.log(pressure,temperature,humidity,speed)
            res.render("weather", {
                nameOfCity: cityName,
                pressure: pressure,
                temperature: temperature,
                humidity: humidity,
                speed: speed,
                description: description,
                icon: icon,
                enter: true
            });

        });
    });
});

app.get("/user/weather", (req,res)=> {


    if(req.isAuthenticated()) {
        res.render("weather", {
            nameOfCity: cityName,
            pressursecretse: pressure,
            temperature: temperature,
            humidity: humidity,
            speed: speed,
            description: description,
            icon: icon,
            enter: false
        });
    } else {
        res.redirect("/home");
    }
});

app.get("/", (req,res) => {
    res.render("home");
});
app.post("/", (req,res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, () =>  {
                res.redirect("/user/weather");
            });
        }
    })
});



app.get("/signup", (req,res) => {
    res.render("signup");
});
 
app.post("/signup", (req,res) => {

    User.register({firstName: req.body.firstName, lastName: req.body.lastName ,username:req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/home");
        }else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/user/weather");
            });
        }
    });
});





app.get("/logout", (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/home");
      });
});



app.get("/features", (req,res) => {
    res.render("features");
});

app.get("/pricing", (req,res) => {
    res.render("pricing");
});

app.get("/about", (req,res) => {
    res.render("about");
});


app.listen(process.env.PORT || 3000, ()=> {
    console.log("Server started on port 3000.");
});