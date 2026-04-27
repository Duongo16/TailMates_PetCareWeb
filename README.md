# 🐾 TailMates - The Ultimate All-in-One Pet Care Platform

TailMates is a comprehensive pet care ecosystem designed to bring pet owners, merchants, and veterinarians together. From AI-powered health consultations to a vibrant social network for pets, TailMates is the "All-in-One" solution for every pet "Sen".


## ✨ Key Features

### 🤖 AI Health Consultant ("Magic Button")
- **Instant Triage**: Get immediate advice on your pet's health using advanced AI.
- **Symptom Checker**: Analyze potential issues before visiting the vet.
- **Personalized Advice**: AI-driven recommendations based on your pet's species, age, and history.

### 🏥 Digital Medical Records
- **Centralized History**: Store all vaccinations, treatments, and prescriptions in one place.
- **Easy Access**: Quickly share medical history with veterinarians.
- **Reminders**: Never miss a vaccination or check-up again.

### 📱 Pet Social Network
- **Social Feed**: Share adorable moments, posts, and comments with the community.
- **PawMatch**: A fun matching/dating feature to find playmates for your pets.
- **Real-time Interaction**: Instant notifications and chat powered by Pusher.

### 🛒 Marketplace & Services
- **Smart Shopping**: Buy pet products recommended by AI specifically for your pet.
- **Service Booking**: Easily book Spa, Grooming, or Veterinary appointments.
- **Merchant Dashboard**: Dedicated interface for pet shops and clinics to manage orders and bookings.

### 💳 Secure Payments & Subscriptions
- **SePay Integration**: Seamless QR-based bank transfers.
- **Tiered Plans**: Subscription packages for both regular users and merchants.

---

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Backend**: Next.js API Routes, [Mongoose](https://mongoosejs.com/) (MongoDB)
- **Real-time**: [Pusher](https://pusher.com/)
- **AI Engine**: [OpenRouter](https://openrouter.ai/) (GPT-4o/Claude-3.5)
- **Media**: [Cloudinary](https://cloudinary.com/)
- **Caching/Queue**: [Redis](https://redis.io/)
- **Payments**: [SePay](https://sepay.vn/)
- **Email**: Nodemailer (Gmail SMTP)

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB (Local or Atlas)
- Redis (Local or Cloud)

### 2. Installation
```bash
git clone https://github.com/your-username/TailMates_PetCareWeb.git
cd TailMates_PetCareWeb
npm install
```

### 3. Environment Setup
Copy `env.template` to `.env.local` and fill in your credentials:
```bash
cp env.template .env.local
```

### 4. Database Seed (Optional)
Generate and import sample customer data:
```bash
node generate_customers.js
# Then follow the mongoimport instructions in the script comments
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 📂 Project Structure

- `app/`: Next.js App Router (Pages & API Routes)
- `components/`: Reusable UI components (Radix UI + Lucide)
- `models/`: Mongoose schemas for MongoDB
- `lib/`: Utility functions, hooks, and shared logic
- `public/`: Static assets (images, icons)
- `styles/`: Global CSS and Tailwind configurations

---

## 🐳 Docker
Build and run using Docker Compose:
```bash
docker-compose up --build
```

---

## 🧪 Testing
Run the test suite with Jest:
```bash
npm test
```

---

## 📄 License

This project is private and for educational purposes at FPT University.

---

Developed with ❤️ by the TailMates Team.
