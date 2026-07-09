const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: { type: String, required: true },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    linkedInDM: { type: String, required: true },
    followUpEmail: { type: String, required: true },
    toneVariants: [{
        tone: { type: String, required: true },
        subject: { type: String, required: true },
        emailBody: { type: String, required: true },
        linkedInDM: { type: String, required: true },
        followUpEmail: { type: String, required: true },
        score: { type: Number }
    }],
    atsScore: { type: Number },
    atsFeedback: [{ type: String }]
}, { timestamps: true });

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);
module.exports = EmailHistory;
