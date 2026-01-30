# SCREENSHOT INSTRUCTIONS FOR FYP2 REPORT
## StyleIt - A Personalized Wardrobe Planner With Outfit Suggestions

This document provides detailed instructions on what screenshots to capture for your FYP2 final report.

---

## GENERAL SCREENSHOT GUIDELINES

1. **Use High Resolution**: Capture screenshots at full screen resolution or at least 1920x1080
2. **Clear and Clean**: Ensure the browser window is clean, no unnecessary tabs or extensions visible
3. **Consistent Browser**: Use the same browser (preferably Chrome) for all screenshots
4. **Remove Personal Data**: If any personal information is visible, blur it out or use test data
5. **File Naming**: Name files descriptively (e.g., `Home_Page.png`, `Upload_Page.png`)

---

## CHAPTER 4: SYSTEM DESIGN SCREENSHOTS
*(Note: These are for Chapter 4 Interface Design section)*

### 4.3.1 Home Page
**File Name**: `Figure_4.3.1_Home_Page.png`
**What to Capture**:
- Full home page showing:
  - Navigation bar
  - Hero section with title and description
  - Feature overview section
  - Call-to-action buttons (Login/Signup)
- **Instructions**: 
  1. Navigate to `http://localhost:3000/` (or your deployed URL)
  2. Ensure you're logged out
  3. Capture the entire page

### 4.3.2 Login Page
**File Name**: `Figure_4.3.2_Login_Page.png`
**What to Capture**:
- Login form with:
  - Email input field
  - Password input field
  - Login button
  - Link to signup page
- **Instructions**:
  1. Navigate to `/login`
  2. Show empty form (or with placeholder text visible)
  3. Capture the form centered on page

### 4.3.3 Signup Page
**File Name**: `Figure_4.3.3_Signup_Page.png`
**What to Capture**:
- Signup form with:
  - Name input field
  - Email input field
  - Password input field
  - Confirm password field
  - Signup button
- **Instructions**:
  1. Navigate to `/signup`
  2. Show empty form
  3. Capture the form

---

## CHAPTER 5: SCREENSHOTS OF TECHNICAL DEVELOPMENT
*(Note: These are the actual implementation screenshots for Chapter 5)*

### 5.2.4 Wardrobe Page
**File Name**: `Figure_5.2.4_Wardrobe_Page.png`
**What to Capture**:
- Wardrobe page showing:
  - Navigation bar
  - Category filter buttons (All Items, Tops, Bottoms, etc.)
  - Empty state message (if no items)
  - Upload button/link
- **Instructions**:
  1. Login with a test account
  2. Navigate to `/wardrobe`
  3. If you have items, temporarily delete them or use a new account
  4. Capture the page showing empty state

### 5.2.4 Wardrobe Page (With Items)
**File Name**: `Figure_5.2.4_Wardrobe_Page.png`
**What to Capture**:
- Wardrobe page showing:
  - Category filter buttons
  - Grid of wardrobe items (at least 4-6 items visible)
  - Item cards showing:
    - Item image
    - Item name
    - Category badge
- **Instructions**:
  1. Ensure you have at least 4-6 wardrobe items uploaded
  2. Navigate to `/wardrobe`
  3. Capture showing multiple items in grid layout
  4. Show different categories if possible

### 5.2.4 Wardrobe Page - Item Detail Modal
**File Name**: `Figure_5.2.4_Wardrobe_Item_Detail.png`
**What to Capture**:
- Item detail modal showing:
  - Large item image
  - Item name
  - Category
  - Tags (if any)
  - Occasion tags
  - Colors detected
  - Description (if any)
  - Edit and Delete buttons
- **Instructions**:
  1. Navigate to `/wardrobe`
  2. Click on any wardrobe item
  3. Capture the detail modal opened
  4. Ensure all information is visible

### 5.2.5 Upload Page
**File Name**: `Figure_5.2.5_Upload_Page.png`
**What to Capture**:
- Upload page showing:
  - File upload area (drag-and-drop zone)
  - Upload button
  - Camera icon (if available)
  - Image preview area (empty or with selected image)
  - "Analyze" button (disabled or ready)
