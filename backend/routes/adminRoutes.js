import express from 'express';
import { searchCandidatesBySkills } from '../controllers/adminControllers.js';
import { protect} from '../middlewares/authMiddlewares.js'; 

const router = express.Router();

// Route for searching candidates by skills
router.get('/candidates',protect, searchCandidatesBySkills);

export default router;