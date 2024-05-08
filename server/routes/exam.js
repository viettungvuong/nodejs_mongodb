const express = require("express");
const router = express.Router();

const Exam = require("../models/exam");
const ExamController = require("../controllers/exam");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExamSession = require("../models/examSession");
const ExamNotify = require("../models/notifyExam");

const { verifyToken } = require("../controllers/auth");

// khong up le Exam len duoc ma Exam luon phu thuoc vao ExamSession
// router.post("/", async (req, res) => {
//   // them exam
//   try {
//     const { studentId, score } = req.body;
//     const student = await Exam.findOne({ _id: studentId });
//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }
//     const newExam = new Exam({ student, score });
//     await newExam.save();
//     res.status(201).json(newExam);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to create new exam entry" });
//   }
// });

router.use(verifyToken);

// tim cac exam cua student
router.get("/:studentEmail", async (req, res) => {
  // lay tat ca exam cua student
  try {
    const exams = await ExamController.getAllExamsOfStudent(
      req.params.studentEmail
    );
    res.status(200).json({ exams: exams });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// tim exam theo id
router.get("/byId/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("student");
    res.status(200).json(exam);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// thiết lập multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination directory where images will be stored
    // Here, we'll use a directory named 'uploads' within the 'public' directory
    const uploadPath = `public/uploads/${req.body.examSessionId}`; // Create a directory for each exam session
    fs.mkdirSync(uploadPath, { recursive: true }); // Ensure the directory exists, create if not
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded image
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// dùng multer
const upload = multer({ storage: storage });

// up hình cho exam
router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const examId = req.body.examId;
    const imagePath = req.file.path; // Get the path of the uploaded image
    // Update the exam document with the imagePath
    await Exam.findByIdAndUpdate(examId, { imagePath: imagePath });
    res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// lấy image của exam
router.get("/getImage/:examId", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam || !exam.imagePath) {
      return res.status(404).json({ error: "Image not found" });
    }
    // Send the image file
    res.sendFile(path.join(__dirname, "..", exam.imagePath));
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve image" });
  }
});

// lay nhung exam moi cua user
router.get("/notify/:email", async (req, res) => {
  try {
    const exams = await ExamNotify.find({ studentEmail: req.params.email });
    res.status(200).json({ exams: exams });
  } catch (error) {}
});

module.exports = router;
