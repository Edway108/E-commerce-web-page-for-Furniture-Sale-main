package com.furnituree.furnituree.Controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.furnituree.furnituree.dto.ProductRequest;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.service.FileStorageService;
import com.furnituree.furnituree.service.ProductService;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/products", "/api/v1/products"})
public class product_controller {
    private final product_repo repo;
    private final ProductService productService;
    private final FileStorageService fileStorageService;

    public product_controller(product_repo repo, ProductService productService, FileStorageService fileStorageService) {
        this.repo = repo;
        this.productService = productService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/findall")
    public List<Product> getAll() {
        return repo.findAll();
    }

    @GetMapping
    public Page<Product> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String material,
            @RequestParam(defaultValue = "true") Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        int safeSize = List.of(10, 20, 50, 100).contains(size) ? size : 10;
        Sort sort = "desc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, sort);
        return productService.search(keyword, categoryId, minPrice, maxPrice, status, material, active, pageable);
    }

    @PostMapping("/addproduct")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product create(@RequestBody Product p) {
        return productService.saveLegacy(p);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product createV1(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @GetMapping("/{id}")
    public Product getOneProduct(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return productService.updateLegacy(id, product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product updateV1(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        productService.softDelete(id);
        return ResponseEntity.ok(Map.of("message", "Product marked as inactive"));
    }

    @GetMapping("/search")
    public List<Product> searchLegacy(@RequestParam String keyword) {
        return repo.findByProductNameContainingIgnoreCase(keyword);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<Product> lowStock() {
        return repo.findLowStockProducts();
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product uploadImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        Product product = productService.getById(id);
        product.setImg(fileStorageService.storeProductImage(file));
        return repo.save(product);
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ByteArrayResource> exportCsv() {
        StringBuilder csv = new StringBuilder("id,name,price,quantity,status,material,color,category\n");
        for (Product p : repo.findAll()) {
            csv.append(p.getId()).append(',')
                    .append(escape(p.getProductName())).append(',')
                    .append(p.getPrice()).append(',')
                    .append(p.getQuantity()).append(',')
                    .append(escape(p.getStatus())).append(',')
                    .append(escape(p.getMaterial())).append(',')
                    .append(escape(p.getColor())).append(',')
                    .append(p.getCategory() == null ? "" : escape(p.getCategory().getName()))
                    .append('\n');
        }
        ByteArrayResource resource = new ByteArrayResource(csv.toString().getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }

    private String escape(String value) {
        if (value == null) return "";
        return '"' + value.replace("\"", "\"\"") + '"';
    }
}
