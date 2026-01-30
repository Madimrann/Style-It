# StyleIt - Complete System Documentation
## Final Year Project Presentation Guide

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Page-by-Page Documentation](#page-by-page-documentation)
7. [Key Functions & Algorithms](#key-functions--algorithms)
8. [AI Integration](#ai-integration)
9. [Authentication & Authorization](#authentication--authorization)
10. [Possible Presentation Questions](#possible-presentation-questions)

---

## System Overview

**StyleIt** is an AI-powered wardrobe management and outfit recommendation system that helps users:
- Upload and categorize clothing items using AI image recognition (Google Vision API)
- Get outfit recommendations using rule-based algorithm (NOT AI - category-based with random selection)
- Plan outfits on a calendar
- Manage their wardrobe efficiently

**Key Features:**
- Google Vision API for image analysis and categorization (AI-based)
- Rule-based outfit recommendation algorithm (NOT AI - category-based with random selection)
- Gemini API available for outfit recommendations (legacy/fallback, not primary method)
- MongoDB database for data persistence
- React frontend with responsive design
- JWT-based authentication
- Admin dashboard for system management

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

### External APIs
- **Google Vision API** - Image analysis and object detection
- **Gemini API** - AI outfit recommendations (legacy/fallback, NOT primary method)
- **Rembg Service** - Background removal (optional)

### Development Tools
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **CORS** - Cross-origin resource sharing

---

## Architecture Overview

### System Architecture Pattern
- **Frontend-Backend Separation**: React SPA communicates with Node.js/Express API
- **RESTful API**: Backend exposes REST endpoints
- **Database-Driven**: MongoDB stores all persistent data
- **JWT Authentication**: Stateless authentication using tokens

### Data Flow
1. User interacts with React frontend
2. Frontend calls API via Axios (ApiService)
3. Express backend processes request
4. Backend queries MongoDB or calls external APIs
5. Response sent back to frontend
6. Frontend updates UI with data

### File Structure
```
styleit_fyp/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── services/       # API service layer
│   ├── contexts/       # React contexts (Auth)
│   └── utils/          # Utility functions
├── backend/
│   └── server.js       # Express server & API endpoints
└── uploads/            # User-uploaded images
```

---

## Database Schema

### Collections & Models

#### 1. Users Collection
**Schema Location:** `backend/server.js` (lines 117-123)

**Fields:**
- `_id` (ObjectId) - Primary key
- `email` (String, required, unique) - User email
- `password` (String, required, hashed) - Bcrypt hashed password
- `name` (String, required) - User name
- `role` (String, enum: ['user', 'admin'], default: 'user') - User role
- `createdAt` (Date, default: Date.now) - Account creation date

**Relationships:**
- Referenced by: WardrobeItem, Outfit, PlannedOutfit (via `user` field)

**Code:**
```javascript
// backend/server.js lines 117-130
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
```

#### 2. WardrobeItems Collection
**Schema Location:** `backend/server.js` (lines 70-83)

**Fields:**
- `_id` (ObjectId) - Primary key
- `user` (ObjectId, ref: 'User', required) - Owner user
- `name` (String, required) - Item name
- `category` (String, required) - Item category (e.g., 'TOPS', 'BOTTOMS', 'SHOES')
- `image` (String, required) - Image path/URL
- `tags` ([String]) - AI-detected tags
- `occasionTags` ([String]) - Suitable occasions (e.g., ['casual', 'formal', 'work'])
- `color` (String) - Primary color
- `colors` (String) - Multiple colors detected
- `description` (String) - AI-generated description
- `style` (String) - Style information
- `confidence` (Number, default: 0.8) - AI detection confidence
- `createdAt` (Date, default: Date.now) - Upload date

**Relationships:**
- References: User
- Referenced by: Outfit.items (embedded), PlannedOutfit.items (embedded)

#### 3. Outfits Collection
**Schema Location:** `backend/server.js` (lines 85-99)

**Fields:**
- `_id` (ObjectId) - Primary key
- `user` (ObjectId, ref: 'User', required) - Owner user
- `name` (String, required) - Outfit name
- `items` ([Object]) - Array of outfit items (embedded):
  - `name` (String)
  - `category` (String)
  - `image` (String)
  - `tags` ([String])
  - `_id` (String) - Reference to original wardrobe item ID
- `occasion` (String) - Occasion for outfit
- `confidence` (Number, default: 0.8) - Recommendation confidence
- `lastWorn` (Date) - Last time outfit was worn
- `createdAt` (Date, default: Date.now) - Creation date

**Relationships:**
- References: User
- References: WardrobeItem (via items[]._id)

#### 4. PlannedOutfits Collection
**Schema Location:** `backend/server.js` (lines 101-115)

**Fields:**
- `_id` (ObjectId) - Primary key
- `user` (ObjectId, ref: 'User', required) - Owner user
- `date` (Date, required) - Planned date
- `outfit` (ObjectId, ref: 'Outfit') - Optional reference to saved outfit
- `name` (String, default: '') - Outfit name for this date
- `occasion` (String, default: '') - Occasion for this date
- `items` ([Object]) - Direct outfit items data (embedded)
- `notes` (String, default: '') - User notes
- `createdAt` (Date, default: Date.now) - Creation date

**Relationships:**
- References: User
- Optional reference: Outfit

#### 5. Categories Collection
**Schema Location:** `backend/server.js` (lines 137-145)

**Fields:**
- `_id` (ObjectId) - Primary key
- `id` (String, required, unique) - Category ID (e.g., 'tops', 'bottoms')
- `label` (String, required) - Display name (e.g., 'Tops', 'Bottoms')
- `color` (String, default: '#3b82f6') - UI color
- `order` (Number, default: 0) - Display order
- `keywords` ([String], default: []) - Keywords for AI detection
- `createdAt` (Date, default: Date.now)

**Default Categories:**
- Tops, Bottoms, Shoes, Outerwear, Accessories

#### 6. Occasions Collection
**Schema Location:** `backend/server.js` (lines 147-155)

**Fields:**
- `_id` (ObjectId) - Primary key
- `id` (String, required, unique) - Occasion ID (e.g., 'casual', 'formal')
- `label` (String, required) - Display name (e.g., 'Casual', 'Formal')
- `color` (String, default: '#3b82f6') - UI color
- `order` (Number, default: 0) - Display order
- `keywords` ([String], default: []) - Keywords for AI detection
- `createdAt` (Date, default: Date.now)

**Default Occasions:**
- Casual, Formal, Work, Sporty

---

## API Endpoints

### Authentication Endpoints
**Base URL:** `/api/auth`

1. **POST /api/auth/signup**
   - **Purpose:** Register new user
   - **Request Body:** `{ email, password, name }`
   - **Response:** `{ token, user }`
   - **Code Location:** `backend/server.js` (search for `app.post('/api/auth/signup'`)
   - **Authentication:** None
   - **Database Operation:** Creates new User document, hashes password

2. **POST /api/auth/login**
   - **Purpose:** User login
   - **Request Body:** `{ email, password }`
   - **Response:** `{ token, user }`
   - **Code Location:** `backend/server.js`
   - **Authentication:** None
   - **Database Operation:** Finds user, compares password, generates JWT

3. **GET /api/auth/me**
   - **Purpose:** Get current authenticated user
   - **Response:** `{ user }`
   - **Code Location:** `backend/server.js`
   - **Authentication:** Required (JWT)
   - **Database Operation:** Finds user by JWT token

### Wardrobe Endpoints
**Base URL:** `/api/wardrobe`

1. **GET /api/wardrobe**
   - **Purpose:** Get all wardrobe items for authenticated user
   - **Response:** `[wardrobeItems]`
   - **Code Location:** `backend/server.js`
   - **Authentication:** Required
   - **Database Operation:** `WardrobeItem.find({ user: req.user.userId })`

2. **POST /api/wardrobe**
   - **Purpose:** Add new wardrobe item
   - **Request:** FormData with image file
   - **Response:** `{ wardrobeItem }`
   - **Code Location:** `backend/server.js` (lines 773-798)
   - **Authentication:** Required
   - **Database Operation:** Creates new WardrobeItem document

3. **PUT /api/wardrobe/:id**
   - **Purpose:** Update wardrobe item
   - **Request Body:** `{ name, category, tags, etc. }`
   - **Response:** `{ wardrobeItem }`
   - **Authentication:** Required
   - **Database Operation:** `WardrobeItem.findByIdAndUpdate()`

4. **DELETE /api/wardrobe/:id**
   - **Purpose:** Delete wardrobe item
   - **Response:** `{ message }`
   - **Authentication:** Required
   - **Database Operation:** `WardrobeItem.findByIdAndDelete()`

5. **GET /api/wardrobe/:id**
   - **Purpose:** Get single wardrobe item
   - **Response:** `{ wardrobeItem }`
   - **Authentication:** Required
   - **Database Operation:** `WardrobeItem.findById()`

### Outfit Endpoints
**Base URL:** `/api/outfits`

1. **GET /api/outfits**
   - **Purpose:** Get all saved outfits for authenticated user
   - **Response:** `[outfits]`
   - **Authentication:** Required
   - **Database Operation:** `Outfit.find({ user: req.user.userId })`

2. **POST /api/outfits**
   - **Purpose:** Save new outfit
   - **Request Body:** `{ name, items, occasion, confidence }`
   - **Response:** `{ outfit }`
   - **Authentication:** Required
   - **Database Operation:** Creates new Outfit document

3. **PUT /api/outfits/:id**
   - **Purpose:** Update saved outfit
   - **Request Body:** `{ name, items, occasion }`
   - **Response:** `{ outfit }`
   - **Authentication:** Required
   - **Database Operation:** `Outfit.findByIdAndUpdate()`

4. **DELETE /api/outfits/:id**
   - **Purpose:** Delete saved outfit
   - **Response:** `{ message }`
   - **Authentication:** Required
   - **Database Operation:** `Outfit.findByIdAndDelete()`

### Planned Outfit Endpoints
**Base URL:** `/api/planned-outfits`

1. **GET /api/planned-outfits**
   - **Purpose:** Get all planned outfits for authenticated user
   - **Response:** `[plannedOutfits]`
   - **Authentication:** Required
   - **Database Operation:** `PlannedOutfit.find({ user: req.user.userId })`

2. **POST /api/planned-outfits**
   - **Purpose:** Create planned outfit
   - **Request Body:** `{ date, name, items, occasion, notes }`
   - **Response:** `{ plannedOutfit }`
   - **Authentication:** Required
   - **Database Operation:** Creates new PlannedOutfit document

3. **DELETE /api/planned-outfits/:id**
   - **Purpose:** Delete planned outfit
   - **Response:** `{ message }`
   - **Authentication:** Required
   - **Database Operation:** `PlannedOutfit.findByIdAndDelete()`

### AI Endpoints

1. **POST /api/analyze-image**
   - **Purpose:** Analyze uploaded image using Google Vision API
   - **Request Body:** `{ imageData: base64String }`
   - **Response:** `{ category, tags, occasionTags, colors, description, confidence }`
   - **Code Location:** `backend/server.js` (lines 1072-1797)
   - **Authentication:** None (or optional)
   - **External API:** Google Vision API
   - **Process:**
     1. Receives base64 image
     2. Calls Google Vision API (OBJECT_LOCALIZATION, LABEL_DETECTION)
     3. Processes detected objects and labels
     4. Matches category using database categories and keywords
     5. Detects occasions using keywords
     6. Returns analysis result

2. **GET /api/recommend-outfit/:occasion**
   - **Purpose:** Get outfit recommendation for occasion
   - **Type:** Rule-based/Category-based Algorithm (NOT AI-based)
   - **URL Params:** `occasion` (e.g., 'casual', 'formal', 'random')
   - **Response:** `{ recommendedOutfit, stylingTips, confidence, duplicateWarning }`
   - **Code Location:** `backend/server.js` (lines 2115-2416)
   - **Authentication:** Required
   - **Algorithm:** Category-based recommendation with random selection (no AI, no external API)
   - **Process:**
     1. Filters wardrobe items by occasion tags
     2. Groups items by category (tops, bottoms, shoes, outerwear, accessories)
     3. Randomly selects one item from each category using `pickRandom()` function
     4. Uses probability-based selection for outerwear (50%) and accessories (0-2 items)
     5. Generates styling tips based on hardcoded rules
     6. Checks for duplicate outfits

3. **POST /api/recommend-outfit-gemini**
   - **Purpose:** Legacy Gemini-based outfit recommendation
   - **Request Body:** `{ occasion, wardrobeItems }`
   - **Response:** `{ recommendedOutfit, stylingTips }`
   - **Code Location:** `backend/server.js` (lines 2476-2598)
   - **External API:** Google Gemini API
   - **Status:** Legacy/fallback (not primary)

4. **POST /api/remove-background**
   - **Purpose:** Remove background from image using rembg service
   - **Request:** FormData with image file
   - **Response:** Processed image (PNG blob with transparent background)
   - **Code Location:** `backend/server.js` (lines 1799-1845)
   - **Authentication:** None (or optional)
   - **External Service:** Rembg Python service (default: `http://localhost:5001`)
   - **Process:**
     1. Receives image file via Multer (memory storage)
     2. Forwards to rembg Python service via HTTP
     3. Python service uses `rembg` library to remove background
     4. Returns processed PNG image (transparent background)
   - **Note:** If background removal fails, original image is used as fallback

### Category & Occasion Endpoints

1. **GET /api/categories**
   - **Purpose:** Get all categories (public)
   - **Response:** `[categories]`
   - **Authentication:** None
   - **Database Operation:** `Category.find().sort({ order: 1 })`

2. **GET /api/occasions**
   - **Purpose:** Get all occasions (public)
   - **Response:** `[occasions]`
   - **Authentication:** None
   - **Database Operation:** `Occasion.find().sort({ order: 1 })`

### Admin Endpoints
**Base URL:** `/api/admin`

**All admin endpoints require admin role authentication**

1. **GET /api/admin/stats**
   - **Purpose:** Get system statistics
   - **Response:** `{ totalUsers, totalWardrobeItems, totalOutfits, totalPlannedOutfits }`

2. **GET /api/admin/users**
   - **Purpose:** Get all users
   - **Response:** `[users]`

3. **POST /api/admin/categories**
   - **Purpose:** Create new category
   - **Request Body:** `{ id, label, color, order, keywords }`

4. **PUT /api/admin/categories/:id**
   - **Purpose:** Update category
   - **Request Body:** `{ label, color, order, keywords }`

5. **DELETE /api/admin/categories/:id**
   - **Purpose:** Delete category

6. **POST /api/admin/occasions**
   - **Purpose:** Create new occasion
   - **Request Body:** `{ id, label, color, order, keywords }`

7. **PUT /api/admin/occasions/:id**
   - **Purpose:** Update occasion
   - **Request Body:** `{ label, color, order, keywords }`

8. **DELETE /api/admin/occasions/:id**
   - **Purpose:** Delete occasion

---

## Page-by-Page Documentation

### 1. Home Page
**File:** `src/pages/Home.js`
**Route:** `/`
**Authentication:** Public

**Purpose:**
- Landing page for the application
- Displays system features and introduction
- Navigation to login/signup

**Components Used:**
- Navbar (shared component)
- Home-specific content sections

**Key Functions:**
- None (static content)

**API Calls:**
- None

---

### 2. Login Page
**File:** `src/pages/Login.js`
**Route:** `/login`
**Authentication:** Public (redirects if already logged in)

**Purpose:**
- User authentication/login

**Components Used:**
- Login form
- Error messages

**Key Functions:**
- `handleLogin()` - Calls AuthContext.login()
- Form validation
- Error handling

**API Calls:**
- `POST /api/auth/login` (via ApiService.login())

**Flow:**
1. User enters email/password
2. Frontend calls `apiService.login(email, password)`
3. Backend validates credentials
4. Backend returns JWT token + user data
5. Frontend stores token in localStorage
6. AuthContext updates user state
7. Redirect to home or previous page

**Code Location:**
- Frontend: `src/pages/Login.js`
- Backend: `backend/server.js` (search for `/api/auth/login`)

---

### 3. Signup Page
**File:** `src/pages/Signup.js`
**Route:** `/signup`
**Authentication:** Public

**Purpose:**
- User registration

**Components Used:**
- Signup form

**Key Functions:**
- `handleSignup()` - Calls AuthContext.signup()
- Form validation
- Password confirmation

**API Calls:**
- `POST /api/auth/signup` (via ApiService.signup())

**Flow:**
1. User enters email, password, name
2. Frontend validates form
3. Backend creates user account (hashes password)
4. Backend returns JWT token
5. Frontend stores token, logs user in automatically

**Code Location:**
- Frontend: `src/pages/Signup.js`
- Backend: `backend/server.js` (search for `/api/auth/signup`)

---

### 4. Wardrobe Page
**File:** `src/pages/Wardrobe.js`
**Route:** `/wardrobe`
**Authentication:** Required

**Purpose:**
- Display user's wardrobe items
- Filter by category
- View item details
- Delete items

**Components Used:**
- Category filter buttons
- Item grid/cards
- Item detail modal

**Key Functions:**
- `loadWardrobeItems()` - Fetches items from API
- `handleDeleteItem()` - Deletes item
- `handleCategoryFilter()` - Filters items by category
- `handleViewItemDetail()` - Shows item details modal

**API Calls:**
- `GET /api/wardrobe` (on mount, via ApiService.getWardrobeItems())
- `DELETE /api/wardrobe/:id` (on delete, via ApiService.deleteWardrobeItem())
- `GET /api/categories` (for filter buttons)

**State Management:**
- `wardrobeItems` - Array of items
- `filteredItems` - Filtered items based on selected category
- `selectedCategory` - Currently selected category filter
- `selectedItemDetail` - Item being viewed in detail modal

**Code Location:**
- Frontend: `src/pages/Wardrobe.js`

---

### 5. Upload Page
**File:** `src/pages/Upload.js`
**Route:** `/upload`
**Authentication:** Required

**Purpose:**
- Upload clothing item images
- AI analysis and categorization
- Confirm and save items to wardrobe

**Components Used:**
- File upload component
- Image preview
- Analysis results display
- Category/occasion selection
- Confirmation form

**Key Functions:**
- `handleUpload()` - Processes file upload and AI analysis
- `handleConfirm()` - Saves item to wardrobe
- `handleAnalyze()` - Calls AI analysis API
- `fileToBase64()` - Converts file to base64 for API

**API Calls:**
1. **POST /api/remove-background**
   - **When:** User uploads image (automatic, happens in background)
   - **Purpose:** Remove background from image using rembg service
   - **Request:** FormData with image file
   - **Response:** Processed image (PNG blob with transparent background)
   - **Code Location:** `backend/server.js` (lines 1799-1845), `src/services/ApiService.js` (lines 582-600)
   - **Process:**
     1. Frontend sends image file via `apiService.removeBackground()`
     2. Backend receives file via Multer (memory storage)
     3. Backend forwards to rembg Python service (default: `http://localhost:5001`)
     4. Python service uses `rembg` library to remove background
     5. Returns processed PNG image (transparent background)
     6. Frontend displays processed image in preview
   - **Note:** If background removal fails, original image is used as fallback

2. **POST /api/analyze-image**
   - **When:** User clicks "Analyze" button
   - **Purpose:** AI image analysis using Google Vision API
   - **Request:** `{ imageData: base64String }`
   - **Response:** `{ category, tags, occasionTags, colors, description }`
   - **Process:**
     1. User selects/upload image
     2. Convert image to base64
     3. Send to `/api/analyze-image`
     4. Backend calls Google Vision API
     5. Backend processes results and matches categories/occasions
     6. Frontend displays analysis results

3. **POST /api/wardrobe**
   - **When:** User confirms item
   - **Purpose:** Save item to database
   - **Request:** FormData with image + item data
   - **Response:** `{ wardrobeItem }`

**Flow:**
1. User selects image file
2. Image preview displayed (with background removal attempted automatically)
3. User clicks "Analyze" → calls `/api/analyze-image`
4. AI analysis results displayed (category, tags, occasions, colors)
5. User can edit category, name, tags, occasions
6. User clicks "Confirm" → saves to wardrobe via `/api/wardrobe`

**Code Location:**
- Frontend: `src/pages/Upload.js`
- Backend AI Analysis: `backend/server.js` (lines 1072-1797)
- Backend Save Item: `backend/server.js` (lines 773-798)

---

### 6. Outfits Page
**File:** `src/pages/Outfits.js`
**Route:** `/outfits`
**Authentication:** Required

**Purpose:**
- Get outfit recommendations (rule-based algorithm, NOT AI)
- Save recommended outfits
- Create custom outfits
- View/edit saved outfits

**Components Used:**
- Occasion selector
- Recommendation display
- Outfit item cards
- Save outfit modal
- Edit outfit modal
- Item detail modal

**Key Functions:**
- `handleRecommend()` - Gets outfit recommendation
- `handleSaveOutfit()` - Saves recommended outfit
- `handleCreateCustom()` - Opens custom outfit creator
- `handleEditOutfit()` - Edits saved outfit
- `handleDeleteOutfit()` - Deletes saved outfit
- `checkDuplicateOutfit()` - Checks for duplicate outfits

**API Calls:**
1. **GET /api/recommend-outfit/:occasion**
   - **When:** User selects occasion and clicks "Style It"
   - **Purpose:** Get outfit recommendation
   - **Type:** Rule-based algorithm (NOT AI-based)
   - **URL Params:** `occasion` (e.g., 'casual', 'formal')
   - **Response:** `{ recommendedOutfit, stylingTips, duplicateWarning }`
   - **Algorithm Location:** `backend/server.js` (lines 2115-2416)
   - **Process:**
     1. Filters wardrobe items by occasion tags
     2. Groups items by category (tops, bottoms, shoes, outerwear, accessories)
     3. Randomly selects one item from each category using `pickRandom()` function
     4. Uses probability-based selection for outerwear and accessories
     5. Checks for duplicates
     6. Generates styling tips based on hardcoded rules
   - **Note:** This is NOT an AI recommendation - it's a deterministic rule-based algorithm with random selection

2. **GET /api/outfits**
   - **When:** Page loads
   - **Purpose:** Load saved outfits

3. **POST /api/outfits**
   - **When:** User saves outfit
   - **Purpose:** Save outfit to database

4. **PUT /api/outfits/:id**
   - **When:** User edits outfit
   - **Purpose:** Update saved outfit

5. **DELETE /api/outfits/:id**
   - **When:** User deletes outfit
   - **Purpose:** Remove outfit from database

**State Management:**
- `recommendedOutfit` - Current recommendation
- `savedOutfits` - User's saved outfits
- `selectedOccasion` - Currently selected occasion
- `showSaveModal` - Save outfit modal visibility
- `editingOutfit` - Outfit being edited

**Code Location:**
- Frontend: `src/pages/Outfits.js`
- Recommendation Algorithm: `backend/server.js` (lines 2115-2416)

---

### 7. Planner Page
**File:** `src/pages/Planner.js`
**Route:** `/planner`
**Authentication:** Required

**Purpose:**
- Calendar-based outfit planning
- Plan outfits for specific dates
- View planned outfits
- Edit/delete planned outfits
- Create outfits from wardrobe items

**Components Used:**
- Calendar component
- Outfit planning modal
- Saved outfits modal
- Item selection grid
- Date picker

**Key Functions:**
- `handleDateClick()` - Opens planning modal for date
- `handlePlanOutfit()` - Saves planned outfit
- `handleSaveCustomOutfit()` - Saves custom outfit from modal
- `loadPlannedOutfits()` - Loads planned outfits for calendar
- `checkDuplicateOutfit()` - Checks for duplicate outfits
- `addSelectedWardrobeItems()` - Adds items to planning modal

**API Calls:**
1. **GET /api/planned-outfits**
   - **When:** Page loads
   - **Purpose:** Load planned outfits for calendar

2. **POST /api/planned-outfits**
   - **When:** User plans outfit
   - **Purpose:** Save planned outfit

3. **DELETE /api/planned-outfits/:id**
   - **When:** User deletes planned outfit
   - **Purpose:** Remove planned outfit

4. **GET /api/wardrobe**
   - **When:** Planning modal opens
   - **Purpose:** Load items for selection

5. **GET /api/outfits**
   - **When:** User wants to use saved outfit
   - **Purpose:** Load saved outfits

**State Management:**
- `plannedOutfits` - Array of planned outfits
- `selectedDate` - Currently selected date
- `showPlanningModal` - Planning modal visibility
- `selectedItems` - Items selected for outfit
- `duplicateWarning` - Duplicate outfit warning

**Code Location:**
- Frontend: `src/pages/Planner.js`

---

### 8. Profile Page
**File:** `src/pages/Profile.js`
**Route:** `/profile`
**Authentication:** Required

**Purpose:**
- Display user profile information
- Show wardrobe statistics
- Navigate to other sections
- Update profile (if implemented)

**Components Used:**
- User info display
- Statistics cards
- Navigation links

**Key Functions:**
- `loadUserStats()` - Loads user statistics
- Navigation handlers for stat cards

**API Calls:**
- User stats (calculated from wardrobe/outfits)
- `GET /api/auth/me` (user info)

**State Management:**
- `userStats` - User statistics
- `user` - Current user (from AuthContext)

**Code Location:**
- Frontend: `src/pages/Profile.js`

---

### 9. Admin Dashboard
**File:** `src/pages/AdminDashboard.js`
**Route:** `/admin`
**Authentication:** Required + Admin role

**Purpose:**
- System administration
- User management
- Category management
- Occasion management
- System statistics

**Components Used:**
- Tabs (Overview, Users, Categories, Occasions)
- Statistics cards
- User table/cards
- Category/occasion management tables
- Modals for create/edit

**Key Functions:**
- `loadData()` - Loads all admin data
- `handleDeleteUser()` - Deletes user
- `handleRoleChange()` - Updates user role
- `handleCreateCategory()` - Creates category
- `handleUpdateCategory()` - Updates category
- `handleDeleteCategory()` - Deletes category
- `handleCreateOccasion()` - Creates occasion
- `handleUpdateOccasion()` - Updates occasion
- `handleDeleteOccasion()` - Deletes occasion
- `handleViewUserDetail()` - Views user details
- Drag & drop handlers for reordering

**API Calls:**
1. **GET /api/admin/stats** - System statistics
2. **GET /api/admin/users** - All users
3. **POST /api/admin/categories** - Create category
4. **PUT /api/admin/categories/:id** - Update category
5. **DELETE /api/admin/categories/:id** - Delete category
6. **POST /api/admin/occasions** - Create occasion
7. **PUT /api/admin/occasions/:id** - Update occasion
8. **DELETE /api/admin/occasions/:id** - Delete occasion
9. **GET /api/admin/users/:id/wardrobe** - User's wardrobe items
10. **GET /api/admin/users/:id/outfits** - User's saved outfits
11. **GET /api/admin/users/:id/planned-outfits** - User's planned outfits

**State Management:**
- `activeTab` - Current tab ('overview', 'users', 'categories', 'occasions')
- `users` - All users
- `categories` - All categories
- `occasions` - All occasions
- `stats` - System statistics
- `showCategoryModal` - Category modal visibility
- `showOccasionModal` - Occasion modal visibility
- `editingCategory` - Category being edited
- `editingOccasion` - Occasion being edited

**Code Location:**
- Frontend: `src/pages/AdminDashboard.js`
- Backend: `backend/server.js` (admin endpoints)

---

## Key Functions & Algorithms

### 1. Category Detection Algorithm
**Location:** `backend/server.js` (lines 1177-1579)

**Purpose:** Match Google Vision API results to database categories

**Process:**
1. Google Vision returns objects and labels
2. Extract main object/label (e.g., "Jacket", "Hat")
3. Try exact ID match (e.g., "JACKET" → category with id="jacket")
4. Try keyword matching (check if detected text matches category keywords)
5. Try label matching (fuzzy match)
6. Try custom category checks (hardcoded mappings)
7. Fallback to hardcoded mapping

**Key Code:**
```javascript
// backend/server.js lines 1177-1579
// Matching logic with priority:
// 1. Exact ID match
// 2. Keyword match (using category keywords from database)
// 3. Label match
// 4. Fuzzy match
// 5. Custom category checks
// 6. Hardcoded fallback
```

---

### 2. Occasion Detection Algorithm
**Location:** `backend/server.js` (lines 1614-1726)

**Purpose:** Detect suitable occasions for clothing items

**Process:**
1. Combines tags and labels from Google Vision
2. Loads all occasions from database
3. Checks if occasion keywords match detected text
4. Uses category-based rules (hardcoded for accuracy)
5. Defaults to "casual" if no match

**Key Code:**
```javascript
// backend/server.js lines 1614-1726
const getOccasionTags = async (category, tags, labels) => {
  // 1. Check database occasion keywords
  // 2. Apply category-based rules
  // 3. Default to casual
}
```

---

### 3. Outfit Recommendation Algorithm
**Location:** `backend/server.js` (lines 2115-2416)

**Purpose:** Generate outfit recommendations based on occasion

**Type:** Rule-based/Category-based Algorithm (NOT AI-based)

**Algorithm:**
1. Filter wardrobe items by occasion tags
2. Group items by category (tops, bottoms, shoes, outerwear, accessories)
3. Randomly select one item from each required category using `pickRandom()` function
4. Optionally include outerwear (50% probability)
5. Optionally include 0-2 accessories (probability-based)
6. Check for duplicate outfits
7. Generate styling tips based on hardcoded rules

**Key Code:**
```javascript
// backend/server.js lines 2168-2380
// Filter by category
const tops = wardrobeItems.filter(item => category === 'TOPS');
const bottoms = wardrobeItems.filter(item => category === 'BOTTOMS');
// ... etc

// Random selection (NOT AI - just random picking)
const outfit = {
  top: pickRandom(tops),
  bottom: pickRandom(bottoms),
  shoes: pickRandom(shoes),
  outerwear: pickOuterwearWithProbability(outerwear),
  accessories: pickAccessoriesWithProbability(accessories)
};
```

**Note:** This is NOT an AI-based recommendation. It uses a deterministic rule-based algorithm with random selection. There is a Gemini API endpoint for AI recommendations (`/api/recommend-outfit-gemini`) but it's legacy/fallback and NOT the primary method used.

---

### 4. Duplicate Outfit Detection
**Location:** `backend/server.js` (search for `checkDuplicateOutfit`)

**Purpose:** Warn users if they've created the same outfit before

**Algorithm:**
1. Compare item IDs of new outfit with existing outfits
2. Check if all items match (same IDs)
3. Check date range (within last 7 days by default)
4. Return duplicate warning if found

**Code Location:**
- Frontend: `src/pages/Outfits.js`, `src/pages/Planner.js`
- Backend: `backend/server.js` (helper function)

---

### 5. Authentication Middleware
**Location:** `backend/server.js` (lines 167-183)

**Purpose:** Verify JWT tokens on protected routes

**Process:**
1. Extract token from Authorization header
2. Verify token signature
3. Extract user ID from token
4. Add user to request object
5. Call next() or return 401

**Code:**
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

---

### 6. Password Hashing
**Location:** `backend/server.js` (lines 125-135)

**Purpose:** Securely store passwords

**Process:**
1. Mongoose pre-save hook intercepts user creation
2. Hashes password using bcrypt (10 salt rounds)
3. Stores hashed password in database

**Code:**
```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

---

## AI Integration

### Google Vision API Integration
**Location:** `backend/server.js` (lines 1072-1797)

**API Endpoint:** `POST /api/analyze-image`

**Features Used:**
1. **OBJECT_LOCALIZATION** - Detects clothing objects (e.g., "Jacket", "Shoe")
2. **LABEL_DETECTION** - Detects labels/descriptions (e.g., "Clothing", "Apparel")

**Process:**
1. Frontend sends base64 image
2. Backend calls Google Vision API
3. Vision API returns objects and labels
4. Backend processes results:
   - Filters for clothing-related objects
   - Extracts main category
   - Matches to database categories (with prioritization if multiple matches)
   - Detects occasions using keywords
   - Extracts colors from labels
5. Returns analysis result

**Category Matching Priority (When Item Matches Multiple Categories):**

The system uses a **prioritization hierarchy** to handle cases where an item matches multiple categories:

1. **Exact ID Match** (Highest Priority)
   - Direct match between detected category name and database category ID
   - Example: "JACKET" detected → matches "jacket" category ID

2. **Variation Match**
   - Handles common variations (e.g., "CAP" or "HAT" → matches "hat" category)

3. **Keyword Matching** (Multiple matches handled with priority):
   - **First Priority:** "Detected-keyword" matches (detected category name matches a keyword)
   - **Second Priority:** Regular keyword matches
   - **Third Priority:** Name matches (category ID/label appears in text)
   - **When Multiple Keyword Matches:**
     - For outerwear items (jacket, coat, blazer): **Prioritizes "outerwear" over "tops"**
     - For other items: Takes the **first match** (but specific categories preferred in fuzzy matching)

4. **Label Matching**
   - Prioritizes **specific categories** over general ones
   - Example: "hat" category preferred over "accessories"
   - Example: "skirt" category preferred over "bottoms"

5. **Fuzzy Matching** (Plural/singular, word boundaries)
   - Scores specific categories **higher** than general ones
   - If scores are close, **prefers non-general categories**
   - General categories: `['tops', 'bottoms', 'shoes', 'outerwear', 'accessories']`

6. **Hardcoded Fallback Mapping**
   - Checks for **specific categories first** (e.g., "hat", "outerwear", "watch")
   - Falls back to **general categories** if specific ones don't exist
   - Example: "HAT" → checks for "hat" category first, then "accessories"

**Result:** The system always selects **one category** - the most specific and appropriate match based on the priority hierarchy above.

**API Request Format:**
```javascript
{
  requests: [{
    image: { content: base64String },
    features: [
      { type: "OBJECT_LOCALIZATION", maxResults: 10 },
      { type: "LABEL_DETECTION", maxResults: 10 }
    ]
  }]
}
```

**Code Location:**
- Backend: `backend/server.js` (lines 1072-1797)
- Frontend API call: `src/services/ApiService.js` (lines 516-531)

---

### Gemini API Integration (Legacy/Fallback)
**Location:** `backend/server.js` (lines 2476-2598)

**API Endpoint:** `POST /api/recommend-outfit-gemini`

**Purpose:** AI-generated outfit recommendations (not primary method)

**Process:**
1. Sends wardrobe items and occasion to Gemini
2. Gemini generates outfit recommendation
3. Parses JSON response
4. Maps back to full wardrobe items

**Status:** Legacy/fallback - primary method is category-based algorithm

---

## Authentication & Authorization

### Authentication Flow

1. **User Login:**
   - User enters email/password
   - Backend validates credentials
   - Backend generates JWT token
   - Token stored in localStorage
   - Token added to API requests

2. **Protected Routes:**
   - ProtectedRoute component checks authentication
   - Redirects to login if not authenticated
   - Checks admin role if required

3. **API Authentication:**
   - Token sent in Authorization header
   - Backend middleware verifies token
   - User ID extracted from token

**Code Locations:**
- AuthContext: `src/contexts/AuthContext.js`
- ProtectedRoute: `src/components/ProtectedRoute.js`
- Backend middleware: `backend/server.js` (lines 167-183)
- Login endpoint: `backend/server.js` (search for `/api/auth/login`)

---

### Authorization (Admin)

**Admin Routes:**
- `/admin` - Admin Dashboard

**Admin Functions:**
- View all users
- Manage categories
- Manage occasions
- View system statistics
- Manage user content

**Code Location:**
- Frontend check: `src/components/ProtectedRoute.js` (requireAdmin prop)
- Backend check: Admin endpoints check `req.user.role === 'admin'`

---

## Possible Presentation Questions

### Technical Questions

1. **"How does the AI image analysis work?"**
   - Answer: Uses Google Vision API with OBJECT_LOCALIZATION and LABEL_DETECTION features. Backend processes results and matches to database categories using keyword matching and fuzzy logic.

2. **"How do you detect categories?"**
   - Answer: Multi-step matching process: exact ID match → keyword match → label match → fuzzy match → custom checks → fallback. Uses category keywords from database for intelligent matching.

3. **"How does outfit recommendation work?"**
   - Answer: Rule-based/category-based algorithm (NOT AI). Filters wardrobe items by occasion tags, groups by category (tops, bottoms, shoes, outerwear, accessories), and randomly selects one item from each category using a `pickRandom()` function. Uses probability-based selection for outerwear (50%) and accessories (0-2 items). Generates styling tips based on hardcoded rules. There is a Gemini API endpoint for AI recommendations, but it's legacy/fallback and not the primary method.

4. **"How do you handle duplicate outfits?"**
   - Answer: Compares item IDs of new outfit with existing outfits. Checks if all items match and if created within last 7 days. Shows warning to user.

5. **"How is authentication implemented?"**
   - Answer: JWT-based authentication. Tokens stored in localStorage. Backend middleware verifies tokens on protected routes. Passwords hashed using bcrypt.

6. **"What database do you use?"**
   - Answer: MongoDB with Mongoose ODM. Collections: Users, WardrobeItems, Outfits, PlannedOutfits, Categories, Occasions.

7. **"How do you handle file uploads?"**
   - Answer: Multer middleware handles file uploads. Files stored in `uploads/` directory. Image paths stored in database.

8. **"How does occasion detection work?"**
   - Answer: Combines Google Vision tags/labels, matches against occasion keywords in database, uses category-based rules for accuracy, defaults to "casual".

9. **"What external APIs do you use?"**
   - Answer: Google Vision API (image analysis), Gemini API (optional/legacy recommendations), Rembg service (optional background removal).

10. **"How do you handle mobile responsiveness?"**
    - Answer: CSS media queries, responsive grid layouts, mobile-specific navigation (hamburger menu), adaptive component layouts.

---

### Design Questions

11. **"Why did you choose React?"**
    - Answer: Component-based architecture, large ecosystem, good state management, excellent for SPAs.

12. **"Why MongoDB instead of SQL?"**
    - Answer: Flexible schema for clothing items (varying tags, occasions), easy to add new fields, good for document-based data.

13. **"How do you ensure data security?"**
    - Answer: Passwords hashed with bcrypt, JWT tokens for authentication, user data isolation (queries filtered by user ID), admin role verification.

14. **"How do you handle errors?"**
    - Answer: Try-catch blocks, error responses with status codes, user-friendly error messages, fallback mechanisms for AI failures.

---

### Functionality Questions

15. **"How do users add items to wardrobe?"**
    - Answer: Upload page → select image → AI analysis → review results → edit if needed → confirm → saved to database.

16. **"How do users get outfit recommendations?"**
    - Answer: Outfits page → select occasion → click "Style It" → system filters wardrobe by occasion → generates recommendation → displays items with styling tips.

17. **"How does the calendar/planner work?"**
    - Answer: Calendar displays planned outfits. Click date → open planning modal → select items from wardrobe → save planned outfit. Loads planned outfits for calendar display.

18. **"Can users edit items after upload?"**
    - Answer: Yes, users can edit category, name, tags, occasions in wardrobe page. Changes saved via PUT request.

19. **"How do categories and occasions work?"**
    - Answer: Admin manages categories/occasions. Each has keywords for AI detection. Users see these in filters/dropdowns. AI uses keywords for categorization.

20. **"What happens if AI analysis fails?"**
    - Answer: Fallback mechanism returns default values (category: 'CLOTHING', occasion: 'casual'). User can manually edit before saving.

---

### System Architecture Questions

21. **"How is the frontend and backend separated?"**
    - Answer: React frontend (port 3000) communicates with Express backend (port 5000) via REST API. Axios handles HTTP requests.

22. **"How do you handle state management?"**
    - Answer: React useState/useEffect hooks, React Context for authentication (AuthContext), local component state for UI.

23. **"How do you handle API calls?"**
    - Answer: Centralized ApiService class (src/services/ApiService.js) with methods for each endpoint. Axios instance with interceptors.

24. **"How is the database structured?"**
    - Answer: MongoDB collections with Mongoose schemas. Relationships via ObjectId references. Embedded documents for outfit items.

25. **"How do you handle image storage?"**
    - Answer: Multer saves files to `uploads/` directory. File paths stored in database. Express serves static files from uploads directory.

---

### Performance & Scalability Questions

26. **"How do you optimize performance?"**
    - Answer: Indexed database queries, efficient filtering, image optimization (base64 conversion), lazy loading of images, caching of categories/occasions.

27. **"Can the system handle many users?"**
    - Answer: MongoDB scales horizontally, Express can handle concurrent requests, JWT is stateless (scalable), file storage can be moved to cloud (S3).

28. **"How do you handle large images?"**
    - Answer: Base64 conversion for API, backend can compress, could add image resizing, file size limits in Multer.

---

### Future Enhancement Questions

29. **"What features would you add?"**
    - Answer: Weather integration, social sharing, shopping links, style preferences learning, cloud image storage, mobile app.

30. **"How would you improve AI accuracy?"**
    - Answer: More training data, custom ML models, user feedback loop, improved keyword matching, better category rules.

---

## Code File Locations Quick Reference

### Frontend
- **Pages:**
  - Home: `src/pages/Home.js`
  - Login: `src/pages/Login.js`
  - Signup: `src/pages/Signup.js`
  - Wardrobe: `src/pages/Wardrobe.js`
  - Upload: `src/pages/Upload.js`
  - Outfits: `src/pages/Outfits.js`
  - Planner: `src/pages/Planner.js`
  - Profile: `src/pages/Profile.js`
  - Admin: `src/pages/AdminDashboard.js`

- **Services:**
  - API Service: `src/services/ApiService.js`

- **Components:**
  - Navbar: `src/components/Navbar.js`
  - ProtectedRoute: `src/components/ProtectedRoute.js`
  - AuthContext: `src/contexts/AuthContext.js`

- **Routing:**
  - App.js: `src/App.js`

### Backend
- **Server & API:**
  - All endpoints: `backend/server.js`
  - Database schemas: `backend/server.js` (lines 70-162)
  - Authentication: `backend/server.js` (lines 167-183, search for `/api/auth`)
  - AI Analysis: `backend/server.js` (lines 1072-1797)
  - Outfit Recommendation: `backend/server.js` (lines 2115-2416)

---

## Key Algorithms Summary

1. **Category Detection (AI-assisted):** Uses Google Vision API + multi-step matching (exact → keyword → label → fuzzy → custom → fallback)
2. **Occasion Detection (AI-assisted):** Uses Google Vision API results + keyword matching + category-based rules + default to casual
3. **Outfit Recommendation (NOT AI):** Rule-based algorithm - Filter by occasion → group by category → random selection → probability-based extras
4. **Duplicate Detection:** Item ID comparison within date range
5. **Authentication:** JWT token generation/verification
6. **Password Security:** Bcrypt hashing (10 salt rounds)

---

## Database Relationships

```
User
  ├── WardrobeItem (user: ObjectId ref)
  ├── Outfit (user: ObjectId ref)
  └── PlannedOutfit (user: ObjectId ref)

Category (standalone, public)
Occasion (standalone, public)

Outfit
  └── items[]._id → WardrobeItem (reference)

PlannedOutfit
  ├── outfit → Outfit (optional ref)
  └── items[] (embedded)
```

---

**End of Documentation**

