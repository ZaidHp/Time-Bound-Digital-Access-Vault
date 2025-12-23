from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class UserAuth(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class VaultItemCreate(BaseModel):
    title: str
    content: str

class VaultItemResponse(VaultItemCreate):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class VaultItemResponse(VaultItemCreate):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ShareLinkCreate(BaseModel):
    vault_item_id: int
    expires_at: datetime
    max_views: int
    password: Optional[str] = None # Optional password from frontend

class ShareLinkResponse(BaseModel):
    share_link: str
    expires_at: datetime
    max_views: int

class ShareMetaData(BaseModel):
    """Information safe to show to anyone with the link"""
    title: str
    is_password_protected: bool
    expires_at: datetime
    is_locked: bool  # True if expired or max views reached

class ShareAccessRequest(BaseModel):
    """Data sent when attempting to unlock"""
    password: Optional[str] = None

class VaultContentResponse(BaseModel):
    """The secret content returned only on success"""
    content: str
    message: str

class AccessLogResponse(BaseModel):
    id: int
    share_link_token: str  # Useful to know WHICH link was used
    access_time: datetime
    outcome: str           # "allowed", "denied_bad_password", etc.
    ip_address: str

    class Config:
        from_attributes = True

class VaultItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class ShareLinkStatus(BaseModel):
    id: int
    token: str
    expires_at: datetime
    max_views: int
    current_views: int
    remaining_views: int
    status: str
    is_password_protected: bool
    is_active: bool  # <--- Include this status
    is_deleted: bool

    class Config:
        from_attributes = True

class ShareLinkUpdate(BaseModel):
    expires_at: Optional[datetime] = None
    max_views: Optional[int] = None
    is_active: Optional[bool] = None
    is_deleted: Optional[bool] = None

class VaultStats(BaseModel):
    total_items: int
    active_shares: int
    total_views: int