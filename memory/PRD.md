# Wedding Photography Website - Product Requirements Document

## Original Problem Statement
Build a real-time website for a photographer with:

### Photographer Portal (Authenticated)
- Google login authentication
- Upload photos to live event gallery
- Upload photos to portfolio section ("Our Wall")
- Upload photos for fading background slideshow in header
- Customize site details (name, social media links, bride/groom names)

### Guest View (Public)
- Header with photographer name/bio over fading background slideshow
- Social media links (WhatsApp, Instagram, YouTube, Email, Location)
- Portfolio section "Our Wall" with scrollable marquee
- Bride and groom names section
- "Live Gallery" for event photos
- Lightbox viewer with navigation and download
- Footer with copyright ("© 2026 SteamIt. All rights reserved")
- Elegant, lightweight, mobile-friendly design

## Tech Stack
- **Frontend:** React, Tailwind CSS, Framer Motion, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** Emergent-managed Google Auth
- **Image Storage:** Base64 strings in MongoDB (MOCKED - future: AWS S3)

## Architecture
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveGallery.jsx
│   │   │   ├── PhotographerHeader.jsx
│   │   │   ├── PortfolioMarquee.jsx
│   │   │   ├── CoupleShowcase.jsx
│   │   │   └── Settings.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GuestView.jsx
│   │   │   └── Login.jsx
│   │   ├── App.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
└── memory/
    └── PRD.md
```

## Key API Endpoints
- `GET /api/photos/guest` - Fetch live gallery photos (public)
- `GET /api/wall-photos` - Fetch portfolio photos (public)
- `GET /api/background-images` - Fetch header slideshow images (public)
- `GET /api/settings` - Fetch photographer settings (public)
- `POST /api/photos/upload` - Upload gallery photo (auth required)
- `POST /api/wall-photos/upload` - Upload portfolio photo (auth required)
- `POST /api/background-images/upload` - Upload header image (auth required)
- `POST /api/settings` - Update settings (auth required)
- `POST /api/auth/session` - Exchange session for user data

## Database Collections
- `photos` - Live gallery photos
- `wall_photos` - Portfolio photos
- `background_images` - Header slideshow images
- `settings` - Photographer settings
- `users` - User accounts
- `user_sessions` - Auth sessions

---

## What's Been Implemented ✅

### Date: January 10, 2026

#### Completed Features
1. **Full-Stack Application** - React + FastAPI + MongoDB
2. **Guest View Page** - Complete with all sections
3. **Photographer Dashboard** - Tabbed interface for content management
4. **Google Authentication** - Emergent-managed OAuth
5. **Photo Upload System** - Live gallery, portfolio, backgrounds
6. **Lightbox Viewer** - Full navigation, download, keyboard support
7. **Fading Header Slideshow** - Auto-cycling background images
8. **Social Links** - All 5 links with icons
9. **SMILE Indicator** - Animated green indicator

#### Bugs Fixed (Today)
1. ✅ **Gallery Loading Issue** - Galleries now load correctly
2. ✅ **Section Dividers** - Redesigned with elegant star icon design
3. ✅ **Performance** - Added lazy loading (`loading="lazy"`, `decoding="async"`)

#### Test Results
- Backend: 100% (19/19 tests passed)
- Frontend: 100% (all features working)
- Test file: `/app/test_reports/iteration_1.json`

---

## Backlog / Future Tasks

### P1 (High Priority)
- [ ] AWS S3 integration for proper image storage (replaces base64)
- [ ] Image compression on upload

### P2 (Medium Priority)  
- [ ] Photo filters/categories for larger galleries
- [ ] Backend refactoring (split server.py into modules)
- [ ] Frontend data fetching hooks (usePhotos, useSettings)

### P3 (Low Priority)
- [ ] Analytics dashboard for photographer
- [ ] Guest comments/reactions on photos
- [ ] QR code for easy event access

---

## Known Limitations
1. **Image Storage:** Currently using base64 strings in MongoDB (MOCKED). Large images cause slow load times. AWS S3 integration recommended for production.
2. **No Image Compression:** Images are stored at original size.

## Notes
- Sample images from Pexels are used when no custom images uploaded
- Photographer login uses tester's own Google account
- Hot reload enabled for development
