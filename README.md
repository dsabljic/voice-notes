# Voice Note SaaS - MVP

[frontend](https://github.com/dsabljic/voice-notes-frontend)

## Project Overview

This project is an MVP for a SaaS application that allows users to record their voice notes and transform them into various textual forms like:

- **Transcriptions**: A cleaned-up script with punctuation.
- **Summaries**: A concise note summarizing the core ideas of the voice note.
- **Lists**: A list of main ideas extracted from the voice note.

### Tech Stack

- **Frontend**: React & Tailwind CSS
- **Backend**: Node.js & Express.js

<!-- ### Reason for MVP Scope
At this stage, the focus of the project is to build a working MVP without user authentication, authorization, or payments. The decision to keep these out of the MVP is to align with my current learning journey in Node.js/Express, which is still covering foundational topics.

By limiting the scope of this MVP I want to:
- Apply what I am currently learning in the aforementioned course.
- Create a simple, functional version of the full stack app without diving into topics like authentication and payment integration, which will be added later as I advance through the course. -->

### Features

- **Record voice notes**: Users can record voice notes directly in the app.
- **Get results**: The voice note can be transcribed, summarized, or converted into a list of ideas.

### Future Plans/TODO list

- [ ] **Implement automated tests**: Add unit tests for to ensure reliability during future development.
- [x] **Add user authentication and authorization**: Implement user sign-up & sign-in
- [ ] **Add payments**: Allow users to access extended features based on the purchase plan they select.

### How to run the project

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/voice-note-saas.git
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development servers**:

   - Start the backend (Node.js):
     ```bash
     node app.js
     ```
   - Start the frontend (React):
     ```bash
     npm run dev
     ```

4. **Access the app**:
   Navigate to `http://localhost:5173` to use the application or test the API endpoints at `http://localhost:3000`.
