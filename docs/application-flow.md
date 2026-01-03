# Training Management System - Complete Application Flow

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Authentication Flow](#authentication-flow)
4. [Core Business Flows](#core-business-flows)
5. [Page-by-Page Flow](#page-by-page-flow)
6. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

The Training Management System is designed to manage corporate training programs, including:
- **Trainer Management**: Track trainers, their expertise, availability, and batch assignments
- **Project Management**: Handle training projects from clients (colleges, corporates)
- **Engagement & Batch Management**: Organize training into engagements and batches
- **HR Requests**: Request hiring of new trainers when capacity is insufficient
- **Attendance Tracking**: Monitor trainer attendance for each batch

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │   Pages     │ │  Components │ │   Contexts  │ │   Hooks    ││
│  │  - Login    │ │  - Modals   │ │  - Auth     │ │  - Toast   ││
│  │  - Dashboard│ │  - Layout   │ │  - Data     │ │  - Mobile  ││
│  │  - Projects │ │  - UI       │ │  - Settings │ │            ││
│  │  - Trainers │ │             │ │             │ │            ││
│  │  - etc.     │ │             │ │             │ │            ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                    Backend (Python/FastAPI)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │   Routes    │ │   Services  │ │   Models    │ │ Middleware ││
│  │  - Auth     │ │  - Auth     │ │  - User     │ │  - Auth    ││
│  │  - Users    │ │  - Project  │ │  - Trainer  │ │  - CORS    ││
│  │  - Trainers │ │  - Trainer  │ │  - Project  │ │  - Logging ││
│  │  - Projects │ │  - HR       │ │  - Batch    │ │            ││
│  │  - etc.     │ │             │ │  - etc.     │ │            ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │ SQL
┌───────────────────────────▼─────────────────────────────────────┐
│                       PostgreSQL Database                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │   Tables    │ │  Functions  │ │   Triggers  │ │    RLS     ││
│  │  - profiles │ │  - has_role │ │  - updated  │ │  Policies  ││
│  │  - trainers │ │  - get_role │ │    _at      │ │            ││
│  │  - projects │ │             │ │  - new_user │ │            ││
│  │  - batches  │ │             │ │             │ │            ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### Role Hierarchy

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | System administrator | Full access to all features, user management, role assignment |
| **HR** | Human Resources | Manage trainers, handle HR requests, view all profiles |
| **Project Manager** | Training PM | Manage projects, allocate trainers, view attendance |
| **Trainer** | Training instructor | View own assignments, record attendance, view own profile |

### Permission Matrix

| Feature | Admin | HR | PM | Trainer |
|---------|-------|----|----|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Role Assignment | ✅ | ❌ | ❌ | ❌ |
| View All Profiles | ✅ | ✅ | ✅ | ❌ |
| Trainer CRUD | ✅ | ✅ | ❌ | ❌ |
| Project CRUD | ✅ | ❌ | ✅ | ❌ |
| Batch Allocation | ✅ | ❌ | ✅ | ❌ |
| HR Requests | ✅ | ✅ | ✅ | ❌ |
| View All Attendance | ✅ | ✅ | ✅ | ❌ |
| Record Own Attendance | ✅ | ❌ | ❌ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ |

---

## Authentication Flow

### Login Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Enter       │                │                │
     │    credentials │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ 2. POST        │                │
     │                │    /auth/login │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ 3. Verify      │
     │                │                │    credentials │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ 4. Get user    │
     │                │                │    + role      │
     │                │                │<───────────────│
     │                │                │                │
     │                │ 5. JWT +       │                │
     │                │    user data   │                │
     │                │<───────────────│                │
     │                │                │                │
     │ 6. Redirect    │                │                │
     │    to dashboard│                │                │
     │<───────────────│                │                │
     │                │                │                │
```

### Session Management

1. **Token Storage**: JWT stored in memory (not localStorage for security)
2. **Token Refresh**: Automatic refresh before expiration
3. **Auth State**: Managed via AuthContext, persisted across tabs
4. **Logout**: Clears tokens, redirects to login

---

## Core Business Flows

### 1. Project Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │     │    Add      │     │  Allocate   │     │   Track     │
│   Project   │────>│ Engagements │────>│   Trainers  │────>│  Progress   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
 ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
 │ status: │        │ Auto-   │        │ Check   │        │ Update  │
 │upcoming │        │ generate│        │ avail.  │        │ status  │
 └─────────┘        │ batches │        │ confirm │        │ reports │
                    └─────────┘        └─────────┘        └─────────┘
```

**Detailed Steps:**

1. **Create Project**
   - PM fills project details (client, dates, description)
   - Project created with status: "upcoming"
   - API: `POST /projects`

2. **Add Engagements**
   - PM adds training engagements to project
   - Specify domain, students, batch size, dates
   - System auto-generates batches
   - API: `POST /projects/{id}/engagements`

3. **Batch Generation Logic**
   ```
   batchCount = ceil(totalStudents / studentsPerBatch)
   for i in range(batchCount):
       batch = {
           batchNumber: i + 1,
           students: min(studentsPerBatch, remaining),
           status: "pending"
       }
   ```

4. **Trainer Allocation**
   - PM views available trainers for domain
   - System checks overlap/conflicts
   - PM allocates trainer → status: "awaiting_confirmation"
   - PM confirms allocation → status: "confirmed"
   - API: `PUT /batches/{id}/allocate`, `POST /batches/{id}/confirm`

5. **Progress Tracking**
   - Dashboard shows project stats
   - Track confirmed vs pending batches
   - Monitor trainer utilization

---

### 2. Trainer Allocation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    TRAINER ALLOCATION WORKFLOW                   │
└──────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │ Batch needs │
     │   trainer   │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐        ┌─────────────┐
     │ Get trainers│        │   Filter:   │
     │ by domain   │───────>│  - expertise│
     └─────────────┘        │  - status   │
                            │  - capacity │
                            └──────┬──────┘
                                   │
            ┌──────────────────────┤
            │                      │
            ▼                      ▼
     ┌─────────────┐        ┌─────────────┐
     │  Trainers   │        │ No trainers │
     │  available  │        │  available  │
     └──────┬──────┘        └──────┬──────┘
            │                      │
            ▼                      ▼
     ┌─────────────┐        ┌─────────────┐
     │Check overlap│        │ Create HR   │
     │  conflicts  │        │  Request    │
     └──────┬──────┘        └─────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐  ┌─────────┐
│No overlap│  │ Overlap │
│ - Select │  │ - Show  │
│ - Allocate│ │  warning│
│ - Confirm│  │ - Allow │
└─────────┘   │override │
              └─────────┘
```

**Overlap Detection:**
```python
def check_trainer_overlap(trainer_id, start_date, end_date, exclude_batch_id=None):
    overlapping = []
    for batch in trainer.assigned_batches:
        if batch.id == exclude_batch_id:
            continue
        if date_ranges_overlap(batch.start, batch.end, start_date, end_date):
            overlapping.append(batch)
    return OverlapInfo(has_overlap=len(overlapping) > 0, overlapping_batches=overlapping)
```

---

### 3. HR Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      HR REQUEST WORKFLOW                         │
└──────────────────────────────────────────────────────────────────┘

 PM                          HR                         System
  │                          │                            │
  │ 1. No trainers available │                            │
  │    for domain            │                            │
  ├─────────────────────────>│                            │
  │ 2. Create HR Request     │                            │
  │    - domain              │                            │
  │    - trainers needed     │                            │
  │    - urgency             │                            │
  │    - notes               │                            │
  │──────────────────────────┼───────────────────────────>│
  │                          │                            │
  │                          │ 3. HR views pending        │
  │                          │    requests                │
  │                          │<───────────────────────────│
  │                          │                            │
  │                          │ 4. Update status:          │
  │                          │    "in_progress"           │
  │                          │───────────────────────────>│
  │                          │                            │
  │                          │ 5. Hire/onboard trainers   │
  │                          │───────────────────────────>│
  │                          │                            │
  │                          │ 6. Mark as "fulfilled"     │
  │                          │───────────────────────────>│
  │                          │                            │
  │ 7. Trainers now available│                            │
  │<──────────────────────────────────────────────────────│
```

---

### 4. Attendance Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      ATTENDANCE WORKFLOW                         │
└──────────────────────────────────────────────────────────────────┘

 Trainer                     System                      PM/Admin
    │                          │                            │
    │ 1. View assigned         │                            │
    │    batches for today     │                            │
    │<─────────────────────────│                            │
    │                          │                            │
    │ 2. Punch In              │                            │
    │    - Select batch        │                            │
    │    - Record time         │                            │
    │─────────────────────────>│                            │
    │                          │ 3. Create attendance       │
    │                          │    record                  │
    │                          │    status: "pending"       │
    │                          │                            │
    │         ... Training Session ...                      │
    │                          │                            │
    │ 4. Punch Out             │                            │
    │    - Add notes           │                            │
    │    - Record time         │                            │
    │─────────────────────────>│                            │
    │                          │ 5. Update attendance       │
    │                          │    status: "present"       │
    │                          │                            │
    │                          │ 6. View attendance         │
    │                          │    reports                 │
    │                          │───────────────────────────>│
```

---

## Page-by-Page Flow

### 1. Login Page (`/login`)
- **Purpose**: Authenticate users
- **Flow**: 
  1. User enters email/password
  2. Submit → API call
  3. Success → Redirect to Dashboard
  4. Failure → Show error message

### 2. Dashboard Page (`/dashboard`)
- **Purpose**: Overview of system status
- **Components**:
  - Stats cards (trainers, projects, batches)
  - Upcoming batches list
  - HR requests summary
  - Calendar preview
- **Data Sources**: Multiple API calls aggregated

### 3. Projects Page (`/projects`)
- **Purpose**: List and manage projects
- **Features**:
  - Search by name/client
  - Filter by status
  - Create new project modal
  - View project details

### 4. Project Detail Page (`/projects/:id`)
- **Purpose**: Manage single project
- **Sections**:
  - Project info card
  - Engagements list
  - Batch allocation table
  - Progress stats
- **Actions**:
  - Add engagement
  - Allocate trainers
  - Confirm allocations

### 5. Trainers Page (`/trainers`)
- **Purpose**: Trainer management
- **Features**:
  - Grid/list view toggle
  - Filter by status/expertise
  - Bulk upload
  - Add individual trainer
  - View trainer profile

### 6. Calendar Page (`/calendar`)
- **Purpose**: Visual schedule
- **Views**: Month/Week
- **Events**: Batches color-coded by status
- **Interactions**: Click event for details

### 7. HR Requests Page (`/hr-requests`)
- **Purpose**: Manage hiring requests
- **Columns**: Project, Domain, Urgency, Status
- **Actions**: Update status, add notes

### 8. Attendance Page (`/attendance`)
- **Purpose**: Track/record attendance
- **Trainer View**: Punch in/out for assigned batches
- **Admin View**: View all attendance records

### 9. Reports Page (`/reports`)
- **Purpose**: Analytics and insights
- **Reports**:
  - Trainer utilization
  - Project completion
  - Batch status distribution
  - Monthly trends

### 10. Settings Page (`/settings`)
- **Purpose**: User preferences
- **Sections**:
  - Profile settings
  - Password change
  - Notification preferences
  - Theme settings

---

## Data Flow Diagrams

### State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT CONTEXT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │    App.tsx      │
                    │  (Root Level)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  AuthProvider   │ │  DataProvider   │ │SettingsProvider │
│                 │ │                 │ │                 │
│ - user          │ │ - trainers      │ │ - theme         │
│ - session       │ │ - projects      │ │ - language      │
│ - login()       │ │ - hrRequests    │ │ - notifications │
│ - logout()      │ │ - addProject()  │ │                 │
│                 │ │ - addTrainer()  │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Components   │
                    │                 │
                    │  useAuth()      │
                    │  useData()      │
                    │  useSettings()  │
                    └─────────────────┘
```

### API Call Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       API REQUEST FLOW                          │
└─────────────────────────────────────────────────────────────────┘

 Component                API Layer              Backend
     │                        │                     │
     │ 1. User action         │                     │
     │    (e.g., save)        │                     │
     ├───────────────────────>│                     │
     │                        │                     │
     │ 2. Show loading        │ 3. HTTP Request     │
     │    state               │    + JWT token      │
     │                        │────────────────────>│
     │                        │                     │
     │                        │ 4. Validate token   │
     │                        │    Check RLS        │
     │                        │    Execute query    │
     │                        │                     │
     │                        │ 5. Response         │
     │                        │<────────────────────│
     │                        │                     │
     │ 6. Update state        │                     │
     │    Hide loading        │                     │
     │    Show toast          │                     │
     │<───────────────────────│                     │
     │                        │                     │
     │ 7. Re-render with      │                     │
     │    new data            │                     │
     │                        │                     │
```

---

## Error Handling

### Error Types & Responses

| Error Type | HTTP Code | User Message | Action |
|------------|-----------|--------------|--------|
| Authentication | 401 | "Session expired" | Redirect to login |
| Authorization | 403 | "Access denied" | Show error toast |
| Validation | 400 | Field-specific | Highlight fields |
| Not Found | 404 | "Resource not found" | Show error page |
| Server Error | 500 | "Something went wrong" | Show retry option |
| Network | - | "Connection lost" | Show offline banner |

---

## Security Considerations

1. **Authentication**: JWT-based, short-lived tokens
2. **Authorization**: Role-based access control (RBAC)
3. **RLS Policies**: Database-level security
4. **Input Validation**: Both client and server side
5. **Password Security**: Server-side verification required
6. **Session Management**: Secure token handling

---

## Performance Optimizations

1. **Lazy Loading**: Route-based code splitting
2. **Pagination**: Server-side pagination for lists
3. **Caching**: React Query for API response caching
4. **Debouncing**: Search inputs debounced
5. **Memoization**: Heavy computations memoized
