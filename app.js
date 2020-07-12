require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-rady:rady-database-password@rady-cluster.bxoms.mongodb.net/radyDB", { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const userSchema = Schema({
    fullName: { type: String, required: true },
    dateOfBirth: { type: String, min: 10, max: 10, required: true },
    gender: { type: String, max: 1, required: true },
    phoneNumber: { type: Number, required: true },
    address: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, min: 6, required: true },
    // patient
    medicalRecord: String, // PDF/image link (only 1)
    // doctor
    specialization: String,
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    // helper
    IDProof: String,
    shift: String
});

const appointmentSchema = Schema({
    unique_ID: { type: String, required: true },
    patientName: { type: String, required: true },
    time: { type: String, required: true },
    dateOfBirth: { type: String, min: 10, max: 10, required: true },
    gender: { type: String, max: 1, required: true },
    previousAppointmentDate: { type: String, min: 10, max: 10 },
    generalComments: String,
    medicalRecord: String, // PDF/image link (only 1)
    prescription: String,  // image link (only 1)
    medicine: [{ type: Schema.Types.ObjectId, ref: "Medicine" }]
});

const medicineSchema = Schema({
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    comments: String
});

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);
const Medicine = mongoose.model("Medicine", medicineSchema);

// APIs
app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            fullName: req.body.fullName,
            dateOfBirth: req.body.dateOfBirth,
            gender: req.body.gender,
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

    User.findOne({ email: email }, function (err, foundUser) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        const data = { success: true, msg: foundUser._id };
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

app.post("/getAppointments", function (req, res) {
    const doctorID = req.body.doctorID;

    User.findById(doctorID, function (err, foundDoctor) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundDoctor) {
                const data = { success: true, appointments: foundDoctor.appointments };
                res.send(data);
            } else {
                const data = { success: false, msg: "Doctor not found." };
                res.send(data);
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});

// const appointment = {
//     unique_ID: req.body.unique_ID,
//     patientName: req.body.patientName,
//     time: req.body.time,
//     dateOfBirth: req.body.dateOfBirth,
//     gender: req.body.gender,
//     previousAppointmentDate: req.body.previousAppointmentDate, // Yeh kaise bhejenge app se?
//     generalComments: req.body, generalComments,
//     medicalRecord: req.body.medicalRecord, // PDF/image link (only 1)
//     prescription: req.body.prescription,  // image link (only 1)
//     medicine: [{
//         medicineName: { type: String, required: true },
//         dosage: { type: String, required: true },
//         comments: String
//     }, {
//         medicineName: { type: String, required: true },
//         dosage: { type: String, required: true },
//         comments: String
//     }]
// };

// User.findByIdAndUpdate(doctorID, { $push: { appointments: appointment } }, function (err, updatedUser) {
//     if (err) {
//         const data = { success: false, msg: err + " Try again." };
//         res.send(data);
//     } else {
//         const data = { success: true };
//         res.send(data);
//     }
// });
