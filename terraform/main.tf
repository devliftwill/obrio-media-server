terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

resource "google_compute_instance" "rtmp_server" {
  name         = "rtmp-server"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "cos-cloud/cos-stable"
      size  = 50
    }
  }

  network_interface {
    network = "default"
    access_config {}  # Gives external IP
  }

  metadata = {
    gce-container-declaration = yamlencode({
      spec = {
        containers = [{
          image = "gcr.io/${var.project_id}/rtmp-server:latest"
          volumeMounts = [
            {
              name = "frames"
              mountPath = "/app/frames"
            },
            {
              name = "google-creds"
              mountPath = "/app/google-credentials.json"
              readOnly = true
            }
          ]
          env = [
            {
              name = "GOOGLE_APPLICATION_CREDENTIALS"
              value = "/app/google-credentials.json"
            }
          ]
        }]
        volumes = [
          {
            name = "frames"
            hostPath = {
              path = "/var/rtmp/frames"
            }
          },
          {
            name = "google-creds"
            hostPath = {
              path = "/etc/google/auth/application_default_credentials.json"
            }
          }
        ]
      }
    })
  }

  tags = ["rtmp-server"]

  service_account {
    scopes = ["cloud-platform"]
  }
}

resource "google_compute_firewall" "allow_rtmp" {
  name    = "allow-rtmp"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["1935"]
  }

  target_tags = ["rtmp-server"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8000"]
  }

  target_tags = ["rtmp-server"]
}