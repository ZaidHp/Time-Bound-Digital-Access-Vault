from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from schemas import UserAuth, Token
from core.security import verify_password, get_password_hash, create_access_token

# Create the Router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=Token)
async def register(user_data: UserAuth, db: AsyncSession = Depends(get_db)):
    #Check if user exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    #Create new user
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, password_hash=hashed_pw)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    #Generate Token
    access_token = create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(user_data: UserAuth, db: AsyncSession = Depends(get_db)):
    #Fetch user
    result = await db.execute(select(User).where(User.username == user_data.username))
    user = result.scalars().first()

    #Verify credentials
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    #Generate Token
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}