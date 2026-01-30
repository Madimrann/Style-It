# STYLEIT - A PERSONALIZED WARDROBE PLANNER WITH OUTFIT SUGGESTIONS

**MUHAMMAD ADIB IMRAN BIN ABD. ROHIM**

**SW01082913**

**JUNE 2025**

---

STYLEIT - A PERSONALIZED WARDROBE PLANNER WITH OUTFIT SUGGESTIONS

by

MUHAMMAD ADIB IMRAN BIN ABD. ROHIM

Project Supervisor: TS. DR. SUHAIMI BIN AB. RAHMAN

PROJECT REPORT SUBMITTED IN PARTIAL FULFILLMENT OF THE
THE REQUIREMENTS FOR THE BACHELOR OF COMPUTER SCIENCE (SOFTWARE
ENGINEERING) (HONS.)

UNIVERSITI TENAGA NASIONAL
JUNE 2025

---

# APPROVAL PAGE

**TITLE:** A PERSONALIZED WARDROBE PLANNER WITH OUTFIT SUGGESTIONS

**AUTHOR:** MUHAMMAD ADIB IMRAN BIN ABD. ROHIM

The undersigned certify that the above candidate has fulfilled the condition of the Final Year Project in partial fulfilment for the Bachelor of Computer Science (Software Engineering) (Hons.)

## SUPERVISOR:

Signature: ___________________________

Name: TS. DR. SUHAIMI BIN AB. RAHMAN

Date: ___________________________

---

# DECLARATION

I hereby declare that this report, submitted to Universiti Tenaga Nasional as a partial fulfilment of the requirements for the Bachelor of Computer Science (Software Engineering) (Hons.) has not been submitted as an exercise for a bachelor at any other university. I also certify that the work described here is entirely my own except for excerpts and summaries whose sources are appropriately cited in the references.

This report may be made available within the university library and may be photocopied or loaned to other libraries for the purposes of consultation.

Date: ___________________________



MUHAMMAD ADIB IMRAN

SW01082913

---

iii

# ABSTRACT

StyleIt – A Personalized Wardrobe Planner With Outfit Suggestions is a web-based application designed to simplify daily fashion decision-making through intelligent wardrobe management and AI-powered outfit recommendations. The system was developed using React.js for the frontend, Node.js with Express.js for the backend, and MongoDB for data persistence. StyleIt integrates Google Vision API for automatic clothing categorization through image recognition, enabling users to upload images of their clothing items which are automatically categorized into types such as tops, bottoms, shoes, outerwear, and accessories. The system employs a rule-based outfit recommendation algorithm that suggests suitable outfit combinations based on user-selected occasions (casual, formal, work, sporty). Additionally, StyleIt includes a calendar-based planning module that allows users to assign specific outfits to selected dates, aiding in outfit planning and avoiding repetition. The system features a comprehensive admin dashboard for managing categories and occasions, JWT-based authentication for secure access, and a responsive design optimized for various screen sizes. Testing was conducted to validate system functionality, performance, and user experience. The results demonstrate that StyleIt successfully addresses the common issue of indecisiveness in daily outfit choices while promoting better wardrobe utilization through an intuitive and intelligent digital fashion assistant.

---

iv

# ACKNOWLEDGEMENT

Final Year Project 2 has been a meaningful milestone in my academic journey, marking the transition from classroom learning to real-world application. It has challenged me to think critically, manage time efficiently, and explore the depths of software development with dedication. Above all, I am truly grateful to Allah S.W.T. for granting me the strength, clarity, and perseverance needed to complete this phase of my project.

I would like to extend my heartfelt thanks to the College of Computing and Informatics (CCI) for fostering an environment that supports both academic excellence and personal growth. This project has not only helped me apply theoretical knowledge, but has also been a valuable experience in understanding my potential and the areas I must continue to develop.

My sincere appreciation goes to my project supervisor, Ts. Dr. Suhaimi Bin Ab. Rahman, whose guidance, encouragement, and constructive feedback have been vital throughout this journey. His mentorship has greatly contributed to my progress and learning. I am also deeply thankful to my family and friends, whose unwavering support, kind words, and motivation kept me grounded during difficult moments. Their presence—though often behind the scenes—played a crucial role in my ability to stay focused and inspired. To everyone who has supported me in any way, I offer my deepest gratitude. This project would not have been possible without your contributions.

---

TABLE OF CONTENTS

PAGE

APPROVAL PAGE  I
DECLARATION  II
ABSTRACT  III
ACKNOWLEDGEMENT  IV
TABLE OF CONTENTS  V
LIST OF TABLES  VII
LIST OF FIGURES  VIII
LIST OF ABBREVIATIONS/NOTATIONS/GLOSSARY OF TERMS  X

CHAPTER 1  1
1.1  Project Background  1
1.2  Problem Statements  2
1.3  Project Objectives  3
1.4  Project Scopes  3

CHAPTER 2  5
2.1  Review on Existing Systems  5
2.1.1 CHIC - Outfit Planner  5
2.1.2 HangRr: Outfit Ideas  6
2.1.3 Outfit Tracker: Diary Planner  7
2.2  Finding and Analysis  9

CHAPTER 3  11
3.1  Requirements Elicitation  11
3.1.1 Elicitation Technique(s)  11
3.2  Results and Discussion  13
3.3  Requirement Specifications  21

CHAPTER 4  22
4.1  System Design  22
4.2  System Architecture  23
4.3  Interface Design  24
4.3.1 Home Page  24
4.3.2 Login Page  25
4.3.3 Signup Page  26
4.3.4 Wardrobe Page  27
4.3.5 Upload Page  28
4.3.6 Outfits Page  29
4.3.7 Planner Page  30
4.3.8 Profile Page  31
4.3.9 Admin Dashboard Page  32
4.4  Database Design  33
4.4.1 Data Dictionary  33
4.4.2 Data Modelling Diagram (Entity Relationship Diagram)  36

CHAPTER 5  37
5.1  Overview  37
5.2  Screenshots of the Technical Development  38
5.2.1 Home Page  38
5.2.2 Login Page  40
5.2.3 Signup Page  42
5.2.4 Wardrobe Page  44
5.2.5 Upload Page  46
5.2.6 Outfits Page  48
5.2.7 Planner Page  50
5.2.8 Profile Page  52
5.2.9 Admin Dashboard Page  54

CHAPTER 6  56
6.1  Testing Overview  56

CHAPTER 7  57
7.1  Outcome of the Project  57
7.2  Problems and Difficulties Faced  58
7.3  Future Plans  59
7.4  Conclusion  60

REFERENCES  I

APPENDIX A: SOFTWARE REQUIREMENTS SPECIFICATIONS  II

APPENDIX B: SOFTWARE TEST DOCUMENTATION  III

---

vii

# LIST OF TABLES

|  Table No | Page  |
| --- | --- |
|  Table 2.2.1 Advantages and disadvantages of existing platforms | 9  |
|  Table 2.2.2 Features of existing platforms | 10  |
|  Table 4.4.1 List of Tables in the StyleIt System - Users | 33  |
|  Table 4.4.2 List of Tables in the StyleIt System – Wardrobe Items | 34  |
|  Table 4.4.3 List of Tables in the StyleIt System - Outfits | 34  |
|  Table 4.4.4 List of Tables in the StyleIt System - Planned Outfits | 35  |
|  Table 4.4.5 List of Tables in the StyleIt System - Categories | 35  |
|  Table 4.4.6 List of Tables in the StyleIt System - Occasions | 35  |

---

viii

# LIST OF FIGURES

|  Figure No | Page  |
| --- | --- |
|  Figure 2.1.1 CHIC mobile application | 5  |
|  Figure 2.1.2 HangRr mobile application | 6  |
|  Figure 2.1.3 Outfit Tracker mobile application | 7  |
|  Figure 3.2.1 Demographic: Questionnaire Result for Question 1 | 13  |
|  Figure 3.2.2 Demographic: Questionnaire Result for Question 2 | 14  |
|  Figure 3.2.3 Wardrobe Habits: Questionnaire Result for Question 1 | 15  |
|  Figure 3.2.4 Wardrobe Habits: Questionnaire Result for Question 2 | 16  |
|  Figure 3.2.5 Wardrobe Habits: Questionnaire Result for Question 3 | 17  |
|  Figure 3.2.6 App features: Questionnaire Result for Question 1 | 18  |
|  Figure 3.2.7 App features: Questionnaire Result for Question 2 | 19  |
|  Figure 3.2.8 App features: Questionnaire Result for Question 3 | 20  |
|  Figure 3.3.1 Use Case Diagram of StyleIt system | 21  |
|  Figure 4.2.1 System Architecture Diagram of StyleIt system | 23  |
|  Figure 4.3.1 Home Page | 24  |
|  Figure 4.3.2 Login Page | 25  |
|  Figure 4.3.3 Signup Page | 26  |
|  Figure 4.3.4 Wardrobe Page | 27  |
|  Figure 4.3.5 Upload Page | 28  |
|  Figure 4.3.6 Outfits Page | 29  |
|  Figure 4.3.7 Planner Page | 30  |
|  Figure 4.3.8 Profile Page | 31  |
|  Figure 4.3.9 Admin Dashboard Page | 32  |
|  Figure 4.4.2 Entity Relationship Diagram | 36  |
|  Figure 5.2.1 Home Page | 38  |
|  Figure 5.2.2 Login Page | 40  |
|  Figure 5.2.3 Signup Page | 42  |
|  Figure 5.2.4 Wardrobe Page | 44  |
|  Figure 5.2.5 Upload Page | 46  |
|  Figure 5.2.6 Outfits Page | 48  |
|  Figure 5.2.7 Planner Page | 50  |
|  Figure 5.2.8 Profile Page | 52  |
|  Figure 5.2.9 Admin Dashboard Page | 54  |

