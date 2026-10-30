# Proposed AWS deployment

## Architecture

Visitor → HTTPS → CloudFront → Origin Access Control → private S3 website files

Use the S3 REST origin, not an S3 public website endpoint. Keep S3 Block Public Access enabled. No EC2, containers, RDS or Lambda are required for the current static site.

## Separate staging environment

Create a dedicated staging bucket and CloudFront distribution. Suggested hostname: staging.silverbulletsecurity.com, subject to domain-owner approval. A CloudFront distribution hostname is also sufficient for initial technical review. A separate AWS account is optional; at minimum keep staging and production buckets, distributions and deployment permissions separate.

An unpublished URL is not access control. If staging must be private, the administrator must add an authentication/access restriction layer before uploading material that should not be public. Do not embed access credentials in JavaScript.

## Administrator setup

1. Create the staging S3 bucket in the chosen region. Enable versioning and encryption; block public access.
2. Create CloudFront with the bucket's REST endpoint as origin, OAC signing enabled and default root object index.html.
3. Add a bucket policy allowing s3:GetObject to the CloudFront service principal only when AWS:SourceArn equals this distribution ARN.
4. Redirect HTTP to HTTPS; allow GET/HEAD (and OPTIONS only if required); enable compression.
5. For a custom hostname, issue/validate an ACM certificate in us-east-1, attach it to CloudFront, and create the DNS alias/CNAME. DNS may remain with the current provider; Route 53 is optional.
6. For initial releases use a caching-disabled policy (minimum/default TTL 0). Serve index.html and sw.js with Cache-Control: no-cache. Do not use year-long immutable caching with the current non-hashed filenames. Cache tuning can follow after staging acceptance.
7. Configure HTTPS response headers and logging as required by company policy. Test any Content Security Policy against Google Fonts, inline styling and the inline script in index.html; a strict policy requires adapting those parts.
8. Create a scoped role for deployment. Prefer IAM Identity Center for interactive deployment or OIDC federation for CI.

The current website is a single page using in-page sections. It does not require a generic SPA fallback of every 404 to index.html. If the old /home route will be retained after a future migration, configure an explicit redirect. Existing /consulting, /training and other legacy URLs need an agreed redirect/content plan before production cutover.

## Minimum deployment permissions

Scope each statement to the specific staging resources:

- s3:ListBucket on arn:aws:s3:::BUCKET_NAME
- s3:GetObject and s3:PutObject on arn:aws:s3:::BUCKET_NAME/*
- cloudfront:CreateInvalidation and cloudfront:GetInvalidation on arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID

Add permissions only if a chosen workflow needs them. Deleting objects is not required for the upload command below. Infrastructure, certificate and DNS permissions can remain with the administrator. Do not supply root keys or secrets in the ZIP/repository.

## Upload the release

Use AWS CLI v2 with an authenticated profile/role. Replace placeholders with actual staging values. Run from the extracted website folder:

```sh
aws s3 sync . s3://BUCKET_NAME/ --exclude ".git/*" --exclude "docs/*" --exclude "*.md" --exclude "*.py" --exclude "*.bat" --exclude "*.sh" --exclude "*.zip" --exclude "__pycache__/*" --cache-control "no-cache" --profile staging
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*" --profile staging
```

Upload only index.html, css/, js/, assets/, manifest.webmanifest and sw.js. The exclusions above keep local launchers and handover documents out of the website bucket. No build command or application environment variables are required.

## Domain-dependent configuration

Before production cutover, update the absolute og:image URL in index.html to the deployed image URL. Confirm email addresses, office details, original training links and social URLs in js/config.js. Decide whether training pages stay on the original host or move to the new site. Do not switch the production domain until those links and legacy redirects have been reviewed.

## Verification and rollback

Verify HTTPS, all assets, mobile navigation, service dialogs, tier controls, methodology wheel, language switching, map/address controls and mailto links. Check the browser console and the first visit in a fresh browser profile. Test an upgrade with an existing service worker to detect stale content.

Keep S3 versioning and the prior release archive. To roll back, redeploy the previous files with a fresh asset/service-worker cache version and invalidate CloudFront. Revalidate the restored site. Cache cleanup on activation deletes old cache namespaces, so offline recovery requires testing as part of the release process.

## Costs

Costs depend on region, storage, traffic, request volume, logging, optional access controls and DNS. Confirm the expected usage with the AWS administrator and set a budget alert. No monthly cost estimate is asserted here.
