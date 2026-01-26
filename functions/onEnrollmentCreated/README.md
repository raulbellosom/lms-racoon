# Racoon LMS — onEnrollmentCreated

**Trigger:** `databases.*.collections.enrollments.documents.*.create`  
**Runtime:** Node 18  
**SDK:** node-appwrite ^17

## What it does

- Increments `studentsCount` in `courseStats/{courseId}` when a student enrolls.
- Creates `courseStats` document if it doesn't exist.

## Required env vars

| Variable                               | Description                                                 |
| -------------------------------------- | ----------------------------------------------------------- |
| `APPWRITE_ENDPOINT`                    | Appwrite API endpoint                                       |
| `APPWRITE_PROJECT_ID`                  | Project ID                                                  |
| `APPWRITE_API_KEY`                     | API Key with `databases.write` permissions                  |
| `APPWRITE_DATABASE_ID`                 | Database ID (default: `lms`)                                |
| `APPWRITE_COURSE_STATS_COLLECTION_ID`  | Collection ID for courseStats (default: `courseStats`)      |
| `APPWRITE_COURSES_COLLECTION_ID`       | Collection ID for courses (default: `courses`)              |
| `APPWRITE_NOTIFICATIONS_COLLECTION_ID` | Collection ID for notifications (default: `notifications`)  |
| `APPWRITE_USER_PREFS_COLLECTION_ID`    | Collection ID for userPrefs (default: `userPreferences`)    |
| `FIREBASE_SERVICE_ACCOUNT_JSON`        | **Required**. File content of Firebase Service Account JSON |

## Appwrite Configuration

### Event Trigger

```
databases.[DATABASE_ID].collections.[ENROLLMENTS_COLLECTION_ID].documents.*.create
```

Example:

```
databases.lms.collections.enrollments.documents.*.create
```

### API Key Scopes

- `databases.read`
- `databases.write`
