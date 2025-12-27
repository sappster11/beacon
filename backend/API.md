# Beacon API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints except `/auth/login` require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "EMPLOYEE"
  }
}
```

## User Roles
- `EMPLOYEE` - Standard employee
- `MANAGER` - Can manage direct reports
- `HR_ADMIN` - HR administrator
- `SUPER_ADMIN` - Full system access

---

## Users & Organization

### Get All Users
```http
GET /users
Roles: HR_ADMIN, SUPER_ADMIN
```

### Get User by ID
```http
GET /users/:id
```

### Get Org Chart
```http
GET /users/org/chart
```

### Get Direct Reports
```http
GET /users/:id/reports
```

### Create User
```http
POST /users
Roles: HR_ADMIN, SUPER_ADMIN

{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "title": "Software Engineer",
  "role": "EMPLOYEE",
  "managerId": "manager-uuid",
  "departmentId": "dept-uuid",
  "hireDate": "2024-01-15"
}
```

### Update User
```http
PATCH /users/:id
Roles: HR_ADMIN, SUPER_ADMIN

{
  "title": "Senior Software Engineer",
  "departmentId": "new-dept-uuid"
}
```

---

## Departments

### Get All Departments
```http
GET /departments
```

### Get Department Tree (Hierarchy)
```http
GET /departments/tree
```

### Get Department by ID
```http
GET /departments/:id
```

### Create Department
```http
POST /departments
Roles: HR_ADMIN, SUPER_ADMIN

{
  "name": "Engineering",
  "parentDepartmentId": "parent-dept-uuid" // optional
}
```

### Update Department
```http
PATCH /departments/:id
Roles: HR_ADMIN, SUPER_ADMIN

{
  "name": "Product Engineering"
}
```

### Delete Department
```http
DELETE /departments/:id
Roles: HR_ADMIN, SUPER_ADMIN
```

---

## Review Cycles

### Get All Review Cycles
```http
GET /reviews/cycles
```

### Get Review Cycle by ID
```http
GET /reviews/cycles/:id
```

### Create Review Cycle
```http
POST /reviews/cycles
Roles: HR_ADMIN, SUPER_ADMIN

