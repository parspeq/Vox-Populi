# Installation Guide

> **Note:** This guide is for setting up the application on your local machine for **development purposes**. If you want to publish the application to a live, publicly accessible server, please refer to the [**Deployment Guide**](DEPLOYMENT.md).

---

## Introduction

This guide will walk you through cloning the repository, installing dependencies, configuring the necessary external services (database), and starting the application. By the end, you will have a fully functional local instance of Vox Populi.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

- **Node.js**: Version 18.x or later is recommended. You can download it from the [official Node.js website](https://nodejs.org/).
- **Git**: Required for cloning the repository. You can download it from the [official Git website](https://git-scm.com/).

You can verify your Node.js installation by running `node -v` in your terminal.

---

### Step 1: Get the Code

First, clone the project repository from GitHub to your local machine using Git.

```bash
git clone https://github.com/your-username/vox-populi.git
cd vox-populi
```

---

### Step 2: Install Dependencies

Once you have the code, navigate into the project directory and install the required Node.js packages using npm.

```bash
npm install
```
This command reads the `package.json` file and downloads all the necessary libraries into the `node_modules` directory.

---

### Step 3: Configure Environment Variables

The application requires a few secret keys and connection strings to function. These are stored in an environment file that you must create.

1.  Create a new file named `.env` in the root of the project directory.

2.  Open the `.env` file and add the following variables:

    ```env
    DATABASE_URL="your_database_connection_string"
    SESSION_SECRET="your_secure_random_string"
    ```

#### **Getting Your `DATABASE_URL`**

This project is configured to use a PostgreSQL database. We recommend [Neon](https://neon.tech) for a quick and free setup.

1.  Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2.  Create a new project.
3.  On your project dashboard, find the **Connection Details** section.
4.  Copy the connection string that starts with `postgresql://`. This is your `DATABASE_URL`.
5.  Paste this value into your `.env` file.

#### **Generating Your `SESSION_SECRET`**

This secret is used to sign and encrypt user session cookies for authentication. It should be a long, random, and secure string.

You can generate a strong secret using the following command in your terminal:

```bash
# On macOS or Linux
openssl rand -base64 32
```
Copy the output and paste it as the value for `SESSION_SECRET` in your `.env` file.

---

### Step 4: Set Up the Database

With your `DATABASE_URL` configured, you can now set up the database schema. This project uses Drizzle ORM to manage database migrations.

Run the following command to apply all migrations. This will create the necessary tables (`users`, `posts`, `topics`, etc.) in your database.

```bash
npm run db:migrate
```
You should see a confirmation that the migrations were applied successfully. If this step fails, please refer to the **Troubleshooting** section below.

---

### Step 5: Run the Application

You are now ready to start the application.

Run the following command to start the Next.js development server:

```bash
npm run dev
```

The application will be running and available at **[http://localhost:9002](http://localhost:9002)**.

You can now open your web browser to this address and begin using the application. The first step will be to sign up for a new user account.

---

## Troubleshooting

Encountering issues during setup? Here are some common problems and their solutions.

### **Database Migration Fails on Fresh Install**

If the `npm run db:migrate` command fails when you are setting up the project for the first time on a new, empty database, it's usually best to bypass the migration history and directly "push" the current schema to the database.

**Solution: Use `drizzle-kit push`**

Drizzle Kit provides a `push` command that synchronizes your database with the *current* state of your schema file (`src/lib/schema.ts`), creating all tables and columns in a single step.

1.  **Ensure your database is empty.** If the failed migration created some tables, it's best to drop them or start with a fresh database.
2.  **Verify your `DATABASE_URL`** in the `.env` file is correct.
3.  **Run the push command:**
    ```bash
    npx drizzle-kit push
    ```
    This will connect to your database and build the schema from scratch. You can now skip the `npm run db:migrate` step and proceed to Step 5.

### **Database Connection Errors**

If you see errors like `Connection refused`, `Authentication failed`, or `database ... does not exist`, follow these steps:

1.  **Check your `DATABASE_URL`:** Double-check every part of the connection string in your `.env` file for typos, especially the password, hostname, and database name.
2.  **Confirm Database is Running:** Ensure your Neon project (or other PostgreSQL provider) is active and not paused.
3.  **Firewall/IP Whitelisting:** If you are connecting to a database that is not on Neon, make sure your current IP address is whitelisted in your database provider's network settings.

### **"`SESSION_SECRET` must be a non-empty string" Error**

This error means the application cannot find the secret key it needs for user authentication.

1.  **Check `.env` file:** Make sure you have created the `.env` file in the root of the project directory (the same level as `package.json`).
2.  **Verify Variable Name:** Ensure the variable is spelled exactly `SESSION_SECRET`.
3.  **Restart the Server:** After creating or modifying the `.env` file, you must stop (`Ctrl+C`) and restart the development server (`npm run dev`) for the changes to take effect.
