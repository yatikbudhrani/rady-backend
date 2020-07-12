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

// Schemas -->
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
    scheduledAppointments: [{
        doctorName: { type: String, required: true },
        doctorSpecialization: { type: String, required: true },
        doctorRoomNumber: String,
        date: { type: String, min: 10, max: 10, required: true },
        time: { type: String, required: true },
        problem: String,
        status: Boolean
    }],
    prescriptions: [{
        medicineName: { type: String, required: true },
        medicineDosage: { type: String, required: true },
        comments: String,
        doctorName: { type: String, required: true },
        doctorNotes: String
    }],
    // doctor
    specialization: String,
    isDoctorAvailable: Boolean,
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    visits: [{ type: Schema.Types.ObjectId, ref: "Visit" }],
    assignedHelpers: [{
        helperName: { type: String, required: true },
        helperPost: String,
        time: { type: String, required: true }
    }],
    references: [{
        sourceDoctorName: { type: String, required: true },
        sourceDoctorSpecialization: { type: String, required: true },
        patientID: { type: String, required: true },
        patientName: { type: String, required: true },
        time: { type: String, required: true },
        isCompleted: Boolean
    }],
    // helper
    IDProof: String,
    shift: String,
    isHelperWorking: Boolean,
    patientVisits: [{
        patientName: { type: String, required: true },
        time: { type: String, required: true },
        room: { type: String, required: true },
        doctorName: { type: String, required: true },
        doctorComments: String
    }],
    assignedWork: {
        doctorName: String,
        room: String,
        isDone: Boolean
    }
});

const appointmentSchema = Schema({
    patientID: { type: String, required: true },
    patientName: { type: String, required: true },
    time: { type: String, required: true },
    dateOfBirth: { type: String, min: 10, max: 10, required: true },
    gender: { type: String, max: 1, required: true },
    previousAppointmentDate: { type: String, min: 10, max: 10 },
    generalComments: String,
    medicalRecord: String, // PDF/image link (only 1)
    prescription: String,  // image link (only 1)
    medicines: [{ type: Schema.Types.ObjectId, ref: "Medicine" }]
});

const medicineSchema = Schema({
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    comments: String
});

const noticeSchema = Schema({
    source: String,
    date: { type: String, min: 10, max: 10, required: true },
    category: { type: String, require: true },
    heading: { type: String, require: true },
    content: { type: String, require: true }
});

const visitSchema = Schema({
    doctorID: { type: String, required: true },
    doctorName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    time: { type: String, required: true },
    hasVisited: Boolean
});

const medicineStockSchema = Schema({
    medicineName: { type: String, required: true },
    stock: { type: Number, required: true }
});

const availableRoomSchema = Schema({
    roomType: { type: String, required: true },
    occupied: { type: Number, required: true },
    vacant: { type: Number, required: true },
    managerName: { type: String, required: true },
    managerPhoneNumber: { type: String, required: true }
});

const appointmentRequestSchema = Schema({
    patientID: { type: String, required: true },
    patientName: { type: String, required: true },
    problem: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);
const Medicine = mongoose.model("Medicine", medicineSchema);
const Notice = mongoose.model("Notice", noticeSchema);
const Visit = mongoose.model("Vsist", visitSchema);
const MedicineStock = mongoose.model("MedicineStock", medicineStockSchema);
const AvaiableRoom = mongoose.model("AvailableRoom", availableRoomSchema);
const AppointmentRequestSchema = mongoose.model("AppointmentRequestSchema", appointmentRequestSchema);

// APIs -->
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
            isDoctorAvailable: true,
            IDProof: req.body.IDProof,
            shift: req.body.shift,
            isHelperWorking: false
        });
        newUser.save(function (err) {
            if (err) {
                const data = { success: false, msg: err + " User registration failed." };
                res.send(data);
            } else {
                const data = { success: true, msg: newUser._id, role: newUser.role };
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
                        const data = { success: true, msg: foundUser._id, role: foundUser.role };
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

app.get("/getAppointments", function (req, res) {
    const doctorID = req.headers.doctorid;

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

app.post("/postNotice", function (req, res) {
    const newNotice = new Notice({
        source: req.body.source,
        date: req.body.date,
        category: req.body.category,
        heading: req.body.heading,
        content: req.body.content
    });
    newNotice.save(function (err) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            const data = { success: true, msg: "Notice posted successfully." };
            res.send(data);
        }
    });
});

app.get("/getNotices/:noticeCategory", function (req, res) {
    const noticeCategory = req.params.noticeCategory;

    Notice.find({ category: noticeCategory }, function (err, foundNotices) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundNotices.length > 0) {
                const data = { success: true, notices: foundNotices };
                res.send(data);
            } else {
                const data = { success: false, msg: "No notice available currently." };
                res.send(data);
            }
        }
    });
});

app.get("/getVisits", function (req, res) {
    const doctorID = req.headers.doctorid;

    User.findById(doctorID, function (err, foundDoctor) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundDoctor) {
                const data = { success: true, visits: foundDoctor.visits };
                res.send(data);
            } else {
                const data = { success: false, msg: "Doctor not found." };
                res.send(data);
            }
        }
    });
});

