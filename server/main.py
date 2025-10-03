from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from typing import List, Optional, Union, Dict, Any
import datetime
import json
import jwt
from passlib.context import CryptContext

# --- Configuration ---
SECRET_KEY = "your_secret_key_here"  # Change this to a secure secret key
ALGORITHM = "HS256"
DATABASE_URL = "sqlite:///./db.sqlite3"

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Setup ---
Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- SQLAlchemy Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    user_info = relationship("UserInfo", back_populates="user", uselist=False)
    tasks = relationship("Task", back_populates="user")
    notes = relationship("Note", back_populates="user")

class UserInfo(Base):
    __tablename__ = "user_info"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_tags = Column(JSON, default=list)
    note_tags = Column(JSON, default=list)
    
    user = relationship("User", back_populates="user_info")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    update_time = Column(Integer)

    user = relationship("User", back_populates="tasks")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    update_time = Column(Integer)
    
    user = relationship("User", back_populates="notes")

class Day(Base):
    __tablename__ = "days"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date_str = Column(String)  # Format: "YYYY-MM-DD"
    update_time = Column(Integer)
    
    user = relationship("User")



Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---
class Repeat(BaseModel):
    times: int
    days: Union[int, List[int]]
    punishment: str

class DateTimeModel(BaseModel):
    year: int
    month: int
    day: int
    time_stamp: int

class TaskModel(BaseModel):
    id: int
    title: str
    is_done: bool
    content: Optional[str] = ""
    create_time: DateTimeModel
    update_time: DateTimeModel
    begin_time: Optional[DateTimeModel] = None
    due_time: Optional[DateTimeModel] = None
    priority: int = Field(default=5, ge=0, le=9)
    tags: List[str] = Field(default_factory=list)
    children: List[str] = Field(default_factory=list)
    repeat: Optional[Repeat] = None
    delete: bool = False
    highlight: bool = True

class NoteModel(BaseModel):
    id: int
    content: str
    create_time: DateTimeModel
    update_time: DateTimeModel
    tags: List[str] = Field(default_factory=list)

class SyncContent(BaseModel):
    tasks: List[TaskModel]
    notes: List[NoteModel]
    task_tag: List[str]
    note_tag: List[str]
    time: int

