# Phone Shop POS System

This is a modern Point of Sale (POS) system designed specifically for small businesses managing phone sales, repairs, and accessories. Built with a focus on simplicity, performance, and security, this solution streamlines operations and provides actionable insights through real-time data and intelligent reporting.

## Key Features

- **Inventory Management**: Add, update, and manage product stock efficiently.
- **Sales Tracking**: Monitor daily sales and transactions in real-time.
- **Reporting**:
    - Insights on low-stock items.
    - Profit calculation and identification of most sold products.
    - Admin-specific reports for better decision-making.
- **Real-Time Updates**: Seamless synchronization of data using Firebase.
- **AI Assistance**: Integrated with OpenAI's GPT API to provide quick answers to common questions.
- **Full-Text Search**: Powered by MeiliSearch for fast and efficient product searches on the frontend.
- **Role-Based UI**: The interface dynamically adjusts based on Firestore roles.

## Tech Stack

- **Frontend**: Built with Vite and React for fast development and performance.
- **UI**: Chakra UI for a beautiful, responsive design.
- **Database**: Firebase Realtime Database for secure and seamless data storage and retrieval.
- **Search**: MeiliSearch for advanced full-text search capabilities.
- **AI Integration**: OpenAI's GPT API for intelligent question answering.

## Hosting and Security

- **Hosting**: Deployed on Vercel, with necessary security headers configured to mitigate potential attacks.
- **Domain Security**: The domain is secured using Cloudflare.
- **Authentication**:
    - User authentication is handled via Firebase Google Sign-In with a popup.
    - The server providing dashboard data is authenticated using a Firebase UID system.

## Functionality

- Complete CRUD operations for managing products, sales, and users.
- Comprehensive reporting for inventory and sales performance.
- Displays dashboard data from a separate server, integrated with Firebase Realtime Database, due to certain client-side restrictions.
- **Planned Feature**: Receipt printing to enhance the checkout process.
- **PWA**: Available as a Progressive Web App (PWA) for mobile users, enabling offline access and an app-like experience.

## Target Audience

This system is designed for small businesses specializing in phone sales, repairs, and accessories.

## Learning Journey

This project was built while learning React and was deployed using Vercel for easy hosting. The system was designed with security in mind, using Firebase for real-time database functionality and authentication, and Cloudflare for securing the domain.

---

