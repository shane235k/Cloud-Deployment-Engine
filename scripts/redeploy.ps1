<#
.SYNOPSIS
    Automated Local CI Redeployment Script for KubeDeploy (Minikube / Kubernetes).

.DESCRIPTION
    Executes the development reload sequence:
      1. Deletes current Kubernetes pods for updated component(s).
      2. Builds new container images locally directly into Minikube (no remote registry needed).
      3. Applies Kubernetes manifests (kubectl apply -f).
      4. Verifies rollout and displays new pod status.

.PARAMETER Component
    The component to redeploy: 'all' (default), 'frontend', or 'backend'.

.PARAMETER Frontend
    Shorthand switch to redeploy only the frontend.

.PARAMETER Backend
    Shorthand switch to redeploy only the backend.

.PARAMETER Builder
    Image build method: 'auto' (default: minikube with docker fallback), 'minikube', or 'docker'.

.PARAMETER SkipBuild
    Skip building images and only delete pods and re-apply manifests.

.PARAMETER NoWait
    Do not wait for rollout status completion.

.EXAMPLE
    .\scripts\redeploy.ps1
    Rebuilds both frontend and backend, deletes pods, applies manifests, and rolls out.

.EXAMPLE
    .\scripts\redeploy.ps1 -Frontend
    Rebuilds and redeploys only the frontend.

.EXAMPLE
    .\scripts\redeploy.ps1 -Backend
    Rebuilds and redeploys only the backend.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('all', 'frontend', 'backend', 'both')]
    [string]$Component = 'all',

    [Alias('f')]
    [switch]$Frontend,

    [Alias('b')]
    [switch]$Backend,

    [ValidateSet('auto', 'minikube', 'docker')]
    [string]$Builder = 'auto',

    [switch]$SkipBuild,
    [switch]$NoWait
)

$ErrorActionPreference = 'Stop'

# Resolve Project Root directory (parent of scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location -Path $ProjectRoot

# Determine targets based on parameters
if ($Frontend -and $Backend) {
    $Target = 'all'
} elseif ($Frontend) {
    $Target = 'frontend'
} elseif ($Backend) {
    $Target = 'backend'
} else {
    $Target = $Component.ToLower()
    if ($Target -eq 'both') { $Target = 'all' }
}

# Image and manifest configuration
$FrontendImage = 'p377-frontend:v1'
$BackendImage  = 'p377-backend:v1'

$FrontendDir  = Join-Path $ProjectRoot 'frontend'
$BackendDir   = Join-Path $ProjectRoot 'backend'
$K8sDir       = Join-Path $ProjectRoot 'k8s'

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host ">> $Message" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "   KUBEDEPLOY LOCAL CI / REDEPLOYMENT SCRIPT            " -ForegroundColor Magenta
Write-Host "   Target: $( $Target.ToUpper() )                       " -ForegroundColor Magenta
Write-Host "   Project Root: $ProjectRoot                           " -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta

# -------------------------------------------------------------------------
# Step 0: Pre-flight Environment Checks
# -------------------------------------------------------------------------
Write-Step "Step 0: Verifying Environment & Cluster Connectivity"

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Fail "kubectl is not installed or not in PATH."
    exit 1
}

$CurrentContext = kubectl config current-context 2>$null
if (-not $CurrentContext) {
    Write-Fail "Kubernetes cluster is not reachable or no context is set."
    exit 1
}
Write-Success "Connected to Kubernetes context: $CurrentContext"

# -------------------------------------------------------------------------
# Step 1: Delete Current Kubernetes Pods
# -------------------------------------------------------------------------
Write-Step "Step 1: Deleting Current Kubernetes Pods"

if ($Target -in @('all', 'frontend')) {
    Write-Host "Deleting existing frontend pods..." -ForegroundColor White
    kubectl delete pod -l app=frontend --ignore-not-found=true --wait=false
    Write-Success "Frontend pods marked for deletion."
}

if ($Target -in @('all', 'backend')) {
    Write-Host "Deleting existing backend pods..." -ForegroundColor White
    kubectl delete pod -l app=backend --ignore-not-found=true --wait=false
    Write-Success "Backend pods marked for deletion."
}

# -------------------------------------------------------------------------
# Step 2: Build New Container Images (Locally - No Registry)
# -------------------------------------------------------------------------
Write-Step "Step 2: Building New Local Images of Updated Code"