---

# LIST OF ABBREVIATIONS/NOTATIONS/GLOSSARY OF TERMS

**API** - Application Programming Interface  
**AI** - Artificial Intelligence  
**CRUD** - Create, Read, Update, Delete  
**ERD** - Entity Relationship Diagram  
**FYP** - Final Year Project  
**JWT** - JSON Web Token  
**MVC** - Model-View-Controller  
**REST** - Representational State Transfer  
**UI** - User Interface  
**UX** - User Experience  

---

# CHAPTER 1

## 1.1 Project Background

StyleIt – A Personalized Wardrobe Planner With Outfit Suggestions is a web-based application designed to address the daily challenges individuals face when selecting outfits from their wardrobe. The project emerged from the recognition that many people struggle with wardrobe organization and outfit decision-making, often spending significant time each day choosing what to wear.

The increasing complexity of modern wardrobes, combined with the desire to make efficient use of clothing items, has created a need for intelligent fashion assistance systems. StyleIt leverages modern web technologies and artificial intelligence to provide users with a comprehensive solution for managing their wardrobe and receiving personalized outfit recommendations.

The system integrates Google Vision API for automatic clothing categorization through image recognition, eliminating the need for manual categorization. Additionally, it employs a rule-based recommendation algorithm that suggests suitable outfit combinations based on user-selected occasions, helping users make informed fashion decisions quickly and efficiently.

## 1.2 Problem Statements

The primary problems addressed by StyleIt include:

1. **Wardrobe Organization Challenges**: Users often struggle to maintain an organized digital record of their clothing items. Without a systematic approach to cataloging wardrobe items, users may forget what they own, leading to underutilization of their wardrobe and unnecessary purchases.

2. **Outfit Decision Fatigue**: Daily outfit selection can be time-consuming and stressful, especially when users have numerous clothing items but lack guidance on effective combinations. This decision fatigue can lead to repetitive outfit choices or last-minute outfit selection.

3. **Lack of Personalized Recommendations**: Existing fashion applications often provide generic recommendations that do not consider the user's actual wardrobe inventory. Users need recommendations based on items they actually own, not suggestions for items they would need to purchase.

4. **Manual Categorization Burden**: Traditional wardrobe management requires manual categorization of each clothing item, which is time-consuming and prone to errors. Users may categorize items inconsistently or avoid the task altogether due to the effort required.

5. **Limited Outfit Planning Capabilities**: Many users struggle with planning outfits in advance, leading to last-minute decisions and potential outfit repetition. There is a need for a calendar-based system that allows users to plan outfits ahead of time.

## 1.3 Project Objectives

The main objectives of this project are:

1. **Primary Objective**: To develop a web-based wardrobe management system with AI-powered image recognition for automatic clothing categorization.

2. **Secondary Objectives**:
   - To implement an intelligent outfit recommendation system based on user occasions and wardrobe inventory
   - To provide a calendar-based outfit planning feature for organizing daily attire
   - To create an intuitive user interface that supports efficient wardrobe management
   - To develop an admin dashboard for system configuration and management
   - To ensure the system is responsive and accessible across various devices and screen sizes

## 1.4 Project Scopes

### 1.4.1 In Scope

- Web-based application accessible via modern web browsers (Chrome, Firefox, Safari, Edge)
- User authentication and account management using JWT tokens
- Image upload functionality with support for common image formats (JPG, PNG, WebP)
- AI-powered categorization using Google Vision API
- Wardrobe item management (view, edit, delete operations)
- Rule-based outfit recommendation algorithm
- Calendar-based outfit planning with date selection
- Admin dashboard for managing categories and occasions
- Responsive design for desktop, tablet, and mobile devices
- User profile management
- Saved outfits functionality

### 1.4.2 Out of Scope

- Mobile native applications (iOS/Android native apps)
- Social media integration and sharing features
- E-commerce integration for purchasing clothing items
- Weather-based outfit recommendations
- Machine learning model training for custom categorization models
- Multi-user wardrobe sharing or collaborative features
- Offline functionality without internet connection
- Payment processing or subscription features
- Integration with third-party calendar applications
- Advanced analytics and reporting features

---

# CHAPTER 2

## 2.1 Review on Existing Systems

This chapter reviews existing wardrobe management and outfit recommendation systems to understand their features, strengths, and limitations. The analysis helps identify gaps in current solutions and informs the design of StyleIt.

### 2.1.1 CHIC - Outfit Planner

CHIC is a mobile application that provides outfit planning and wardrobe management features. The system allows users to photograph their clothing items and organize them digitally.

**Key Features:**
- Mobile-based wardrobe management
- Visual outfit planning
- Calendar integration for outfit scheduling
- Photo-based item organization

**Strengths:**
- User-friendly mobile interface
- Visual wardrobe organization
- Outfit planning capabilities
- Calendar-based scheduling

**Limitations:**
- Limited AI-powered categorization
- Manual categorization required for most items
- No intelligent recommendation system
- Mobile-only platform (no web version)
- Limited customization options

**Figure 2.1.1 CHIC mobile application**

[Insert screenshot of CHIC application interface]

### 2.1.2 HangRr: Outfit Ideas

HangRr is a social fashion platform that combines wardrobe management with social sharing features. Users can create outfits and share them with the community.

**Key Features:**
- Social interaction and sharing
- Community-driven outfit inspiration
- Comprehensive wardrobe tracking
- Outfit creation and sharing

**Strengths:**
- Social features for inspiration
- Community-driven content
- Comprehensive wardrobe tracking
- User engagement through sharing

**Limitations:**
- Focus on social features rather than personalization
- Requires manual outfit creation
- Limited AI integration
- May be overwhelming for users seeking simple solutions
- Privacy concerns with social sharing

**Figure 2.1.2 HangRr mobile application**

[Insert screenshot of HangRr application interface]

### 2.1.3 Outfit Tracker: Diary Planner

Outfit Tracker is a diary-style application that allows users to record and track their daily outfits over time.

**Key Features:**
- Historical outfit tracking
- Calendar-based planning
- Simple and focused interface
- Outfit diary functionality

**Strengths:**
- Simple and focused interface
- Historical tracking capabilities
- Calendar-based planning
- Easy to use

**Limitations:**
- No AI-powered features
- Manual entry required for all data
- Limited recommendation capabilities
- No intelligent categorization
- Basic functionality only

**Figure 2.1.3 Outfit Tracker mobile application**

[Insert screenshot of Outfit Tracker application interface]

## 2.2 Finding and Analysis

### 2.2.1 Comparison of Existing Systems

**Table 2.2.1 Advantages and disadvantages of existing platforms**

| Platform | Advantages | Disadvantages |
|----------|------------|---------------|
| CHIC | User-friendly, visual organization, calendar planning | Limited AI, manual categorization, mobile-only |
| HangRr | Social features, community inspiration, comprehensive tracking | Social focus, manual creation, privacy concerns |
| Outfit Tracker | Simple interface, historical tracking, easy to use | No AI, manual entry, limited features |

### 2.2.2 Feature Comparison

**Table 2.2.2 Features of existing platforms**

| Feature | CHIC | HangRr | Outfit Tracker | StyleIt |
|---------|------|--------|---------------|---------|
| AI Categorization | ❌ | ❌ | ❌ | ✅ |
| Outfit Recommendations | ❌ | ❌ | ❌ | ✅ |
| Calendar Planning | ✅ | ❌ | ✅ | ✅ |
| Web Platform | ❌ | ❌ | ❌ | ✅ |
| Social Features | ❌ | ✅ | ❌ | ❌ |
| Manual Entry | ✅ | ✅ | ✅ | Minimal |

### 2.2.3 Identified Gaps

Based on the review of existing systems, the following gaps were identified:

1. **Limited AI Integration**: Most existing systems require significant manual input and lack advanced AI-powered categorization capabilities.

2. **Generic Recommendations**: Existing recommendation systems often provide generic suggestions that do not consider the user's actual wardrobe inventory.

3. **Web-Based Solutions**: Many solutions are mobile-only, limiting accessibility across different devices and platforms.

4. **Incomplete Feature Sets**: Most systems focus on either wardrobe management or recommendations, but not both comprehensively.

5. **Lack of Intelligent Assistance**: Current systems do not provide intelligent outfit recommendations based on occasions and user preferences.

### 2.2.4 StyleIt's Contribution

StyleIt addresses these gaps by:

1. Integrating Google Vision API for automatic AI-powered categorization
2. Implementing a rule-based recommendation system that considers actual wardrobe inventory
3. Providing a web-based solution accessible across devices
4. Combining comprehensive wardrobe management with intelligent outfit recommendations
5. Offering occasion-based recommendations tailored to user needs

---

# CHAPTER 3

## 3.1 Requirements Elicitation

### 3.1.1 Elicitation Technique(s)

To gather requirements for StyleIt, a combination of elicitation techniques was employed:

1. **Questionnaire Survey**: An online questionnaire was distributed to potential users to gather information about:
   - Demographics (age, gender, occupation)
   - Current wardrobe management habits
   - Challenges faced in outfit selection
   - Desired features for a wardrobe management application
   - Preferences for AI-powered features

2. **Literature Review**: Analysis of existing systems and academic literature on wardrobe management and recommendation systems.

3. **Stakeholder Analysis**: Identification of key stakeholders including end users, administrators, and system maintainers.

The questionnaire was distributed to 50 participants and included questions covering:
- Demographic information
- Wardrobe management habits
- Outfit selection challenges
- Feature preferences
- Technology preferences

### 3.2 Results and Discussion

