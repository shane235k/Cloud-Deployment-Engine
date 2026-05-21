const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        fullName: String,
        avatarUrl: String,
        bio: String,
        company: String,
        jobTitle: String,
        location: String,
        website: String,
        githubUsername: String,
        githubAccessToken: String,
        linkedinUrl: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);