{
  "name": "Q1 2024 Reviews",
  "type": "QUARTERLY", // QUARTERLY | SEMI_ANNUAL | ANNUAL
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

### Update Review Cycle
```http
PATCH /reviews/cycles/:id
Roles: HR_ADMIN, SUPER_ADMIN

{
  "status": "closed"
}
```

---

## Reviews

### Get My Reviews
```http
GET /reviews/my-reviews
```

### Get Review by ID
```http
GET /reviews/:id
```

### Create Review
```http
POST /reviews
Roles: MANAGER, HR_ADMIN, SUPER_ADMIN

{
  "revieweeId": "employee-uuid",
  "reviewerId": "manager-uuid",
  "cycleId": "cycle-uuid"
}
```

### Submit Self-Assessment
```http
PATCH /reviews/:id/self-assessment

{
  "selfAssessment": "This quarter I accomplished..."
}
```

### Submit Manager Assessment
```http
PATCH /reviews/:id/manager-assessment

{
  "managerAssessment": "Performance summary...",
  "overallRating": 3 // 1-4 scale
}
```

### Rating Scale
- `1` - Does Not Meet Expectations
- `2` - Partially Meets Expectations
- `3` - Meets Expectations
- `4` - Exceeds Expectations

---

## Peer Feedback (Anonymous)

### Submit Peer Feedback
```http
POST /reviews/:reviewId/peer-feedback

{
  "feedback": "Great collaboration skills...",
  "rating": 4 // 1-4 scale, optional
}
```

### Get Peer Feedback for Review
```http
GET /reviews/:reviewId/peer-feedback

Response:
[
  {
    "id": "feedback-uuid",
    "feedback": "Great teamwork...",
    "rating": 4,
    "createdAt": "2024-01-15T10:00:00Z"
    // Note: giver information is NOT included (anonymous)
  }
]
```

---

## Goals (OKRs)

### Goal Visibility
- `PRIVATE` - Only owner can see
- `TEAM` - Owner's team can see
- `COMPANY` - Everyone can see

### Goal Status
- `DRAFT` - Not started
- `ACTIVE` - In progress
- `COMPLETED` - Finished
- `CANCELLED` - Cancelled

### Get My Goals
```http
GET /goals/my-goals
```

### Get User's Goals
```http
GET /goals/user/:userId
```

### Get Company Goals
```http
GET /goals/company
```

### Get Goal by ID
```http
GET /goals/:id
```

### Create Goal
```http
POST /goals

{
  "title": "Increase user engagement",
  "description": "Improve DAU by 20%",
  "targetValue": 100000,
  "currentValue": 80000,
  "unit": "users",
  "dueDate": "2024-12-31",
  "status": "ACTIVE",
  "visibility": "COMPANY",
  "parentGoalId": "parent-goal-uuid" // For OKR alignment
}
```

### Update Goal
```http
PATCH /goals/:id

{
  "status": "COMPLETED",
  "currentValue": 105000
}
```

### Update Goal Progress
```http
PATCH /goals/:id/progress

{
  "currentValue": 95000
}
```

### Delete Goal
```http
DELETE /goals/:id
```

### Get Goal Alignment Tree
```http
GET /goals/:id/tree

Response: Hierarchical tree of goal and all child goals
```

---

## One-on-One Meetings

### Meeting Status
- `scheduled`
- `completed`
- `cancelled`

### Get My Meetings
```http
GET /one-on-ones/my-meetings
```

### Get Upcoming Meetings
```http
GET /one-on-ones/upcoming
```

### Get Meeting by ID
```http
GET /one-on-ones/:id

Note: Manager notes are hidden from employee
```

### Create Meeting
```http
POST /one-on-ones

{
  "employeeId": "employee-uuid",
  "scheduledAt": "2024-02-15T14:00:00Z",
  "agenda": "Q1 goals review, career development"
}
```

### Update Meeting
```http
PATCH /one-on-ones/:id

{
  "scheduledAt": "2024-02-16T14:00:00Z",
  "status": "completed"
}
```

### Update Shared Notes
```http
PATCH /one-on-ones/:id/shared-notes

{
  "sharedNotes": "Discussed project progress..."
}
```

### Update Manager Notes (Manager Only)
```http
PATCH /one-on-ones/:id/manager-notes

{
  "managerNotes": "Private notes about performance..."
}
```

### Update Action Items
```http
PATCH /one-on-ones/:id/action-items

{
  "actionItems": "[{\"task\": \"Complete training\", \"due\": \"2024-03-01\"}]"
}
```

### Mark as Completed
```http
PATCH /one-on-ones/:id/complete
```

### Cancel Meeting
```http
PATCH /one-on-ones/:id/cancel
```

### Delete Meeting
```http
DELETE /one-on-ones/:id
```

---

## Development Plans

### Get My Development Plan
```http
GET /development-plans/my-plan
```

### Get User's Development Plan
```http
GET /development-plans/user/:userId
```

### Get Development Plan by ID
```http
GET /development-plans/:id
```

### Create Development Plan
```http
POST /development-plans

{
  "careerGoals": "Become a senior engineer within 2 years",
  "skillsToAdd": ["Python", "System Design", "Leadership"],
  "milestones": [
    {
      "title": "Complete advanced Python course",
      "dueDate": "2024-06-30",
      "completed": false
    }
  ]
}
```

### Update Development Plan
```http
PATCH /development-plans/:id

{
  "careerGoals": "Updated career goals...",
  "skillsToAdd": ["Python", "System Design", "Leadership", "GraphQL"]
}
```

### Update Progress
```http
PATCH /development-plans/:id/progress

{
  "progress": 45 // 0-100
}
```

### Delete Development Plan
```http
DELETE /development-plans/:id
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Access Control Summary

| Endpoint | Employee | Manager | HR Admin | Super Admin |
|----------|----------|---------|----------|-------------|
| Own profile | ✓ | ✓ | ✓ | ✓ |
| Direct reports | - | ✓ | ✓ | ✓ |
| All users | - | - | ✓ | ✓ |
| Create users | - | - | ✓ | ✓ |
| Create review cycles | - | - | ✓ | ✓ |
| Create reviews | - | ✓ | ✓ | ✓ |
| Own goals | ✓ | ✓ | ✓ | ✓ |
| Company goals (view) | ✓ | ✓ | ✓ | ✓ |
| 1:1s (own) | ✓ | ✓ | ✓ | ✓ |
| Development plans (own) | ✓ | ✓ | ✓ | ✓ |
| Departments (manage) | - | - | ✓ | ✓ |

---

## Data Models Reference

### User
- `id`, `email`, `name`, `title`, `role`
- `managerId`, `departmentId`, `hireDate`
- `gustoId` (for HRIS sync)

### Review
- `id`, `revieweeId`, `reviewerId`, `cycleId`
- `overallRating` (1-4)
- `selfAssessment`, `managerAssessment`
- `status`: NOT_STARTED | IN_PROGRESS | COMPLETED | CALIBRATED

### Goal
- `id`, `ownerId`, `parentGoalId`
- `title`, `description`
- `targetValue`, `currentValue`, `unit`
- `dueDate`, `status`, `visibility`

### OneOnOne
- `id`, `managerId`, `employeeId`
- `scheduledAt`, `status`
- `agenda`, `sharedNotes`, `managerNotes`, `actionItems`

### DevelopmentPlan
- `id`, `userId`
- `careerGoals`, `skillsToAdd`, `milestones`
- `progress` (0-100)
