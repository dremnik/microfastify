# Kubernetes Deployment Guide

## Prerequisites

1. GKE Autopilot cluster created
2. `gcloud` and `kubectl` configured
3. Domain name with DNS access

## Setup Steps

### 1. Reserve a Static IP Address

```bash
gcloud compute addresses create microfastify-ip --global
```

Get the IP address:
```bash
gcloud compute addresses describe microfastify-ip --global
```

### 2. Configure DNS

Point your domain to the reserved IP address:
- Add an A record for `YOUR_DOMAIN` → `STATIC_IP`
- Add an A record for `www.YOUR_DOMAIN` → `STATIC_IP` (if using www)

### 3. Update Configuration

1. Edit `k8s/ingress.yaml` and replace `YOUR_DOMAIN_NAME` with your actual domain
2. Edit `k8s/deployment.yaml` and update the image path if needed
3. Edit `k8s/secrets.yaml` and add your actual base64-encoded secrets:
   ```bash
   echo -n "postgresql://user:pass@host:5432/db" | base64
   ```

### 4. Deploy to GKE

```bash
# Apply all manifests
kubectl apply -k k8s/

# Or apply individually
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5. Monitor Deployment

```bash
# Check pods
kubectl get pods -l app=microfastify

# Check ingress (this takes 5-10 minutes to provision)
kubectl describe ingress microfastify

# Check SSL certificate status (can take up to 30 minutes)
kubectl get managedcertificates microfastify-cert

# View logs
kubectl logs -l app=microfastify -f
```

## GitHub Actions Setup

The GitHub Actions workflow will automatically build and deploy on push to master/main.

### Required Secrets

Add these secrets to your GitHub repository:

For GKE deployment:
- `GCP_PROJECT_ID`: Your GCP project ID
- `GKE_CLUSTER_NAME`: Your GKE cluster name
- `GKE_REGION`: Your GKE region (e.g., us-central1)
- `WIF_PROVIDER`: Workload Identity Federation provider
- `WIF_SERVICE_ACCOUNT`: Service account for Workload Identity

For npm private packages (if needed):
- `NPM_TOKEN`: Your npm authentication token

## Troubleshooting

### SSL Certificate Not Provisioning
- Ensure DNS is properly configured
- Check that the domain resolves to the static IP
- Certificate provisioning can take up to 30 minutes

### Pods Not Starting
- Check secrets are properly configured: `kubectl describe secret microfastify-secrets`
- Check pod logs: `kubectl logs -l app=microfastify`
- Verify database connectivity

### Ingress Not Working
- Ensure the static IP name matches in ingress.yaml
- Check ingress events: `kubectl describe ingress microfastify`
- Verify the service is running: `kubectl get svc microfastify-lb`