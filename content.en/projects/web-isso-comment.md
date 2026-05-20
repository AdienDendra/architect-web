---
title: "Setup Isso-Comments with AWS EC2 & Cloudflare"
translationKey: "web-isso-comment"
date: 2026-05-19T18:50:00+10:00
tags: ["sydney", "documentation", "website", "isso-comments", "hugo"]
categories: ["documentation"]
---

### Introduction  
To add a comment system to this website was quite challenging because the site is static. This means that if I want to enable comments, I need a database to store input submitted by guests.

There are several comment platform options, both paid and free. I tried a few, for example, Remark24, which is easy to install but very difficult to customize on the front end. In the end, I chose <a href="https://isso-comments.de/" target="_blank" rel="noopener">isso-comments</a> because it’s simple, clean, and easy to modify visually.

### Method
I set up AWS EC2 using the default configuration, running Ubuntu Linux on a t3.micro instance. For DNS configuration, I connected it using a Cloudflare Tunnel installed on the EC2 instance. This way, if the public IP changes, it automatically syncs with Cloudflare. I’ll break down the technical details below.

### Cloudflare Dashboard Breakdown
#### Setting up a Cloudflare Tunnel
The main reason I used Cloudflare was honestly because I wanted to experiment with tunnels… haha. Instead of sending inbound requests directly to EC2 via ports 80/443, all traffic goes through Cloudflare first and then through the tunnel to EC2. For outbound connections, EC2 connects directly to the nearest Cloudflare data center.

From what I’ve read, Cloudflare generates SSL certificates for incoming requests. This means the connection from the website is encrypted by Cloudflare (https://issocomment.adiendendra.com) before being forwarded to EC2.

Cloudflare setup:
1. Name: `isso-aws`
2. Install Connector:
    * Select *Linux* > *AMD64*
3. Route Traffic:
    * Subdomain: `issocomment`
    * Domain: `adiendendra.com`
    * Service: Type: `HTTP` | URL: `localhost:8080`

Published result looks like this:
![1](/images/projects/web-isso-comment/isso_cloudflare_connectors.jpg)

### Cloudflare & Docker Isso Installation Breakdown on AWS EC2
#### Cloudflared Configuration on EC2
This command installs cloudflared as a background service (daemon) on EC2. Once the service is running, the cloudflared agent automatically opens an outbound tunnel to Cloudflare’s edge network until its status becomes HEALTHY.

With this architecture, Cloudflare can forward public requests from the subdomain directly to the local Docker Isso port without requiring inbound ports 80/443 to be opened on the EC2 Security Group.

```Bash
# download cloudflared package for Ubuntu
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# install the package on EC2
sudo dpkg -i cloudflared.deb

# run the system service using the token provided by Cloudflare
sudo cloudflared service install ********************* (token number)
```

#### Isso Directory Structure
I created the following file and directory structure for Isso on AWS EC2:
![1](/images/projects/web-isso-comment/docker.png)

#### Installing Docker on AWS EC2
Using Docker makes it easier to deploy Isso-Comment on EC2. Docker keeps Isso neatly packaged inside a container with the correct Python version and required libraries. It also isolates the Python runtime from the main EC2 OS and simplifies persistent storage management (comments.db) using Docker Volumes.
```python
sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker
```
#### Configuring the comments.db database
For database handling, Isso automatically creates the database file if it doesn’t exist and initializes its internal table (comment columns, email, timestamp, etc.) when the container runs for the first time.

When docker compose starts, the Isso container runs inside an isolated environment using an internal user with User ID (UID) 1000 and Group ID (GID) 1000 (not root).

To ensure the Isso container has permission to create the comments.db file on the host (EC2), the parent directory must exist and its ownership must be changed to UID/GID 1000 using:

```python
mkdir -p db
sudo chown -R 1000:1000 db
```
This ensures that when the Isso container starts with docker `compose up -d`, it won’t encounter *Permission Denied* and can automatically create and write to *comments.db* inside that folder.

#### isso.conf Configuration
This file as a host to define various parameters and tells Isso where to create and read the SQLite database (comments.db).
```Bash
[general]
dbpath = /db/comments.db
host = https://architect.adiendendra.com/
notify = smtp
max-age = 0 # no delay for commenters to delete/edit their comments
reply-to-self = true

## Forward email notifications whenever someone replies to a comment
[smtp]
host = smtp.gmail.com
port = 587
security = starttls
timeout = 10

# Sender email account
username = adien.dendra@gmail.com
password = *****************

# Email delivery details
from = "Isso Comments" <adien.dendra@gmail.com>
to = hello@adiendendra.com

[server]
listen = http://0.0.0.0:8080
public-endpoint = https://issocomment.adiendendra.com
ssl = true

# admin approval required before comments appear on the website
[moderation]
enabled = true

[admin]
enabled = true
password = ***********

[guard]
enabled = true
require-author = false
require-email = false  
```

#### docker-compose.yml Configuration
The main purpose of docker-compose.yml is to bundle all configuration and database settings into a single file.

```yaml
services:
  isso:
    image: machines/isso
    container_name: isso
    restart: always
    environment:
      - UID=1000 # sudo chown on db folder
      - GID=1000
    volumes:
      - ./config:/config # menghubungkan file didalam config dir
      - ./db:/db  # maps files inside the config directory
      - /etc/localtime:/etc/localtime:ro # sync EC2 UTC time to Sydney local time
      - /etc/timezone:/etc/timezone:ro # set server timezone to Sydney
    ports:
      - "8080:8080" 
```

#### Running Docker
```Bash
sudo docker compose up -d # -d for detached mode
```

