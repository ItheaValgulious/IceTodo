from fastapi import FastAPI, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional, Union
import datetime
import json
import hashlib
import jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

SECRET_KEY = "your_secret_key_here"  # Change this to a secure secret key
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

class UserData(Base):
    __tablename__ = "user_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)  # JSON string of SyncContent

engine = create_engine("sqlite:///./db.sqlite3")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models
class Repeat(BaseModel):
    times: int
    days: Union[int, List[int]]
    punishment: str  # Assuming str for punishment

class DateTimeModel(BaseModel):
    year: int
    month: int
    day: int
    time_stamp: int

    @classmethod
    def from_datetime(cls, dt: datetime.datetime):
        return cls(
            year=dt.year,
            month=dt.month,
            day=dt.day,
            time_stamp=int(dt.timestamp() * 1000)  # Convert to milliseconds
        )
    
    def to_datetime(self) -> datetime.datetime:
        return datetime.datetime.fromtimestamp(self.time_stamp / 1000)

class Task(BaseModel):
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
    children: List["Task"] = Field(default_factory=list)
    repeat: Optional[Repeat] = None
    delete: bool = False
    highlight: bool = True

class Note(BaseModel):
    id: int
    content: str
    create_time: DateTimeModel
    update_time: DateTimeModel
    tags: List[str] = Field(default_factory=list)

class SyncContent(BaseModel):
    tasks: List[Task]
    notes: List[Note]
    task_tag: List[str]
    note_tag: List[str]
    time: int

# Rebuild for recursive Task
Task.model_rebuild()

# Helper functions
def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: int):
    return jwt.encode({"sub": str(user_id)}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Login endpoint
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

# Check endpoint
class CheckRequest(BaseModel):
    token: str
    hash: str

@app.post("/check/")
def check_hash(request: CheckRequest, db: Session = Depends(get_db)):
    user_id = get_current_user(request.token)
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    if not user_data:
        return {"need_sync": True}
    content_dict = json.loads(user_data.content)
    # Compute hash of sorted JSON (canonical form)
    server_hash = hashlib.sha256(json.dumps(content_dict, sort_keys=True).encode()).hexdigest()
    need_sync = server_hash != request.hash
    return {"need_sync": need_sync}

# Get sync (pull) endpoint - Using POST for body support, as GET with body is non-standard
# Note: Adjusted from user's "GET" to POST for practicality; client should use POST

class SyncPullRequest(BaseModel):
    token: str
@app.post("/sync/pull/")
def get_sync(request: SyncPullRequest, db: Session = Depends(get_db)):
    user_id = get_current_user(request.token)
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    if not user_data:
        # Return empty sync content if no data exists
        return SyncContent(
            tasks=[],
            notes=[],
            task_tag=[],
            note_tag=[],
            time=0
        )
    
    try:
        content_dict = json.loads(user_data.content)
        return SyncContent(**content_dict)
    except (json.JSONDecodeError, ValueError) as e:
        # If JSON parsing fails, return empty sync content
        return SyncContent(
            tasks=[],
            notes=[],
            task_tag=[],
            note_tag=[],
            time=0
        )
    except Exception as e:
        # If any other error occurs, raise HTTP exception
        raise HTTPException(status_code=422, detail=f"Error processing sync data: {str(e)}")

# Post sync (push) endpoint
class PushRequest(BaseModel):
    token: str
    content: SyncContent

@app.post("/sync/push/")
def push_sync(request: PushRequest, db: Session = Depends(get_db)):
    user_id = get_current_user(request.token)
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    # Serialize the content with proper handling of DateTimeModel objects
    content_dict = request.content.model_dump(mode='json')
    content_str = json.dumps(content_dict)
    
    if not user_data:
        user_data = UserData(user_id=user_id, content=content_str)
        db.add(user_data)
    else:
        user_data.content = content_str
    db.commit()
    return {"status": "success"}

# Note: To create users, you can add a register endpoint if needed, e.g.:
@app.post("/register")
def register(request: LoginRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(400, "User exists")
    print(request.username, request.password)
    hashed = get_password_hash(request.password)
    user = User(username=request.username, password_hash=hashed)
    db.add(user)
    db.commit()
    return {"status": "success"}

# Run with: uvicorn filename:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)