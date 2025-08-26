from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base
from datetime import datetime

class Stack(Base):
    __tablename__ = "stacks"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Add this relationship
    workflows = relationship("Workflow", back_populates="stack", cascade="all, delete-orphan")