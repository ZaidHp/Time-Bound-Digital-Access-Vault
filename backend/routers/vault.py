# # backend/routers/vault.py
# from typing import List
# import asyncio
# import secrets
# from datetime import datetime
# from fastapi import APIRouter, Depends, HTTPException, status, Request
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select
#
# from database import get_db
# from models import VaultItem, User, ShareLink, AccessLog
# from schemas import (
#     VaultItemCreate, VaultItemResponse,
#     ShareLinkCreate, ShareLinkResponse,
#     ShareMetaData, ShareAccessRequest, VaultContentResponse
# )
# from core.security import get_current_user, get_password_hash, verify_password
#
# router = APIRouter(
#     prefix="/vault",
#     tags=["Vault Items"]
# )
#
#
# @router.post("/items", response_model=VaultItemResponse)
# async def create_vault_item(
#         item: VaultItemCreate,
#         db: AsyncSession = Depends(get_db),
#         current_user: User = Depends(get_current_user)
# ):
#     # Create the database object
#     new_item = VaultItem(
#         title=item.title,
#         content=item.content,
#         owner_id=current_user.id
#     )
#
#     # Save to DB
#     db.add(new_item)
#     await db.commit()
#     await db.refresh(new_item)
#
#     return new_item
#
# @router.get("/items", response_model=List[VaultItemResponse])
# async def read_vault_items(
#     skip: int = 0,
#     limit: int = 100,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     # Query items where owner_id matches the logged-in user
#     query = select(VaultItem).where(VaultItem.owner_id == current_user.id).offset(skip).limit(limit)
#     result = await db.execute(query)
#     items = result.scalars().all()
#     return items
#
#
# @router.post("/share", response_model=ShareLinkResponse)
# async def create_share_link(
#         share_data: ShareLinkCreate,
#         db: AsyncSession = Depends(get_db),
#         current_user: User = Depends(get_current_user)
# ):
#     # 1. Verify Ownership (Security Requirement)
#     # Ensure the user actually owns the item they are trying to share
#     result = await db.execute(select(VaultItem).where(VaultItem.id == share_data.vault_item_id))
#     item = result.scalars().first()
#
#     if not item or item.owner_id != current_user.id:
#         raise HTTPException(status_code=404, detail="Vault item not found")
#
#     # 2. Generate Unique Token
#     token = secrets.token_urlsafe(16)  # Creates a random string like "D5a_1bX..."
#
#     # 3. Hash the optional password (if provided)
#     hashed_pw = get_password_hash(share_data.password) if share_data.password else None
#
#     # 4. Save to DB
#     new_share = ShareLink(
#         vault_item_id=share_data.vault_item_id,
#         token=token,
#         expires_at=share_data.expires_at,
#         max_views=share_data.max_views,
#         password_hash=hashed_pw
#     )
#
#     db.add(new_share)
#     await db.commit()
#
#     # Return the full link URL (Assuming frontend runs on port 3000)
#     full_link = f"http://localhost:3000/access/{token}"
#
#     return {
#         "share_link": full_link,
#         "expires_at": share_data.expires_at,
#         "max_views": share_data.max_views
#     }
#
#
# @router.get("/shared/{token}", response_model=ShareMetaData)
# async def get_share_metadata(token: str, db: AsyncSession = Depends(get_db)):
#     # Fetch Link
#     result = await db.execute(select(ShareLink).where(ShareLink.token == token))
#     share = result.scalars().first()
#
#     if not share:
#         # Security: Return 404 immediately to prevent guessing
#         raise HTTPException(status_code=404, detail="Link invalid or expired")
#
#     # Check Status
#     is_expired = share.expires_at < datetime.utcnow()
#     is_exhausted = share.current_views >= share.max_views
#
#     # Fetch Title (Safe to display)
#     item_result = await db.execute(select(VaultItem).where(VaultItem.id == share.vault_item_id))
#     item = item_result.scalars().first()
#
#     return {
#         "title": item.title if item else "Unknown Item",
#         "is_password_protected": share.password_hash is not None,
#         "expires_at": share.expires_at,
#         "is_locked": is_expired or is_exhausted
#     }
#
#
# # 2. Attempt to Unlock Content
# @router.post("/shared/{token}/access", response_model=VaultContentResponse)
# async def access_shared_content(
#         token: str,
#         req: ShareAccessRequest,
#         request: Request,
#         db: AsyncSession = Depends(get_db)
# ):
#     # Fetch Link
#     result = await db.execute(select(ShareLink).where(ShareLink.token == token))
#     share = result.scalars().first()
#
#     if not share:
#         raise HTTPException(status_code=404, detail="Link not found")
#
#     client_ip = request.client.host if request.client else "unknown"
#
#     # --- VALIDATION CHECKS ---
#
#     # 1. Check Expiration
#     if share.expires_at < datetime.utcnow():
#         await log_attempt(db, share.id, "denied_expired", client_ip)
#         raise HTTPException(status_code=410, detail="This link has expired.")
#
#     # 2. Check View Limit
#     if share.current_views >= share.max_views:
#         await log_attempt(db, share.id, "denied_view_limit", client_ip)
#         raise HTTPException(status_code=410, detail="View limit reached.")
#
#     # 3. Verify Password (if protected)
#     if share.password_hash:
#         if not req.password or not verify_password(req.password, share.password_hash):
#             # SECURITY: Artificial Delay to prevent brute force
#             await asyncio.sleep(2)
#             await log_attempt(db, share.id, "denied_bad_password", client_ip)
#             raise HTTPException(status_code=401, detail="Incorrect password.")
#
#     # --- SUCCESS ---
#
#     # Update View Count
#     share.current_views += 1
#     await log_attempt(db, share.id, "allowed", client_ip)
#     await db.commit()
#
#     # Retrieve Content
#     item_result = await db.execute(select(VaultItem).where(VaultItem.id == share.vault_item_id))
#     item = item_result.scalars().first()
#
#     return {
#         "content": item.content,
#         "message": "Access granted."
#     }
#
#
# # Helper to log attempts
# async def log_attempt(db: AsyncSession, share_id: int, outcome: str, ip: str):
#     new_log = AccessLog(
#         share_link_id=share_id,
#         outcome=outcome,
#         ip_address=ip
#     )
#     db.add(new_log)
#     try:
#         await db.commit()
#     except Exception:
#         await db.rollback()

