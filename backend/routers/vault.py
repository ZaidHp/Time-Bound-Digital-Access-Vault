import asyncio
import os
import secrets
from datetime import datetime, timezone
from typing import List
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_

from database import get_db
from models import VaultItem, User, ShareLink, AccessLog
from schemas import (
    VaultItemCreate, VaultItemResponse,
    ShareLinkCreate, ShareLinkResponse,
    ShareMetaData, ShareAccessRequest,
    VaultContentResponse, AccessLogResponse,
    VaultItemUpdate, ShareLinkStatus,
    ShareLinkUpdate, VaultStats
)
from core.security import get_current_user, get_password_hash, verify_password

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

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

    full_link = f"{FRONTEND_URL}/access/{token}"

    return {
        "share_link": full_link,
        "expires_at": share_data.expires_at,
        "max_views": share_data.max_views
    }


# --- 4. Public: Get Link Metadata ---
@router.get("/shared/{token}", response_model=ShareMetaData)
async def get_share_metadata(token: str, db: AsyncSession = Depends(get_db)):
    # FIX: Exclude deleted links. If deleted, we return 404 (Link invalid)
    result = await db.execute(
        select(ShareLink)
        .where(ShareLink.token == token)
        .where(ShareLink.is_deleted == False)
    )
    share = result.scalars().first()

    if not share:
        raise HTTPException(status_code=404, detail="Link invalid or expired")

    # If revoked (active=False), we treat it as locked
    is_revoked = not share.is_active
    is_expired = share.expires_at < datetime.now(timezone.utc)
    is_exhausted = share.current_views >= share.max_views

    item_result = await db.execute(select(VaultItem).where(VaultItem.id == share.vault_item_id))
    item = item_result.scalars().first()

    return {
        "title": item.title if item else "Unknown Item",
        "is_password_protected": share.password_hash is not None,
        "expires_at": share.expires_at,
        "is_locked": is_revoked or is_expired or is_exhausted
    }


