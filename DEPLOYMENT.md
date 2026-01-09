# 🚀 CryptoVault Enterprise - Deployment Guide

> Deploy CryptoVault to production environments

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [AWS Configuration](#aws-configuration)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Services
- **PostgreSQL** 14+ database
- **Node.js** 18.17+ runtime
- **AWS Account** with S3 and KMS access

### Optional Services
- **GCP Account** for backup storage
- **Domain** with SSL certificate
- **CDN** (CloudFront, Cloudflare)

---

## Environment Configuration

### Production Environment Variables

Create `.env.production` with these variables:

```env
# ===========================================
# REQUIRED CONFIGURATION
# ===========================================

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/cryptovault?sslmode=require"

# Authentication
JWT_SECRET="your-256-bit-secret-key-generate-with-openssl-rand-base64-32"

# ===========================================
# AWS CONFIGURATION (Required for production)
# ===========================================

# Region
AWS_REGION="ap-south-1"

# IAM Credentials (use IAM roles in production if possible)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."

# S3 Bucket for encrypted files
AWS_S3_BUCKET="your-production-bucket"

# KMS Key for additional encryption
AWS_KMS_KEY_ARN="arn:aws:kms:region:account:key/key-id"

# ===========================================
# OPTIONAL CONFIGURATION
# ===========================================

# GCP Backup (optional)
GCP_PROJECT_ID="your-project"
GCP_BUCKET_NAME="your-backup-bucket"
GCP_KEYFILE_PATH="/path/to/service-account.json"

# Feature Flags
ENABLE_POST_QUANTUM="true"
ENABLE_FHE="false"
ENABLE_DEMO_MODE="false"

# Performance
MAX_FILE_SIZE_MB="100"
UPLOAD_TIMEOUT_MS="300000"

# Security Headers
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"
```

### Generate Secure JWT Secret

```bash
# Generate a secure 256-bit secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### Option 1: AWS RDS (Recommended)

```bash
# Create PostgreSQL instance via AWS CLI
aws rds create-db-instance \
    --db-instance-identifier cryptovault-prod \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --engine-version 14 \
    --master-username admin \
    --master-user-password "YOUR_SECURE_PASSWORD" \
    --allocated-storage 100 \
    --storage-encrypted \
    --vpc-security-group-ids sg-xxx \
    --backup-retention-period 7
```

### Option 2: Managed PostgreSQL

Supported providers:
- **Supabase** - Free tier available
- **PlanetScale** - MySQL (requires adapter)
- **Neon** - Serverless Postgres
- **Railway** - Simple deployment

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate deploy
```

---

## AWS Configuration

### S3 Bucket Setup

```bash
# Create bucket
aws s3 mb s3://cryptovault-prod-files --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket cryptovault-prod-files \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket cryptovault-prod-files \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "your-kms-key-id"
            }
        }]
    }'

# Block public access
aws s3api put-public-access-block \
    --bucket cryptovault-prod-files \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### KMS Key Setup

```bash
# Create KMS key
aws kms create-key \
    --description "CryptoVault DEK encryption key" \
    --key-usage ENCRYPT_DECRYPT \
    --origin AWS_KMS

# Create alias
aws kms create-alias \
    --alias-name alias/cryptovault-prod \
    --target-key-id "key-id-from-above"
```

### IAM Policy (Least Privilege)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::cryptovault-prod-files",
                "arn:aws:s3:::cryptovault-prod-files/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            "Resource": "arn:aws:kms:region:account:key/key-id"
        }
    ]
}
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add AWS_ACCESS_KEY_ID production
# ... add all required variables
```

**Vercel Configuration** (`vercel.json`):
```json
{
    "framework": "nextjs",
    "regions": ["bom1"],
    "functions": {
        "app/api/**/*.ts": {
            "maxDuration": 30
        }
    }
}
```

### Option 2: AWS (EC2 + Docker)

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and push to ECR
docker build -t cryptovault .
docker tag cryptovault:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Deploy to EC2
ssh ec2-user@your-instance
docker pull $ECR_REPO:latest
docker run -d -p 3000:3000 --env-file .env.production cryptovault
```

### Option 3: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
    app:
        build: .
        ports:
            - "3000:3000"
        environment:
            - DATABASE_URL=postgresql://postgres:password@db:5432/cryptovault
            - JWT_SECRET=${JWT_SECRET}
            - AWS_REGION=${AWS_REGION}
            - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
            - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
            - AWS_S3_BUCKET=${AWS_S3_BUCKET}
        depends_on:
            - db

    db:
        image: postgres:14-alpine
        volumes:
            - postgres_data:/var/lib/postgresql/data
        environment:
            - POSTGRES_USER=postgres
            - POSTGRES_PASSWORD=password
            - POSTGRES_DB=cryptovault

volumes:
    postgres_data:
```

```bash
docker-compose up -d
```

### Option 4: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add PostgreSQL
railway add --plugin postgresql
```

---

## Post-Deployment Checklist

### Security

- [ ] HTTPS enabled (SSL certificate)
- [ ] HSTS header configured
- [ ] CORS restricted to your domain
- [ ] Rate limiting enabled
- [ ] CSP headers configured
- [ ] Database connection uses SSL

### Environment

- [ ] All environment variables set
- [ ] JWT_SECRET is unique and secure
- [ ] AWS credentials are IAM roles (not hardcoded)
- [ ] Demo mode disabled (`ENABLE_DEMO_MODE=false`)

### Database

- [ ] Migrations applied
- [ ] Backups configured
- [ ] Connection pooling enabled
- [ ] Indices created

### Monitoring

- [ ] Error tracking (Sentry, etc.)
- [ ] Logging configured
- [ ] Uptime monitoring
- [ ] Performance metrics

### Testing

- [ ] Upload/download works
- [ ] Authentication works
- [ ] File sharing works
- [ ] Audit logs recording

---

## Monitoring & Maintenance

### Health Check Endpoint

Add a health check route:

```typescript
// app/api/health/route.ts
export async function GET() {
    return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
}
```

### Recommended Monitoring

| Service | Purpose |
|---------|---------|
| **AWS CloudWatch** | Logs, metrics |
| **Sentry** | Error tracking |
| **UptimeRobot** | Uptime monitoring |
| **Datadog** | APM, logs |

### Backup Strategy

```bash
# Daily database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-*.sql.gz s3://cryptovault-backups/
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# /etc/logrotate.d/cryptovault
/var/log/cryptovault/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules
# Ensure security group allows inbound on 5432
```

### S3 Upload Failed

```bash
# Test S3 access
aws s3 ls s3://your-bucket/

# Check IAM permissions
aws sts get-caller-identity
```

### High Memory Usage

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

*See [QUICKSTART.md](./QUICKSTART.md) for development setup*
