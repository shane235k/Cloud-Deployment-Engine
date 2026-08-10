# 🚀 KubeDeploy (Cloud Deployment Engine)

[![Kubernetes](https://img.shields.io/badge/Kubernetes-K3s-326CE5?logo=kubernetes&logoColor=white)](https://k3s.io/)
[![Terraform](https://img.shields.io/badge/Terraform-v1.x-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**KubeDeploy** is a full-stack, self-service **Cloud Platform-as-a-Service (PaaS)** (similar to Vercel/Render) designed for containerized web applications. It automates AWS infrastructure provisioning via **Terraform Workspaces**, manages CI/CD pipelines through **Jenkins**, and orchestrates application deployments onto **Kubernetes (K3s)** clusters with intelligent workload scheduling, automated server provisioning, and continuous SSH telemetry.

---

## 📸 Architecture & Workflow Overview

```text
 ┌────────────────┐       GitHub OAuth        ┌───────────────────────────┐
 │   Developer    │ ────────────────────────> │  React Frontend (Nginx)   │
 │   User / Admin │ <──────────────────────── │    (Port 30007 / K8s)     │
 └────────────────┘                           └─────────────┬─────────────┘
                                                            │ REST / WebSocket
                                                            ▼
                                              ┌───────────────────────────┐
                                              │  Express.js Backend API   │
                                              │   (MongoDB / Scheduler)   │
                                              └─────────────┬─────────────┘
                                                            │
                     ┌──────────────────────────────────────┴──────────────────────────────────────┐
                     ▼                                                                             ▼
       ┌───────────────────────────┐                                                 ┌───────────────────────────┐
       │   Jenkins CI/CD Server    │                                                 │   30s Telemetry Monitor   │
       │   (Docker Container :8080)│                                                 │    (SSH Metrics Agent)    │
       └─────────────┬─────────────┘                                                 └─────────────┬─────────────┘
                     │                                                                             │
        ┌────────────┴────────────┐                                                                │
        ▼                         ▼                                                                │
┌───────────────┐         ┌───────────────┐                                                        │
│ Base Infra    │         │ Server Module │                                                        │
│ (SG / Net)    │         │ (AWS EC2 K3s) │                                                        │
└───────────────┘         └───────┬───────┘                                                        │
                                  │                                                                │
                                  ▼                                                                │
                  ┌──────────────────────────────┐                                                 │
                  │   AWS EC2 Deployment Server  │ <───────────────────────────────────────────────┘
                  │   (Workspace: worker-N)      │
                  │   K3s Cluster / App Pods     │
                  └──────────────────────────────┘
```

---

## ✨ Features

- ⚡ **One-Click Application Deployment**: Connects with GitHub OAuth to pull repositories, build Docker images, and deploy them automatically to K3s Kubernetes clusters.
- 🏗️ **Modular Terraform Workspaces**: Separates Base infrastructure (Security Groups, shared networking) from Server instances (`worker-1`, `worker-2`, etc.) using Terraform workspaces.
- 🧠 **Greedy Priority Workload Scheduler**: Evaluates candidate nodes and places workloads based on a 4-tier tie-breaking algorithm:
  $$\text{Lowest Active Deployments} \longrightarrow \text{Lowest CPU} \longrightarrow \text{Lowest RAM} \longrightarrow \text{Lowest Disk}$$
- 🔄 **Automatic Server Auto-Provisioning**: Automatically triggers Jenkins to spin up a new AWS EC2 node if existing servers are at full capacity or offline.
- 📡 **30-Second SSH Telemetry Agent**: Polls EC2 nodes every 30s to extract CPU, RAM, Disk, Uptime, and live Pod counts, automatically flagging unreachable nodes as `OFFLINE`.
- 🗑️ **Standalone Infrastructure Destruction**: Provides a `Destroy-Server` pipeline to cleanly tear down EC2 instances and delete Terraform workspaces without losing MongoDB database records.
- 🎛️ **Dual-Role Control Plane**:
  - **User Dashboard (Sleek Dark Theme)**: Project management, deployment logs, metrics, and zero-downtime rollbacks.
  - **Admin Dashboard (High-Contrast White Theme)**: Node health monitoring, infrastructure scaling, access request management, and cluster controls.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), JavaScript, Vanilla CSS (Dark/Light Dual Theme), Nginx |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB Atlas), Axios, Child Process |
| **Infrastructure** | Terraform (Modular Base/Server Workspaces), AWS EC2, AWS EIP, AWS Security Groups |
| **CI/CD & Orchestration** | Jenkins (Pipeline Groovy), Kubernetes (K3s), Docker Desktop, Minikube |
| **Observability** | Prometheus, Grafana, Custom SSH Base64 Telemetry Monitor |

---

## 📁 Repository Directory Structure

```text
.
├── backend/
│   ├── controllers/            # Controller endpoints (admin, server, auth)
│   ├── models/                 # Mongoose Data Models (Server, Deployment, User, RegisterRequest)
│   ├── routes/                 # Express Route Definitions (/auth, /servers, /admin, /github)
│   ├── services/               # Core Services (scheduler, serverMonitor, deploymentQueueService, jenkinsService)
│   └── terraform/              # Refactored Modular Terraform Setup
│       ├── base/               # Shared AWS Infrastructure (Security Group, Base State)
│       ├── modules/            # Reusable Terraform Modules (base, server)
│       └── server/             # Deployment Server Workspaces (worker-1, worker-2, etc.)
├── frontend/                   # React Vite Source Code
│   ├── src/
│   │   ├── admin/              # High-contrast White Theme Admin Control Plane Pages
│   │   ├── components/         # Navbar, Sidebar, LoginPage, DeployForm
│   │   └── pages/              # User Dashboard (Projects, Deployments, New Project, Monitoring)
│   └── nginx.conf              # Nginx Reverse Proxy Config for K8s pod
├── jenkins/                    # Jenkins Pipelines
│   ├── kubedeploy-stable-v2.pipeline # Deploy app onto K3s node
│   ├── deploy-server.pipeline   # Provisions EC2 node & K3s cluster via Terraform
│   └── destroy-server.pipeline  # Standalone EC2 node destruction pipeline
└── k8s/                        # Kubernetes Deployment & Service Manifests
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    └── frontend-service.yaml
```

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed and running on your machine:

1. **Docker Desktop** (or Docker Engine)
2. **Minikube** & **`kubectl`** CLI
3. **Jenkins** running in a Docker container on default port `8080` (`http://localhost:8080`)
4. **Node.js** (v18 or v22) & **npm**
5. **Terraform CLI** (v1.x+)
6. **AWS CLI** (configured with AWS credentials: `aws configure`)
7. **AWS SSH Key Pair**: A valid EC2 key pair saved as `p377-key.pem`

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `backend/` directory:

```env
# Backend Server Configuration
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/kubedeploy?retryWrites=true&w=majority

# Jenkins Configuration (Container running on default port 8080)
JENKINS_URL=http://host.docker.internal:8080
JENKINS_USER=your_jenkins_username
JENKINS_TOKEN=your_jenkins_api_token
JENKINS_DEPLOY_JOB=kubedeploy-stable-v2
JENKINS_PROVISION_JOB=deploy-server
JENKINS_DESTROY_JOB=Destroy-Server

# Terraform Directory Paths inside Jenkins Container
TF_BASE_DIR=/var/jenkins_home/terraform/base
TF_SERVER_DIR=/var/jenkins_home/terraform/server

# AWS & SSH Configuration
SSH_USER=ubuntu
SSH_KEY_PATH=/app/keys/p377-key.pem
AWS_DEFAULT_REGION=us-east-2

# GitHub OAuth App Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend Local Port-Forwarding URL
FRONTEND_URL=http://localhost:30007
```

---

## 🔧 Jenkins Setup & Pipeline Configuration

You must run Jenkins inside a Docker container on the default port **`8080`** (`http://localhost:8080`) and configure the 3 required pipelines matching the names specified in your `.env`:

### 1. Run Jenkins Container
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

### 2. Create the 3 Required Jenkins Pipeline Jobs
Log into Jenkins at `http://localhost:8080`, create **3 New Items** of type **Pipeline**, and configure them with the corresponding scripts from the `jenkins/` folder:

| Pipeline Job Name (in Jenkins) | `.env` Variable | Source Groovy File in Repo |
| :--- | :--- | :--- |
| **`kubedeploy-stable-v2`** | `JENKINS_DEPLOY_JOB` | [jenkins/kubedeploy-stable-v2.pipeline](file:///c:/nvm/COLLEGE/DEVOPS/KubeDeploy/jenkins/kubedeploy-stable-v2.pipeline) |
| **`deploy-server`** | `JENKINS_PROVISION_JOB` | [jenkins/deploy-server.pipeline](file:///c:/nvm/COLLEGE/DEVOPS/KubeDeploy/jenkins/deploy-server.pipeline) |
| **`Destroy-Server`** | `JENKINS_DESTROY_JOB` | [jenkins/destroy-server.pipeline](file:///c:/nvm/COLLEGE/DEVOPS/KubeDeploy/jenkins/destroy-server.pipeline) |

---

## 🚀 Local Setup & Installation Guide

Follow these step-by-step instructions to get the application running locally on your machine using Minikube and Docker.

### 1. Clone the Repository
```bash
git clone https://github.com/shane235k/Cloud-Deployment-Engine.git
cd Cloud-Deployment-Engine
```

### 2. Start Minikube & Configure Docker Environment
```bash
minikube start
# Configure your shell to use Minikube's in-cluster Docker daemon (Powershell):
minikube docker-env | Invoke-Expression
```

### 3. Build Docker Images
Build the backend and frontend Docker images locally:

```bash
# Build Backend Image
docker build -t p377-backend:v2 ./backend

# Build Frontend Image
docker build -t p377-frontend:v2 ./frontend
```

### 4. Create Kubernetes Secrets
Before applying Kubernetes deployments, you **MUST** create `backend-secret` from your `.env` file and `p377-ssh-key` from your SSH key file:

```bash
# 1. Create backend-secret containing environment variables
kubectl create secret generic backend-secret --from-env-file=./backend/.env

# 2. Create p377-ssh-key containing your EC2 SSH private key
kubectl create secret generic p377-ssh-key --from-file=p377-key.pem=/path/to/your/p377-key.pem
```

### 5. Deploy to Kubernetes
Apply the Kubernetes manifests from the `k8s/` directory:

```bash
kubectl apply -f ./k8s/
```

Verify that all pods and services are running cleanly:
```bash
kubectl get pods
kubectl get services
```

### 6. Expose Application via Port-Forwarding
Forward local port `30007` to the `frontend-service`:

```bash
kubectl port-forward svc/frontend-service 30007:80
```

Now open your browser and navigate to:
👉 **[http://localhost:30007](http://localhost:30007)**

---

## 🔑 Setting Up GitHub OAuth

To allow users to connect their GitHub accounts and select repositories:

1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Set the fields as follows:
   - **Application Name**: `KubeDeploy Local`
   - **Homepage URL**: `http://localhost:30007`
   - **Authorization Callback URL**: `http://localhost:30007/auth/github/callback`
4. Copy the **Client ID** and generate a **Client Secret**.
5. Paste them into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in your `backend/.env` (and recreate `backend-secret`).

---

## 🧪 Running Frontend Development Mode Locally

If you want to make hot-reloading code changes to the frontend React app without rebuilding Docker images:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will run on `http://localhost:5173`.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more details.
