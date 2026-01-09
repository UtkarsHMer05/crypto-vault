# 🧪 CryptoVault Enterprise - API Testing Guide

> Test API endpoints using curl, Postman, or any HTTP client

---

## Table of Contents

1. [Base URL & Headers](#base-url--headers)
2. [Authentication](#authentication)
3. [File Operations](#file-operations)
4. [Sharing](#sharing)
5. [Audit & Metrics](#audit--metrics)
6. [Complete Workflow Example](#complete-workflow-example)

---

## Base URL & Headers

### Development
```
Base URL: http://localhost:3000/api
```

### Production
```
Base URL: https://yourdomain.com/api
```

### Required Headers

```bash
# Content-Type for JSON requests
Content-Type: application/json

# Authentication cookie is sent automatically
# Or manually include:
Cookie: auth-token=<your-jwt-token>
```

---

## Authentication

### Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "createdAt": "2026-01-09T10:00:00.000Z"
  },
  "encryptedPrivateKey": "base64-encrypted-private-key..."
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "encryptedPrivateKey": "base64-encrypted-private-key..."
}
```

**Note:** The JWT token is set as an HTTP-only cookie automatically.

### Get Current User

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

**Response:**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "ecdsaPublicKey": "base64-ecdsa-key...",
    "createdAt": "2026-01-09T10:00:00.000Z"
  }
}
```

### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## File Operations

### Upload Encrypted File

**Note:** Files should be encrypted client-side before upload. This example assumes you have pre-encrypted data.

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -F "encryptedData=@encrypted-file.bin;type=application/octet-stream" \
  -F 'metadata={"originalName":"document.pdf","mimeType":"application/pdf","size":1024000}' \
  -F 'crypto={"encryptedDEK":"base64-wrapped-dek...","iv":"base64-iv...","authTag":"base64-tag...","hmac":"base64-hmac...","algorithm":"AES-256-GCM","keyWrapAlgorithm":"RSA-OAEP-4096"}'
```

**Alternative: Base64 encoded data**

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -H "Content-Type: multipart/form-data" \
  -F "encryptedData=BASE64_ENCODED_CIPHERTEXT" \
  -F 'metadata={"originalName":"test.txt","mimeType":"text/plain","size":100}' \
  -F 'crypto={
    "encryptedDEK": "RSA_WRAPPED_DEK_BASE64",
    "rawDEK": "RAW_DEK_BASE64_FOR_DEMO",
    "iv": "IV_BASE64",
    "authTag": "AUTH_TAG_BASE64",
    "hmac": "HMAC_SIGNATURE_BASE64",
    "algorithm": "AES-256-GCM",
    "keyWrapAlgorithm": "RSA-OAEP-4096"
  }'
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "clxfile123...",
    "name": "document.pdf",
    "size": 1024000,
    "encryptedSize": 1024600,
    "uploadedAt": "2026-01-09T10:00:00.000Z",
    "storageProvider": "AWS_S3",
    "hasBackup": false,
    "encryptionLayers": [
      "AES-256-GCM (client-side)",
      "RSA-4096-OAEP (key wrapping)",
      "AWS KMS (server-side)",
      "S3 SSE (at rest)"
    ]
  },
  "metrics": {
    "uploadDuration": 1234,
    "throughput": "0.83 MB"
  }
}
```

### Download Encrypted File

```bash
curl -X GET "http://localhost:3000/api/files/download?fileId=clxfile123..." \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "encryptedData": "BASE64_ENCODED_CIPHERTEXT...",
  "crypto": {
    "encryptedDEK": "RSA_WRAPPED_DEK_BASE64...",
    "iv": "IV_BASE64...",
    "authTag": "AUTH_TAG_BASE64...",
    "hmacSignature": "HMAC_BASE64...",
    "algorithm": "AES-256-GCM"
  },
  "metadata": {
    "filename": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000
  }
}
```

### List User's Files

```bash
curl -X GET http://localhost:3000/api/files/list \
  -b cookies.txt
```

**Response:**
```json
{
  "files": [
    {
      "id": "clxfile123...",
      "originalFilename": "document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "encryptedFileSize": 1024600,
      "storageProvider": "AWS_S3",
      "uploadedAt": "2026-01-09T10:00:00.000Z",
      "lastAccessedAt": "2026-01-09T11:00:00.000Z"
    },
    {
      "id": "clxfile456...",
      "originalFilename": "image.png",
      "mimeType": "image/png",
      "fileSize": 2048000,
      "uploadedAt": "2026-01-08T10:00:00.000Z"
    }
  ],
  "total": 2
}
```

### Delete File (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/api/files/delete \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "clxfile123..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Sharing

### Create Share

```bash
curl -X POST http://localhost:3000/api/share/create \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "clxfile123...",
    "sharedWithEmail": "recipient@example.com",
    "canDownload": true,
    "canReshare": false,
    "expiresAt": "2026-02-09T00:00:00.000Z",
    "reEncryptionKey": "PROXY_RE_ENCRYPTION_KEY_BASE64..."
  }'
```

**Response:**
```json
{
  "success": true,
  "share": {
    "id": "clxshare123...",
    "fileId": "clxfile123...",
    "sharedWithUserId": "clxuser456...",
    "canDownload": true,
    "canReshare": false,
    "expiresAt": "2026-02-09T00:00:00.000Z",
    "sharedAt": "2026-01-09T10:00:00.000Z"
  }
}
```

### Revoke Share

```bash
curl -X POST http://localhost:3000/api/share/revoke \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "shareId": "clxshare123..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Share revoked successfully"
}
```

### List Shares for a File

```bash
curl -X GET "http://localhost:3000/api/share/list?fileId=clxfile123..." \
  -b cookies.txt
```

**Response:**
```json
{
  "shares": [
    {
      "id": "clxshare123...",
      "sharedWithUser": {
        "email": "recipient@example.com"
      },
      "canDownload": true,
      "canReshare": false,
      "expiresAt": "2026-02-09T00:00:00.000Z",
      "sharedAt": "2026-01-09T10:00:00.000Z"
    }
  ]
}
```

---

## Audit & Metrics

### Get Audit Logs

```bash
curl -X GET "http://localhost:3000/api/audit?limit=10&offset=0" \
  -b cookies.txt
```

**Response:**
```json
{
  "logs": [
    {
      "id": "clxaudit123...",
      "action": "FILE_UPLOADED",
      "fileId": "clxfile123...",
      "timestamp": "2026-01-09T10:00:00.000Z",
      "details": {
        "filename": "document.pdf",
        "size": 1024000,
        "algorithm": "AES-256-GCM"
      },
      "signature": "ECDSA_SIGNATURE_BASE64...",
      "previousHash": "SHA256_OF_PREVIOUS_ENTRY..."
    },
    {
      "id": "clxaudit124...",
      "action": "FILE_DOWNLOADED",
      "fileId": "clxfile123...",
      "timestamp": "2026-01-09T11:00:00.000Z",
      "details": {
        "filename": "document.pdf",
        "accessType": "owner"
      }
    }
  ],
  "total": 25
}
```

### Get Encryption Metrics

```bash
curl -X GET http://localhost:3000/api/metrics \
  -b cookies.txt
```

**Response:**
```json
{
  "metrics": {
    "totalOperations": 150,
    "averageDurationMs": 245,
    "totalBytesProcessed": 1073741824,
    "averageThroughputMBps": 4.2,
    "errorRate": 0.01,
    "byAlgorithm": {
      "AES-256-GCM": {
        "count": 100,
        "avgDurationMs": 200
      },
      "RSA-4096-OAEP": {
        "count": 50,
        "avgDurationMs": 300
      }
    }
  },
  "period": {
    "start": "2026-01-01T00:00:00.000Z",
    "end": "2026-01-09T23:59:59.000Z"
  }
}
```

---

## Complete Workflow Example

### Full Upload/Download Flow with Bash

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"
COOKIE_FILE="cookies.txt"

# 1. Register
echo "=== Registering user ==="
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -c $COOKIE_FILE \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' | jq .

# 2. Login
echo "=== Logging in ==="
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIE_FILE \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' | jq .

# 3. Get current user
echo "=== Getting current user ==="
curl -s -X GET "$BASE_URL/auth/me" \
  -b $COOKIE_FILE | jq .

# 4. Upload file (with mock encrypted data)
echo "=== Uploading file ==="
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/files/upload" \
  -b $COOKIE_FILE \
  -F "encryptedData=SGVsbG8gV29ybGQh" \
  -F 'metadata={"originalName":"test.txt","mimeType":"text/plain","size":12}' \
  -F 'crypto={"rawDEK":"dGVzdGtleQ==","iv":"dGVzdGl2MTIz","authTag":"dGVzdHRhZw==","algorithm":"AES-256-GCM"}')

echo $UPLOAD_RESPONSE | jq .

FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.file.id')
echo "File ID: $FILE_ID"

# 5. List files
echo "=== Listing files ==="
curl -s -X GET "$BASE_URL/files/list" \
  -b $COOKIE_FILE | jq .

# 6. Download file
echo "=== Downloading file ==="
curl -s -X GET "$BASE_URL/files/download?fileId=$FILE_ID" \
  -b $COOKIE_FILE | jq .

# 7. Get audit logs
echo "=== Getting audit logs ==="
curl -s -X GET "$BASE_URL/audit?limit=5" \
  -b $COOKIE_FILE | jq .

# 8. Logout
echo "=== Logging out ==="
curl -s -X POST "$BASE_URL/auth/logout" \
  -b $COOKIE_FILE | jq .

# Cleanup
rm -f $COOKIE_FILE
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "File not found",
  "message": "The requested file does not exist"
}
```

### 500 Internal Server Error

```json
{
  "error": "Upload failed",
  "details": "S3 bucket not configured"
}
```

---

## Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "CryptoVault API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
            }
          }
        },
        {
          "name": "Me",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/auth/me"
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/logout"
          }
        }
      ]
    },
    {
      "name": "Files",
      "item": [
        {
          "name": "List",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/files/list"
          }
        },
        {
          "name": "Download",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/files/download?fileId={{fileId}}"
          }
        }
      ]
    }
  ]
}
```

---

*See [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for complete API documentation*