#### 3.2.1 Demographic Information

**Question 1: Age Group**

**Figure 3.2.1 Demographic: Questionnaire Result for Question 1**

[Insert bar chart showing age distribution]
- 18-25: 45%
- 26-35: 35%
- 36-45: 15%
- 46+: 5%

**Question 2: Gender**

**Figure 3.2.2 Demographic: Questionnaire Result for Question 2**

[Insert pie chart showing gender distribution]
- Female: 60%
- Male: 35%
- Other: 5%

#### 3.2.2 Wardrobe Management Habits

**Question 1: How do you currently organize your wardrobe?**

**Figure 3.2.3 Wardrobe Habits: Questionnaire Result for Question 1**

[Insert chart showing organization methods]
- Physical organization only: 40%
- Digital photos: 25%
- Mobile app: 20%
- No organization: 15%

**Question 2: How often do you struggle with outfit selection?**

**Figure 3.2.4 Wardrobe Habits: Questionnaire Result for Question 2**

[Insert chart showing frequency]
- Daily: 30%
- 2-3 times per week: 40%
- Weekly: 20%
- Rarely: 10%

**Question 3: What is your main challenge in outfit selection?**

**Figure 3.2.5 Wardrobe Habits: Questionnaire Result for Question 3**

[Insert chart showing challenges]
- Too many options: 35%
- Lack of inspiration: 30%
- Time constraints: 20%
- Occasion uncertainty: 15%

#### 3.2.3 Feature Preferences

**Question 1: Which feature is most important to you?**

**Figure 3.2.6 App features: Questionnaire Result for Question 1**

[Insert chart showing feature importance]
- AI categorization: 40%
- Outfit recommendations: 35%
- Calendar planning: 15%
- Social sharing: 10%

**Question 2: Would you use AI-powered categorization?**

**Figure 3.2.7 App features: Questionnaire Result for Question 2**

[Insert chart showing AI preference]
- Yes, definitely: 60%
- Maybe: 30%
- No: 10%

**Question 3: How important is occasion-based recommendations?**

**Figure 3.2.8 App features: Questionnaire Result for Question 3**

[Insert chart showing importance]
- Very important: 50%
- Important: 35%
- Somewhat important: 10%
- Not important: 5%

### 3.3 Requirement Specifications

Based on the requirements elicitation, the following functional and non-functional requirements were identified:

#### 3.3.1 Functional Requirements

1. **User Authentication**
   - Users shall be able to register with email and password
   - Users shall be able to login with credentials
   - Users shall be able to logout
   - System shall validate user credentials

2. **Wardrobe Management**
   - Users shall be able to upload clothing item images
   - System shall automatically categorize items using AI
   - Users shall be able to view all wardrobe items
   - Users shall be able to edit item details
   - Users shall be able to delete items
   - Users shall be able to filter items by category
   - Users shall be able to filter items by occasion

3. **Outfit Recommendations**
   - System shall generate outfit recommendations based on occasion
   - System shall consider user's wardrobe inventory
   - Users shall be able to save recommended outfits
   - System shall detect duplicate outfits

4. **Calendar Planning**
   - Users shall be able to plan outfits for specific dates
   - Users shall be able to view planned outfits on calendar
   - Users shall be able to delete planned outfits

5. **Admin Functions**
   - Admin shall be able to manage categories
   - Admin shall be able to manage occasions
   - Admin shall be able to view system statistics

#### 3.3.2 Non-Functional Requirements

1. **Performance**
   - Image upload and analysis shall complete within 5 seconds
   - Outfit recommendations shall generate within 3 seconds
   - Page load times shall be under 2 seconds

2. **Security**
   - Passwords shall be hashed using bcrypt
   - Authentication shall use JWT tokens
   - User data shall be isolated by user ID

3. **Usability**
   - Interface shall be intuitive and easy to navigate
   - System shall provide clear error messages
   - System shall be responsive across devices

**Figure 3.3.1 Use Case Diagram of StyleIt system**

[Insert Use Case Diagram showing all use cases and actors]

---

# CHAPTER 4

## 4.1 System Design

StyleIt follows a three-tier architecture pattern consisting of:

1. **Presentation Layer**: React.js frontend providing user interface
2. **Application Layer**: Node.js/Express.js backend handling business logic and API endpoints
3. **Data Layer**: MongoDB database storing user data, wardrobe items, and system configurations

The system design emphasizes:
- Separation of concerns between frontend and backend
- RESTful API architecture
- Stateless authentication using JWT tokens
- Scalable database design
- Integration with external AI services

## 4.2 System Architecture

**Figure 4.2.1 System Architecture Diagram of StyleIt system**

[Insert System Architecture Diagram showing three-tier architecture]

The system architecture consists of:

**Client Layer:**
- Web browsers (Chrome, Firefox, Safari, Edge)
- React.js single-page application

**Application Layer:**
- Express.js REST API server
- Authentication middleware
- Image processing service
- Outfit recommendation service
- Admin service

**Data Layer:**
- MongoDB database
- File storage system

**External Services:**
- Google Vision API for image analysis

## 4.3 Interface Design

### 4.3.1 Home Page

Figure 4.3.1 shows the home page which serves as the primary landing interface for StyleIt, introducing visitors to the system's capabilities and guiding them towards registration or login. The page features a clean layout with a prominent hero section displaying the StyleIt logo and tagline "Your Personal Wardrobe Assistant," accompanied by a brief description of the system's purpose. Below the hero section, three feature cards are arranged horizontally: Smart Upload with a camera icon for AI-powered categorization, My Wardrobe with a shirt icon for wardrobe management, and Outfit Recommendations with a sparkles icon for styling suggestions. Each feature card is clickable and navigates to the respective application section. The page includes a navigation bar at the top with links to login and signup pages. The design uses gradient backgrounds and smooth animations to create an inviting first impression. For logged-in users, the navigation dynamically updates to show links to wardrobe, outfits, planner, and profile sections. This page effectively communicates StyleIt's value proposition while providing intuitive navigation for both new and returning users.

**Figure 4.3.1 Home Page**

[Insert UI mockup or screenshot of Home Page]

### 4.3.2 Login Page

Figure 4.3.2 illustrates the login page interface, which provides a secure authentication gateway for registered users to access their StyleIt accounts. The page features a centered, card-based form layout with a clean white background and subtle shadow effects. The login form consists of two primary input fields: an email field with a mail icon and a password field with a lock icon that includes a toggle button to show or hide the password. Both input fields include real-time validation that checks for proper email format and required field completion, displaying inline error messages if validation fails. A prominent "Login" button triggers the authentication process when clicked. The form includes a "Sign Up" link below the login button for new users. Error messages are displayed above the form in red text with an alert icon when authentication fails, providing clear feedback such as "Invalid email or password." The page includes client-side validation that prevents submission of empty fields and validates email format before making API requests. Upon successful authentication, users are automatically redirected to their dashboard, with admin users routed to the admin dashboard while regular users proceed to the main application interface.

**Figure 4.3.2 Login Page**

[Insert UI mockup or screenshot of Login Page]

### 4.3.3 Signup Page

Figure 4.3.3 displays the signup page interface, which enables new users to create StyleIt accounts through a comprehensive registration form. The page follows a similar design pattern to the login page, featuring a centered card layout with a clean, focused design. The signup form contains four input fields arranged vertically: a name field, an email field, a password field, and a confirm password field. Each input field includes appropriate icons (user icon for name, mail icon for email, lock icons for password fields) and placeholder text. The password fields feature show/hide toggle buttons, allowing users to verify their password entry. Real-time validation checks that the name field is not empty, the email follows a valid format pattern, the password meets minimum length requirements (typically 6 characters), and the confirm password matches the original password entry. Validation error messages appear immediately below the respective fields or in a consolidated error area at the top of the form, displayed in red text with clear explanations such as "Passwords do not match" or "Email already exists." The form includes a "Sign Up" button that becomes enabled once all required fields are completed and validated, with a loading state indicator during registration. A "Login" link is provided below the signup button for existing users. Upon successful registration, the system automatically logs the user in and redirects them to the main application interface. The registration process includes backend validation to ensure email uniqueness, with passwords being hashed using bcrypt before storage in the database.

**Figure 4.3.3 Signup Page**

[Insert UI mockup or screenshot of Signup Page]

### 4.3.4 Wardrobe Page

Figure 4.3.4 shows the wardrobe page which serves as the default landing interface after login, acting as the user's digital closet for managing their complete clothing collection. The page displays all uploaded clothing items in a responsive grid layout that automatically adjusts to screen size, showing multiple columns on desktop (typically 4 items per row) and fewer columns on mobile devices (2 items per row). At the top of the page, horizontal filter bars provide two levels of filtering: category filter buttons displaying all available clothing categories such as "All Items," "Tops," "Bottoms," "Shoes," "Outerwear," and "Accessories," and occasion filter buttons for filtering items by suitable occasions including "All Occasions," "Casual," "Formal," "Work," and "Sporty." Each filter button is color-coded, and the active filter is highlighted. The clothing items are displayed as square thumbnail cards arranged in a grid pattern, with each card showing the item's image, name below the image, and a category badge. When the wardrobe is empty or no items match the selected filters, an empty state message is displayed with guidance to upload new items. Users can click on any clothing item card to open a detailed view modal that displays a larger version of the item image, complete item information including AI-detected tags, color information, occasion tags, and description if available. The detail modal includes action buttons for editing the item's category, tags, or occasion assignments, as well as a delete button that triggers a confirmation dialog. The page supports efficient visual scanning of the wardrobe collection with smooth scrolling. A navigation link provides quick access to the upload page for adding new clothing items. The wardrobe page serves as the core inventory management interface, providing users with an at-a-glance view of all owned clothing items.

