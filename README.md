# collab-task-board
A collaborative Kanban board with real-time sync, smart assign, and conflict handling.

---

# Tech Stack

- Frontend: React
- Backend: Node.js + Express
- Database: MongoDB
- Realtime: Socket.IO
- Login System: JWT (JSON Web Tokens)

---

# Features 

- Login and Register
- Add, edit, and delete tasks
- Drag and drop tasks between Todo, In Progress, and Done
- **Smart Assign** — Automatically assigns task to the user with the least work
- **Conflict Handling** — If two people edit the same task, it warns you and lets you choose what to do
- Real-time updates — no need to refresh the page
- Shows a log of all activity

---

# How to Run This App on Your Computer

## 1. Clone the project

```bash
git clone https://github.com/YOUR_USERNAME/collab-task-board.git
cd collab-task-board
```
## 2. Set up the backend

- create a .env file and put  
  PORT= 5000  
  MONGO_URI= your mongodb uri  
  JWT_SECRET= your secret key
  
```
cd backend
npm install
npm run dev
```

## 3. Set up the frontend

```
cd frontend
npm install
npm run dev
```

