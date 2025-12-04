package com.crm.entity;

import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
public class Reminder {
    @Id @GenericGenerator(name = "uuid2", strategy = "uuid2") @GeneratedValue(generator = "uuid2") private String id;
    @Column(nullable = false) private String userId;
    @Column(nullable = false) private String contactId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ReminderType type;
    @Column(nullable = false) private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    @Enumerated(EnumType.STRING) private ReminderStatus status = ReminderStatus.PENDING;
    @CreationTimestamp private LocalDateTime createdAt;

    public enum ReminderType { BIRTHDAY, ANNIVERSARY, FOLLOWUP, NO_CONTACT, SHARE }
    public enum ReminderStatus { PENDING, SENT, DISMISSED }

    public Reminder() {}
    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public ReminderType getType() { return type; }
    public void setType(ReminderType type) { this.type = type; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public ReminderStatus getStatus() { return status; }
    public void setStatus(ReminderStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
