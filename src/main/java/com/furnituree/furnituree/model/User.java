package com.furnituree.furnituree.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

//this class is the definition for User class included User_Id; name ; role ; phonenumber; address
@Entity // to declare that this is the table to sql
public class User {
    @Id // define that this one is the id and it is unique
    @GeneratedValue(strategy = GenerationType.IDENTITY) // to make it count up when ever new user being created
    private Long User_Id;

    @Column(unique = true) // also make the username is the unique value ; cause it is not int like id so
                           // not make it increased by itself
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // guess it make this one unable to be change ?
    private String password;

    private String role;// would have been admin//user

    private int phonenumber;// incase want to make the forgetpass to trace back ( idea not BEING MADE )

    private String address;// to make the receipt to send out

    // getter and setter

    public Long getUser_Id() {
        return User_Id;
    }

    public void setUser_Id(Long User_Id) {
        this.User_Id = User_Id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;

    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;

    }

    /**
     * @return String return the role
     */
    public String getRole() {
        return role;
    }

    /**
     * @param role the role to set
     */
    public void setRole(String role) {
        this.role = role;
    }

    /**
     * @return int return the phonenumber
     */
    public int getPhonenumber() {
        return phonenumber;
    }

    /**
     * @param phonenumber the phonenumber to set
     */
    public void setPhonenumber(int phonenumber) {
        this.phonenumber = phonenumber;
    }

    /**
     * @return String return the address
     */
    public String getAddress() {
        return address;
    }

    /**
     * @param address the address to set
     */
    public void setAddress(String address) {
        this.address = address;
    }

}
