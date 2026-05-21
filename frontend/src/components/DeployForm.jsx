import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDeployment } from '../api';

export default function DeployForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    projectName: '',
    repoUrl: '',
    projectType: 'frontend',
    framework: 'react',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
  });

  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectName.trim() || !formData.repoUrl.trim()) {
      return;
    }

    try {
      setLoading(true);

      const result = await createDeployment({
        ...formData,
        projectName: formData.projectName.trim(),
        repoUrl: formData.repoUrl.trim(),
      });

      navigate(`/deployments/${result.deploymentId}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="vercel-form">
      <h1>Deploy Application</h1>
      <p className="subtitle">
        Configure and deploy your application to Kubernetes.
      </p>

      <label>Project Name</label>
      <input
        type="text"
        placeholder="my-awesome-app"
        value={formData.projectName}
        onChange={(e) => updateField('projectName', e.target.value)}
      />

      <label>GitHub Repository URL</label>
      <input
        type="text"
        placeholder="https://github.com/username/repository"
        value={formData.repoUrl}
        onChange={(e) => updateField('repoUrl', e.target.value)}
      />

      <label>Project Type</label>
      <select
        value={formData.projectType}
        onChange={(e) => updateField('projectType', e.target.value)}
      >
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
        <option value="fullstack">Full Stack</option>
      </select>

      <label>Framework</label>
      <select
        value={formData.framework}
        onChange={(e) => updateField('framework', e.target.value)}
      >
        <option value="react">React</option>
        <option value="nextjs">Next.js</option>
        <option value="vue">Vue</option>
        <option value="nodejs">Node.js</option>
        <option value="express">Express</option>
      </select>

      <label>Build Command</label>
      <input
        type="text"
        value={formData.buildCommand}
        onChange={(e) => updateField('buildCommand', e.target.value)}
      />

      <label>Output Directory</label>
      <input
        type="text"
        value={formData.outputDirectory}
        onChange={(e) => updateField('outputDirectory', e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Deploying...' : 'Deploy'}
      </button>
    </form>
  );
}