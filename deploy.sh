#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
CLUSTER_NAME="microfastify-cluster"
REGION="us-central1"
STATIC_IP_NAME="microfastify-ip"

echo "🚀 Starting deployment for project: $PROJECT_ID"

# 1. Check if cluster exists
echo "📍 Checking cluster status..."
if ! gcloud container clusters describe $CLUSTER_NAME --region=$REGION &>/dev/null; then
    echo "❌ Cluster $CLUSTER_NAME not found. Please create it first with:"
    echo "   gcloud container clusters create-auto $CLUSTER_NAME --region=$REGION"
    exit 1
fi

# 2. Get cluster credentials
echo "🔑 Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# 3. Create static IP if it doesn't exist
echo "🌐 Checking static IP..."
if ! gcloud compute addresses describe $STATIC_IP_NAME --global &>/dev/null; then
    echo "   Creating static IP..."
    gcloud compute addresses create $STATIC_IP_NAME --global
fi

# 4. Get the static IP address
STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --global --format="get(address)")
echo "   Static IP: $STATIC_IP"
echo "   ⚠️  Make sure your domain points to this IP!"

# 5. Apply Kubernetes manifests
echo "☸️  Applying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/networking.yaml

# 6. Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/microfastify --timeout=5m

# 7. Check certificate status
echo "🔒 Checking SSL certificate status..."
kubectl get managedcertificates microfastify-cert

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update your DNS to point to: $STATIC_IP"
echo "2. Wait for SSL certificate to provision (up to 30 minutes)"
echo "3. Monitor with: kubectl get managedcertificates -w"
echo "4. View logs: kubectl logs -l app=microfastify -f"