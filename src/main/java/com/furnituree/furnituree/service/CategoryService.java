package com.furnituree.furnituree.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.dto.CategoryRequest;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.repo.CategoryRepository;

@Service
public class CategoryService {
    private final CategoryRepository repository;
    private final AuditService auditService;

    public CategoryService(CategoryRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional
    public Category create(CategoryRequest request) {
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Category already exists");
        }
        Category category = new Category();
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        Category saved = repository.save(category);
        auditService.record("CREATE", "Category", saved.getId(), "Category created");
        return saved;
    }

    @Transactional
    public Category update(Long id, CategoryRequest request) {
        Category category = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setDisplayOrder(request.getDisplayOrder() == null ? category.getDisplayOrder() : request.getDisplayOrder());
        auditService.record("UPDATE", "Category", id, "Category updated");
        return repository.save(category);
    }

    @Transactional
    public void softDelete(Long id) {
        Category category = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        category.setActive(false);
        repository.save(category);
        auditService.record("SOFT_DELETE", "Category", id, "Category marked inactive");
    }
}
