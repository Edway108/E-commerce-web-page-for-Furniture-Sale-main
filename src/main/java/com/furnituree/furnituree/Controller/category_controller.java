package com.furnituree.furnituree.Controller;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.dto.CategoryRequest;
import com.furnituree.furnituree.exception.BadRequestException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.repo.category_repo;
import com.furnituree.furnituree.repo.product_repo;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/categories")
public class category_controller {

    private final category_repo categoryRepo;
    private final product_repo productRepo;

    public category_controller(category_repo categoryRepo, product_repo productRepo) {
        this.categoryRepo = categoryRepo;
        this.productRepo = productRepo;
    }

    @GetMapping("/findall")
    public List<Category> getAllCategories(@RequestParam(required = false) String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            return categoryRepo.findByNameContainingIgnoreCaseOrderByNameAsc(keyword.trim());
        }
        return categoryRepo.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @GetMapping("/{id}")
    public Category getOneCategory(@PathVariable Long id) {
        return findCategory(id);
    }

    @PostMapping("/addcategory")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        String name = request.getName().trim();
        if (categoryRepo.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Category name already exists");
        }

        Category category = new Category();
        applyCategoryRequest(category, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryRepo.save(category));
    }

    @PutMapping("/update/{id}")
    public Category updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        Category category = findCategory(id);
        String name = request.getName().trim();

        categoryRepo.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BadRequestException("Category name already exists");
            }
        });

        applyCategoryRequest(category, request);
        return categoryRepo.save(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Category category = findCategory(id);
        long productCount = productRepo.countByCategoryId(id);
        if (productCount > 0) {
            throw new BadRequestException("Cannot delete category because it still has " + productCount + " products");
        }

        categoryRepo.delete(category);
        return ResponseEntity.noContent().build();
    }

    private Category findCategory(Long id) {
        return categoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }

    private void applyCategoryRequest(Category category, CategoryRequest request) {
        category.setName(request.getName().trim());
        category.setDescription(blankToNull(request.getDescription()));
        category.setImageUrl(blankToNull(request.getImageUrl()));
        category.setStatus(request.getStatus() == null || request.getStatus().isBlank()
                ? "ACTIVE"
                : request.getStatus().trim().toUpperCase());
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
