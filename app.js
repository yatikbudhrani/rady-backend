require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-rady:rady-database-password@rady-cluster.bxoms.mongodb.net/radyDB", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: hash
        });
        newUser.save(function (err) {
            if (err) {
                console.log(err);
                res.send("User could not be registered.");
            } else {
                res.send("User registered successfully.");
            }
        });
    });
});

app.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email }, function (err, foundUser) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.send("Login successful.");
                    } else {
                        res.send("Incorrect password.")
                    }
                });
            } else {
                console.log("Incorrect Username.");
                res.send("Incorrect Username.");
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});
