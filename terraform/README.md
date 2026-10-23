# KubeDeploy Cloud Infrastructure (Terraform)

This directory contains the production-grade Infrastructure as Code (IaC) templates for KubeDeploy on AWS. It provisions a multi-tenant, scalable K3s Kubernetes cluster behind an internet-facing AWS Application Load Balancer (ALB).

---

## Architecture Overview

```
                         Internet (HTTPS / HTTP)
                                   │
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │     Shared Application Load Balancer (ALB)        │
          │  - Dynamic routing to cluster nodes on port 80   │
          │  - Path: /apps/{deployment_id}                   │
          └────────────────────────┬─────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
    ┌───────────────────────────┐       ┌───────────────────────────┐
    │   K3s Server (Control)    │       │     K3s Worker (Agent)    │
    │  - Traefik Ingress Router │       │  - Traefik Ingress Router │
    │  - Control Plane API 6443 │       │  - Workload Container Pods│
    │  - SSM Join Token Issuer  │       │  - Auto-joins via SSM     │
    └───────────────────────────┘       └───────────────────────────┘
```

The infrastructure is split into two modular layers:

1. **`base/` (Shared Base Infrastructure)**:
   - **VPC**: Multi-AZ VPC (`10.0.0.0/16`) spanning 2 Availability Zones.
   - **Subnets**: 2 Public Subnets with Internet Gateway routing.
   - **ALB**: Shared Application Load Balancer with HTTP Listener on Port 80.
   - **Target Group**: HTTP Target Group with health checks (`/ping`) pointing to K3s nodes.
   - **Security Groups**: `alb_sg` (Port 80/443 from `0.0.0.0/0`) and `k3s_nodes_sg` (cluster internal communication, SSH, and ALB forwarding).
   - **IAM**: Scoped IAM roles and instance profiles for SSM join token exchange (`k3s_server_role`, `k3s_agent_role`).

2. **`server/` (Dynamic Server & Worker Nodes)**:
   - **EC2 Instances**: Ubuntu 24.04 Noble LTS (`t3.micro` / customizable) with 20GB gp3 storage.
   - **Workspace Isolation**: Uses Terraform workspaces (`server-1`, `worker-1`, etc.) so multiple nodes can be provisioned independently.
   - **Automated K3s Bootstrap**:
     - Configures 2GB swap space for low-memory resilience.
     - Automatically generates or retrieves the cluster join token via AWS SSM Parameter Store (`/kubedeploy/k3s-join-token`).
     - Enables Traefik Ingress Controller and ServiceLB.
     - Workers auto-join the control plane via private IP.

---

## Directory Layout

```
terraform/
├── README.md
├── base/
│   ├── main.tf                 # Root module invoking modules/base
│   ├── outputs.tf              # Outputs VPC IDs, Subnet IDs, ALB DNS, Target Group ARN
│   ├── variables.tf            # Base variables (CIDRs, region, environment name)
│   └── terraform.tfvars.example
├── server/
│   ├── main.tf                 # Root module invoking modules/server via remote_state
│   ├── outputs.tf              # Outputs instance ID, public IP, private IP, node role
│   ├── variables.tf            # Server variables (instance type, key name, workspace)
│   └── terraform.tfvars.example
└── modules/
    ├── base/
    │   ├── main.tf             # AWS VPC, Subnets, IGW, ALB, Security Groups, IAM
    │   ├── outputs.tf
    │   └── variables.tf
    └── server/
        ├── main.tf             # AWS EC2, cloud-init user_data for K3s server/agent
        ├── outputs.tf
        └── variables.tf
```

---

## Deployment Instructions

### Prerequisites
- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) (>= 1.5.0)
- AWS CLI configured with administrator or infrastructure permissions:
  ```bash
  aws configure
  ```
- An existing EC2 Key Pair in your target AWS region (e.g. `p377-key`).

---

### Step 1: Provision Base Shared Infrastructure

```bash
cd terraform/base

# Initialize Terraform providers
terraform init

# Create your terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars

# Review and apply
terraform plan
terraform apply -auto-approve
```

---

### Step 2: Provision K3s Control Plane Server

```bash
cd ../server

# Initialize Terraform
terraform init

# Create and select a workspace for the control plane server
terraform workspace new server-1
terraform workspace select server-1

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Ensure key_name matches your AWS EC2 Key Pair

# Provision the Server
terraform apply -auto-approve -var="is_control_plane=true"
```

---

### Step 3: Provision Worker Agent Nodes (Optional / Scalable)

```bash
cd ../server

# Create and select a new workspace for the worker node
terraform workspace new worker-1
terraform workspace select worker-1

# Apply with is_control_plane=false and the private IP of the server
terraform apply -auto-approve \
  -var="is_control_plane=false" \
  -var="k3s_server_private_ip=<SERVER_PRIVATE_IP>"
```

---

## Teardown / Destruction Order

To cleanly destroy all infrastructure without orphaned dependencies:

1. **Destroy all worker nodes first**:
   ```bash
   cd terraform/server
   terraform workspace select worker-1
   terraform destroy -auto-approve
   terraform workspace select default
   terraform workspace delete worker-1
   ```

2. **Destroy control plane server**:
   ```bash
   terraform workspace select server-1
   terraform destroy -auto-approve
   terraform workspace select default
   terraform workspace delete server-1
   ```

3. **Destroy base infrastructure**:
   ```bash
   cd ../base
   terraform destroy -auto-approve
   ```
