from fastapi import APIRouter
from app.api.v1.endpoints import auth, students, classes, courses, sessions, checkin, reports, audit, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
api_router.include_router(users.router, prefix="/users", tags=["users"])