# backend/routers/vault.py
import asyncio
import os
import secrets
from datetime import datetime, timezone  # <--- FIX 1: Import timezone
from typing import List
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import VaultItem, User, ShareLink, AccessLog
from schemas import (
    VaultItemCreate, VaultItemResponse,
    ShareLinkCreate, ShareLinkResponse,
    ShareMetaData, ShareAccessRequest,
    VaultContentResponse, AccessLogResponse
)
from core.security import get_current_user, get_password_hash, verify_password

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL")

router = APIRouter(
    prefix="/vault",
    tags=["Vault Items"]
)


# --- 1. Create Item ---
@router.post("/items", response_model=VaultItemResponse)
async def create_vault_item(
        item: VaultItemCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    new_item = VaultItem(
        title=item.title,
        content=item.content,
        owner_id=current_user.id
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item


# --- 2. List Items ---
@router.get("/items", response_model=List[VaultItemResponse])
async def read_vault_items(
        skip: int = 0,
        limit: int = 100,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    query = select(VaultItem).where(VaultItem.owner_id == current_user.id).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return items


# --- 3. Share Item (Generate Link) ---
@router.post("/share", response_model=ShareLinkResponse)
async def create_share_link(
        share_data: ShareLinkCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Verify Ownership
    result = await db.execute(select(VaultItem).where(VaultItem.id == share_data.vault_item_id))
    item = result.scalars().first()

    if not item or item.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Vault item not found")

    # Generate Token
    token = secrets.token_urlsafe(16)

    # Hash password if provided
    hashed_pw = get_password_hash(share_data.password) if share_data.password else None

    new_share = ShareLink(
        vault_item_id=share_data.vault_item_id,
        token=token,
        expires_at=share_data.expires_at,
        max_views=share_data.max_views,
        password_hash=hashed_pw
    )

    db.add(new_share)
    await db.commit()

    full_link = f"safga/access/{token}"

    return {
        "share_link": full_link,
        "expires_at": share_data.expires_at,
        "max_views": share_data.max_views
    }


# --- 4. Public: Get Link Metadata ---
@router.get("/shared/{token}", response_model=ShareMetaData)
async def get_share_metadata(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShareLink).where(ShareLink.token == token))
    share = result.scalars().first()

    if not share:
        raise HTTPException(status_code=404, detail="Link invalid or expired")

    # --- FIX 2: Use timezone-aware comparison ---
    # share.expires_at is aware, so we compare with aware current time
    is_expired = share.expires_at < datetime.now(timezone.utc)
    is_exhausted = share.current_views >= share.max_views

    item_result = await db.execute(select(VaultItem).where(VaultItem.id == share.vault_item_id))
    item = item_result.scalars().first()

    return {
        "title": item.title if item else "Unknown Item",
        "is_password_protected": share.password_hash is not None,
        "expires_at": share.expires_at,
        "is_locked": is_expired or is_exhausted
    }


# --- 5. Public: Access Content ---
@router.post("/shared/{token}/access", response_model=VaultContentResponse)
async def access_shared_content(
        token: str,
        req: ShareAccessRequest,
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ShareLink).where(ShareLink.token == token))
    share = result.scalars().first()

    if not share:
        raise HTTPException(status_code=404, detail="Link not found")

    client_ip = request.client.host if request.client else "unknown"

    # --- FIX 3: Use timezone-aware comparison ---
    if share.expires_at < datetime.now(timezone.utc):
        await log_attempt(db, share.id, "denied_expired", client_ip)
        raise HTTPException(status_code=410, detail="This link has expired.")

    if share.current_views >= share.max_views:
        await log_attempt(db, share.id, "denied_view_limit", client_ip)
        raise HTTPException(status_code=410, detail="View limit reached.")

    # Password Check
    if share.password_hash:
        if not req.password or not verify_password(req.password, share.password_hash):
            await asyncio.sleep(2)
            await log_attempt(db, share.id, "denied_bad_password", client_ip)
            raise HTTPException(status_code=401, detail="Incorrect password.")

    # Success
    share.current_views += 1
    await log_attempt(db, share.id, "allowed", client_ip)
    await db.commit()

    item_result = await db.execute(select(VaultItem).where(VaultItem.id == share.vault_item_id))
    item = item_result.scalars().first()

    return {
        "content": item.content,
        "message": "Access granted."
    }


# --- Helper: Log Attempts ---
async def log_attempt(db: AsyncSession, share_id: int, outcome: str, ip: str):
    new_log = AccessLog(
        share_link_id=share_id,
        outcome=outcome,
        ip_address=ip
    )
    db.add(new_log)
    try:
        await db.commit()
    except Exception:
        await db.rollback()


@router.get("/items/{item_id}/logs", response_model=List[AccessLogResponse])
async def read_item_logs(
        item_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # 1. Verify Ownership
    # We must ensure the user actually owns the vault item they are auditing.
    result = await db.execute(select(VaultItem).where(VaultItem.id == item_id))
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these logs")

    # 2. Query Logs
    # Join AccessLog with ShareLink to filter by the specific Vault Item ID
    query = (
        select(AccessLog, ShareLink.token)
        .join(ShareLink, AccessLog.share_link_id == ShareLink.id)
        .where(ShareLink.vault_item_id == item_id)
        .order_by(AccessLog.access_time.desc())  # Newest first
    )

    result = await db.execute(query)

    # 3. Format Response
    # Since we selected specific columns/entities, we map them to the schema
    logs = []
    for log_entry, token in result:
        logs.append({
            "id": log_entry.id,
            "share_link_token": token,
            "access_time": log_entry.access_time,
            "outcome": log_entry.outcome,
            "ip_address": log_entry.ip_address
        })

    return logs