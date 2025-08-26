from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from ..db import Base
from datetime import datetime

class Stack(Base):
    __tablename__ = "stacks"
    id = Column(String, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow  # This sets it in Python if not provided
    )