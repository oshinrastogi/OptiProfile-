import express from 'express';
import multer from 'multer'; 
import { analyzeResumeController, deleteResumeController, getSavedResumesController, saveResumeController } from '../controllers/resumeControllers.js'; 
import { protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post('/resume/analyze', upload.single("resume"), analyzeResumeController);

router.post('/resumes/save', saveResumeController);
router.get('/resumes', getSavedResumesController);
router.delete('/resumes/:id', deleteResumeController);


export default router;