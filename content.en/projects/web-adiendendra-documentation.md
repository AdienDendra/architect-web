---
title: "Website Migration and Efficiency From 1.2 GB to 11.2 MB! Crazy!"
translationKey: "web-adiendendra.documentation"
date: 2026-05-13T21:50:00+10:00
tags: ["sydney", "documentation", "website", "adiendendra.com", "template"]
categories: ["documentation"]
author: "Adien Dendra"
ShowToc: true
TocOpen: false
---
<style>
  .post-content {
    font-size: 16px;
    line-height: 1.4;
  }
</style>

### Introduction
The website <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> was very slow and had no TLS, so I started looking for alternative solutions that could provide the most efficient service possible in terms of cost, security, and low DTI/DTO (Data Transfer In/Out). Eventually, I decided to replace the shared hosting + domain from <a href="https://sosys.net/" target="_blank" rel="noopener">sosys.net</a> with AWS S3 as static storage, Cloudflare for DNS+TLS management, and I plan to migrate the domain to *adiendendra.com.au* to make it look more local.

### Problem
Currently, it's using shared hosting + domain costs Rp. 700k/year. The price is actually quite affordable, but the website is slow and unstable, the domain <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> several times was redirected to another website on the same server (eldersleamanor.co.nz).

### Method
I will move the hosting and domain to another server, no longer using sosys.net. There are many alternative options out there that are much faster and more cost‑efficient. For the domain, I will look for a cheaper registrar. I will explain the method in detail.

#### 1. Strategy: Download the database to local
- The current plan is to convert my website into a static site. This means the database will be managed locally, then “exported” as static files to another server.
- Since my website uses WordPress, I will install <a href="https://localwp.com/" target="_blank" rel="noopener">LocalWP</a> and <a href="https://www.httrack.com/" target="_blank" rel="noopener">httrack</a> on my PC.
- Database: export the .sql file to my local PC via phpMyAdmin in CPanel.
- Assets: download the /wp-content/uploads folder, since all images and media are stored there.
- Cleanup: I do not download the core WordPress files (wp-admin, wp-includes) from CPanel, because I can use the clean version from LocalWP.

#### 2. Server Options
There are basically two choices, AWS S3 or Cloudflare. But since I’m currently learning AWS Cloud, I will use AWS S3 as the medium. From what I’ve read, AWS S3 is extremely powerful. It is designed to handle thousands of requests per second simultaneously. For a portfolio website, I’m confident I will never experience “slowdowns” due to bandwidth limits.

### Hosting
After calculating everything, I decided to use AWS S3 Free Tier. Here’s why:
#### 1. Cost
- *Free Tier*: AWS provides 5 GB of S3 storage for free during the first 12 months after creating an AWS account. Since my website data is only 1.2 GB, it fits within the free quota.
- *Cost After 12 Months*: Once the free tier ends, I will start paying. Based on the information I found, for 1.2 GB of data in the Sydney region (ap-southeast-2):
  - Standard AWS S3 price is around 0.025 USD per GB per month.
  - Estimated cost: 1.2 GB x 0.025 USD = 0.03 USD per month (around Rp 550 per month).
  - That means the annual cost is only about 0.36 USD (less than Rp 10,000).
- *Data transfer*: Technically, there is no limit to how much data can flow (unlimited), but there are pricing rules:
  - Data Transfer IN (Upload): Free. I can upload the 1.2 GB as many times as I want with no bandwidth cost.
  - Data Transfer OUT (Download to the internet): Charged. When someone visits my website, AWS S3 sends data to their device, and AWS charges per GB.
  - Free Tier: AWS provides 100 GB per month of free Data Transfer Out to the internet. Since my total archive is only 1.2 GB, as long as it isn’t downloaded back and forth more than 50 times a month, I won’t pay anything. For example, if the homepage size (including images) is 2 MB:
  - If 1 person visits: DTO = 2 MB.
  - If 500 people visit: DTO = 1,000 MB (1 GB).
  - The good news is AWS gives 100 GB of free Data Transfer Out every month forever (not just in the first year).

There is one important detail in AWS S3: PUT/GET Requests.
- *PUT*: Cost for uploading files.
- *GET*: Cost every time someone “requests” a file to display in the browser. Free Tier includes 2,000 PUT and 20,000 GET requests per month.

#### 2. Strategy if the 100 GB free tier is exceeded
If the 100 GB monthly quota (free forever) is exceeded, the pricing switches to *Tiered Pricing*. Based on the data I found, here is the cost simulation for the Sydney region (ap-southeast-2):
- Standard DTO (Data Transfer Out)
  After the first free 100 GB, the next tier is:
  - Standard AWS S3 price: ~0.025 USD per GB per month.
  - Next 100 GB to 10 TB: ~0.114 USD per GB.

- Cost Simulation
  For example, if the website becomes busy and total outbound data reaches 150 GB in a month:
  - First 100 GB: 0 USD (Free).
  - Remaining 50 GB: 50 GB x 0.114 USD = 5.70 USD (around Rp 90,000).

