package com.crm.entity;

import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;

@Entity
@Table(name = "contact_groups", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "name"}))
public class ContactGroup {
    @Id @GenericGenerator(name = "uuid2", strategy = "uuid2") @GeneratedValue(generator = "uuid2")
    private String id;
    @Column(nullable = false) private String userId;
    @Column(nullable = false) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    private String color;
    @Column(columnDefinition = "TEXT") private String contactIds; // JSON array of contact IDs
    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;

    public ContactGroup() {}
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getContactIds() { return contactIds; }
    public void setContactIds(String contactIds) { this.contactIds = contactIds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
