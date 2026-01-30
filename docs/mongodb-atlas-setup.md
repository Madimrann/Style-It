# MongoDB Atlas Setup Guide

## 1. Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up for free account
3. Create a new project called "StyleIt"

## 2. Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select region closest to you
4. Click "Create"

## 3. Database Access
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username/password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## 4. Network Access
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

## 5. Get Connection String
1. Go to "Clusters" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace <password> with your user password
6. Replace <dbname> with "styleit"

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/styleit?retryWrites=true&w=majority`
