import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api";

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        fullName: "",
        avatarUrl: "",
        bio: "",
        company: "",
        jobTitle: "",
        location: "",
        website: "",
        githubUsername: "",
        linkedinUrl: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getProfile();
                const filled = {
                    fullName: data.fullName || "",
                    avatarUrl: data.avatarUrl || "",
                    bio: data.bio || "",
                    company: data.company || "",
                    jobTitle: data.jobTitle || "",
                    location: data.location || "",
                    website: data.website || "",
                    githubUsername: data.githubUsername || "",
                    linkedinUrl: data.linkedinUrl || "",
                };
                setProfile(filled);
                // If profile is empty, start in edit mode
                const isEmpty = !data.fullName && !data.bio && !data.company;
                setEditing(isEmpty);
            } catch (error) {
                console.error("Failed to load profile:", error);
                setEditing(true);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage("");
            await updateProfile(profile);
            setMessage("Profile saved successfully.");
            setEditing(false);
        } catch (error) {
            console.error("Failed to save profile:", error);
            setMessage("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="page-loading">Loading profile...</div>;
    }

    // ── VIEW MODE ───────────────────────────────────────────
    if (!editing) {
        return (
            <div className="profile-view-page">
                <div className="profile-view-header">
                    <div className="profile-view-avatar-wrap">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="avatar"
                                className="profile-view-avatar-img"
                            />
                        ) : (
                            <div className="profile-view-avatar-initials">
                                {getInitials(profile.fullName)}
                            </div>
                        )}
                    </div>

                    <div className="profile-view-identity">
                        <h1>{profile.fullName || "Unnamed User"}</h1>
                        {profile.jobTitle && (
                            <p className="profile-view-jobtitle">{profile.jobTitle}</p>
                        )}
                        {profile.company && (
                            <p className="profile-view-company">@ {profile.company}</p>
                        )}
                    </div>

                    <button
                        className="profile-edit-btn"
                        onClick={() => { setEditing(true); setMessage(""); }}
                    >
                        ✎ Edit Profile
                    </button>
                </div>

                {profile.bio && (
                    <div className="profile-view-card">
                        <h3>Bio</h3>
                        <p>{profile.bio}</p>
                    </div>
                )}

                <div className="profile-view-grid">
                    {profile.location && (
                        <div className="profile-view-item">
                            <span className="pvi-label">📍 Location</span>
                            <span className="pvi-value">{profile.location}</span>
                        </div>
                    )}
                    {profile.website && (
                        <div className="profile-view-item">
                            <span className="pvi-label">🌐 Website</span>
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noreferrer"
                                className="pvi-link"
                            >
                                {profile.website}
                            </a>
                        </div>
                    )}
                    {profile.githubUsername && (
                        <div className="profile-view-item">
                            <span className="pvi-label">GitHub</span>
                            <a
                                href={`https://github.com/${profile.githubUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="pvi-link"
                            >
                                @{profile.githubUsername}
                            </a>
                        </div>
                    )}
                    {profile.linkedinUrl && (
                        <div className="profile-view-item">
                            <span className="pvi-label">LinkedIn</span>
                            <a
                                href={profile.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="pvi-link"
                            >
                                {profile.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
                            </a>
                        </div>
                    )}
                </div>

                {!profile.fullName && !profile.bio && !profile.company && (
                    <div className="profile-empty-hint">
                        Your profile is empty. Click <strong>Edit Profile</strong> to fill it in.
                    </div>
                )}
            </div>
        );
    }

    // ── EDIT MODE ───────────────────────────────────────────
    return (
        <div className="profile-view-page">
            <div className="profile-edit-topbar">
                <div>
                    <h1>Edit Profile</h1>
                    <p>Update your personal information below.</p>
                </div>
                <button
                    className="profile-cancel-btn"
                    onClick={() => { setEditing(false); setMessage(""); }}
                >
                    ✕ Cancel
                </button>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-grid">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input name="fullName" value={profile.fullName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Avatar URL</label>
                        <input name="avatarUrl" value={profile.avatarUrl} onChange={handleChange} placeholder="https://..." />
                    </div>
                    <div className="form-group">
                        <label>Company</label>
                        <input name="company" value={profile.company} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Job Title</label>
                        <input name="jobTitle" value={profile.jobTitle} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input name="location" value={profile.location} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Website</label>
                        <input name="website" value={profile.website} onChange={handleChange} placeholder="https://..." />
                    </div>
                    <div className="form-group">
                        <label>GitHub Username</label>
                        <input name="githubUsername" value={profile.githubUsername} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>LinkedIn URL</label>
                        <input name="linkedinUrl" value={profile.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                    </div>
                </div>

                <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea name="bio" rows="5" value={profile.bio} onChange={handleChange} />
                </div>

                {message && <div className="form-message">{message}</div>}

                <button type="submit" className="save-button" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}