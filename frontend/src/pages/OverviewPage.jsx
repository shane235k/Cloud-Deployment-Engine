import DeployForm from '../components/DeployForm';
import DeploymentCard from '../components/DeploymentCard';

export default function OverviewPage({
  deployments,
  loading,
  fetchDeployments,
}) {
  const latestDeployment = deployments[0];

  return (
    <div className="page">
      <h1>Overview</h1>

      <DeployForm onDeploy={fetchDeployments} />

      <h2>Latest Deployment</h2>

      {loading ? (
        <p>Loading...</p>
      ) : latestDeployment ? (
        <DeploymentCard deployment={latestDeployment} />
      ) : (
        <p>No deployments yet.</p>
      )}
    </div>
  );
}