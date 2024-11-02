## GitHub Actions Deployment Setup for GCP Compute Engine

### Initial Setup Instructions

1. Create a GCP Project (if you haven't already):
   ```bash
   gcloud projects create [PROJECT_ID]
   gcloud config set project [PROJECT_ID]
   ```

2. Enable required APIs:
   ```bash
   gcloud services enable \
     compute.googleapis.com \
     containerregistry.googleapis.com \
     cloudbuild.googleapis.com
   ```

3. Create a Service Account:
   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Deploy"

   # Grant necessary roles
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/compute.admin"
   
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
   ```

4. Create Compute Engine Instance:
   ```bash
   # Create the instance with container optimized OS
   gcloud compute instances create-with-container rtmp-server \
     --zone=us-central1-a \
     --machine-type=e2-standard-2 \
     --boot-disk-size=50GB \
     --image-project=cos-cloud \
     --image-family=cos-stable \
     --container-image=gcr.io/$PROJECT_ID/rtmp-server:latest \
     --container-mount-host-path=mount-path=/app/frames,host-path=/var/rtmp/frames \
     --container-mount-host-path=mount-path=/app/google-credentials.json,host-path=/etc/google/auth/application_default_credentials.json,mode=ro \
     --container-env=GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json \
     --tags=rtmp-server \
     --scopes=cloud-platform

   # Create firewall rules for RTMP and HTTP
   gcloud compute firewall-rules create allow-rtmp \
     --allow=tcp:1935 \
     --target-tags=rtmp-server \
     --description="Allow RTMP traffic"

   gcloud compute firewall-rules create allow-http \
     --allow=tcp:8000 \
     --target-tags=rtmp-server \
     --description="Allow HTTP traffic"
   ```

5. Add GitHub Secrets:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Add these repository secrets:
     - `GCP_PROJECT_ID`: Your GCP project ID
     - `GCP_SA_KEY`: The entire content of the downloaded key.json file

### Instance Details
- Machine Type: e2-standard-2 (2 vCPU, 8GB RAM)
- Region: us-central1-a
- Network Tags: rtmp-server
- Ports: 1935 (RTMP), 8000 (HTTP)
- OS: Container-Optimized OS

### Deployment Process
1. Builds Docker container
2. Pushes to Google Container Registry
3. Updates GCE instance with new container
4. Container automatically mounts required volumes
5. Firewall rules allow RTMP and HTTP traffic

### Getting Server Information
```bash
# Get the server's external IP
gcloud compute instances describe rtmp-server \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Your RTMP endpoint will be: rtmp://[SERVER-IP]:1935
HTTP endpoint will be: http://[SERVER-IP]:8000