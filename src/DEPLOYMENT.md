# Deployment Guide

This document provides guides for deploying the Vox Populi application. The first section covers a generic deployment to a Virtual Private Server (VPS), which offers maximum flexibility but requires manual server setup. The second section covers modern, streamlined deployment options.

---

## Generic VPS Deployment

This approach requires manual server setup and management.

### Introduction

A VPS is a virtual machine hosted by a cloud provider (e.g., DigitalOcean, Vultr, AWS EC2, etc.). This guide will walk you through configuring a standard Linux server to run the application securely and efficiently. We will set up:

- **Node.js:** To run the Next.js application.
- **PostgreSQL:** The database for the application.
- **PM2:** A process manager to keep the application running continuously.
- **Nginx:** A reverse proxy to manage web traffic and enable HTTPS.

### Prerequisites

- A provisioned VPS running a modern Linux distribution (this guide uses Ubuntu 22.04).
- SSH access to your server.
- A domain name with its A/AAAA records pointing to your server's IP address.

---

### Step 1: Server Preparation

First, connect to your server via SSH and install the necessary software.

#### 1.1 Install Node.js

We recommend using `nvm` (Node Version Manager) to install and manage Node.js versions.

```bash
# Update package list
sudo apt update

# Install curl
sudo apt install curl -y

# Download and run the nvm installation script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Load nvm into the current shell session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v18 (or a later LTS version)
nvm install 18

# Verify installation
node -v
```

#### 1.2 Install PM2 Process Manager

PM2 will ensure your application restarts automatically if it crashes.

```bash
# Install PM2 globally using npm
npm install pm2 -g
```

#### 1.3 Install Nginx Web Server

Nginx will act as a reverse proxy, directing outside web traffic to your running application.

```bash
# Install Nginx
sudo apt install nginx -y

# Allow Nginx through the firewall
sudo ufw allow 'Nginx Full'
```

---

### Step 2: Install and Configure PostgreSQL

The application requires a PostgreSQL database to store data.

```bash
# Install PostgreSQL and its contrib package
sudo apt install postgresql postgresql-contrib -y

# Switch to the default postgres user to run commands
sudo -i -u postgres

# Open the PostgreSQL command line
psql
```

Now, from within the `psql` shell, run the following SQL commands to create a dedicated database and user for your application. **Replace `'your_secure_password'` with a strong, unique password.**

```sql
-- Create a new database for the application
CREATE DATABASE vox_populi;

-- Create a new user with an encrypted password
CREATE USER vox_populi_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant all privileges on the new database to the new user
GRANT ALL PRIVILEGES ON DATABASE vox_populi TO vox_populi_user;

-- Exit the psql shell
\q
```

Finally, exit the `postgres` user session to return to your normal user shell by typing `exit`.

---

### Step 3: Deploy Application Code

Next, get your application code onto the server.

```bash
# Clone your repository
git clone https://github.com/your-username/vox-populi.git
cd vox_populi

# Install dependencies
npm install
```

---

### Step 4: Configure Environment Variables & Database

Create a `.env.production` file for your production secrets. **Do not** commit this file to Git.

```bash
# Create and open the file for editing
nano .env.production
```

Add your production-ready secrets to this file. Use the database credentials you created in Step 2.

```env
# Replace the user, password, and database name with the ones you created.
# Since the database is on the same server, the host is 'localhost'.
DATABASE_URL="postgresql://vox_populi_user:your_secure_password@localhost:5432/vox_populi"

# Generate a new, unique secret for your production environment.
SESSION_SECRET="your_unique_and_secure_production_secret"
```

With the environment configured, run the database migrations to set up the tables.

```bash
# Apply the database schema
npm run db:migrate
```

---

### Step 5: Build and Run the Application with PM2

Create a production build of your Next.js application and start it with PM2.

```bash
# Create a production build
npm run build

# Start the Next.js production server with PM2
pm start npm --name "vox-populi" -- start

# Check the status of your application
pm2 list

# You can view logs with:
# pm2 logs vox-populi
```

---

### Step 6: Configure Nginx Reverse Proxy

Create an Nginx configuration file to route public traffic to your app.

```bash
# Create a new Nginx configuration file
sudo nano /etc/nginx/sites-available/your-domain.com
```

Paste the following configuration, replacing `your-domain.com` with your actual domain and ensuring the port (`3000` by default) matches your Next.js app's port.

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000; # The port your Next.js app is running on
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Now, enable this configuration:

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Test the Nginx configuration for errors
sudo nginx -t

# If the test is successful, restart Nginx
sudo systemctl restart nginx
```

At this point, you should be able to access your application at `http://your-domain.com`.

---

### Step 7: Secure with HTTPS (Recommended)

Use Certbot to get a free SSL certificate from Let's Encrypt.

```bash
# Install Certbot and its Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Obtain and install the certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically update your Nginx configuration to handle HTTPS traffic and set up a cron job for automatic certificate renewal. Your application is now live and secure at `https://your-domain.com`.

---

## Application Configuration

This application includes configuration files that allow you to fine-tune its security and anti-spam rules without modifying the core application code.

- **`src/config/rate-limits.ts`**: This file controls how frequently users can perform actions like creating topics, replying, creating polls, sending chat messages, or reporting content. You can adjust the `limit` (number of actions) and `window` (time in seconds) for each action to match your community's needs.
- **`src/config/spam-check.ts`**: This file contains the thresholds for the Stop Forum Spam check during user registration. You can modify `MIN_FREQUENCY` and `MIN_CONFIDENCE` to make the spam filter more or less strict.

Before deploying, review these files and adjust the values if the defaults do not suit your requirements.

---

## Alternative Deployment Options

