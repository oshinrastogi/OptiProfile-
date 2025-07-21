import express from 'express';
import multer from 'multer'; 
import { analyzeResumeController } from '../controllers/resumeControllers.js'; 

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post('/resume/analyze', upload.single("resume"), analyzeResumeController);

export default router;