# --- Helper Functions ---
def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: int):
    return jwt.encode({"sub": str(user_id)}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")



def get_day_timestamp_range(year: int, month: int, day: int) -> tuple:
    """Get start and end timestamps for a specific day"""
    start_date = datetime.datetime(year, month, day)
    end_date = start_date + datetime.timedelta(days=1)
    start_timestamp = int(start_date.timestamp() * 1000)
    end_timestamp = int(end_date.timestamp() * 1000)
    return start_timestamp, end_timestamp

def get_create_time_from_content(content: str) -> DateTimeModel:
    """Extract create_time from task/note content"""
    try:
        data = json.loads(content)
        create_time_data = data.get('create_time', {})
        return DateTimeModel(
            year=create_time_data.get('year', 1970),
            month=create_time_data.get('month', 1),
            day=create_time_data.get('day', 1),
            time_stamp=create_time_data.get('time_stamp', 0)
        )
    except (json.JSONDecodeError, KeyError):
        return DateTimeModel(year=1970, month=1, day=1, time_stamp=0)



# --- FastAPI App ---
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# --- Endpoints ---
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    status: str
    token: Optional[str] = None

@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        return LoginResponse(status="failed")
    token = create_token(user.id)
    return LoginResponse(status="success", token=token)



class SyncPullRequest(BaseModel):
    token: str
    year: int
    month: int
    day: int

@app.post("/sync/pull/")
def get_sync(request: SyncPullRequest, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request.token)
    
    user_info = db.query(UserInfo).filter(UserInfo.user_id == user_id).first()
    if not user_info:
        user_info = UserInfo(user_id=user_id, task_tags=[], note_tags=[])
        db.add(user_info)
        db.commit()

    # Get day update time from day table
    date_str = f"{request.year}-{request.month:02d}-{request.day:02d}"
    day_record = db.query(Day).filter(Day.user_id == user_id, Day.date_str == date_str).first()
    update_time = day_record.update_time if day_record else int(datetime.datetime.now().timestamp() * 1000)

    # Get all tasks and notes for the user
    tasks_db = db.query(Task).filter(Task.user_id == user_id).all()
    notes_db = db.query(Note).filter(Note.user_id == user_id).all()

    # Filter by create_time within the specified day
    tasks = []
    notes = []
    
    for task_db in tasks_db:
        create_time = get_create_time_from_content(task_db.content)
        if (create_time.year == request.year and 
            create_time.month == request.month and 
            create_time.day == request.day):
            tasks.append(TaskModel.model_validate_json(task_db.content))
    
    for note_db in notes_db:
        create_time = get_create_time_from_content(note_db.content)
        if (create_time.year == request.year and 
            create_time.month == request.month and 
            create_time.day == request.day):
            notes.append(NoteModel.model_validate_json(note_db.content))

    return SyncContent(
        tasks=tasks,
        notes=notes,
        task_tag=user_info.task_tags,
        note_tag=user_info.note_tags,
        time=update_time
    )

class PushRequest(BaseModel):
    token: str
    year: int
    month: int
    day: int
    time: int  # New time parameter
    content: SyncContent

class GetDaysRequest(BaseModel):
    token: str

@app.post("/sync/push/")
def push_sync(request: PushRequest, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request.token)

    # Get all existing tasks and notes for the user
    existing_tasks = db.query(Task).filter(Task.user_id == user_id).all()
    existing_notes = db.query(Note).filter(Note.user_id == user_id).all()

    # Delete existing data created on the specified day
    for task_db in existing_tasks:
        create_time = get_create_time_from_content(task_db.content)
        if (create_time.year == request.year and 
            create_time.month == request.month and 
            create_time.day == request.day):
            db.delete(task_db)
    
    for note_db in existing_notes:
        create_time = get_create_time_from_content(note_db.content)
        if (create_time.year == request.year and 
            create_time.month == request.month and 
            create_time.day == request.day):
            db.delete(note_db)

    # Add new tasks and notes
    for task_model in request.content.tasks:
        db_task = Task(
            user_id=user_id,
            content=task_model.model_dump_json(),
            update_time=task_model.update_time.time_stamp
        )
        db.add(db_task)
            
    for note_model in request.content.notes:
        db_note = Note(
            user_id=user_id,
            content=note_model.model_dump_json(),
            update_time=note_model.update_time.time_stamp
        )
        db.add(db_note)

    # Update user tags
    user_info = db.query(UserInfo).filter(UserInfo.user_id == user_id).first()
    if not user_info:
        user_info = UserInfo(user_id=user_id)
        db.add(user_info)
    user_info.task_tags = request.content.task_tag
    user_info.note_tags = request.content.note_tag

    # Update day update time
    date_str = f"{request.year}-{request.month:02d}-{request.day:02d}"
    day_record = db.query(Day).filter(Day.user_id == user_id, Day.date_str == date_str).first()
    if day_record:
        day_record.update_time = request.time
    else:
        day_record = Day(user_id=user_id, date_str=date_str, update_time=request.time)
        db.add(day_record)

    db.commit()
    return {"status": "success"}

@app.post("/get_days/")
def get_days(request: GetDaysRequest, db: Session = Depends(get_db)):
    """Get a dictionary of all dates with their update times for the user"""
    user_id = get_current_user_id(request.token)
    
    # Get all day records for the user
    day_records = db.query(Day).filter(Day.user_id == user_id).all()
    
    dates_dict = {}
    
    # Process day records to build dates dictionary
    for day_record in day_records:
        dates_dict[day_record.date_str] = day_record.update_time
    
    return {"days": dates_dict}

@app.post("/register")
def register(request: LoginRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(400, "User exists")
    hashed = get_password_hash(request.password)
    user = User(username=request.username, password_hash=hashed)
    db.add(user)
    db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)