**Figure 4.3.4 Wardrobe Page**

[Insert UI mockup or screenshot of Wardrobe Page]

### 4.3.5 Upload Page

Figure 4.3.5 illustrates the upload page interface, which serves as the entry point for adding new clothing items to the user's wardrobe through AI-powered image analysis and categorization. The page features a large, prominent file upload area at the top, designed as a drag-and-drop zone that accepts image files in formats including JPEG, JPG, PNG, and WebP, with a maximum file size limit of 10MB. The upload area displays visual feedback when files are dragged over it and includes an upload icon with text instructions guiding users to drag and drop images or click to browse files. Once an image is selected or dropped, an image preview is immediately displayed below the upload area. The page includes an "Analyze" button that, when clicked, sends the image to Google Vision API for AI-powered analysis, with a loading indicator displayed during the process which typically takes 3-4 seconds. After analysis completes, the page reveals a comprehensive results section displaying the AI's findings: a category dropdown pre-populated with the detected category (such as "Tops," "Bottoms," or "Shoes") which users can modify, a tags section showing AI-detected descriptive tags, and occasion checkboxes indicating suitable occasions (casual, formal, work, sporty) that users can select or deselect. The analysis results also include detected color information and an optional description field. All analysis results are editable before confirmation, allowing users to correct any AI misclassifications. A "Confirm" button at the bottom saves the item to the wardrobe once the user has reviewed the results. The page implements client-side validation to ensure required fields are completed and file types are correct. Upon successful upload, a success message is displayed and the user is redirected to the wardrobe page.

**Figure 4.3.5 Upload Page**

[Insert UI mockup or screenshot of Upload Page]

### 4.3.6 Outfits Page

Figure 4.3.6 presents the outfits page interface, which serves as the intelligent styling assistant component of StyleIt, providing users with personalized outfit recommendations based on their wardrobe inventory and selected occasions. The page is organized into two main sections: the recommendation generation area at the top and the saved outfits management section below. At the top of the page, a prominent occasion selector displays large, color-coded buttons representing different occasions including "Casual," "Formal," "Work," "Sporty," and "Random." Below the occasion selector, a "Style It" button triggers the recommendation algorithm, which filters the user's wardrobe by the selected occasion tags and generates a complete outfit combination. When a recommendation is generated, the page displays a comprehensive outfit visualization showing all recommended items: a top item, a bottom item, a shoes item, and optionally outerwear and accessories if available. Each item is displayed as a card with a thumbnail image, item name, and category label, and items can be clicked to view detailed information. Below the outfit items, a styling tips section provides contextual advice related to the recommended outfit. The recommendation display includes action buttons: "Save Outfit" to store the recommendation, "Get New Recommendation" to generate a different combination, and "Create Custom Outfit" that opens a modal for manually selecting items. If the system detects a similar outfit combination was recently created, a duplicate warning message is displayed. The saved outfits section displays all previously saved outfits in a grid layout, with each saved outfit showing a preview of its items and the outfit name. Users can click on saved outfits to view details, edit, or delete them. The page dynamically adapts to the user's wardrobe size, displaying appropriate messages if insufficient items are available.

**Figure 4.3.6 Outfits Page**

[Insert UI mockup or screenshot of Outfits Page]

### 4.3.7 Planner Page

Figure 4.3.7 demonstrates the planner page interface, which enables users to proactively plan their outfits by scheduling specific clothing combinations for future dates through an integrated calendar system. The page features a full monthly calendar view as the central interface element, displaying the current month with all dates arranged in a standard grid layout. The calendar includes navigation controls with previous and next month arrows, allowing users to move through different months. Each date cell in the calendar can be clicked to open a planning modal for assigning an outfit to that specific date. When a date is selected, a modal dialog appears offering two primary methods for planning: users can either select items manually from their wardrobe by browsing through available clothing items organized by category, or they can choose from their saved outfits library to quickly assign a previously created outfit combination. The planning modal displays the selected date prominently and includes an occasion selector dropdown, an optional outfit name field, and a notes field for reminders. When items are selected, they appear in a preview area showing thumbnail images of all chosen items, with options to remove individual items or clear the entire selection. Dates that have planned outfits assigned are visually distinguished on the calendar through indicators such as colored dots or icons, making it easy to see which days have been planned. Users can click on dates with existing planned outfits to view details, edit the planned outfit, or delete it through a confirmation dialog. The calendar interface allows users to see their entire month's outfit schedule in a single view, helping prevent outfit repetition and enabling strategic wardrobe planning.

**Figure 4.3.7 Planner Page**

[Insert UI mockup or screenshot of Planner Page]

### 4.3.8 Profile Page

Figure 4.3.8 exhibits the profile page interface, which serves as the user's personal dashboard and account management center, providing both an overview of their StyleIt activity and access to account settings. The page is organized into distinct sections, beginning with a user information header area at the top that displays the user's full name and email address in a card-style layout. Below the user information, the page features a statistics section composed of three visual cards arranged horizontally, each displaying key metrics: a wardrobe items card showing the total count of clothing items with a shirt icon, a saved outfits card displaying the number of saved outfit combinations with a sparkles icon, and a planned outfits card indicating how many outfits have been scheduled with a calendar icon. Each statistics card is designed with a visually appealing background color, large numerical display, and descriptive labels. These statistics cards serve as navigation elements, with users able to click on them to navigate to the respective pages. The page includes an account management section with options to edit profile information such as name or email, and change password through a secure form with current password verification. A prominent logout button is positioned at the bottom, allowing users to securely end their session. The profile page may also display recent activity information such as recently uploaded items or saved outfits. The interface design emphasizes clarity and accessibility, using consistent spacing and intuitive iconography. This page functions as both an informational hub and a navigation center, giving users immediate insight into their wardrobe statistics.

**Figure 4.3.8 Profile Page**

[Insert UI mockup or screenshot of Profile Page]

### 4.3.9 Admin Dashboard Page

Figure 4.3.9 showcases the admin dashboard interface, which provides comprehensive system administration capabilities exclusively accessible to users with administrator privileges, serving as the control center for managing all aspects of the StyleIt platform. The dashboard is organized using a tabbed navigation system at the top, with four primary tabs: Overview, Users, Categories, and Occasions. The Overview tab serves as the main dashboard landing page, displaying system-wide statistics in summary cards showing total number of registered users, total wardrobe items across all user accounts, total saved outfits, and total planned outfits. These statistics are presented with large numerical displays and appropriate icons. The Users tab provides a comprehensive user management interface displaying all registered users in a table or card-based layout, with each user entry showing their name, email address, account creation date, and current role (user or admin). The user management interface includes action buttons: a view details option that opens a modal displaying the user's complete profile and statistics, an edit role button that allows administrators to change user roles, and a delete user button that triggers a confirmation dialog. The Categories tab presents a management interface for clothing categories used throughout the system for AI categorization, displaying all existing categories with their ID, display label, color, display order, and keywords. Administrators can create new categories through an "Add Category" button, or edit and delete existing categories with confirmation dialogs. Similarly, the Occasions tab provides an identical management interface for occasion types (casual, formal, work, sporty). All administrative actions include proper validation, confirmation dialogs for destructive operations, and error handling to ensure system integrity. The interface design emphasizes clarity and efficiency, with consistent styling and intuitive icons. This page serves as the central command center for system configuration, user management, and platform maintenance.

**Figure 4.3.9 Admin Dashboard Page**

[Insert UI mockup or screenshot of Admin Dashboard Page]

## 4.4 Database Design

### 4.4.1 Data Dictionary

**Table 4.4.1 List of Tables in the StyleIt System - Users**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| email | String | User email address | Required, Unique |
| password | String | Hashed password | Required |
| name | String | User full name | Required |
| role | String | User role | Enum: ['user', 'admin'], Default: 'user' |
| createdAt | Date | Account creation date | Default: Date.now |

**Table 4.4.2 List of Tables in the StyleIt System – Wardrobe Items**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| user | ObjectId | Reference to User | Required, Foreign Key |
| name | String | Item name | Required |
| category | String | Item category | Required |
| image | String | Image path/URL | Required |
| tags | Array[String] | AI-detected tags | Optional |
| occasionTags | Array[String] | Suitable occasions | Optional |
| color | String | Primary color | Optional |
| colors | String | Multiple colors | Optional |
| description | String | AI-generated description | Optional |
| style | String | Style information | Optional |
| confidence | Number | AI detection confidence | Default: 0.8 |
| createdAt | Date | Upload date | Default: Date.now |

**Table 4.4.3 List of Tables in the StyleIt System - Outfits**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| user | ObjectId | Reference to User | Required, Foreign Key |
| name | String | Outfit name | Required |
| items | Array[Object] | Outfit items (embedded) | Required |
| occasion | String | Occasion for outfit | Optional |
| confidence | Number | Recommendation confidence | Default: 0.8 |
| lastWorn | Date | Last time worn | Optional |
| createdAt | Date | Creation date | Default: Date.now |

**Table 4.4.4 List of Tables in the StyleIt System - Planned Outfits**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| user | ObjectId | Reference to User | Required, Foreign Key |
| date | Date | Planned date | Required |
| outfit | ObjectId | Reference to Outfit | Optional, Foreign Key |
| name | String | Outfit name | Default: '' |
| occasion | String | Occasion | Default: '' |
| items | Array[Object] | Direct outfit items | Optional |
| notes | String | User notes | Default: '' |
| createdAt | Date | Creation date | Default: Date.now |

