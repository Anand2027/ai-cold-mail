const express = require('express');
const multer = require('multer');
const router = express.Router();
const { generateEmail, checkAts, prepareInterview, getHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT resumes are supported'));
    }
  }
});

const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
};

router.post('/generate-email', protect, uploadResume, generateEmail);
router.post('/check-ats', protect, uploadResume, checkAts);
router.post('/interview-prep', protect, uploadResume, prepareInterview);
router.get('/history', protect, getHistory);

module.exports = router;
