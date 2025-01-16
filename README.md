# Voice Note SaaS - MVP

[frontend](https://github.com/dsabljic/voice-notes-frontend)

## Project Overview

This project is an MVP for a SaaS application that allows users to record their voice notes, upload audio files and transform them into various textual forms, such as notes of the following types:

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
- **Upload audio files**: Users can upload their audio files and create their notes that way.
- **Get results**: The voice note can be transcribed, summarized, or converted into a list of ideas.

### Future Plans/TODO list

- [ ] **Implement automated tests**: Add unit tests for to ensure reliability during future development.
- [x] **Add user authentication and authorization**: Implement user sign-up & sign-in
- [ ] **Add payments**: Allow users to access extended features based on the purchase plan they select.

### How to run the project

#### Clone the repository

   ```bash
   git clone https://github.com/dsabljic/voice-notes.git
   ```

#### Install dependencies

```bash
npm install
```

#### Run the development servers

- Start the backend (Node.js):
  ```bash
  node app.js
  ```
- Start the frontend (React) after cloning the [frontend](https://github.com/dsabljic/voice-notes-frontend) project and running `npm install` there:
  ```bash
  npm run dev
  ```
  
#### Sidenote

Right now the project requires you to create products (plans) manually on the Stripe dashboard (admin dashboard coming soon). After running the server for the first time with the sequelize.sync({ force: true }) the database will be initialized (after that you should comment out the sync({ force: true }) and call sync without args as shown in app.js) and you can add you plans like this:

```sql
INSERT INTO plan (planType, price, maxUploads, maxRecordingTime)
VALUES ('free', 0.00, 5, 600);

INSERT INTO plan (planType, price, maxUploads, maxRecordingTime, stripeProductId, stripePriceId)
VALUES ('standard', 5.99, 15, 3600, 'prod_stripe_productId', 'price_stripe_priceId'); -- 1 hour = 3600 seconds

INSERT INTO plan (planType, price, maxUploads, maxRecordingTime, stripeProductId, stripePriceId)
VALUES ('pro', 7.99, 30, 10800, 'prod_stripe_productId', 'price_stripe_priceId');
```

If you want to try out the Stripe functionality and listen to events run the server and in another terminal run:

```bash
stripe listen --forward-to localhost:3000/payment/webhook
```

#### Access the app

Navigate to `http://localhost:5173` (frontend) to use the application or test the API endpoints at `http://localhost:3000`.

### ER diagram

![image](https://github.com/user-attachments/assets/e0a931e2-62c0-4fd6-91f4-7b4c85504d65)
