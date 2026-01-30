# System Architecture Diagram - StyleIt

## Mermaid Format

```mermaid
graph TB
    subgraph Client["CLIENT LAYER"]
        B1[Browser 1<br/>Chrome]
        B2[Browser 2<br/>Firefox]
        BN[Browser N<br/>Safari/Edge]
    end
    
    subgraph Presentation["PRESENTATION LAYER"]
        subgraph React["React.js Frontend Application"]
            Pages[Pages<br/>Home, Login, Wardrobe,<br/>Upload, Outfits, Planner,<br/>Profile, Admin]
            Components[Components<br/>Navbar, ProtectedRoute,<br/>Logo]
            Services[Services<br/>ApiService,<br/>AuthContext]
            Router[React Router<br/>JWT Auth Context]
        end
    end
    
    subgraph Application["APPLICATION LAYER"]
        subgraph Express["Node.js + Express.js Backend"]
            Gateway[API Gateway / Middleware<br/>CORS, Body Parser,<br/>JWT Auth, Error Handling]
            AuthSvc[Auth Service<br/>Signup, Login, JWT]
            ImageSvc[Image Service<br/>Upload, AI Analysis,<br/>Categorize]
            OutfitSvc[Outfit Service<br/>Recommend, Save,<br/>Manage]
            AdminSvc[Admin Service<br/>Users, Categories,<br/>Occasions]
        end
    end
    
    subgraph Data["DATA LAYER"]
        MongoDB[(MongoDB Database<br/>Users, WardrobeItems,<br/>Outfits, PlannedOutfits,<br/>Categories, Occasions)]
        FileStorage[File Storage<br/>uploads/]
    end
    
    subgraph External["EXTERNAL SERVICES"]
        VisionAPI[Google Vision API<br/>Object Detection,<br/>Label Detection,<br/>Image Analysis]
    end
    
    B1 --> React
    B2 --> React
    BN --> React
    
    Pages --> Gateway
    Components --> Gateway
    Services --> Gateway
    Router --> Gateway
    
    Gateway --> AuthSvc
    Gateway --> ImageSvc
    Gateway --> OutfitSvc
    Gateway --> AdminSvc
    
    ImageSvc --> VisionAPI
    AuthSvc --> MongoDB
    OutfitSvc --> MongoDB
    AdminSvc --> MongoDB
    ImageSvc --> FileStorage
    
    style Client fill:#e1d5e7
    style Presentation fill:#fff2cc
    style Application fill:#f8cecc
    style Data fill:#dae8fc
    style External fill:#e1d5e7
    style MongoDB fill:#dae8fc
```

## Architecture Layers Description

### CLIENT LAYER
- Multiple web browsers accessing the application
- Standard HTTP/HTTPS communication

### PRESENTATION LAYER
- **React.js Frontend**: Single-page application
- **Pages**: All user-facing pages
- **Components**: Reusable UI components
- **Services**: API communication and authentication
- **Router**: Client-side routing and auth context

### APPLICATION LAYER
- **Express.js Backend**: RESTful API server
- **API Gateway**: Middleware for request handling
- **Auth Service**: User authentication and authorization
- **Image Service**: File upload and AI processing
- **Outfit Service**: Recommendation and outfit management
- **Admin Service**: System administration

### DATA LAYER
- **MongoDB**: Document database storing all data
- **File Storage**: Local storage for uploaded images

### EXTERNAL SERVICES
- **Google Vision API**: AI-powered image analysis