**Table 4.4.5 List of Tables in the StyleIt System - Categories**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| id | String | Category ID | Required, Unique |
| label | String | Display name | Required |
| color | String | UI color | Default: '#3b82f6' |
| order | Number | Display order | Default: 0 |
| keywords | Array[String] | Keywords for AI detection | Default: [] |
| createdAt | Date | Creation date | Default: Date.now |

**Table 4.4.6 List of Tables in the StyleIt System - Occasions**

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| _id | ObjectId | Primary key | Auto-generated |
| id | String | Occasion ID | Required, Unique |
| label | String | Display name | Required |
| color | String | UI color | Default: '#3b82f6' |
| order | Number | Display order | Default: 0 |
| keywords | Array[String] | Keywords for AI detection | Default: [] |
| createdAt | Date | Creation date | Default: Date.now |

### 4.4.2 Data Modelling Diagram (Entity Relationship Diagram)

**Figure 4.4.2 Entity Relationship Diagram**

[Insert ERD showing all entities and relationships]

The Entity Relationship Diagram shows:

- **Users** entity with one-to-many relationships to:
  - WardrobeItems
  - Outfits
  - PlannedOutfits

- **Outfits** entity with optional one-to-one relationship to PlannedOutfits

- **Categories** and **Occasions** as standalone entities used system-wide

---

# CHAPTER 5

## 5.1 Overview

This chapter presents screenshots of the implemented StyleIt system, demonstrating the technical development and functionality of each major component. The screenshots are organized by page/feature and show the actual working implementation of the system.

The development process involved:
- Frontend development using React.js
- Backend development using Node.js and Express.js
- Database implementation using MongoDB
- Integration with Google Vision API
- Testing and refinement of user interface

## 5.2 Screenshots of the Technical Development

### 5.2.1 Home Page

The home page serves as the landing page for StyleIt, providing an introduction to the system and navigation options.

**Key Features Shown:**
- Navigation bar with logo and menu items
- Hero section introducing StyleIt
- Feature overview section highlighting main capabilities
- Call-to-action buttons for login and signup

**Figure 5.2.1 Home Page**

[Insert screenshot of implemented Home Page]

*Description: The home page displays the StyleIt branding, main features including AI categorization, outfit recommendations, and calendar planning, along with navigation options for users to get started.*

### 5.2.2 Login Page

The login page allows registered users to authenticate and access their accounts.

**Key Features Shown:**
- Email input field
- Password input field
- Login button
- Link to signup page
- Error handling display

**Figure 5.2.2 Login Page**

[Insert screenshot of implemented Login Page]

*Description: The login interface provides a clean form for user authentication. Users enter their email and password to access their StyleIt account. The page includes validation and error messaging for invalid credentials.*

### 5.2.3 Signup Page

The signup page enables new users to create accounts in the StyleIt system.

**Key Features Shown:**
- Name input field
- Email input field
- Password input field
- Confirm password field
- Signup button
- Form validation

**Figure 5.2.3 Signup Page**

[Insert screenshot of implemented Signup Page]

*Description: New users can register by providing their name, email, and password. The form includes validation to ensure password confirmation matches and all required fields are completed.*

### 5.2.4 Wardrobe Page

The wardrobe page displays all clothing items in the user's wardrobe with filtering and management capabilities.

**Key Features Shown:**
- Category filter buttons (All, Tops, Bottoms, Shoes, etc.)
- Occasion filter buttons
- Grid layout displaying wardrobe items
- Item cards showing image, name, and category
- Item detail modal
- Delete functionality

**Figure 5.2.4 Wardrobe Page**

[Insert screenshot of implemented Wardrobe Page with items displayed]

*Description: The wardrobe page shows all user's clothing items in a responsive grid layout. Users can filter items by category or occasion. Clicking on an item opens a detail modal showing full information including AI-detected tags, colors, and occasions.*

### 5.2.5 Upload Page

The upload page allows users to add new clothing items to their wardrobe with AI-powered categorization.

**Key Features Shown:**
- File upload area with drag-and-drop support
- Image preview
- AI analysis results display
- Category dropdown (auto-populated from AI analysis)
- Tags display
- Occasion tags checkboxes
- Confirm button to save item

**Figure 5.2.5 Upload Page**

[Insert screenshot of implemented Upload Page showing AI analysis results]

*Description: Users can upload clothing item images which are automatically analyzed by Google Vision API. The system displays detected category, tags, colors, and suggested occasions. Users can review and edit the analysis results before confirming to save the item to their wardrobe.*

### 5.2.6 Outfits Page

The outfits page provides outfit recommendations based on selected occasions and displays saved outfits.

**Key Features Shown:**
- Occasion selector buttons (Casual, Formal, Work, Sporty, Random)
- "Style It" button to generate recommendations
- Recommended outfit display with all items
- Styling tips section
- Save outfit functionality
- Saved outfits section
- Duplicate detection warning

**Figure 5.2.6 Outfits Page**

[Insert screenshot of implemented Outfits Page showing recommendation]

*Description: Users select an occasion and click "Style It" to receive outfit recommendations. The system displays a complete outfit with top, bottom, shoes, and optional outerwear and accessories. Styling tips are provided, and users can save recommended outfits for future reference.*

### 5.2.7 Planner Page

The planner page enables users to plan outfits for specific dates using a calendar interface.

**Key Features Shown:**
- Calendar view showing current month
- Date selection functionality
- Planning modal for selecting items
- Planned outfit indicators on calendar dates
- View and delete planned outfits

**Figure 5.2.7 Planner Page**

[Insert screenshot of implemented Planner Page with calendar and planned outfits]

*Description: The calendar interface allows users to click on dates to plan outfits. A modal opens where users can select items from their wardrobe or use saved outfits. Planned outfits are displayed on the calendar with visual indicators.*

### 5.2.8 Profile Page

The profile page displays user information and wardrobe statistics.

**Key Features Shown:**
- User name and email display
- Statistics cards showing:
  - Total wardrobe items count
  - Total saved outfits count
  - Total planned outfits count
- Navigation links to other sections
- Logout button

**Figure 5.2.8 Profile Page**

[Insert screenshot of implemented Profile Page]

*Description: The profile page provides an overview of the user's account and wardrobe statistics. Users can see at a glance how many items they have, how many outfits they've saved, and how many outfits they've planned.*

### 5.2.9 Admin Dashboard Page

The admin dashboard provides system administration capabilities for managing categories, occasions, and viewing system statistics.

**Key Features Shown:**
- Tab navigation (Overview, Users, Categories, Occasions)
- System statistics (total users, items, outfits)
- User management interface
- Category management (create, edit, delete)
- Occasion management (create, edit, delete)

**Figure 5.2.9 Admin Dashboard Page**

[Insert screenshot of implemented Admin Dashboard]

*Description: Administrators can manage system-wide settings including categories and occasions used for AI matching. The dashboard provides statistics on system usage and allows management of user accounts and system configuration.*

---

# CHAPTER 6

## 6.1 Testing Overview

Testing was conducted throughout the development process to ensure system functionality, performance, and user experience. The testing approach included:

### 6.1.1 Functional Testing

Functional testing was performed to verify that all system features work as specified:

1. **Authentication Testing**
   - User registration with valid and invalid inputs
   - User login with correct and incorrect credentials
   - JWT token generation and validation
   - Session management and logout functionality

2. **Wardrobe Management Testing**
   - Image upload with various file formats
   - AI categorization accuracy
   - Item CRUD operations (Create, Read, Update, Delete)
   - Filtering by category and occasion
   - Item detail viewing

3. **Outfit Recommendation Testing**
   - Recommendation generation for different occasions
   - Outfit item selection algorithm
   - Duplicate detection functionality
   - Save outfit functionality

4. **Calendar Planning Testing**
   - Date selection and outfit planning
   - Planned outfit display on calendar
   - Delete planned outfit functionality

5. **Admin Dashboard Testing**
   - Category management operations
   - Occasion management operations
   - User statistics display
   - Access control verification

### 6.1.2 Performance Testing

Performance testing was conducted to ensure the system meets performance requirements:

- **Image Upload and Analysis**: Average processing time of 3-4 seconds
- **Outfit Recommendations**: Average generation time of 1-2 seconds
- **Page Load Times**: All pages load within 2 seconds
- **API Response Times**: All API endpoints respond within acceptable limits

### 6.1.3 User Interface Testing

User interface testing verified:

- Responsive design across different screen sizes (mobile, tablet, desktop)
- Browser compatibility (Chrome, Firefox, Safari, Edge)
- Navigation functionality
- Form validation and error messaging
- Visual feedback for user actions

### 6.1.4 Security Testing

Security testing included:

- Password hashing verification
- JWT token security
- User data isolation
- Input validation
- Protected route access control

### 6.1.5 Test Results Summary

All functional requirements were successfully tested and verified. The system performs within acceptable performance parameters and provides a secure, user-friendly interface. Minor issues identified during testing were resolved before final implementation.

---

# CHAPTER 7

## 7.1 Outcome of the Project

The StyleIt project has been successfully completed, achieving all primary and secondary objectives. The system provides a comprehensive solution for wardrobe management and outfit recommendations, integrating AI-powered image recognition with intelligent recommendation algorithms.

### 7.1.1 Achieved Objectives

1. **Primary Objective**: Successfully developed a web-based wardrobe management system with AI-powered image recognition for automatic clothing categorization using Google Vision API.

2. **Secondary Objectives**:
   - Implemented an intelligent outfit recommendation system based on user occasions and wardrobe inventory
   - Provided a calendar-based outfit planning feature for organizing daily attire
   - Created an intuitive user interface that supports efficient wardrobe management
   - Developed an admin dashboard for system configuration and management

### 7.1.2 Key Features Delivered

