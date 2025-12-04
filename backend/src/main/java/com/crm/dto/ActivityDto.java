package com.crm.dto;

public class ActivityDto {
    private String id;
    private String type; // MEETING, TASK, REMINDER, SHARE, CONTACT_CREATED, CONTACT_UPDATED
    private String description;
    private String contactId;
    private String contactName;
    private String timestamp;
    private Object details;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Object getDetails() { return details; }
    public void setDetails(Object details) { this.details = details; }
}
