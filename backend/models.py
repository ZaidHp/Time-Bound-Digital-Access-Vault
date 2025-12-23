# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

class VaultItem(Base):
    __tablename__ = "vault_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)  # The "Sensitive text content" [cite: 37]
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ShareLink(Base):
    __tablename__ = "share_links"
    id = Column(Integer, primary_key=True, index=True)
    vault_item_id = Column(Integer, ForeignKey("vault_items.id"))
    token = Column(String, unique=True, index=True) # Unique link identifier
    password_hash = Column(String, nullable=True)   # "Optional access password" [cite: 44]
    expires_at = Column(DateTime(timezone=True))    # "Expiration time" [cite: 42]
    max_views = Column(Integer)                     # "Maximum number of allowed views" [cite: 43]
    current_views = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(Integer, primary_key=True, index=True)
    share_link_id = Column(Integer, ForeignKey("share_links.id"))
    access_time = Column(DateTime(timezone=True), server_default=func.now())
    outcome = Column(String)  # "allowed" or "denied" [cite: 55]
    ip_address = Column(String)