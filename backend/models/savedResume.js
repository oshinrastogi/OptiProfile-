import mongoose from 'mongoose';

const SavedResumeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        profession: { type: String, required: true, trim: true },
        yearsOfExperience: { type: Number, required: true },
        resumeLink: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

export default mongoose.model('SavedResume', SavedResumeSchema);