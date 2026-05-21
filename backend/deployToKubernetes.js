const { execSync } = require("child_process");

function deployToKubernetes(deploymentId) {
  const imageName = `react-app:${deploymentId}`;
  const resourceName = `react-app-${deploymentId}`;

  // Load Docker image into Minikube
  execSync(`minikube image load ${imageName}`, { stdio: "inherit" });

  // Create or update deployment
  execSync(
    `kubectl create deployment ${resourceName} --image=${imageName} --dry-run=client -o yaml | kubectl apply -f -`,
    {
      stdio: "inherit",
      shell: true
    }
  );

  // Expose service (ignore if already exists)
  try {
    execSync(
      `kubectl expose deployment ${resourceName} --type=NodePort --port=3000`,
      { stdio: "inherit" }
    );
  } catch (_) {
    // Service already exists; ignore.
  }

  // Wait for rollout
  // Wait for deployment rollout to complete
  execSync(
    `kubectl rollout status deployment/${resourceName} --timeout=180s`,
    {
      stdio: "inherit",
      shell: true,
    }
  );
  let url = "";

  try {
    url = execSync(
      `minikube service ${resourceName} --url`,
      {
        encoding: "utf8",
        timeout: 10000
      }
    ).trim();
  } catch (error) {
    url = error.stdout
      .split("\n")
      .find(line => line.startsWith("http"))
      ?.trim();
  }

  if (!url) {
    throw new Error("Failed to determine service URL");
  }
  const podName = execSync(
    `kubectl get pods -l app=${resourceName} -o jsonpath="{.items[0].metadata.name}"`,
    {
      encoding: "utf8",
      shell: true,
    }
  ).trim();
  return {
    url,
    imageName,
    deploymentName: resourceName,
    serviceName: resourceName,
    podName,
  };
}

module.exports = deployToKubernetes;