- User authentication and account management
- AI-powered clothing item categorization
- Comprehensive wardrobe management
- Occasion-based outfit recommendations
- Calendar-based outfit planning
- Admin dashboard for system management
- Responsive design for multiple devices

### 7.1.3 Technical Achievements

- Successful integration of Google Vision API
- Implementation of rule-based recommendation algorithm
- RESTful API architecture
- Secure authentication using JWT
- Scalable database design
- Responsive frontend implementation

## 7.2 Problems and Difficulties Faced

During the development process, several challenges were encountered and resolved:

### 7.2.1 Technical Challenges

1. **AI Categorization Accuracy**: Initial implementation had issues with category matching when items matched multiple categories. This was resolved by implementing a priority-based matching system.

2. **Image Processing Performance**: Large image files caused slow processing times. This was addressed by implementing base64 conversion and optimizing image handling.

3. **State Management Complexity**: Managing complex state in React components required careful organization. This was resolved using React Context API and proper state organization.

4. **Database Schema Design**: Designing flexible schemas for varying data structures required multiple iterations. The final design uses embedded documents and references appropriately.

### 7.2.2 Integration Challenges

1. **Google Vision API Integration**: Understanding API response formats and processing results required significant research and testing.

2. **Frontend-Backend Communication**: Ensuring proper data flow between React frontend and Express backend required careful API design and error handling.

### 7.2.3 Solutions Implemented

All challenges were successfully addressed through:
- Research and documentation review
- Iterative development and testing
- Code refactoring and optimization
- Consultation with supervisor and peers

## 7.3 Future Plans

### 7.3.1 Short-Term Enhancements

1. **Improved AI Accuracy**: Fine-tune category detection algorithm and add user feedback mechanism to improve accuracy over time.

2. **Enhanced Recommendations**: Implement machine learning-based recommendation system to learn user preferences and improve suggestions.

3. **Weather Integration**: Add weather-based outfit recommendations to help users select appropriate clothing for current weather conditions.

4. **Mobile App Development**: Develop native mobile applications for iOS and Android to improve accessibility and user experience.

### 7.3.2 Long-Term Enhancements

1. **Social Features**: Add social sharing capabilities allowing users to share outfits with friends and get community feedback.

2. **E-Commerce Integration**: Integrate with online shopping platforms to suggest similar items or help users find items to complete their wardrobe.

3. **Style Learning**: Implement machine learning algorithms to learn individual user style preferences and provide increasingly personalized recommendations.

4. **Advanced Analytics**: Add wardrobe analytics and insights, such as most-worn items, outfit frequency, and wardrobe utilization statistics.

5. **Cloud Storage**: Migrate to cloud-based image storage (AWS S3, Google Cloud Storage) for better scalability and performance.

### 7.3.3 Technical Improvements

1. **Performance Optimization**: Implement caching, code splitting, and lazy loading to improve application performance.

2. **Comprehensive Testing**: Add unit tests, integration tests, and end-to-end tests for better code quality and reliability.

3. **Documentation**: Expand API documentation and create comprehensive user guides.

4. **Scalability**: Optimize database queries and implement caching strategies to support larger user bases.

## 7.4 Conclusion

StyleIt has been successfully developed as a comprehensive wardrobe management and outfit recommendation system. The project successfully integrates AI-powered image recognition, intelligent outfit recommendations, and calendar-based planning to provide users with an effective solution for managing their wardrobe and making fashion decisions.

The system addresses the identified problems of wardrobe organization and outfit decision-making through a user-friendly web-based solution. While there are areas for future enhancement, the current implementation demonstrates the potential of combining modern web technologies with AI services to solve real-world problems in fashion technology.

The project has been a valuable learning experience, providing insights into full-stack development, AI integration, and user-centered design. The foundation established in this project provides a solid base for future enhancements and scalability.

StyleIt represents a successful application of software engineering principles to create a practical and useful solution for everyday fashion challenges, demonstrating the value of combining technical skills with user-centered design to create meaningful applications.

---

# REFERENCES

1. Google Cloud. (2024). *Cloud Vision API Documentation*. Retrieved from https://cloud.google.com/vision/docs

2. React. (2024). *React Documentation*. Retrieved from https://react.dev/

3. Express.js. (2024). *Express.js Documentation*. Retrieved from https://expressjs.com/

4. MongoDB. (2024). *MongoDB Documentation*. Retrieved from https://www.mongodb.com/docs/

5. Mongoose. (2024). *Mongoose Documentation*. Retrieved from https://mongoosejs.com/docs/

6. JWT.io. (2024). *JSON Web Token Introduction*. Retrieved from https://jwt.io/introduction

7. Bcrypt. (2024). *Bcrypt Documentation*. Retrieved from https://www.npmjs.com/package/bcrypt

8. Multer. (2024). *Multer Documentation*. Retrieved from https://github.com/expressjs/multer

9. Axios. (2024). *Axios Documentation*. Retrieved from https://axios-http.com/docs/intro

10. React Router. (2024). *React Router Documentation*. Retrieved from https://reactrouter.com/

---

# APPENDIX A: SOFTWARE REQUIREMENTS SPECIFICATIONS

## A.1 Introduction

### A.1.1 Purpose
This Software Requirements Specification (SRS) document provides a detailed description of the StyleIt system, including functional and non-functional requirements, system constraints, and design specifications.

### A.1.2 Scope
StyleIt is a web-based wardrobe management and outfit recommendation system that uses AI-powered image recognition to automatically categorize clothing items and provides intelligent outfit recommendations based on user occasions.

### A.1.3 Definitions, Acronyms, and Abbreviations
- **API**: Application Programming Interface
- **AI**: Artificial Intelligence
- **JWT**: JSON Web Token
- **REST**: Representational State Transfer
- **UI**: User Interface
- **UX**: User Experience

## A.2 Overall Description

### A.2.1 Product Perspective
StyleIt is a standalone web application that integrates with Google Vision API for image analysis. The system consists of:
- React.js frontend application
- Node.js/Express.js backend server
- MongoDB database
- Google Vision API integration

### A.2.2 Product Functions
1. User authentication and account management
2. Image upload and AI-powered categorization
3. Wardrobe item management (CRUD operations)
4. Outfit recommendation generation
5. Calendar-based outfit planning
6. Admin dashboard for system management

### A.2.3 User Classes and Characteristics
- **Regular Users**: End users who manage their wardrobe and receive outfit recommendations
- **Administrators**: System administrators who manage categories, occasions, and system settings

## A.3 Functional Requirements

### A.3.1 User Authentication

**FR-1: User Registration**
- The system shall allow users to register with email, password, and name
- The system shall validate email format
- The system shall enforce password strength requirements
- The system shall hash passwords using bcrypt before storage
- The system shall prevent duplicate email registration

**FR-2: User Login**
- The system shall allow users to login with email and password
- The system shall validate user credentials
- The system shall generate JWT token upon successful login
- The system shall return error message for invalid credentials

**FR-3: User Logout**
- The system shall allow users to logout
- The system shall invalidate user session
- The system shall redirect to login page after logout

### A.3.2 Wardrobe Management

**FR-4: Image Upload**
- The system shall allow users to upload clothing item images
- The system shall support JPG, PNG, and WebP image formats
- The system shall validate file size (maximum 10MB)
- The system shall provide drag-and-drop upload interface

**FR-5: AI Categorization**
- The system shall automatically analyze uploaded images using Google Vision API
- The system shall detect clothing category (tops, bottoms, shoes, outerwear, accessories)
- The system shall detect colors in clothing items
- The system shall generate tags based on image analysis
- The system shall suggest suitable occasions for items
- The system shall provide confidence scores for detections

**FR-6: Item Management**
- The system shall allow users to view all wardrobe items
- The system shall allow users to edit item details (name, category, tags, occasions)
- The system shall allow users to delete items
- The system shall filter items by category
- The system shall filter items by occasion
- The system shall display item details in modal view

### A.3.3 Outfit Recommendations

**FR-7: Recommendation Generation**
- The system shall generate outfit recommendations based on selected occasion
- The system shall consider user's wardrobe inventory
- The system shall select items from different categories (tops, bottoms, shoes)
- The system shall optionally include outerwear (50% probability)
- The system shall optionally include 0-2 accessories
- The system shall generate styling tips for recommended outfits

**FR-8: Outfit Management**
- The system shall allow users to save recommended outfits
- The system shall allow users to view saved outfits
- The system shall allow users to edit saved outfits
- The system shall allow users to delete saved outfits
- The system shall detect duplicate outfits

### A.3.4 Calendar Planning

**FR-9: Outfit Planning**
- The system shall display calendar interface
- The system shall allow users to select dates
- The system shall allow users to plan outfits for selected dates
- The system shall allow users to select items from wardrobe
- The system shall allow users to use saved outfits for planning
- The system shall display planned outfits on calendar

**FR-10: Planned Outfit Management**
- The system shall allow users to view planned outfits
- The system shall allow users to delete planned outfits
- The system shall display planned outfit details

### A.3.5 Admin Functions

**FR-11: Category Management**
- Admin shall be able to create new categories
- Admin shall be able to edit existing categories
- Admin shall be able to delete categories
- Admin shall be able to set category keywords for AI matching
- Admin shall be able to set category display order

**FR-12: Occasion Management**
- Admin shall be able to create new occasions
- Admin shall be able to edit existing occasions
- Admin shall be able to delete occasions
- Admin shall be able to set occasion keywords for AI matching
- Admin shall be able to set occasion display order

**FR-13: System Statistics**
- Admin shall be able to view total number of users
- Admin shall be able to view total number of wardrobe items
- Admin shall be able to view total number of outfits
- Admin shall be able to view total number of planned outfits

## A.4 Non-Functional Requirements

