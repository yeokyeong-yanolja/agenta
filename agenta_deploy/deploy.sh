#!/bin/bash

REGION="ap-northeast-2"
ACCOUNT_ID="517727162249"
REPO_PREFIX="iab"

# Image names and repository names
WEB_IMAGE_NAME="agentaai-agenta-web"
BACKEND_IMAGE_NAME="agentaai-backend"

WEB_REPO_NAME="${REPO_PREFIX}/agenta-web-dev"
BACKEND_REPO_NAME="${REPO_PREFIX}/agenta-backend-dev"

# ECR Addresses
WEB_ECR_ADDRESS="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${WEB_REPO_NAME}"
BACKEND_ECR_ADDRESS="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_REPO_NAME}"

# Step 1: Run docker-compose
docker-compose -f "../docker-compose.yml" up -d --build

# Step 2: Authenticate Docker with ECR
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Step 3: Tag the images
docker tag ${WEB_IMAGE_NAME} ${WEB_ECR_ADDRESS}
docker tag ${BACKEND_IMAGE_NAME} ${BACKEND_ECR_ADDRESS}

# Step 4: Push the images to ECR
docker push ${WEB_ECR_ADDRESS}
docker push ${BACKEND_ECR_ADDRESS}

# Step 5: Deploy Kubernetes Manifest
kubectl apply -f k8s-manifest.yaml
