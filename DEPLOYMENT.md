# Frontend Deployment to S3 + CloudFront

## Overview
Frontend is a static React application built with Vite and deployed to AWS S3 + CloudFront.

---

## 🚀 Automatic Deployment (GitHub Actions)

### Setup
1. Add GitHub Secrets:
   - `AWS_OIDC_ROLE` - AWS IAM role for OIDC authentication
   - `DEV_CLOUDFRONT_DIST_ID` - Dev CloudFront distribution ID
   - `UAT_CLOUDFRONT_DIST_ID` - UAT CloudFront distribution ID
   - `PROD_CLOUDFRONT_DIST_ID` - Prod CloudFront distribution ID

2. Update S3 bucket names in `.github/workflows/deploy.yaml`:
   ```yaml
   S3_BUCKET=cir-eus1-dev-fe-s3  # Change to your bucket name
   ```

3. Update API URLs in workflow:
   ```yaml
   VITE_API_URL=https://api-dev.yourdomain.com/v1
   ```

### Deploy
```bash
# Push to branch
git push origin dev   # Deploys to dev environment
git push origin uat   # Deploys to UAT environment
git push origin main  # Deploys to production
```

---

## 📦 Manual Deployment

### 1. Build
```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` folder with optimized static files.

### 2. Deploy to S3
```bash
# Set environment
export S3_BUCKET=your-bucket-name
export CLOUDFRONT_DIST_ID=your-distribution-id

# Sync static assets (with long cache)
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html (no cache)
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# Upload JSON files (short cache)
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --exclude "*" \
  --include "*.json" \
  --cache-control "public,max-age=300"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/*"
```

---

## ☁️ AWS Setup

### S3 Bucket Configuration

1. **Create S3 Bucket**:
```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

2. **Enable Static Website Hosting**:
```bash
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

3. **Bucket Policy** (for CloudFront access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
        }
      }
    }
  ]
}
```

### CloudFront Distribution

1. **Create Distribution**:
   - Origin: S3 bucket
   - Origin Access: Origin Access Control (OAC)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Compress Objects: Yes

2. **Cache Behavior**:
   - Path: `/*`
   - Cache Policy: CachingOptimized
   - Origin Request Policy: CORS-S3Origin

3. **Error Pages**:
   - 403 → `/index.html` (200 response)
   - 404 → `/index.html` (200 response)

4. **Custom Domain** (optional):
   - Add CNAME record
   - Add SSL certificate from ACM

---

## 🔧 Environment Variables

### Build Time Variables
Create `.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com/v1
```

These are embedded during build:
```bash
npm run build
```

---

## 📊 Cache Strategy

| File Type | Cache Duration | Reason |
|-----------|---------------|---------|
| `index.html` | No cache | Always get latest version |
| `*.js`, `*.css` | 1 year | Hashed filenames, immutable |
| `*.json` | 5 minutes | Manifests, may change |
| Images | 1 year | Static assets |

---

## 🧪 Testing

### Local Build Test
```bash
cd frontend
npm run build
npm run preview  # Test production build locally
```

### Verify Deployment
```bash
# Check S3
aws s3 ls s3://your-bucket-name/

# Check CloudFront
curl -I https://your-domain.com

# Test API connection
curl https://your-domain.com
```

---

## 🔄 Rollback

### Option 1: S3 Versioning
```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled

# List versions
aws s3api list-object-versions --bucket your-bucket-name

# Restore previous version
aws s3api copy-object \
  --bucket your-bucket-name \
  --copy-source your-bucket-name/index.html?versionId=VERSION_ID \
  --key index.html
```

### Option 2: Redeploy Previous Commit
```bash
git checkout PREVIOUS_COMMIT
npm run build
# Deploy to S3
```

---

## 💰 Cost Estimate

### Monthly Costs (Low Traffic)
- **S3 Storage (1GB)**: $0.02
- **S3 Requests (10K)**: $0.01
- **CloudFront (10GB transfer)**: $0.85
- **CloudFront Requests (100K)**: $0.10

**Total**: ~$1/month

---

## 🔐 Security

- ✅ HTTPS only (CloudFront)
- ✅ S3 bucket not publicly accessible
- ✅ CloudFront OAC for S3 access
- ✅ Security headers via CloudFront Functions
- ✅ No sensitive data in frontend code
- ✅ API URL from environment variable

---

## 📝 Checklist

- [ ] S3 bucket created
- [ ] CloudFront distribution created
- [ ] OAC configured
- [ ] Error pages configured (403, 404 → index.html)
- [ ] GitHub secrets added
- [ ] Workflow file updated with bucket names
- [ ] API URL configured
- [ ] Test deployment
- [ ] Verify CloudFront cache
- [ ] Test all routes (SPA routing)

---

## 🚦 CI/CD Status

**Current Setup**:
- ✅ Auto-deploy on push to dev/uat/main
- ✅ Build optimization with Vite
- ✅ Cache control headers
- ✅ CloudFront invalidation
- ✅ Environment-specific API URLs

**Workflow File**: `.github/workflows/deploy.yaml`

---

## 📞 Troubleshooting

### Issue: Blank page after deployment
**Solution**: Check browser console, verify API URL

### Issue: 403 errors
**Solution**: Check S3 bucket policy and CloudFront OAC

### Issue: Old version showing
**Solution**: Invalidate CloudFront cache

### Issue: API calls failing
**Solution**: Check CORS settings on backend, verify API URL

---

**Deployment Method**: S3 + CloudFront (Static Hosting)
**No Docker Required**: Frontend is static files only
**Build Tool**: Vite
**CI/CD**: GitHub Actions