# --- 5. Public: Access Content ---
@router.post("/shared/{token}/access", response_model=VaultContentResponse)
async def access_shared_content(
        token: str,
        req: ShareAccessRequest,
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    # FIX: Exclude deleted links
    result = await db.execute(
        select(ShareLink)
        .where(ShareLink.token == token)
        .where(ShareLink.is_deleted == False)
    )
    share = result.scalars().first()

    if not share:
        raise HTTPException(status_code=404, detail="Link not found")

    client_ip = request.client.host if request.client else "unknown"

    # Security Checks
    if not share.is_active:
        await log_attempt(db, share.id, "denied_revoked", client_ip)
        raise HTTPException(status_code=410, detail="This link has been revoked.")

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
    result = await db.execute(select(VaultItem).where(VaultItem.id == item_id))
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these logs")

    # Logs are historical, so we generally show them even if the link was later deleted.
    query = (
        select(AccessLog, ShareLink.token)
        .join(ShareLink, AccessLog.share_link_id == ShareLink.id)
        .where(ShareLink.vault_item_id == item_id)
        .order_by(AccessLog.access_time.desc())
    )

    result = await db.execute(query)

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


@router.put("/items/{item_id}", response_model=VaultItemResponse)
async def update_vault_item(
        item_id: int,
        item_update: VaultItemUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(VaultItem).where(VaultItem.id == item_id))
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")

    if item_update.title is not None:
        item.title = item_update.title
    if item_update.content is not None:
        item.content = item_update.content

    await db.commit()
    await db.refresh(item)

    return item


# --- 6. Manage Shares: List Links ---
@router.get("/items/{item_id}/shares", response_model=List[ShareLinkStatus])
async def get_item_share_links(
        item_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(VaultItem).where(VaultItem.id == item_id))
    item = result.scalars().first()

    if not item or item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Filter out deleted links
    links_result = await db.execute(
        select(ShareLink)
        .where(ShareLink.vault_item_id == item_id)
        .where(ShareLink.is_deleted == False)
        .order_by(ShareLink.id.desc())
    )
    links = links_result.scalars().all()

    response_data = []
    now = datetime.now(timezone.utc)

    for link in links:
        remaining = max(0, link.max_views - link.current_views)

        if not link.is_active:
            status_label = "Revoked"
        elif link.current_views >= link.max_views:
            status_label = "Locked"
        elif link.expires_at < now:
            status_label = "Expired"
        else:
            status_label = "Active"

        response_data.append({
            "id": link.id,
            "token": link.token,
            "expires_at": link.expires_at,
            "max_views": link.max_views,
            "current_views": link.current_views,
            "remaining_views": remaining,
            "status": status_label,
            "is_password_protected": link.password_hash is not None,
            "is_active": link.is_active,
            "is_deleted": link.is_deleted  # <--- FIX: Added missing field
        })

    return response_data


# --- 7. Manage Shares: Update Link ---
@router.put("/shares/{share_id}", response_model=ShareLinkStatus)
async def update_share_link(
        share_id: int,
        update_data: ShareLinkUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ShareLink, VaultItem)
        .join(VaultItem, ShareLink.vault_item_id == VaultItem.id)
        .where(ShareLink.id == share_id)
        .where(ShareLink.is_deleted == False)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Link not found")

    share_link, vault_item = row

    if vault_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if update_data.expires_at is not None:
        share_link.expires_at = update_data.expires_at
    if update_data.max_views is not None:
        share_link.max_views = update_data.max_views
    if update_data.is_active is not None:
        share_link.is_active = update_data.is_active

    await db.commit()
    await db.refresh(share_link)

    remaining = max(0, share_link.max_views - share_link.current_views)
    now = datetime.now(timezone.utc)

    if not share_link.is_active:
        status_label = "Revoked"
    elif share_link.current_views >= share_link.max_views:
        status_label = "Locked"
    elif share_link.expires_at < now:
        status_label = "Expired"
    else:
        status_label = "Active"

    return {
        "id": share_link.id,
        "token": share_link.token,
        "expires_at": share_link.expires_at,
        "max_views": share_link.max_views,
        "current_views": share_link.current_views,
        "remaining_views": remaining,
        "status": status_label,
        "is_password_protected": share_link.password_hash is not None,
        "is_active": share_link.is_active,
        "is_deleted": share_link.is_deleted # <--- FIX: Added missing field
    }


# --- 8. Manage Shares: Soft Delete Link ---
@router.delete("/shares/{share_id}")
async def delete_share_link(
        share_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # FIX: Ensure we only delete existing (non-deleted) links
    result = await db.execute(
        select(ShareLink, VaultItem)
        .join(VaultItem, ShareLink.vault_item_id == VaultItem.id)
        .where(ShareLink.id == share_id)
        .where(ShareLink.is_deleted == False)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Link not found")

    share_link, vault_item = row

    if vault_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # FIX: Soft delete logic
    share_link.is_deleted = True

    await db.commit()

    return {"message": "Link deleted successfully"}


@router.get("/stats", response_model=VaultStats)
async def get_vault_stats(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # 1. Get List of User's Vault Items IDs
    # We need this to filter shares belonging only to this user
    user_items_query = select(VaultItem.id).where(VaultItem.owner_id == current_user.id)

    # 2. Count Total Items
    total_items_query = select(func.count()).select_from(VaultItem).where(VaultItem.owner_id == current_user.id)
    total_items = await db.execute(total_items_query)
    total_items_count = total_items.scalar() or 0

    # 3. Count Active Shares
    # Criteria: Belongs to user, Active flag, Not Deleted, Not Expired, Views remaining
    now = datetime.now(timezone.utc)

    active_shares_query = select(func.count()).select_from(ShareLink).where(
        ShareLink.vault_item_id.in_(user_items_query),
        ShareLink.is_active == True,
        ShareLink.is_deleted == False,
        ShareLink.expires_at > now,
        ShareLink.current_views < ShareLink.max_views
    )
    active_shares = await db.execute(active_shares_query)
    active_shares_count = active_shares.scalar() or 0

    # 4. Sum Total Views
    # Sum of current_views for all links belonging to user (even if expired/deleted, we want history)
    total_views_query = select(func.sum(ShareLink.current_views)).where(
        ShareLink.vault_item_id.in_(user_items_query)
    )
    total_views = await db.execute(total_views_query)
    total_views_count = total_views.scalar() or 0

    return {
        "total_items": total_items_count,
        "active_shares": active_shares_count,
        "total_views": total_views_count
    }