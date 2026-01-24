# Racoon LMS — onCourseCreated

**Trigger:** `databases.*.collections.courses.documents.*.create`  
**Runtime:** Node 18  
**SDK:** node-appwrite ^17

## What it does

- Creates initial `courseStats/{courseId}` document when a new course is created.
- Initializes `ratingAvg`, `ratingCount`, `studentsCount`, `commentsCount` to 0.

## Required env vars

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_COURSE_STATS_COLLECTION_ID`
