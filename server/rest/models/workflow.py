from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from db import Base

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, index=True)
    stack_id = Column(String, ForeignKey("stacks.id"))
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list) 
    data = Column(JSON, default=dict)

    stack = relationship("Stack", back_populates="workflows")