#### 3. Strategy to avoid additional costs
After reading more, it turns out AWS offers ways to reduce DTO costs significantly, even down to 0 USD if configured correctly:
- *AWS CloudFront (CDN)*: If I place CloudFront in front of S3, AWS provides 1 TB (1,000 GB) of free outbound data every month. This is far larger than S3’s native quota. So my website will almost certainly remain 0 USD forever.
- *Cloudflare (Egress Filtering)*: If S3 is connected to Cloudflare via Cloudflare R2 or an S3 Proxy, Cloudflare will fetch the data from AWS only once, then distribute it to thousands of visitors from their own servers. So I only pay for a single fetch.

But based on my current strategy and data size, I probably won’t need strategy number 3. It just in case.

### Domain
The hosting and domain from sosys.net will expire on 25 February 2027. While I’m only migrating the hosting for now, I’ll keep using the domain until I eventually buy a new one from another registrar. I might take advantage of first‑year promo pricing from GoDaddy or Namecheap, even though the renewal price will return to normal (15–20 USD) in the second year. That’s still more efficient than paying for shared hosting + domain. Alternatively, I may buy a domain from an Australian registrar and switch to .com.au.

### Technical Breakdown
#### 1. Export database via phpMyAdmin CPanel

{{< collapse title="export database" collapse="true">}}
![1](/images/projects/web-adiendendra-documentation/1.Download_database.JPG)
{{< /collapse >}}

#### 2. Export website materials
Only 3 directories are exported:
- uploads
- themes
- plugins

{{< collapse title="export material" collapse="true">}}
![1](/images/projects/web-adiendendra-documentation/2.compress_updoad.JPG)
{{< /collapse >}}

#### 3. Download and Install Local WP
Use the default setup for Local WP. Pleas pay attention to the PHP version, I use 7.4.30 because PHP doesn’t run properly on version 8. Then replace the three directories in the Local WP installation folder.

{{< collapse title="local wp" collapse="true">}}
![3](/images/projects/web-adiendendra-documentation/3.localWP.JPG)
![4](/images/projects/web-adiendendra-documentation/3.replace_upload.JPG)
![4A](/images/projects/web-adiendendra-documentation/9.change_php_version.JPG)
{{< /collapse >}}

#### 4. Import Database
Local WP automatically points to the database, we just need to import it.

{{< collapse title="database" collapse="true">}}
![5](/images/projects/web-adiendendra-documentation/5.import_databes.JPG)
{{< /collapse >}}

#### 5. Site Name and Table Prefix
Change the site name from localhost to the domain name. Since my database uses the prefix wpvb from CPanel, I need to update the prefix.

{{< collapse title="site & table prefix" collapse="true">}}
![7](/images/projects/web-adiendendra-documentation/6.ubah_nama_site.JPG)
![8](/images/projects/web-adiendendra-documentation/7.tableprefix_diubah.JPG)
{{< /collapse >}}

#### 6. Debug
Enable error return to make debugging easier.

{{< collapse title="debug" collapse="true">}}
![9](/images/projects/web-adiendendra-documentation/8.debug_display.JPG)
{{< /collapse >}}

#### 7. HTTrack
Install HTTrack. This app will "cook" the website into a static version.
{{< collapse title="HTTrack" collapse="true">}}
![10](/images/projects/web-adiendendra-documentation/11.HTdownload.JPG)
![11](/images/projects/web-adiendendra-documentation/12.log.JPG)
{{< /collapse >}}

#### 8. AWS S3
Create a bucket in S3. As mentioned earlier, this bucket will store the static website data.
{{< collapse title="bucket" collapse="true">}}
![12](/images/projects/web-adiendendra-documentation/14.bucket_AWS_S3.JPG)
![13](/images/projects/web-adiendendra-documentation/15.bucket_setup.JPG)
{{< /collapse >}}

#### 9. AWS CLI (Command Line Interface)
The easiest way to access an S3 bucket is through AWS CLI. We must generate an Access Key and Security Key in S3 to access it. Here is an example of syncing updated files from my local PC to S3.
{{< collapse title="cli" collapse="true">}}
![12](/images/projects/web-adiendendra-documentation/17.aws_configure.JPG)
![13](/images/projects/web-adiendendra-documentation/18.lokal_sync_s3.JPG)
{{< /collapse >}}

### Conclusion
After the website was “cooked” into a static version, the total data size dropped dramatically to just 11.2 MB! A massive difference compared to the original 1.2 GB stored in CPanel, filled with WordPress features that, in my opinion, are unnecessary for a simple portfolio site.

Now, the website <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> runs smoothly and flawlessly on AWS S3 infrastructure, providing up to 99% data durability and the ability to handle scalability without any risk of downtime.

On top of that, the integration with Cloudflare DNS adds even more performance benefits. Cloudflare’s Edge Computing technology ensures extremely low latency for global visitors. With caching at the Edge level, adiendendra.com becomes significantly lighter because content is delivered from the data center closest to the user. This greatly improves load speed and helps minimize additional AWS S3 charges once my free‑tier period ends!