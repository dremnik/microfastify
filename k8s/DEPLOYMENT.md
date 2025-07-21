# GKE Deployment Guide

Complete step-by-step guide to deploy your Fastify app to Google Kubernetes Engine (GKE) with automatic GitHub Actions CI/CD.

## Prerequisites

- Google Cloud Platform account with billing enabled
- GitHub repository for your app
- `gcloud` CLI installed and authenticated
- Domain name (optional, for HTTPS)

## Part 1: GCP Setup

### 1. Set Your Project and Enable APIs

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable iam.googleapis.com
```

### 2. Create GKE Autopilot Cluster

```bash
# Create the cluster (takes 5-10 minutes)
gcloud container clusters create-auto microfastify-cluster \
  --region=us-central1
```

### 3. Reserve Static IP Address

```bash
# Create global static IP for HTTPS load balancer
gcloud compute addresses create microfastify-ip --global

# Get the IP address (point your domain to this)
gcloud compute addresses describe microfastify-ip --global --format="get(address)"
```

## Part 2: Workload Identity Federation Setup

### 4. Create Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.developer"
```

### 5. Set Up Workload Identity Federation

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Create OIDC provider (replace YOUR_GITHUB_USERNAME)
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository_owner=='YOUR_GITHUB_USERNAME'" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Bind service account to workload identity (replace YOUR_GITHUB_USERNAME/REPO_NAME)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud iam service-accounts add-iam-policy-binding \
    "github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

### 6. Get Values for GitHub Secrets

```bash
# Get the values you need for GitHub Secrets
echo "WIF_PROVIDER: projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "WIF_SERVICE_ACCOUNT: github-actions@$PROJECT_ID.iam.gserviceaccount.com"
echo "GCP_PROJECT_ID: $PROJECT_ID"
echo "STATIC_IP: $(gcloud compute addresses describe microfastify-ip --global --format='get(address)')"
```

## Part 3: GitHub Repository Setup

### 7. Configure GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these repository secrets:

**Application Secrets:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_KEYS` - Comma-separated API keys

**GCP Deployment Secrets:**
- `GCP_PROJECT_ID` - Your GCP project ID
- `GKE_CLUSTER_NAME` - `microfastify-cluster`
- `GKE_REGION` - `us-central1`
- `WIF_PROVIDER` - From step 6 output
- `WIF_SERVICE_ACCOUNT` - From step 6 output

### 8. Update Kubernetes Manifests

Edit `k8s/networking.yaml`:
- Replace `kerl.space` with your actual domain
- Replace `www.kernl.space` with your www subdomain

Edit `k8s/deployment.yaml`:
- Update image path if needed: `ghcr.io/YOUR_USERNAME/YOUR_REPO:latest`

## Part 4: DNS and Domain Setup (Optional)

### 9. Configure DNS

Point your domain to the static IP from step 3:
- Add A record: `yourdomain.com` → `STATIC_IP`
- Add A record: `www.yourdomain.com` → `STATIC_IP`

## Part 5: Deploy

### 10. Deploy Your App

```bash
# Push to trigger deployment
git add .
git commit -m "Deploy to GKE"
git push origin main
```

GitHub Actions will automatically:
1. Build Docker image
2. Push to GitHub Container Registry
3. Create Kubernetes secrets
4. Deploy to GKE
5. Update deployment with new image

### 11. Monitor Deployment

```bash
# Get cluster credentials
gcloud container clusters get-credentials microfastify-cluster --region=us-central1

# Check deployment status
kubectl get pods -l app=microfastify
kubectl rollout status deployment/microfastify

# Check SSL certificate (takes up to 30 minutes)
kubectl get managedcertificates microfastify-cert

# View logs
kubectl logs -l app=microfastify -f

# Check ingress
kubectl describe ingress microfastify
```

## Troubleshooting

### SSL Certificate Issues
- Ensure DNS points to static IP
- Certificate can take up to 30 minutes to provision
- Check: `kubectl describe managedcertificates microfastify-cert`

### Deployment Issues
- Check GitHub Actions logs
- Verify all GitHub Secrets are set correctly
- Check pod logs: `kubectl logs -l app=microfastify`

### Permission Issues
- Ensure service account has `roles/container.developer`
- Verify Workload Identity Federation is set up correctly
- Check that repository name matches in attribute condition

## Useful Commands

```bash
# Get static IP
gcloud compute addresses describe microfastify-ip --global

# Update deployment manually
kubectl set image deployment/microfastify microfastify=ghcr.io/user/repo:tag

# Scale deployment
kubectl scale deployment microfastify --replicas=3

# Delete everything
kubectl delete -f k8s/
gcloud container clusters delete microfastify-cluster --region=us-central1
gcloud compute addresses delete microfastify-ip --global
```

## Template Replication

To use this setup for another project:

1. Copy the `k8s/`, `.github/` directories, and `Dockerfile`
2. Update image names and domain names in manifests
3. Repeat Part 2 (Workload Identity setup) with new repository name
4. Set up GitHub Secrets for new repository
5. Push to deploy!

The Workload Identity Federation setup only needs to be done once per repository.