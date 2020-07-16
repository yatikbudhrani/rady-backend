require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-rady:rady-database-password@rady-cluster.bxoms.mongodb.net/radyDatabase", { useNewUrlParser: true, useUnifiedTopology: true });

// Schema
const userSchema = Schema({
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    DOB: { type: String, min: 10, max: 10, required: true },
    gender: { type: String, max: 1, required: true },
    phoneNumber: { type: Number, required: true },
    email: { type: String, required: true },
    password: { type: String, min: 6, required: true },
    role: { type: String, max: 1, required: true },
    // Doctor
    department: String,
    cabinNumber: String,
    daysAvailable: [String],
    maxAppointmentsPerDay: Number,
    scheduledAppointments: [{
        appointmentDate: { type: String, min: 10, max: 10 },
        appointmentTime: { type: String, min: 5, max: 5 },
        patientID: String,
        patientName: String,
        problem: String,
        isReferred: Boolean,
        referredBy: String
    }],
    doctorVisits: [{
        visitTime: { type: String, min: 5, max: 5 },
        patientID: String,
        patientName: String,
        patientRoomNumber: String
    }],
    allotedStaff: [{
        allotmentTime: { type: String, min: 5, max: 5 },
        staffName: String,
        staffPost: String,
        task: String
    }],
    // Patient
    medicalRecord: String,
    upcomingAppointments: [{
        appointmentStatus: String,
        appointmentDate: { type: String, min: 10, max: 10 },
        appointmentTime: { type: String, min: 5, max: 5 },
        doctorID: String,
        doctorName: String,
        doctorDepartment: String,
        doctorCabinNumber: String,
        problem: String,
    }],
    prescriptions: [{
        timestamp: String,
        doctorName: String,
        medicines: [{
            medicineName: String,
            dosageInstruction: String
        }],
        generalComment: String
    }],
    // Staff
    idProof: String,
    staffPost: String,
    staffVisits: [{
        visitTime: { type: String, min: 5, max: 5 },
        patientName: String,
        patientRoomNumber: String,
        instruvctions: String
    }],
    allotedDoctors: [{
        allotmentTime: { type: String, min: 5, max: 5 },
        doctorName: String,
        cabinNumber: String,
        task: String
    }]
});

const User = mongoose.model("User", userSchema);

// APIs
// Authentication
app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            fullName: req.body.fullName,
            address: req.body.address,
            DOB: req.body.DOB,
            gender: req.body.gender,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: hash,
            role: req.body.role,
            department: req.body.department,
            cabinNumber: req.body.cabinNumber,
            daysAvailable: req.body.daysAvailable,
            maxAppointmentsPerDay: req.body.maxAppointmentsPerDay,
            idProof: req.body.idProof,
            staffPost: req.body.staffPost
        });
        newUser.save(function (err) {
            if (err) {
                const data = { success: false, msg: err + " User registration failed." };
                res.send(data);
            } else {
                const data = { success: true, msg: newUser._id };
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
                        const data = { success: true, msg: { id: foundUser._id, medicalRecord: foundUser.medicalRecord }, name: foundUser.fullName, role: foundUser.role };
                        res.send(data);
                    } else {
                        const data = { success: false, msg: "Incorrect password." };
                        res.send(data);
                    }
                });
            } else {
                const data = { success: false, msg: "User not registered." };
                res.send(data);
            }
        }
    });
});

// Patient, Doctor and Staff
app.get("/userDetails", function (req, res) {
    const userID = req.headers.userid;

    User.findById(userID, function (err, foundUser) {
        const data = {
            fullName: foundUser.fullName,
            address: foundUser.address,
            DOB: foundUser.DOB,
            gender: foundUser.gender,
            phoneNumber: foundUser.phoneNumber,
            email: foundUser.email,
            // Doctor
            department: foundUser.department,
            cabinNumber: foundUser.cabinNumber,
            daysAvailable: foundUser.daysAvailable,
            // Patient
            medicalRecord: foundUser.medicalRecord,
            // Staff
            idProof: foundUser.idProof,
            staffPost: foundUser.staffPost
        };
        res.send(data);
    });
});

// Patient
app.get("/doctorsList", function (req, res) {
    User.find({ role: "D" }, "fullName department cabinNumber", function (err, foundDoctors) {
        if (foundDoctors) {
            const data = {
                success: true,
                doctorsList: foundDoctors
            }
            res.send(data);
        } else {
            const data = {
                success: false,
                msg: "No doctors have registered with this hospital."
            };
            res.send(data);
        }
    });
});

app.get("/upcomingAppointments", function (req, res) {
    const patientID = req.headers.patientid;

    User.findById(patientID, function (err, foundPatient) {
        if (foundPatient.upcomingAppointments.length > 0) {
            const data = { success: true, upcomingAppointments: foundPatient.upcomingAppointments };
            res.send(data);
        } else {
            const data = { success: true, msg: "No upcoming appointments." };
            res.send(data);
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});