# MongoDB Compass Setup for StyleIt

## 1. Connect to MongoDB
1. Open **MongoDB Compass**
2. Use default connection: `mongodb://localhost:27017`
3. Click **Connect**

## 2. Create Database
1. Click **Create Database**
2. Database Name: `styleit`
3. Collection Name: `wardrobe` (we'll create more collections later)
4. Click **Create Database**

## 3. Create Additional Collections
After creating the database, create these collections:
- `wardrobe` (already created)
- `outfits`
- `plannedoutfits`

## 4. Test Connection
You should see:
```
Database: styleit
Collections: wardrobe, outfits, plannedoutfits
```

## 5. Connection String
Your local MongoDB connection string is:
```
mongodb://localhost:27017/styleit
```

This is what we'll use in our backend API!