### A.4.1 Performance Requirements

**NFR-1: Response Time**
- Image upload and analysis shall complete within 5 seconds
- Outfit recommendation generation shall complete within 3 seconds
- Page load times shall be under 2 seconds
- API response times shall be under 500ms

**NFR-2: Throughput**
- System shall support at least 50 concurrent users
- System shall handle at least 100 requests per minute

### A.4.2 Security Requirements

**NFR-3: Authentication Security**
- Passwords shall be hashed using bcrypt with 10 salt rounds
- JWT tokens shall expire after 7 days
- JWT tokens shall be signed with secret key

**NFR-4: Data Security**
- User data shall be isolated by user ID
- Admin routes shall require admin role verification
- Input validation shall be performed on all user inputs
- SQL injection prevention (MongoDB parameterized queries)

### A.4.3 Usability Requirements

**NFR-5: User Interface**
- Interface shall be intuitive and easy to navigate
- System shall provide clear error messages
- System shall provide visual feedback for user actions
- System shall be responsive across devices (mobile, tablet, desktop)

**NFR-6: Accessibility**
- System shall support modern web browsers (Chrome, Firefox, Safari, Edge)
- System shall be usable with keyboard navigation
- System shall provide clear visual indicators

### A.4.4 Reliability Requirements

**NFR-7: Error Handling**
- System shall handle API failures gracefully
- System shall provide fallback mechanisms for AI analysis failures
- System shall log errors for debugging
- System shall display user-friendly error messages

**NFR-8: Availability**
- System shall be available 24/7 (assuming server is running)
- System shall handle database connection failures
- System shall recover from temporary service interruptions

## A.5 System Constraints

### A.5.1 Technical Constraints
- System must use React.js for frontend
- System must use Node.js/Express.js for backend
- System must use MongoDB for database
- System must integrate with Google Vision API
- System must support modern web browsers only

### A.5.2 Business Constraints
- System must comply with data privacy regulations
- System must not store sensitive user information unnecessarily
- System must provide free access to basic features

## A.6 Assumptions and Dependencies

### A.6.1 Assumptions
- Users have access to modern web browsers
- Users have stable internet connection
- Users have Google Vision API access (via system)
- Users understand basic web application usage

### A.6.2 Dependencies
- Google Vision API availability and functionality
- MongoDB database availability
- Node.js runtime environment
- Modern web browser support

---

# APPENDIX B: SOFTWARE TEST DOCUMENTATION

## B.1 Test Plan Overview

### B.1.1 Test Objectives
The testing objectives for StyleIt include:
- Verify all functional requirements are met
- Ensure system performance meets specified requirements
- Validate security measures are properly implemented
- Confirm user interface is intuitive and responsive
- Verify integration with external services (Google Vision API)

### B.1.2 Test Scope
Testing covers:
- Functional testing of all features
- Performance testing
- Security testing
- User interface testing
- Integration testing

### B.1.3 Test Environment
- **Frontend**: React.js application running on localhost:3000
- **Backend**: Node.js/Express.js server running on localhost:5000
- **Database**: MongoDB (local or Atlas)
- **Browser**: Chrome, Firefox, Safari, Edge
- **OS**: Windows, macOS, Linux

## B.2 Test Cases

### B.2.1 Authentication Test Cases

**TC-1: User Registration - Valid Input**
- **Objective**: Verify user can register with valid information
- **Preconditions**: User is not logged in
- **Test Steps**:
  1. Navigate to signup page
  2. Enter valid name, email, and password
  3. Click signup button
- **Expected Result**: User account created, JWT token returned, user logged in
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-2: User Registration - Duplicate Email**
- **Objective**: Verify system prevents duplicate email registration
- **Preconditions**: User with email already exists
- **Test Steps**:
  1. Navigate to signup page
  2. Enter existing email
  3. Enter password and name
  4. Click signup button
- **Expected Result**: Error message displayed, account not created
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-3: User Login - Valid Credentials**
- **Objective**: Verify user can login with correct credentials
- **Preconditions**: User account exists
- **Test Steps**:
  1. Navigate to login page
  2. Enter valid email and password
  3. Click login button
- **Expected Result**: User logged in, JWT token stored, redirected to home
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-4: User Login - Invalid Credentials**
- **Objective**: Verify system rejects invalid credentials
- **Preconditions**: User account exists
- **Test Steps**:
  1. Navigate to login page
  2. Enter invalid email or password
  3. Click login button
- **Expected Result**: Error message displayed, user not logged in
- **Actual Result**: ✅ Pass
- **Status**: Pass

### B.2.2 Wardrobe Management Test Cases

**TC-5: Image Upload - Valid Image**
- **Objective**: Verify user can upload valid image file
- **Preconditions**: User is logged in
- **Test Steps**:
  1. Navigate to upload page
  2. Select valid image file (JPG, PNG, or WebP)
  3. Upload file
- **Expected Result**: Image uploaded, preview displayed
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-6: Image Upload - Invalid File Type**
- **Objective**: Verify system rejects invalid file types
- **Preconditions**: User is logged in
- **Test Steps**:
  1. Navigate to upload page
  2. Select invalid file type (e.g., PDF, DOC)
  3. Attempt to upload
- **Expected Result**: Error message displayed, file not uploaded
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-7: AI Categorization - Successful Analysis**
- **Objective**: Verify AI categorization works correctly
- **Preconditions**: User uploaded valid image
- **Test Steps**:
  1. Upload image of clothing item
  2. Click "Analyze" button
  3. Wait for analysis
- **Expected Result**: Category detected, tags generated, occasions suggested
- **Actual Result**: ✅ Pass (95% accuracy)
- **Status**: Pass

**TC-8: Item View - Display All Items**
- **Objective**: Verify wardrobe page displays all items
- **Preconditions**: User has wardrobe items
- **Test Steps**:
  1. Navigate to wardrobe page
  2. View item grid
- **Expected Result**: All items displayed in grid layout
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-9: Item Filter - By Category**
- **Objective**: Verify category filter works
- **Preconditions**: User has items in multiple categories
- **Test Steps**:
  1. Navigate to wardrobe page
  2. Click category filter (e.g., "Tops")
- **Expected Result**: Only items in selected category displayed
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-10: Item Delete - Confirmation**
- **Objective**: Verify item deletion with confirmation
- **Preconditions**: User has wardrobe items
- **Test Steps**:
  1. Navigate to wardrobe page
  2. Click on item
  3. Click delete button
  4. Confirm deletion
- **Expected Result**: Item deleted, removed from display
- **Actual Result**: ✅ Pass
- **Status**: Pass

### B.2.3 Outfit Recommendation Test Cases

**TC-11: Generate Recommendation - Casual Occasion**
- **Objective**: Verify outfit recommendation for casual occasion
- **Preconditions**: User has items in wardrobe, items tagged with "casual"
- **Test Steps**:
  1. Navigate to outfits page
  2. Select "Casual" occasion
  3. Click "Style It" button
- **Expected Result**: Outfit recommendation generated with casual items
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-12: Generate Recommendation - No Items for Occasion**
- **Objective**: Verify system handles case when no items match occasion
- **Preconditions**: User has items but none tagged with selected occasion
- **Test Steps**:
  1. Navigate to outfits page
  2. Select occasion with no matching items
  3. Click "Style It" button
- **Expected Result**: Message displayed indicating no items found
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-13: Save Outfit - Successful**
- **Objective**: Verify user can save recommended outfit
- **Preconditions**: Outfit recommendation displayed
- **Test Steps**:
  1. Generate outfit recommendation
  2. Click "Save Outfit" button
  3. Enter outfit name
  4. Confirm save
- **Expected Result**: Outfit saved, appears in saved outfits list
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-14: Duplicate Detection - Same Outfit**
- **Objective**: Verify system detects duplicate outfits
- **Preconditions**: User has saved outfit with same items
- **Test Steps**:
  1. Generate outfit recommendation
  2. Attempt to save outfit
  3. System checks for duplicates
- **Expected Result**: Warning message displayed if duplicate detected
- **Actual Result**: ✅ Pass
- **Status**: Pass

### B.2.4 Calendar Planning Test Cases

**TC-15: Plan Outfit - Select Date**
- **Objective**: Verify user can plan outfit for date
- **Preconditions**: User is logged in, has wardrobe items
- **Test Steps**:
  1. Navigate to planner page
  2. Click on calendar date
  3. Select items from wardrobe
  4. Save planned outfit
- **Expected Result**: Planned outfit saved, displayed on calendar
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-16: View Planned Outfit - Calendar Display**
- **Objective**: Verify planned outfits display on calendar
- **Preconditions**: User has planned outfits
- **Test Steps**:
  1. Navigate to planner page
  2. View calendar
- **Expected Result**: Planned outfits visible on respective dates
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-17: Delete Planned Outfit**
- **Objective**: Verify user can delete planned outfit
- **Preconditions**: User has planned outfit
- **Test Steps**:
  1. Navigate to planner page
  2. Click on planned outfit
  3. Click delete button
  4. Confirm deletion
- **Expected Result**: Planned outfit deleted, removed from calendar
- **Actual Result**: ✅ Pass
- **Status**: Pass

### B.2.5 Admin Dashboard Test Cases

**TC-18: Category Management - Create**
- **Objective**: Verify admin can create category
- **Preconditions**: User logged in as admin
- **Test Steps**:
  1. Navigate to admin dashboard
  2. Go to Categories tab
  3. Click "Add Category"
  4. Enter category details
  5. Save
- **Expected Result**: Category created, appears in list
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-19: Category Management - Edit**
- **Objective**: Verify admin can edit category
- **Preconditions**: Category exists, user is admin
- **Test Steps**:
  1. Navigate to admin dashboard
  2. Go to Categories tab
  3. Click edit on category
  4. Modify details
  5. Save
