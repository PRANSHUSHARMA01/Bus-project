terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "ap-south-1" # Mumbai (DPDP India data residency compliant)
}

variable "domain_name" {
  type    = string
  default = "pranshusharma.tech"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

# ------------------------------------------------------------------------------
# 1. S3 Bucket for Nightly Encrypted Backups
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "backups" {
  bucket = "smartbus-backups-${var.domain_name}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups_enc" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups_retention" {
  bucket = aws_s3_bucket.backups.id
  rule {
    id     = "expire-backups-30-days"
    status = "Enabled"
    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups_block_public" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# 2. IAM Role & Instance Profile (SSM, S3 Backup, SES, CloudWatch)
# ------------------------------------------------------------------------------
resource "aws_iam_role" "ec2_role" {
  name = "smartbus-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# Attach AWS managed policy for SSM Session Manager (No port 22 needed!)
resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "cloudwatch_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Custom policy for S3 Backups and SES Email Sending
resource "aws_iam_role_policy" "s3_ses_policy" {
  name = "smartbus-s3-ses-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/smartbus/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "smartbus-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ------------------------------------------------------------------------------
# 3. Security Group (Port 80 and 443 open to the world, Port 22 closed via SSM)
# ------------------------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "web_sg" {
  name        = "smartbus-web-sg"
  description = "Allow inbound HTTP/HTTPS traffic"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP for Let's Encrypt challenge & Caddy redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS production traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ------------------------------------------------------------------------------
# 4. EC2 Instance with Ubuntu 24.04 LTS & Docker
# ------------------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = false
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update
              apt-get install -y ca-certificates curl gnupg lsb-release
              
              # Install Docker
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              
              # Enable and start Docker
              systemctl enable docker
              systemctl start docker
              
              # Create application directory
              mkdir -p /opt/smartbus
              mkdir -p /var/lib/smartbus/postgres_data
              EOF

  tags = {
    Name = "smartbus-production"
  }
}

# ------------------------------------------------------------------------------
# 5. Elastic IP
# ------------------------------------------------------------------------------
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "smartbus-eip"
  }
}

output "elastic_ip" {
  description = "Point your DNS A record (pranshusharma.tech) to this Elastic IP"
  value       = aws_eip.app_eip.public_ip
}

output "s3_backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}
