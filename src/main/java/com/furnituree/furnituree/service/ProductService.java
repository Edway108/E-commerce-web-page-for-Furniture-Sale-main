package com.furnituree.furnituree.service;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.dto.ProductRequest;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Tag;
import com.furnituree.furnituree.repo.CategoryRepository;
import com.furnituree.furnituree.repo.TagRepository;
import com.furnituree.furnituree.repo.product_repo;

import jakarta.persistence.criteria.Predicate;

@Service
public class ProductService {
    private final product_repo productRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final AuditService auditService;

    public ProductService(product_repo productRepository, CategoryRepository categoryRepository,
            TagRepository tagRepository, AuditService auditService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.auditService = auditService;
    }

    public Product getById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    public Page<Product> search(String keyword, Long categoryId, Double minPrice, Double maxPrice,
            String status, String material, Boolean active, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            Predicate p = cb.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                p = cb.and(p, cb.or(
                        cb.like(cb.lower(root.get("productName")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("color")), like),
                        cb.like(cb.lower(root.get("material")), like)));
            }
            if (categoryId != null) {
                p = cb.and(p, cb.equal(root.get("category").get("id"), categoryId));
            }
            if (minPrice != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (status != null && !status.isBlank()) {
                p = cb.and(p, cb.equal(cb.lower(root.get("status")), status.trim().toLowerCase()));
            }
            if (material != null && !material.isBlank()) {
                p = cb.and(p, cb.like(cb.lower(root.get("material")), "%" + material.trim().toLowerCase() + "%"));
            }
            if (active != null) {
                p = cb.and(p, cb.equal(root.get("active"), active));
            }
            return p;
        };
        return productRepository.findAll(spec, pageable);
    }

    @Transactional
    public Product create(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        product.setCreatedBy("admin-or-manager");
        Product saved = productRepository.save(product);
        auditService.record("CREATE", "Product", saved.getId(), "Product created");
        return saved;
    }

    @Transactional
    public Product saveLegacy(Product product) {
        if (product.getPrice() <= 0) {
            throw new BusinessException("Price must be greater than 0");
        }
        if (product.getQuantity() == null || product.getQuantity() < 0) {
            throw new BusinessException("Quantity cannot be negative");
        }
        product.setActive(true);
        Product saved = productRepository.save(product);
        auditService.record("CREATE", "Product", saved.getId(), "Product created through legacy endpoint");
        return saved;
    }

    @Transactional
    public Product update(Long id, ProductRequest request) {
        Product product = getById(id);
        applyRequest(product, request);
        product.setUpdatedBy("admin-or-manager");
        Product saved = productRepository.save(product);
        auditService.record("UPDATE", "Product", id, "Product updated");
        return saved;
    }

    @Transactional
    public Product updateLegacy(Long id, Product request) {
        Product product = getById(id);
        product.setProduct_name(request.getProduct_name());
        product.setPrice(request.getPrice());
        product.setDescription(request.getDescription());
        product.setImg(request.getImg());
        product.setQuantity(request.getQuantity());
        product.setMaterial(request.getMaterial());
        product.setColor(request.getColor());
        product.setDimensions(request.getDimensions());
        product.setConditionStatus(request.getConditionStatus());
        product.setStatus(request.getStatus() == null ? product.getStatus() : request.getStatus());
        Product saved = productRepository.save(product);
        auditService.record("UPDATE", "Product", id, "Product updated through legacy endpoint");
        return saved;
    }

    @Transactional
    public void softDelete(Long id) {
        Product product = getById(id);
        product.setActive(false);
        product.setStatus("INACTIVE");
        productRepository.save(product);
        auditService.record("SOFT_DELETE", "Product", id, "Product marked inactive");
    }

    private void applyRequest(Product product, ProductRequest request) {
        if (request.getPrice() <= 0) {
            throw new BusinessException("Price must be greater than 0");
        }
        if (request.getQuantity() == null || request.getQuantity() < 0) {
            throw new BusinessException("Quantity cannot be negative");
        }
        product.setProductName(request.getProductName());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setDescription(request.getDescription());
        product.setImg(request.getImg());
        product.setMaterial(request.getMaterial());
        product.setColor(request.getColor());
        product.setDimensions(request.getDimensions());
        product.setConditionStatus(request.getConditionStatus() == null ? "NEW" : request.getConditionStatus());
        product.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        product.setStockThreshold(request.getStockThreshold() == null ? 5L : request.getStockThreshold());
        product.setWeightKg(request.getWeightKg());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }
        if (request.getTags() != null) {
            Set<Tag> tags = new LinkedHashSet<>();
            for (String name : request.getTags()) {
                if (name == null || name.isBlank())
                    continue;
                Tag tag = tagRepository.findByNameIgnoreCase(name.trim()).orElseGet(() -> {
                    Tag created = new Tag();
                    created.setName(name.trim());
                    return tagRepository.save(created);
                });
                tags.add(tag);
            }
            product.setTags(tags);
        }
    }
}
