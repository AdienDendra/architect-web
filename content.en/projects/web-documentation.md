---
title: "Static Web Workflow With Hugo"
translationKey: "web-documentation"
date: 2026-05-07T20:49:00+10:00
tags: ["sydney", "documentation", "website", "paperMod", "template"]
categories: ["story"]
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

I built this website not merely for its “appearance,” but for efficiency and performance. Below is the technical documentation of how this site was assembled from scratch.

The whole process started from my frustration with my previous website (<a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a>) being slow because it had too many unnecessary features. That pushed me to find a way to create a lightweight and efficient site, especially since the goal was simply one‑way documentation.

### 1. Why Choose SSG?

<div style="padding-left: 26px;">
As I mentioned earlier, <a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> uses WordPress (a CMS) with an active database, while this site uses an SSG (Static Site Generator).

The SSG I use is Hugo, the reason because it’s popular and well-documented. Hugo’s role here is to “cook” all content into static HTML files, the server only delivers the finished files, enhanced by Cloudflare’s edge computing, which is distributed globally. As a result, the speed is significantly higher.

</div>

### 2. Managing Hugo Content
<div style="padding-left: 26px;">

#### A. Initial Setup
<div style="padding-left: 20px;">
Installing Hugo and adding the PaperMod theme:

```bash
hugo new site architect-web
cd architect-web
git init
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```
</div>

#### B. Configuration (hugo.toml)
<div style="padding-left: 20px;">
I use the TOML format for configuration because it’s cleaner and easier to read than JSON. This is where I define the site’s content structure, enable bilingual support (English and Indonesian), and more:

```markdown
baseURL = 'https://architect.adiendendra.com/'
languageCode = 'en-us'
title = 'Adien'
theme = 'PaperMod'
defaultContentLanguage = "en"
defaultContentLanguageInSubdir = true 
enableRobotsTXT = true
```
You can see the full configuration here <a href="https://github.com/AdienDendra/architect-web/blob/main/hugo.toml " target="_blank" rel="noopener">hugo.toml</a>
</div>

</div>

### 4. Anatomy of Hugo Directory Structure
<div style="padding-left: 26px;">
Here are the key roles of the main directories that make up this website:

#### A. content.en & content.id (Multilingual Content)
<div style="padding-left: 20px;">
Hugo has native multilingual support.
Why separate them? These folders split content by language (English and Indonesian). Hugo automatically generates URL paths /en/ and /id/.

<code>_index.md </code>: A crucial file that defines metadata for the main folder page (e.g., category title “Projects”).

<code>posts/</code> vs <code>projects/</code>: This separation defines Content Sections. I use it to distinguish between blog posts and project documentation.
</div>

#### B. layouts/
<div style="padding-left: 20px;">
This is where I tell Hugo to behave beyond the theme’s default settings.
<code>shortcodes/</code>: Contains files like <code>mermaid.html</code> or <code>collapse.html</code>. Shortcodes let me insert elements or attributes into Markdown without writing long HTML.

Example: To create a diagram, I simply call the shortcode in Markdown.

<code>partials/extend_head.html</code>: Used to inject additional code into the site section without modifying theme files.
</div>


#### C. static/ vs assets/
<div style="padding-left: 20px;">
These two folders confused me at first, but apparetnly their functions are actually very different:
<code>static/images/</code>: Everything here is copied directly into the public folder. I use it for profile photos or assets that don’t need processing.

<code>assets/css/</code>: Files here are processed by Hugo (minified, bundled, etc.) before publishing to improve loading speed.
</div>

#### D. public/ (Output)
<div style="padding-left: 20px;">
This is the most important folder once the site goes live.
It contains the final “cooked” output from Hugo. All Markdown files become pure HTML.
This is the directory Cloudflare Pages actually reads. Cloudflare doesn’t look at the content folder, it only serves what’s inside public.

In practice, I don’t push the <code>public</code> directory to GitHub because Cloudflare runs Hugo on their server. Hugo simply clones the raw files from GitHub. That’s why Cloudflare Pages requires a Build Command: <code>hugo --gc --minify</code>.
</div>
</div>

### 5. GitHub & CI/CD Integration (Continuous Integration)
<div style="padding-left: 26px;">
GitHub isn’t just a place to store code, it also acts as an automation trigger.

- **Push Data**: Whenever I push from VS Code on my PC or commit from my phone.
- **Webhook**: GitHub sends a signal to Cloudflare Pages.
- **Build Process**: Cloudflare runs Hugo on their server: <code>hugo --gc --minify</code>
- **Deployment**: If there are no errors, the processed output in the public directory is instantly distributed across Cloudflare’s global edge network.

Here’s the Cloudflare Pages setting:
![Setting](/images/cloudflare_setting.JPG)
</div>

### 6. Technical Summary 
<div style="padding-left: 26px;">

| Component | Technology | Role |
| :--- | :---: | :--- |
| Engine | Hugo | Static file generator from Markdown |
| Config | TOML | Global and multilingual configuration |
| Repository | GitHub | Version control and automation trigger |
| Hosting | Cloudflare Pages | CDN, SSL, and global file delivery |
| Domain | CPanel DNS | Connects personal domain identity |

</div>


