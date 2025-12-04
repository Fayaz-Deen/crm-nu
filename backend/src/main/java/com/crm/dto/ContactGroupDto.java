package com.crm.dto;

import javax.validation.constraints.NotBlank;
import java.util.List;

public class ContactGroupDto {
    private String id;
    @NotBlank private String name;
    private String description;
    private String color;
    private List<String> contactIds;
    private Integer contactCount;
    private String createdAt;
    private String updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public List<String> getContactIds() { return contactIds; }
    public void setContactIds(List<String> contactIds) { this.contactIds = contactIds; }
    public Integer getContactCount() { return contactCount; }
    public void setContactCount(Integer contactCount) { this.contactCount = contactCount; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