- **Instructions**:
  1. Navigate to `/upload`
  2. Select an image but don't analyze yet
  3. Show image preview visible
  4. Capture the page

### 5.2.5 Upload Page (After Analysis)
**File Name**: `Figure_5.2.5_Upload_Page_After_Analysis.png`
**What to Capture**:
- Upload page showing:
  - Image preview
  - Analysis results:
    - Detected category (dropdown/display)
    - Detected tags
    - Detected occasions (checkboxes)
    - Detected colors
    - AI description
  - Editable fields
  - "Confirm" button
- **Instructions**:
  1. Upload an image
  2. Click "Analyze"
  3. Wait for analysis to complete
  4. Capture showing all analysis results
  5. Ensure category, tags, and occasions are visible

### 5.2.6 Outfits Page
**File Name**: `Figure_5.2.6_Outfits_Page.png`
**What to Capture**:
- Outfits page showing:
  - Occasion selector/buttons (Casual, Formal, Work, Sporty, Random)
  - "Style It" button
  - Empty recommendation area (before generating)
- **Instructions**:
  1. Navigate to `/outfits`
  2. Ensure you have wardrobe items uploaded
  3. Capture showing occasion selector visible
  4. Don't generate recommendation yet

### 5.2.6 Outfits Page (With Recommendation)
**File Name**: `Figure_5.2.6_Outfits_Page_With_Recommendation.png`
**What to Capture**:
- Outfits page showing:
  - Selected occasion
  - Recommended outfit display:
    - Top item (image and name)
    - Bottom item (image and name)
    - Shoes (image and name)
    - Outerwear (if included)
    - Accessories (if included)
  - Styling tips section
  - "Save Outfit" button
  - "Get New Recommendation" button
- **Instructions**:
  1. Select an occasion (e.g., "Casual")
  2. Click "Style It"
  3. Wait for recommendation to load
  4. Capture showing full recommendation
  5. Ensure all outfit items are visible

### 5.2.6 Outfits Page - Saved Outfits Section
**File Name**: `Figure_5.2.6_Saved_Outfits.png`
**What to Capture**:
- Outfits page showing:
  - "Saved Outfits" section/tab
  - Grid of saved outfits (at least 2-3 outfits)
  - Each outfit showing:
    - Outfit name
    - Preview of items
    - Edit/Delete options
- **Instructions**:
  1. Save at least 2-3 outfits first
  2. Navigate to saved outfits section
  3. Capture showing multiple saved outfits

### 5.2.7 Planner Page
**File Name**: `Figure_5.2.7_Planner_Page.png`
**What to Capture**:
- Planner page showing:
  - Full calendar view (month view)
  - Navigation arrows (previous/next month)
  - Current month name
  - Calendar grid with dates
  - At least one date with a planned outfit indicator
- **Instructions**:
  1. Navigate to `/planner`
  2. Ensure you have at least one planned outfit
  3. Capture showing calendar with planned outfit visible
  4. Show current month view

### 5.2.7 Planner Page - Planning Modal
**File Name**: `Figure_5.2.7_Planner_Page_Planning_Modal.png`
**What to Capture**:
- Planning modal showing:
  - Selected date displayed
  - Wardrobe items grid for selection
  - Selected items section
  - Occasion selector
  - Outfit name input
  - Notes field (optional)
  - "Plan Outfit" button
  - "Use Saved Outfit" option (if available)
- **Instructions**:
  1. Click on a date in the calendar
  2. Capture the planning modal opened
  3. Show item selection interface
  4. Have at least one item selected

### 5.2.8 Profile Page
**File Name**: `Figure_5.2.8_Profile_Page.png`
**What to Capture**:
- Profile page showing:
  - User information (name, email)
  - Statistics cards:
    - Total wardrobe items count
    - Total saved outfits count
    - Total planned outfits count
  - Navigation links or buttons
  - Logout button
- **Instructions**:
  1. Navigate to `/profile`
  2. Ensure statistics are populated
  3. Capture showing all information

