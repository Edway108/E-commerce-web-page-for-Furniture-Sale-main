package com.furnituree.furnituree.dto;

import jakarta.validation.constraints.Email;

public class UpdateProfileRequest {
    private String fullName;
    @Email(message = "Email format is invalid")
    private String email;
    private int phonenumber;
    private String address;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public int getPhonenumber() { return phonenumber; }
    public void setPhonenumber(int phonenumber) { this.phonenumber = phonenumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
