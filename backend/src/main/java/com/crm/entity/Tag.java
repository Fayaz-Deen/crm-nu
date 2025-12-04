package com.crm.entity;

import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;

@Entity
@Table(name = "tags", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "name"}))
public class Tag {
    @Id @GenericGenerator(name = "uuid2", strategy = "uuid2") @GeneratedValue(generator = "uuid2")
    private String id;
    @Column(nullable = false) private String userId;
    @Column(nullable = false) private String name;
    private String color;
    private String description;
    @CreationTimestamp private LocalDateTime createdAt;

    public Tag() {}
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
