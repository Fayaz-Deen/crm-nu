package com.crm.dto;

import javax.validation.constraints.NotBlank;

public class TagDto {
    private String id;
    @NotBlank private String name;
    private String color;
    private String description;
    private Long contactCount;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getContactCount() { return contactCount; }
    public void setContactCount(Long contactCount) { this.contactCount = contactCount; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