function Build-LocalImage {
    param(
        [string]$ImageName,
        [string]$ContextDir,
        [string]$PreferredBuilder
    )

    Write-Host "`nBuilding local image '$ImageName' from context: $ContextDir..." -ForegroundColor Yellow

    $BuildSuccess = $false

    if ($PreferredBuilder -in @('auto', 'minikube')) {
        if (Get-Command minikube -ErrorAction SilentlyContinue) {
            Write-Host "Executing: minikube image build -t $ImageName $ContextDir" -ForegroundColor DarkGray
            & minikube image build -t $ImageName $ContextDir
            if ($LASTEXITCODE -eq 0) {
                $BuildSuccess = $true
                Write-Success "Image '$ImageName' successfully built directly into Minikube runtime."
            } else {
                Write-Warn "minikube image build returned exit code $LASTEXITCODE."
            }
        }
    }

    # Fallback to docker build + minikube image load if minikube build failed or docker was requested
    if (-not $BuildSuccess) {
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-Fail "Neither 'minikube image build' succeeded nor is 'docker' available."
            exit 1
        }

        Write-Host "Building via Docker daemon: docker build -t $ImageName $ContextDir" -ForegroundColor DarkGray
        & docker build -t $ImageName $ContextDir
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Docker build failed for $ImageName."
            exit 1
        }
        Write-Success "Docker build complete for $ImageName."

        if (Get-Command minikube -ErrorAction SilentlyContinue) {
            Write-Host "Loading image into Minikube cluster: minikube image load $ImageName" -ForegroundColor DarkGray
            & minikube image load $ImageName
            if ($LASTEXITCODE -ne 0) {
                Write-Fail "Failed to load image into Minikube."
                exit 1
            }
            Write-Success "Image '$ImageName' loaded into Minikube."
        }
    }
}

if (-not $SkipBuild) {
    if ($Target -in @('all', 'frontend')) {
        Build-LocalImage -ImageName $FrontendImage -ContextDir $FrontendDir -PreferredBuilder $Builder
    }

    if ($Target -in @('all', 'backend')) {
        Build-LocalImage -ImageName $BackendImage -ContextDir $BackendDir -PreferredBuilder $Builder
    }
} else {
    Write-Warn "Skipping image build step as requested (-SkipBuild)."
}

# -------------------------------------------------------------------------
# Step 3: Apply Kubernetes Manifests (kubectl apply -f)
# -------------------------------------------------------------------------
Write-Step "Step 3: Applying Kubernetes Manifests (kubectl apply -f)"

$ManifestsToApply = @()

if ($Target -in @('all', 'backend')) {
    $ManifestsToApply += (Join-Path $K8sDir 'backend-deployment.yaml')
    $ManifestsToApply += (Join-Path $K8sDir 'backend-service.yaml')
}

if ($Target -in @('all', 'frontend')) {
    $ManifestsToApply += (Join-Path $K8sDir 'frontend-deployment.yaml')
    $ManifestsToApply += (Join-Path $K8sDir 'frontend-service.yaml')
}

foreach ($Manifest in $ManifestsToApply) {
    if (Test-Path $Manifest) {
        Write-Host "Applying $Manifest..." -ForegroundColor White
        kubectl apply -f $Manifest
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Failed to apply manifest: $Manifest"
            exit 1
        }
    } else {
        Write-Warn "Manifest file not found: $Manifest"
    }
}

# Optional ServiceMonitor application only if CRD is supported
if ($Target -in @('all', 'backend')) {
    $MonitorManifest = Join-Path $K8sDir 'backend-monitor.yaml'
    if (Test-Path $MonitorManifest) {
        $HasCRD = kubectl get crd servicemonitors.monitoring.coreos.com 2>$null
        if ($HasCRD) {
            Write-Host "Applying $MonitorManifest..." -ForegroundColor White
            kubectl apply -f $MonitorManifest
        }
    }
}

Write-Success "Kubernetes manifests applied successfully."

# -------------------------------------------------------------------------
# Step 4: Ensure Pods Pickup New Local Image & Verify Rollout
# -------------------------------------------------------------------------
Write-Step "Step 4: Restarting Deployments & Verifying Rollout"

# Trigger rollout restart so Kubernetes explicitly replaces pods with the new local image
if ($Target -in @('all', 'frontend')) {
    Write-Host "Triggering rollout restart for frontend-deployment..." -ForegroundColor White
    kubectl rollout restart deployment frontend-deployment
}

if ($Target -in @('all', 'backend')) {
    Write-Host "Triggering rollout restart for backend-deployment..." -ForegroundColor White
    kubectl rollout restart deployment backend-deployment
}

if (-not $NoWait) {
    if ($Target -in @('all', 'frontend')) {
        Write-Host "Waiting for frontend-deployment rollout to finish..." -ForegroundColor White
        kubectl rollout status deployment/frontend-deployment --timeout=90s
    }

    if ($Target -in @('all', 'backend')) {
        Write-Host "Waiting for backend-deployment rollout to finish..." -ForegroundColor White
        kubectl rollout status deployment/backend-deployment --timeout=90s
    }
}

# -------------------------------------------------------------------------
# Final Summary
# -------------------------------------------------------------------------
Write-Step "Deployment Complete! Active Pods Status"
kubectl get pods -o wide

Write-Host "`n[SUCCESS] CI Redeployment finished for: $( $Target.ToUpper() )`n" -ForegroundColor Green