app.get("/getAvailableHelpers", function (req, res) {
    const dateObject = new Date();
    const time = dateObject.getHours();

    if (time < 12)
        var currentShift = "M";
    else if (time < 18)
        var currentShift = "A";
    else
        var currentShift = "E";

    User.find({ role: "helper", shift: currentShift, isWorking: false }, function (err, foundHelpers) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundHelpers) {
                const data = { success: true, helpers: foundHelpers };
                res.send(data);
            } else {
                const data = { success: false, msg: "No helpers available for current shift." };
                res.send(data);
            }
        }
    });
});

app.get("/getAssignedHelpers", function (req, res) {
    const doctorID = req.headers.doctorid;

    User.findById(doctorID, function (err, foundDoctor) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundDoctor.assignedHelpers.length > 0) {
                const data = { success: true, assignedHelpers: foundDoctor.assignedHelpers };
                res.send(data);
            } else {
                const data = { success: false, msg: "No helper is been assigned to you." };
                res.send(data);
            }
        }
    });
});

app.get("/getDoctors", function (req, res) {
    User.find({ role: "doctor" }, function (err, foundDoctors) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundDoctors.length > 0) {
                const data = { success: true, doctors: foundDoctors };
                res.send(data);
            } else {
                const data = { success: false, msg: "No doctor is registered." };
                res.send(data);
            }
        }
    });
});

app.get("/getAvailableDoctors", function (req, res) {
    User.find({ role: "doctor", isDoctorAvailable: true }, function (err, foundAvailableDoctors) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundAvailableDoctors.length > 0) {
                const data = { success: true, availableDoctors: foundAvailableDoctors };
                res.send(data);
            } else {
                const data = { success: false, msg: "No doctor is available currently." };
                res.send(data);
            }
        }
    });
});

app.get("/getMedicineStock", function (req, res) {
    MedicineStock.find({}, function (err, foundMedicines) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundMedicines.length > 0) {
                const data = { success: true, medicines: foundMedicines };
                res.send(data);
            } else {
                const data = { success: false, msg: "No medicine is available currently." };
                res.send(data);
            }
        }
    });
});

app.get("/getReferences", function (req, res) {
    const doctorID = req.headers.doctorid;

    User.findById(doctorID, function (err, foundDoctor) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundDoctor.references.length > 0) {
                const data = { success: true, references: foundDoctor.references };
                res.send(data);
            } else {
                const data = { success: false, msg: "No references available." };
                res.send(data);
            }
        }
    });
});

app.get("/getScheduledAppointments", function (req, res) {
    const patientID = req.headers.patientid;

    User.findById(patientID, function (err, foundPatient) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundPatient.scheduledAppointments.length > 0) {
                const data = { success: true, scheduledAppointments: foundPatient.scheduledAppointments };
                res.send(data);
            } else {
                const data = { success: false, msg: "No appointments available." };
                res.send(data);
            }
        }
    });
});

app.get("/getAvailableRooms", function (req, res) {
    AvaiableRoom.find({}, function (err, foundRooms) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundRooms.length > 0) {
                const data = { success: true, rooms: foundRooms };
                res.send(data);
            } else {
                const data = { success: false, msg: "Some error occured. Try again." };
                res.send(data);
            }
        }
    });
});

app.get("/getPrescriptions", function (req, res) {
    const patientID = req.headers.patientid;

    User.findById(patientID, function (err, foundPatient) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundPatient.prescriptions.length > 0) {
                const data = { success: true, prescriptions: foundPatient.prescriptions };
                res.send(data);
            } else {
                const data = { success: false, msg: "No prescriptions available." };
                res.send(data);
            }
        }
    });
});

app.post("/sendAppointmentRequest", function (req, res) {
    const newAppointmentRequest = new AppointmentRequestSchema({
        patientID: req.body.patientID,
        patientName: req.body.patientName,
        problem: req.body.problem
    });
    newAppointmentRequest.save(function (err) {
        if (err) {
            const data = { success: false, msg: err + " Appointment request failed." };
            res.send(data);
        } else {
            const data = { success: true, msg: "Apointment requested successfully." };
            res.send(data);
        }
    });
});

app.get("/getPatientVisits", function (req, res) {
    const helperID = req.headers.helperid;

    User.findById(helperID, function (err, foundHelper) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundHelper.patientVisits.length > 0) {
                const data = { success: true, patientVisits: foundHelper.patientVisits };
                res.send(data);
            } else {
                const data = { success: false, msg: "No patient visits right now." };
                res.send(data);
            }
        }
    });
});

app.get("/getAssignedWork", function (req, res) {
    const helperID = req.headers.helperid;

    User.findById(helperID, function (err, foundHelper) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundHelper) {
                const data = { success: true, assignedWork: foundHelper.assignedWork };
                res.send(data);
            } else {
                const data = { success: false, msg: "Helper not found." };
                res.send(data);
            }
        }
    });
});

app.get("/getAppointmentRequests", function (req, res) {
    AppointmentRequestSchema.find({}, function (err, foundAppointmentRequests) {
        if (err) {
            const data = { success: false, msg: err + " Try again." };
            res.send(data);
        } else {
            if (foundAppointmentRequests.length > 0) {
                const data = { success: true, appointmentRequests: foundAppointmentRequests };
                res.send(data);
            } else {
                const data = { success: false, msg: "No requests available currently." };
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
//     medicines: [{
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