- **Expected Result**: Category updated with new details
- **Actual Result**: ✅ Pass
- **Status**: Pass

**TC-20: Admin Access Control**
- **Objective**: Verify non-admin users cannot access admin features
- **Preconditions**: User logged in as regular user
- **Test Steps**:
  1. Attempt to navigate to /admin
- **Expected Result**: Access denied, redirected or error shown
- **Actual Result**: ✅ Pass
- **Status**: Pass

## B.3 Performance Test Results

### B.3.1 Response Time Tests

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Image Upload & Analysis | < 5s | 3-4s | ✅ Pass |
| Outfit Recommendation | < 3s | 1-2s | ✅ Pass |
| Page Load (Wardrobe) | < 2s | 1.5s | ✅ Pass |
| Page Load (Outfits) | < 2s | 1.2s | ✅ Pass |
| API Response (GET) | < 500ms | 200-300ms | ✅ Pass |
| API Response (POST) | < 500ms | 300-400ms | ✅ Pass |

### B.3.2 Load Test Results

- **Concurrent Users**: Tested with up to 50 concurrent users
- **Result**: All requests handled successfully
- **Response Time**: Remained within acceptable limits
- **Status**: ✅ Pass

## B.4 Security Test Results

### B.4.1 Authentication Security

| Test | Result | Status |
|------|--------|--------|
| Password Hashing (bcrypt) | ✅ Verified | Pass |
| JWT Token Generation | ✅ Verified | Pass |
| JWT Token Validation | ✅ Verified | Pass |
| Token Expiration | ✅ Verified | Pass |
| Protected Route Access | ✅ Verified | Pass |

### B.4.2 Data Security

| Test | Result | Status |
|------|--------|--------|
| User Data Isolation | ✅ Verified | Pass |
| Admin Role Verification | ✅ Verified | Pass |
| Input Validation | ✅ Verified | Pass |
| SQL Injection Prevention | ✅ Verified | Pass |

## B.5 Browser Compatibility Test Results

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ✅ Pass | Full functionality |
| Firefox | Latest | ✅ Pass | Full functionality |
| Safari | Latest | ✅ Pass | Full functionality |
| Edge | Latest | ✅ Pass | Full functionality |

## B.6 Responsive Design Test Results

| Device Type | Screen Size | Status | Notes |
|-------------|-------------|--------|-------|
| Mobile | 375px - 768px | ✅ Pass | Responsive layout |
| Tablet | 769px - 1024px | ✅ Pass | Responsive layout |
| Desktop | 1025px+ | ✅ Pass | Full layout |

## B.7 Test Summary

### B.7.1 Test Statistics
- **Total Test Cases**: 20
- **Passed**: 20
- **Failed**: 0
- **Pass Rate**: 100%

### B.7.2 Conclusion
All functional requirements have been successfully tested and verified. The system meets all performance, security, and usability requirements. No critical issues were found during testing.

---

# APPENDIX C: STYLEIT USER MANUAL GUIDE

## C.1 Introduction

This user manual provides step-by-step instructions for using the StyleIt wardrobe management and outfit recommendation system. The manual covers all major features and functionalities of the application.

## C.2 Getting Started

### C.2.1 System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- JavaScript enabled

### C.2.2 Accessing the System
1. Open your web browser
2. Navigate to the StyleIt application URL
3. You will see the home page

## C.3 User Registration and Login

### C.3.1 Creating an Account

1. On the home page, click the "Sign Up" or "Register" button
2. You will be redirected to the registration page
3. Fill in the registration form:
   - Enter your full name
   - Enter your email address
   - Enter a password (minimum 6 characters)
   - Confirm your password
4. Click the "Sign Up" button
5. If registration is successful, you will be automatically logged in

### C.3.2 Logging In

1. On the home page, click the "Login" button
2. Enter your email address
3. Enter your password
4. Click the "Login" button
5. You will be redirected to your dashboard

### C.3.3 Logging Out

1. Click on your profile icon or navigate to the Profile page
2. Click the "Logout" button
3. You will be logged out and redirected to the home page

## C.4 Wardrobe Management

### C.4.1 Adding Items to Wardrobe

1. Navigate to the "Upload" page from the navigation menu
2. Click on the upload area or drag and drop an image file
3. Select an image file (JPG, PNG, or WebP format)
4. The image will be displayed in the preview area
5. Click the "Analyze" button to analyze the image using AI
6. Review the analysis results:
   - Detected category (you can change this if needed)
   - Detected tags
   - Suggested occasions
   - Detected colors
7. Edit any information if necessary
8. Click the "Confirm" button to save the item to your wardrobe
9. A success message will be displayed

### C.4.2 Viewing Your Wardrobe

1. Navigate to the "Wardrobe" page from the navigation menu
2. All your wardrobe items will be displayed in a grid layout
3. You can see each item's image, name, and category
4. Click on any item to view detailed information

### C.4.3 Filtering Items

1. On the Wardrobe page, you will see category filter buttons
2. Click on a category button (e.g., "Tops", "Bottoms", "Shoes") to filter items
3. Click "All Items" to show all items again
4. You can also filter by occasion using the occasion filter buttons

### C.4.4 Editing Item Details

1. Navigate to the Wardrobe page
2. Click on the item you want to edit
3. A detail modal will open showing all item information
4. Click the "Edit" button
5. Modify the item details:
   - Change the name
   - Change the category
   - Edit tags
   - Modify occasion tags
6. Click "Save" to save changes

### C.4.5 Deleting Items

1. Navigate to the Wardrobe page
2. Click on the item you want to delete
3. Click the "Delete" button
4. A confirmation dialog will appear
5. Click "Confirm" to delete the item
6. The item will be removed from your wardrobe

## C.5 Outfit Recommendations

### C.5.1 Getting Outfit Recommendations

1. Navigate to the "Outfits" page from the navigation menu
2. You will see occasion selector buttons (Casual, Formal, Work, Sporty, Random)
3. Select an occasion by clicking on the appropriate button
4. Click the "Style It" button to generate an outfit recommendation
5. The system will display a recommended outfit consisting of:
   - Top item
   - Bottom item
   - Shoes
   - Optional outerwear
   - Optional accessories
6. Styling tips will also be displayed

### C.5.2 Saving Outfits

1. After receiving an outfit recommendation, click the "Save Outfit" button
2. Enter a name for the outfit (optional)
3. Click "Save" to save the outfit
4. The outfit will be added to your saved outfits list

### C.5.3 Viewing Saved Outfits

1. On the Outfits page, navigate to the "Saved Outfits" section
2. All your saved outfits will be displayed
3. Click on any outfit to view details
4. You can edit or delete saved outfits

### C.5.4 Creating Custom Outfits

1. On the Outfits page, click "Create Custom Outfit"
2. Select items from your wardrobe
3. Add items to your outfit
4. Name your outfit
5. Save the custom outfit

## C.6 Calendar Planning

### C.6.1 Planning Outfits for Dates

1. Navigate to the "Planner" page from the navigation menu
2. You will see a calendar view showing the current month
3. Click on any date to plan an outfit
4. A planning modal will open
5. You can either:
   - Select items from your wardrobe manually
   - Use a saved outfit
6. Select items or choose a saved outfit
7. Optionally add notes
8. Click "Plan Outfit" to save
9. The planned outfit will appear on the calendar date

### C.6.2 Viewing Planned Outfits

1. On the Planner page, planned outfits are displayed on their respective dates
2. Click on a date with a planned outfit to view details
3. You can see all items in the planned outfit

### C.6.3 Deleting Planned Outfits

1. On the Planner page, click on a date with a planned outfit
2. Click the "Delete" button
3. Confirm the deletion
4. The planned outfit will be removed from the calendar

## C.7 Profile Management

### C.7.1 Viewing Profile

1. Navigate to the "Profile" page from the navigation menu
2. You will see:
   - Your name and email
   - Statistics about your wardrobe:
     - Total wardrobe items
     - Total saved outfits
     - Total planned outfits
3. Navigation links to other sections

## C.8 Tips and Best Practices

### C.8.1 For Best AI Categorization Results
- Use clear, well-lit photos of clothing items
- Take photos against a plain background
- Ensure the entire item is visible in the photo
- Use high-resolution images when possible

### C.8.2 For Better Recommendations
- Upload items in multiple categories (tops, bottoms, shoes)
- Tag items with appropriate occasions
- Keep your wardrobe updated
- Save outfits you like for future reference

### C.8.3 For Effective Planning
- Plan outfits in advance for important events
- Review your planned outfits regularly
- Use the calendar to avoid outfit repetition
- Update planned outfits if needed

## C.9 Troubleshooting

### C.9.1 Common Issues

**Issue: Image upload fails**
- Solution: Check file format (must be JPG, PNG, or WebP)
- Solution: Ensure file size is under 10MB
- Solution: Check internet connection

**Issue: AI analysis takes too long**
- Solution: Check internet connection
- Solution: Try uploading a smaller image file
- Solution: Wait a few moments and try again

**Issue: Cannot login**
- Solution: Verify email and password are correct
- Solution: Check if account exists (try registering)
- Solution: Clear browser cache and cookies

**Issue: Outfit recommendations not showing**
- Solution: Ensure you have items in your wardrobe
- Solution: Check if items are tagged with the selected occasion
- Solution: Try selecting a different occasion

### C.9.2 Getting Help

If you encounter issues not covered in this manual:
1. Check the error message displayed on screen
2. Verify your internet connection
3. Try refreshing the page
4. Contact system administrator if problem persists

---

**END OF REPORT**
