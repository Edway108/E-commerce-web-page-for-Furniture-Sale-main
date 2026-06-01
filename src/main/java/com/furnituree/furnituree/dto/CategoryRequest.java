package com.furnituree.furnituree.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 120, message = "Category name must be at most 120 characters")
    private String name;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @Size(max = 500, message = "Image URL must be at most 500 characters")
    private String imageUrl;

    @Pattern(regexp = "ACTIVE|INACTIVE|active|inactive", message = "Status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