For developers who prefer a more managed, serverless approach, several platforms offer excellent free tiers and a streamlined deployment process. These platforms typically host your application code, but **you will still need a separate, publicly accessible PostgreSQL database.**

We recommend using a managed database provider like **[Neon](https://neon.tech)** (which is also recommended for local development) or **[Supabase](https://supabase.com)**. Both offer generous free tiers for PostgreSQL databases.

### Vercel

Vercel is the company behind Next.js and provides a zero-configuration deployment experience.

1.  **Set Up Database:** Sign up for a free PostgreSQL database from a provider like [Neon](https://neon.tech) or [Supabase](https://supabase.com) and get your database connection string (`DATABASE_URL`).
2.  **Push to Git:** Make sure your project is pushed to a GitHub, GitLab, or Bitbucket repository.
3.  **Import Project:** Sign up for a Vercel account and import your Git repository. Vercel will automatically detect that it's a Next.js project.
4.  **Add Environment Variables:** In the Vercel project settings, navigate to the "Environment Variables" section. Add your `DATABASE_URL` (from your database provider) and `SESSION_SECRET` with their production values.
5.  **Deploy:** Click the "Deploy" button. Your application will be built and deployed automatically.

### Netlify

Netlify is another popular platform with a generous free tier for modern web apps.

1.  **Set Up Database:** Sign up for a free PostgreSQL database from a provider like [Neon](https://neon.tech) or [Supabase](https://supabase.com) and get your database connection string (`DATABASE_URL`).
2.  **Push to Git:** Ensure your project is in a GitHub, GitLab, or Bitbucket repository.
3.  **Import Project:** Sign up for a Netlify account. From the dashboard, choose "Add new site" -> "Import an existing project" and select your repository.
4.  **Add Environment Variables:** In your Netlify site settings, go to "Build & deploy" -> "Environment". Add your `DATABASE_URL` (from your database provider) and `SESSION_SECRET`.
5.  **Deploy:** Netlify will auto-detect the build settings. Click "Deploy site" to publish your application.

### Firebase App Hosting

Given the `apphosting.yaml` file in this repository, Firebase App Hosting is a fully-managed, serverless option from Google.

1.  **Set Up Database:** Sign up for a free PostgreSQL database from a provider like [Neon](https://neon.tech) or [Supabase](https://supabase.com) and get your database connection string (`DATABASE_URL`).
2.  **Prerequisites:** Make sure you have a Firebase project created and the Firebase CLI installed (`npm install -g firebase-tools`).
3.  **Initialize:** Run `firebase init apphosting` in your project directory to link it to your Firebase project.
4.  **Set Secrets:** In your App Hosting backend settings in the Firebase Console, add your `DATABASE_URL` (from your database provider) and `SESSION_SECRET`.
5.  **Deploy:** Run the command `firebase apphosting:backends:deploy` to deploy your application.

---

## Troubleshooting

Encountering issues during deployment? Here are some common problems and their solutions.

### **Database Connection Issues**

This is the most common deployment problem. If your application starts but you see errors related to the database, it's likely a connection or firewall issue.

- **Managed Database (Neon, Supabase, etc.):** These services often restrict connections to a list of allowed IP addresses.
  - **Solution:** Find your server's public IP address (you can run `curl ifconfig.me` on your VPS). Go to your database provider's dashboard (e.g., Neon project settings), find the "IP Allowlist" or "Network" section, and add your server's IP address.
- **Self-Hosted PostgreSQL:**
  - **Solution:** You need to configure PostgreSQL to listen on its public interface and allow connections from your app server. This involves editing `postgresql.conf` (to set `listen_addresses`) and `pg_hba.conf` (to add an entry for your app server's IP). This is an advanced topic; consult the PostgreSQL documentation for your specific version.

### **Application Not Starting or Crashing (PM2)**

If your application shows as "errored" or "stopped" in `pm2 list`, check the logs to see what's wrong.

- **Solution:** Run the command `pm2 logs vox-populi`. This will show you the most recent log output from your application. Look for error messages, which usually point to the root cause, such as:
  - **Missing Environment Variables:** An error like `SESSION_SECRET must be a non-empty string` means you forgot to create or populate your `.env.production` file on the server.
  - **Database Migration Needed:** An error indicating a table or column does not exist usually means you deployed new code but forgot to run `npm run db:migrate` on the production server.

### **502 Bad Gateway Error (Nginx)**

This error means Nginx is running but it cannot successfully connect to your application running on `localhost:3000`.

1.  **Check if the App is Running:** Run `pm2 list` to ensure your `vox-populi` process is online and not errored. If it's not running, use `pm2 logs` to debug (see previous point).
2.  **Verify the Port:** Double-check your Nginx configuration file (`/etc/nginx/sites-available/your-domain.com`). Ensure the `proxy_pass http://localhost:3000;` line uses the correct port that your Next.js app is configured to run on.
3.  **Test Nginx Config:** Always run `sudo nginx -t` after making changes to your Nginx files. It will tell you if there's a syntax error. If it reports an error, the message will usually tell you which file and line number to look at.
4.  **Check the Firewall:** Although the guide includes a step to allow Nginx, it's worth double-checking. Run `sudo ufw status` to ensure that "Nginx Full" is listed as allowed.

### **Environment Variables on Managed Platforms (Vercel, Netlify, etc.)**

If your deployment on a platform like Vercel succeeds but the application doesn't work correctly, the most common cause is missing environment variables.

- **Solution:** Go to your project/site settings on the platform's dashboard. Find the "Environment Variables" section. Ensure that **both** `DATABASE_URL` and `SESSION_SECRET` are present and have the correct production values. Remember to redeploy your application after adding or changing variables.
