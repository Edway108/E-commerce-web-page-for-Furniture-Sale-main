package com.furnituree.furnituree.dto;

public class deleteFromCart {

    private Long productId;
    private String productName;
    private Long productQuantity;

    /**
     * @return Long return the productId
     */
    public Long getProductId() {
        return productId;
    }

    /**
     * @param productId the productId to set
     */
    public void setProductId(Long productId) {
        this.productId = productId;
    }

    /**
     * @return String return the productName
     */
    public String getProductName() {
        return productName;
    }

    /**
     * @param productName the productName to set
     */
    public void setProductName(String productName) {
        this.productName = productName;
    }

    /**
     * @return Long return the productQuantity
     */
    public Long getProductQuantity() {
        return productQuantity;
    }

    /**
     * @param productQuantity the productQuantity to set
     */
    public void setProductQuantity(Long productQuantity) {
        this.productQuantity = productQuantity;
    }

}
