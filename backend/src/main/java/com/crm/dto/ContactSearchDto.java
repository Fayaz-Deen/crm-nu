package com.crm.dto;

import java.util.List;

public class ContactSearchDto {
    private String query;
    private List<String> tags;
    private String company;
    private String lastContactedFrom;
    private String lastContactedTo;
    private String createdFrom;
    private String createdTo;
    private Boolean hasEmail;
    private Boolean hasPhone;
    private Boolean hasWhatsapp;
    private Boolean hasInstagram;
    private String sortBy;
    private String sortOrder;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getLastContactedFrom() { return lastContactedFrom; }
    public void setLastContactedFrom(String lastContactedFrom) { this.lastContactedFrom = lastContactedFrom; }
    public String getLastContactedTo() { return lastContactedTo; }
    public void setLastContactedTo(String lastContactedTo) { this.lastContactedTo = lastContactedTo; }
    public String getCreatedFrom() { return createdFrom; }
    public void setCreatedFrom(String createdFrom) { this.createdFrom = createdFrom; }
    public String getCreatedTo() { return createdTo; }
    public void setCreatedTo(String createdTo) { this.createdTo = createdTo; }
    public Boolean getHasEmail() { return hasEmail; }
    public void setHasEmail(Boolean hasEmail) { this.hasEmail = hasEmail; }
    public Boolean getHasPhone() { return hasPhone; }
    public void setHasPhone(Boolean hasPhone) { this.hasPhone = hasPhone; }
    public Boolean getHasWhatsapp() { return hasWhatsapp; }
    public void setHasWhatsapp(Boolean hasWhatsapp) { this.hasWhatsapp = hasWhatsapp; }
    public Boolean getHasInstagram() { return hasInstagram; }
    public void setHasInstagram(Boolean hasInstagram) { this.hasInstagram = hasInstagram; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortOrder() { return sortOrder; }
    public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }
}
