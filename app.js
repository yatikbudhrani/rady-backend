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
    fullName: { type: String, min: 2, required: true },
    dateOfBirth: { type: String, min: 10, max: 10, required: true },
    sex: { type: String, max: 1, required: true },
    phoneNumber: { type: Number, required: true },
    address: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, min: 6, required: true },
    // patient
    medicalRecord: String,
    // doctor
    specialization: String,
    // helper
    IDProof: String,
    shift: String
});

const User = mongoose.model("User", userSchema);

app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            fullName: req.body.fullName,
            dateOfBirth: req.body.dateOfBirth,
            sex: req.body.sex,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            role: req.body.role,
            email: req.body.email,
            password: hash,
            medicalRecord: req.body.medicalRecord,
            specialization: req.body.specialization,
            IDProof: req.body.IDProof,
            shift: req.body.shift
        });
        newUser.save(function (err) {
            if (err) {
                const data = { success: false, msg: err + " User registration failed." };
                res.send(data);
            } else {
                const data = { success: true, msg: "User registration successful." };
                res.send(data);
            }
        });
    });
});

app.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    // Might have to change "User"
    User.findOne({ email: email }, function (err, foundUser) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        const data = { success: true };
                        res.send(data);
                    } else {
                        const data = { success: false, msg: "Incorrect password." };
                        res.send(data);
                    }
                });
            } else {
                const data = { success: false, msg: "User not found." };
                res.send(data);
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});
