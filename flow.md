# Technical Workflow & Data Flow Guide

## System Components & Lifecycle

### 1. Database Layer (MongoDB / Mongoose)
- **User**: Stores email, password hash, role (`admin` or `user`), and avatar.
- **Subject**: Tied to RTU schema (university, branch, semester, courseCode).
- **Topic**: Child of Subject. Maintains `generationStatus` and `content`.
- **QuestionBank**: Linked to a `Topic`. Stores a list of generated questions, options, and explanations.
- **Test**: Stores the attempts (`attemptCount`), `highScore`, and historical metrics for a specific `userId` and `topicId`.

### 2. Frontend Component Tree
- `App.jsx`: Root router wrapper, Context Providers.
- `pages/Home.jsx`: Public landing page.
- `pages/Login.jsx` & `pages/Signup.jsx`: Auth forms triggering Axios API calls. Store JWT in context/localStorage.
- `components/PrivateRoute.jsx`: Wrapper to ensure only authenticated users hit protected components like `Profile.jsx` or `AdminDashboard.jsx`.
- `pages/Subjects.jsx`: Loads all subjects via `/api/subjects`.
- `pages/Topics.jsx` & `pages/TopicDetail.jsx`: Fetches topic context. `TopicDetail` handles AI status polling if the topic is still generating.
- `pages/Tests.jsx`: Implements the interactive Quiz UI using state (current question index, selected answers). Evaluates responses and posts final score.
- `pages/Leaderboard.jsx`: Hits `/api/tests/global-leaderboard` to fetch aggregrated rankings.
- `pages/AdminDashboard.jsx`: Administrative actions (creating subjects, viewing users).

### 3. Backend Workflow
#### Authentication (`authRoutes.js` -> `authController.js`)
- **Login**: Verifies credentials -> Generates JWT -> Sends in response.
- **Google Login**: Uses `google-auth-library` to check Google Identity Token -> Maps to local User DB -> Issues JWT.
- **Middleware**: `protect` middleware decodes JWT and appends `req.user`.

#### Topic Generation (`topicRoutes.js` -> `topicGenerationService.js`)
- **Flow**: User requests topic creation -> Topic DB document created with `generationStatus = "pending"` -> Background AI generation service is invoked without awaiting response -> User gets success instantly. The frontend continuously polls until `generationStatus` completes.

#### Testing Engine (`testRoutes.js`)
- **Fetching Questions**: Endpoint `GET /api/tests/questions/:topicId`. Looks up the `QuestionBank` for the topic. Depending on the difficulty set on the `Topic`, it crops limits (randomly shuffles via Fisher-Yates and returns a slice).
- **Submitting Score**: Endpoint `POST /api/tests/score/:topicId`. Payload includes `{ score, maxScore }`. Compares against existing `Test` record for that `userId`/`topicId`. If higher, replaces `highScore` and updates `lastAttemptAt`.

#### RTU Validation (`subjectRoutes.js` -> `rtuSyllabusService.js`)
- **Validation**: Whenever a Subject is posted, it runs through `findRtuSubjectMatch()`. It strict-matches the course names against a known syllabus dataset. Rejects non-RTU mappings.

### 4. API Request/Response Lifecycle (Example: Taking a Test)
1. **Frontend**: Client clicks "Start test" on `TopicDetail.jsx`.
2. **Frontend Axios**: Sends GET `Bearer <jwt>` to `/api/tests/questions/123`.
3. **Backend Middleware**: `protect` decodes JWT. Resolves `userId`.
4. **Backend Route**: Reaches `testRoutes.js`. Fetches `QuestionBank`. Selects subset of 5/10 questions. Maps out sensitive data (leaves correct answers intact for client evaluation).
5. **Frontend State**: Initializes Question `[0]`. User selects answer. Proceeds. Computes score locally.
6. **Frontend Finalize**: User hits Submit. Sends POST `/api/tests/score/123` with final score.
7. **Backend Route**: Updates the high score if it beats the historical best. Returns the DB `Test` object status.
8. **Frontend Alert**: Toast confirming score is saved.