### 5.2.9 Admin Dashboard Page
**File Name**: `Figure_5.2.9_Admin_Dashboard_Page.png`
**What to Capture**:
- Admin dashboard showing:
  - Tabs (Overview, Users, Categories, Occasions)
  - Overview tab selected
  - System statistics:
    - Total users
    - Total wardrobe items
    - Total outfits
    - Total planned outfits
  - Charts or visualizations (if any)
- **Instructions**:
  1. Login as admin user
  2. Navigate to `/admin`
  3. Capture overview tab
  4. Ensure statistics are visible

### 5.2.9 Admin Dashboard - Categories Management
**File Name**: `Figure_5.2.9_Admin_Dashboard_Categories.png`
**What to Capture**:
- Admin dashboard showing:
  - Categories tab selected
  - Table/list of categories:
    - Category ID
    - Category Label
    - Color
    - Keywords
    - Actions (Edit/Delete)
  - "Add Category" button
- **Instructions**:
  1. Navigate to Categories tab in admin dashboard
  2. Capture showing all categories
  3. Ensure table/list is visible

### 5.2.9 Admin Dashboard - Users Management
**File Name**: `Figure_5.2.9_Admin_Dashboard_Users.png`
**What to Capture**:
- Admin dashboard showing:
  - Users tab selected
  - Table/list of users:
    - User name
    - Email
    - Role (user/admin)
    - Created date
    - Actions (View/Delete)
  - User count
- **Instructions**:
  1. Navigate to Users tab
  2. Capture showing user list
  3. Ensure multiple users are visible (if available)

---

## ADDITIONAL SCREENSHOTS FOR TESTING (Optional)
*(Note: These can be used in Chapter 6: Testing Overview if needed)*

### Testing: Successful Image Upload
**File Name**: `Figure_Testing_Successful_Image_Upload.png`
**What to Capture**:
- Upload page showing:
  - Success message (e.g., "Item added successfully!")
  - Confirmation that item was saved
  - Option to upload another item
- **Instructions**:
  1. Upload an image
  2. Complete analysis
  3. Confirm and save
  4. Capture success message

### Testing: AI Analysis Results
**File Name**: `Figure_Testing_AI_Analysis_Results.png`
**What to Capture**:
- Upload page showing:
  - Image with analysis results
  - Detected category (highlighted or selected)
  - Confidence score (if displayed)
  - All detected tags
  - All detected occasions
  - Detected colors
- **Instructions**:
  1. Upload a clear image of clothing item
  2. Click Analyze
  3. Capture showing all AI-detected information
  4. Ensure accuracy is visible

### Testing: Outfit Recommendation Result
**File Name**: `Figure_Testing_Outfit_Recommendation_Result.png`
**What to Capture**:
- Outfits page showing:
  - Complete outfit recommendation
  - All items displayed clearly
  - Styling tips visible
  - No duplicate warning (or show duplicate warning if applicable)
- **Instructions**:
  1. Ensure you have items in multiple categories
  2. Generate recommendation
  3. Capture showing complete outfit
  4. Show styling tips if available

### Testing: Error Handling (Example)
**File Name**: `Figure_Testing_Error_Handling.png`
**What to Capture**:
- Any page showing:
  - Error message displayed clearly
  - User-friendly error text
  - Option to retry or go back
- **Instructions**:
  1. Trigger an error (e.g., invalid login, network error)
  2. Capture error message
  3. Ensure error is clearly displayed

### Testing: Responsive Design (Mobile View)
**File Name**: `Figure_Testing_Mobile_View.png`
**What to Capture**:
- Any page (preferably Wardrobe or Outfits) showing:
  - Mobile-responsive layout
  - Hamburger menu (if applicable)
  - Adjusted grid layout (2 columns instead of 4)
  - Touch-friendly buttons
- **Instructions**:
  1. Open browser developer tools (F12)
  2. Toggle device toolbar (Ctrl+Shift+M)
  3. Select mobile device (e.g., iPhone 12)
  4. Navigate to a page
  5. Capture mobile view

### Testing: Database Content (MongoDB Compass)
**File Name**: `Figure_Testing_Database_Content.png`
**What to Capture**:
- MongoDB Compass showing:
  - Database: `styleit`
  - Collections visible:
    - users
    - wardrobeitems
    - outfits
    - plannedoutfits
    - categories
    - occasions
  - Sample document from one collection
