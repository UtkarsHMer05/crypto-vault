# 🚀 CryptoVault Enterprise - Quick Start Guide

> Get up and running in 5 minutes

---

## Prerequisites

- **Node.js** 18.17 or later
- **PostgreSQL** database (local or cloud)
- **npm** or **yarn**

---

## Option 1: Demo Mode (No Setup Required)

Try the app immediately without any configuration:

```bash
# Clone the repository
git clone <repository-url>
cd cryptovault-enterprise

# Install dependencies
npm install

# Run in development mode
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo) to explore the demo.

**Demo mode features:**
- ✅ Full encryption/decryption workflow
- ✅ Local storage (no AWS/database needed)
- ✅ Pre-generated demo keys
- ⚠️ Not for production use

---

## Option 2: Full Setup (Production-Ready)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required variables:**

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/cryptovault"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-256-bit-secret-key-here"
```

**Optional variables (for cloud storage):**

```env
# AWS Configuration
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_KMS_KEY_ARN="arn:aws:kms:region:account:key/id"

# Feature Flags
ENABLE_POST_QUANTUM="true"
ENABLE_FHE="false"
```

### Step 3: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### Step 4: Run the Application

```bash
# Development mode (with hot reload)
npm run dev

# OR Production mode
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## First Steps After Setup

### 1. Create an Account

1. Go to `/register`
2. Enter email and password
3. System generates RSA-4096 key pair
4. Private key is encrypted with your password

### 2. Upload a File

1. Go to `/upload` or Dashboard
2. Drag & drop or select a file
3. Watch encryption happen in real-time
4. File is encrypted client-side before upload

### 3. Download and Decrypt

1. Go to `/files`
2. Click on a file to download
3. File is downloaded encrypted
4. Decrypted in your browser with your private key

### 4. Explore Advanced Features

| Feature | Location |
|---------|----------|
| Encryption Demos | `/crypto-lab` |
| Visual Demonstrations | `/visual-demo` |
| Analytics Dashboard | `/analytics` |
| Key Management | `/keys` |
| File Sharing | `/share` |

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
```

---

## Folder Structure Quick Reference

```
cryptovault-enterprise/
├── app/                  # Next.js pages & API routes
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Protected pages
│   ├── api/             # API endpoints
│   └── demo/            # Demo mode
├── components/          # React components
├── lib/
│   ├── crypto/          # 🔐 Cryptographic modules
│   ├── auth/            # JWT handling
│   └── storage/         # Storage adapters
├── prisma/              # Database schema
└── public/              # Static assets
```

---

## Troubleshooting

### "Cannot connect to database"

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env.local`
3. Try: `npm run db:push`

### "Module not found" errors

```bash
npm install
npm run db:generate
```

### "Crypto operation failed"

- Ensure you're running on `localhost` (HTTPS required for prod)
- Clear browser cache and try again
- Check browser console for specific error

### AWS/S3 errors

- Verify AWS credentials in `.env.local`
- Check IAM permissions (S3, KMS access)
- Ensure bucket exists and region matches

---

## Next Steps

1. 📖 Read [README.md](./README.md) for full documentation
2. 🔐 Explore [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for crypto details
3. 🏗️ Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. 📊 Use [PRESENTATION_CONTENT.md](./PRESENTATION_CONTENT.md) for slides

---

## Need Help?

- Check [FAQ.md](./FAQ.md) for common questions
- Review [GLOSSARY.md](./GLOSSARY.md) for crypto terms
- See [SECURITY.md](./SECURITY.md) for security details

---

*Happy encrypting! 🔐*
