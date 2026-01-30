# Mermaid Diagrams for FYP2 Report

These Mermaid diagrams can be used directly in markdown or converted to images.

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph Client["CLIENT LAYER"]
        B1[Browser 1]
        B2[Browser 2]
        BN[Browser N]
    end
    
    subgraph Presentation["PRESENTATION LAYER"]
        React[React.js Frontend]
        Pages[Pages Components]
        Components[Reusable Components]
        Services[API Services]
        Router[React Router]
        Auth[AuthContext]
    end
    
    subgraph Application["APPLICATION LAYER"]
        Express[Express.js Backend]
        API[API Gateway]
        AuthService[Auth Service]
        ImageService[Image Service]
        OutfitService[Outfit Service]
        WardrobeService[Wardrobe Service]
        CalendarService[Calendar Service]
        AdminService[Admin Service]
    end
    
    subgraph Data["DATA LAYER"]
        MongoDB[(MongoDB Database)]
        FileStorage[File Storage]
    end
    
    subgraph External["EXTERNAL SERVICES"]
        VisionAPI[Google Vision API]
    end
    
    B1 --> React
    B2 --> React
    BN --> React
    
    React --> Pages
    React --> Components
    React --> Services
    React --> Router
    React --> Auth
    
    Services --> Express
    Express --> API
    API --> AuthService
    API --> ImageService
    API --> OutfitService
    API --> WardrobeService
    API --> CalendarService
    API --> AdminService
    
    ImageService --> VisionAPI
    AuthService --> MongoDB
    WardrobeService --> MongoDB
    OutfitService --> MongoDB
    CalendarService --> MongoDB
    AdminService --> MongoDB
    WardrobeService --> FileStorage
```

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ WARDROBE_ITEMS : has
    USERS ||--o{ OUTFITS : has
    USERS ||--o{ PLANNED_OUTFITS : has
    OUTFITS ||--o| PLANNED_OUTFITS : "optional reference"
    WARDROBE_ITEMS }o--o{ OUTFITS : "embedded in"
    
    USERS {
        ObjectId _id PK
        string email UK
        string password
        string name
        string role
        date createdAt
    }
    
    WARDROBE_ITEMS {
        ObjectId _id PK
        ObjectId user FK
        string name
        string category
        string image
        array tags
        array occasionTags
        string color
        string colors
        string description
        string style
        number confidence
        date createdAt
    }
    
    OUTFITS {
        ObjectId _id PK
        ObjectId user FK
        string name
        array items
        string occasion
        number confidence
        date lastWorn
        date createdAt
    }
    
    PLANNED_OUTFITS {
        ObjectId _id PK
        ObjectId user FK
        date date
        ObjectId outfit FK
        string name
        string occasion
        array items
        string notes
        date createdAt
    }
    
    CATEGORIES {
        ObjectId _id PK
        string id UK
        string label
        string color
        number order
        array keywords
        date createdAt
    }
    
    OCCASIONS {
        ObjectId _id PK
        string id UK
        string label
        string color
        number order
        array keywords
        date createdAt
    }
```

## 3. User Registration Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: 1. Fill registration form
    F->>B: 2. POST /api/auth/signup
    B->>DB: 3. Check if email exists
    DB-->>B: Email not found
    B->>B: 4. Hash password
    B->>DB: 5. Create user document
    DB-->>B: User created
    B->>B: 6. Generate JWT token
    B-->>F: 7. Return token and user
    F->>F: 8. Store token in localStorage
    F-->>U: 9. Redirect to home
```

## 4. Image Upload and Analysis Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant GV as Google Vision API
    participant DB as MongoDB
    
    U->>F: 1. Select image file
    F->>F: 2. Convert to base64
    F->>B: 3. POST /api/analyze-image
    B->>GV: 4. Call Vision API
    GV-->>B: 5. Return analysis results
    B->>B: 6. Process results
    B->>DB: 7. Load categories
    DB-->>B: 8. Return categories
    B->>B: 9. Match category and occasions
    B-->>F: 10. Return analysis results
    F-->>U: 11. Display results
    U->>F: 12. Review and edit
    U->>F: 13. Confirm save
    F->>B: 14. POST /api/wardrobe
    B->>B: 15. Save image file
    B->>DB: 16. Create wardrobe item
    DB-->>B: 17. Item created
    B-->>F: 18. Return saved item
    F-->>U: 19. Success message
```

## 5. Outfit Recommendation Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: 1. Select occasion
    U->>F: 2. Click "Style It"
    F->>B: 3. GET /api/recommend-outfit/:occasion
    B->>DB: 4. Get user's wardrobe items
    DB-->>B: 5. Return items
    B->>B: 6. Filter by occasion tags
    B->>B: 7. Group by category
    B->>B: 8. Randomly select items
    B->>DB: 9. Check for duplicates
    DB-->>B: 10. No duplicates found
    B->>B: 11. Generate styling tips
    B-->>F: 12. Return recommended outfit
    F-->>U: 13. Display outfit
    U->>F: 14. Save outfit
    F->>B: 15. POST /api/outfits
    B->>DB: 16. Save outfit
    DB-->>B: 17. Outfit saved
    B-->>F: 18. Return saved outfit
    F-->>U: 19. Success message
```

## 6. Calendar Planning Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: 1. Click date on calendar
    F->>F: 2. Open planning modal
    F->>B: 3. GET /api/wardrobe
    B->>DB: 4. Get user's wardrobe items
    DB-->>B: 5. Return items
    B-->>F: 6. Return items
    F-->>U: 7. Display items for selection
    U->>F: 8. Select items
    U->>F: 9. Save planned outfit
    F->>B: 10. POST /api/planned-outfits
    B->>DB: 11. Create planned outfit
    DB-->>B: 12. Planned outfit created
    B-->>F: 13. Return planned outfit
    F->>F: 14. Update calendar display
    F-->>U: 15. Show planned outfit on calendar
```

## How to Use These Diagrams

### Option 1: Use in Markdown
If your report supports Mermaid (GitHub, some markdown viewers):
- Copy the mermaid code blocks directly into your markdown
- They will render automatically

### Option 2: Convert to Images
1. Go to https://mermaid.live/
2. Paste the mermaid code
3. Export as PNG or SVG
4. Insert into your report

### Option 3: Use in Draw.io
1. Open draw.io
2. Use these as reference
3. Recreate manually for more control
4. Export as PNG or SVG

---

**Note**: Adjust the diagrams based on your actual implementation details.

