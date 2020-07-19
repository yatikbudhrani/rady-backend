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
        problem: String
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
        instructions: String
    }],
    allotedDoctors: [{
        allotmentTime: { type: String, min: 5, max: 5 },
        doctorName: String,
        cabinNumber: String,
        task: String
    }]
});

const noticeSchema = ({
    category: { type: String, max: 1, required: true },
    postedBy: { type: String, required: true },
    date: { type: String, min: 10, max: 10, required: true },
    heading: { type: String, required: true },
    content: { type: String, required: true }
});

const appointmentRequestSchema = Schema({
    patientID: { type: String, required: true },
    patientName: { type: String, required: true },
    problem: { type: String, required: true }
});

const roomSchema = Schema({
    roomCategory: { type: String, required: true },
    occupiedBeds: { type: Number, required: true },
    vacantBeds: { type: Number, required: true }
});

const leaveSchema = Schema({
    staffID: { type: String, required: true },
    staffName: { type: String, required: true },
    leaveDates: { type: String, required: true },
    status: { type: Boolean, required: true }
});

const User = mongoose.model("User", userSchema);
const Notice = mongoose.model("Notice", noticeSchema);
const AppointmentRequest = mongoose.model("AppointmentRequest", appointmentRequestSchema);
const Room = mongoose.model("Room", roomSchema);
const Leave = mongoose.model("Leave", leaveSchema);

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

// Doctor and Staff
app.get("/allNotices", function (req, res) {
    Notice.find({ category: "G" }, "postedBy date heading content", function (err, foundNotices) {
        if (foundNotices) {
            const data = {
                success: true,
                notices: foundNotices
            }
            res.send(data);
        } else {
            const data = {
                success: false,
                msg: "No notices have been posted recently."
            };
            res.send(data);
        }
    });
});

app.get("/notices", function (req, res) {
    const role = req.headers.role;
    Notice.find({ category: role }, "postedBy date heading content", function (err, foundNotices) {
        if (foundNotices) {
            const data = {
                success: true,
                notices: foundNotices
            }
            res.send(data);
        } else {
            const data = {
                success: false,
                msg: "No notices have been posted recently."
            };
            res.send(data);
        }
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
                msg: "No doctors are registered in this hospital."
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
            const data = { success: false, msg: "No upcoming appointments." };
            res.send(data);
        }
    });
});

app.post("/requestAppointment", function (req, res) {
    const patientID = req.body.patientID;
    const problem = req.body.problem;

    const newAppointmentRequest = new AppointmentRequest({
        patientID: patientID,
        patientName: req.body.patientName,
        problem: problem
    });
    newAppointmentRequest.save(function (err) {
        if (err) {
            data = { sucess: false };
            res.send(data);
        } else {
            const newAppointment = {
                appointmentStatus: "Pending",
                appointmentDate: "PPPPPPPPPP",
                appointmentTime: "PPPPP",
                doctorID: "Pending",
                doctorName: "Pending",
                doctorDepartment: "Pending",
                doctorCabinNumber: "Pending",
                problem: problem
            };
            User.findByIdAndUpdate(patientID, { $push: { "upcomingAppointments": newAppointment } }, function (err, patient) {
                if (err) {
                    data = { sucess: false };
                    res.send(data);
                } else {
                    data = { sucess: true };
                    res.send(data);
                }
            });
        }
    });
});

app.get("/prescriptions", function (req, res) {
    const patientID = req.headers.patientid;

    User.findById(patientID, function (err, foundPatient) {
        if (foundPatient.prescriptions.length > 0) {
            const data = { success: true, prescriptions: foundPatient.prescriptions };
            res.send(data);
        } else {
            const data = { success: false, msg: "No prescription found." };
            res.send(data);
        }
    });
});

app.post("/deletePrescription", function (req, res) {
    const patientID = req.body.patientID;
    const timestamp = req.body.timestamp;

    User.findById(patientID, function (err, foundPatient) {
        foundPatient.prescriptions.pull({ timestamp: timestamp });
        const data = { success: true };
        res.send(data);
    });
});

app.get("/availableRooms", function (req, res) {
    Room.find({}, function (err, foundRooms) {
        const data = { rooms: foundRooms };
        res.send(data);
    });
});

// Doctor
app.get("/scheduledAppointments", function (req, res) {
    const doctorID = req.headers.doctorid;

    const date = new Date();
    const currentDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

    let currentScheduledAppointments = [];

    User.findById(doctorID, function (err, foundDoctor) {
        if (foundDoctor.scheduledAppointments.length > 0) {
            foundDoctor.scheduledAppointments.forEach(appointment => {
                if (appointment.appointmentDate.equals(currentDate))
                    currentScheduledAppointments.push(appointment);
            });
            if (currentScheduledAppointments.length > 0) {
                const data = { success: true, scheduledAppointments: currentScheduledAppointments };
            } else {
                const data = { success: false, msg: "No appointments scheduled for today." };
            }
        } else {
            const data = { success: false, msg: "No appointments scheduled." };
            res.send(data);
        }
    });
});

// Staff
app.post("/applyForLeave", function (req, res) {
    const newLeave = Leave({
        staffID: req.body.staffID,
        staffName: req.body.staffName,
        leaveDates: req.body.leaveDates,
        status: false
    });
    newLeave.save(function (err) {
        if (err) {
            const data = { success: false };
            res.send(data);
        } else {
            const data = { success: true };
            res.send(data);
        }
    });
});

app.get("/staffVisits", function (req, res) {
    const staffID = req.headers.staffid;

    User.findById(staffID, function (err, foundStaff) {
        if (foundStaff.staffVisits.length > 0) {
            const data = { success: true, visits: foundStaff.staffVisits };
            res.send(data);
        } else {
            const data = { success: false, msg: "No upcoming visits." };
            res.send(data);
        }
    });
});

app.post("/visitCompleted", function (req, res) {
    const staffID = req.body.staffID
    const visitTime = req.body.visitTime;

    User.findById(staffID, function (err, foundStaff) {
        foundStaff.staffVisits.pull({ visitTime: visitTime });
        const data = { success: true };
        res.send(data);
    });
});

app.get("/allotedDoctors", function (req, res) {
    const staffID = req.headers.staffid;

    User.findById(staffID, function (err, foundStaff) {
        if (foundStaff.allotedDoctors.length > 0) {
            const data = { success: true, allotedDoctors: foundStaff.allotedDoctors };
            res.send(data);
        } else {
            const data = { success: false, msg: "No task has been assigned to you." };
            res.send(data);
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});