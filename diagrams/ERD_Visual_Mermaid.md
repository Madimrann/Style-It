# Entity Relationship Diagram - StyleIt Database

## Mermaid ERD Format

```mermaid
erDiagram
    USERS ||--o{ WARDROBE_ITEMS : "has"
    USERS ||--o{ OUTFITS : "has"
    USERS ||--o{ PLANNED_OUTFITS : "has"
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

## Relationships Explained

1. **USERS → WARDROBE_ITEMS** (One-to-Many)
   - One user can have many wardrobe items
   - Each wardrobe item belongs to one user

2. **USERS → OUTFITS** (One-to-Many)
   - One user can have many saved outfits
   - Each outfit belongs to one user

3. **USERS → PLANNED_OUTFITS** (One-to-Many)
   - One user can have many planned outfits
   - Each planned outfit belongs to one user

4. **OUTFITS → PLANNED_OUTFITS** (One-to-One, Optional)
   - A planned outfit can optionally reference a saved outfit
   - A saved outfit can be used in multiple planned outfits

5. **WARDROBE_ITEMS ↔ OUTFITS** (Many-to-Many, Embedded)
   - Outfit items are embedded in Outfit documents
   - Items reference WardrobeItem via _id field

6. **CATEGORIES** (Standalone)
   - System-wide categories for AI matching and filtering

7. **OCCASIONS** (Standalone)
   - System-wide occasions for filtering and recommendations