- **Instructions**:
  1. Open MongoDB Compass
  2. Connect to your database
  3. Navigate to `styleit` database
  4. Show collections list
  5. Open one collection and show a sample document

---

## ADDITIONAL SCREENSHOTS (Optional but Recommended)

### Additional: Navigation Bar
**File Name**: `Figure_Additional_Navigation_Bar.png`
**What to Capture**:
- Navigation bar showing:
  - Logo/brand name
  - Navigation links (Home, Wardrobe, Upload, Outfits, Planner, Profile)
  - User menu or logout button
- **Instructions**:
  1. Login as user
  2. Capture navigation bar from any page

### Additional: Category Filter in Action
**File Name**: `Figure_Additional_Category_Filter.png`
**What to Capture**:
- Wardrobe page showing:
  - Category filter buttons
  - One category selected (e.g., "Tops")
  - Filtered results showing only items from that category
- **Instructions**:
  1. Navigate to `/wardrobe`
  2. Click on a category filter (e.g., "Tops")
  3. Capture showing filtered results

### Additional: Edit Item Modal
**File Name**: `Figure_Additional_Edit_Item_Modal.png`
**What to Capture**:
- Edit modal showing:
  - Item image
  - Editable fields:
    - Name
    - Category (dropdown)
    - Tags
    - Occasion tags (checkboxes)
  - Save and Cancel buttons
- **Instructions**:
  1. Navigate to `/wardrobe`
  2. Click on an item
  3. Click Edit
  4. Capture edit modal

---

## SCREENSHOT CHECKLIST

Before submitting, ensure you have:

### Chapter 4: Interface Design (Mockups/Designs)
- [ ] Figure 4.3.1: Home Page
- [ ] Figure 4.3.2: Login Page
- [ ] Figure 4.3.3: Signup Page
- [ ] Figure 4.3.4: Wardrobe Page
- [ ] Figure 4.3.5: Upload Page
- [ ] Figure 4.3.6: Outfits Page
- [ ] Figure 4.3.7: Planner Page
- [ ] Figure 4.3.8: Profile Page
- [ ] Figure 4.3.9: Admin Dashboard Page

### Chapter 5: Screenshots of Technical Development (Actual Implementation)
- [ ] Figure 5.2.1: Home Page
- [ ] Figure 5.2.2: Login Page
- [ ] Figure 5.2.3: Signup Page
- [ ] Figure 5.2.4: Wardrobe Page
- [ ] Figure 5.2.5: Upload Page
- [ ] Figure 5.2.6: Outfits Page
- [ ] Figure 5.2.7: Planner Page
- [ ] Figure 5.2.8: Profile Page
- [ ] Figure 5.2.9: Admin Dashboard Page

### Optional: Testing Screenshots (for Chapter 6)
- [ ] Successful Upload
- [ ] AI Analysis Results
- [ ] Outfit Recommendation
- [ ] Error Handling
- [ ] Mobile View
- [ ] Database Content

---

## TIPS FOR BETTER SCREENSHOTS

1. **Use Browser Zoom**: Set browser zoom to 100% for consistent sizing
2. **Hide Extensions**: Disable browser extensions that add UI elements
3. **Use Test Data**: Create test accounts and test data for clean screenshots
4. **Consistent Theme**: Use the same browser theme/color scheme
5. **Full Screen**: Use full-screen mode (F11) for cleaner captures
6. **Remove Cursor**: Hide mouse cursor when capturing
7. **Annotation**: You can add arrows or labels later using image editing software

---

## SCREENSHOT EDITING TIPS

If you need to annotate screenshots:

1. **Add Figure Numbers**: Use image editing software to add figure numbers (e.g., "Figure 4.1")
2. **Add Labels**: Label important UI elements if needed
3. **Blur Sensitive Data**: Blur out any personal information
4. **Consistent Format**: Use consistent image format (PNG recommended)
5. **File Size**: Compress images if file sizes are too large, but maintain quality

---

**Good luck with your FYP2 report!**

