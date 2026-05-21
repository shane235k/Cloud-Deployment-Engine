import { useState } from 'react';
import { submitRegisterRequest } from '../api';

export default function RegisterRequestPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.email.trim()) {
      return;
    }

    try {
      setLoading(true);

      await submitRegisterRequest({
        username: formData.username.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      setSubmitted(true);

      setFormData({
        username: '',
        email: '',
        message: '',
      });
    } catch (error) {
      alert(
        error.response?.data?.error ||
        'Failed to submit request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <form
        onSubmit={handleSubmit}
        className="vercel-form"
      >
        <h1>Request Access</h1>

        <p className="subtitle">
          Submit a request to gain access to the
          deployment platform.
        </p>

        {submitted && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
            }}
          >
            Request submitted successfully.
          </div>
        )}

        <label>Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) =>
            updateField('username', e.target.value)
          }
        />

        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            updateField('email', e.target.value)
          }
        />

        <label>Reason / Message</label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            updateField('message', e.target.value)
          }
          rows="6"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Submitting...'
            : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}