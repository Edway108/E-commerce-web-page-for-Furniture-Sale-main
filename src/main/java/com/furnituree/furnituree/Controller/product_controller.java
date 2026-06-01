package com.furnituree.furnituree.Controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.furnituree.furnituree.dto.ProductRequest;
import com.furnituree.furnituree.exception.BadRequestException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.repo.category_repo;
import com.furnituree.furnituree.repo.product_repo;

import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/products")
public class product_controller {
    private final product_repo repo;
    private final category_repo categoryRepo;

    public product_controller(product_repo repo, category_repo categoryRepo) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
    }

    @GetMapping("/findall")
    public List<Product> getAll() {
        return repo.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @PostMapping("/addproduct")
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        Product product = new Product();
        applyProductRequest(product, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(product));
    }

    @GetMapping("/{id}")
    public Product getOneProduct(@PathVariable Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    @PutMapping("/update/{id}")
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        Product old = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));

        applyProductRequest(old, request);
        return repo.save(old);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Product product = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        repo.delete(product);
        return ResponseEntity.noContent().build();
    }

    @CrossOrigin(origins = "*")
    @GetMapping("/search")
    public List<Product> search(@RequestParam String keyword) {
        return repo.findByproductNameContaining(keyword);
    }

    @GetMapping("/filter")
    public Page<Product> filterProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Long minQuantity,
            @RequestParam(required = false) Long maxQuantity,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "all") String stockStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        validateFilter(minPrice, maxPrice, minQuantity, maxQuantity);

        int safePage = Math.max(page, 0);
        int safeSize = normalizePageSize(size);
        Pageable pageable = PageRequest.of(safePage, safeSize, buildSort(sortBy, sortDir));

        return repo.findAll(
                buildProductSpecification(keyword, minPrice, maxPrice, minQuantity, maxQuantity, categoryId, stockStatus),
                pageable);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardData() {
        List<Product> products = repo.findAll(Sort.by(Sort.Direction.ASC, "id"));

        long totalProducts = products.size();
        long totalStock = products.stream()
                .mapToLong(p -> p.getQuantity() == null ? 0 : p.getQuantity())
                .sum();
        long outOfStock = products.stream()
                .filter(p -> p.getQuantity() == null || p.getQuantity() == 0)
                .count();
        long lowStock = products.stream()
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0 && p.getQuantity() <= 5)
                .count();
        long available = products.stream()
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 5)
                .count();
        double inventoryValue = products.stream()
                .mapToDouble(p -> p.getPrice() * (p.getQuantity() == null ? 0 : p.getQuantity()))
                .sum();

        List<Map<String, Object>> topStockProducts = products.stream()
                .sorted((a, b) -> Long.compare(
                        b.getQuantity() == null ? 0 : b.getQuantity(),
                        a.getQuantity() == null ? 0 : a.getQuantity()))
                .limit(7)
                .map(this::toProductSummary)
                .collect(Collectors.toList());

        List<Map<String, Object>> highestValueProducts = products.stream()
                .sorted((a, b) -> Double.compare(
                        b.getPrice() * (b.getQuantity() == null ? 0 : b.getQuantity()),
                        a.getPrice() * (a.getQuantity() == null ? 0 : a.getQuantity())))
                .limit(7)
                .map(this::toProductSummary)
                .collect(Collectors.toList());

        Map<String, Long> categorySummary = products.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCategory() == null ? "Uncategorized" : p.getCategory().getName(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        Map<String, Object> stockSummary = new LinkedHashMap<>();
        stockSummary.put("outOfStock", outOfStock);
        stockSummary.put("lowStock", lowStock);
        stockSummary.put("available", available);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalProducts", totalProducts);
        result.put("totalStock", totalStock);
        result.put("outOfStock", outOfStock);
        result.put("lowStock", lowStock);
        result.put("available", available);
        result.put("inventoryValue", inventoryValue);
        result.put("stockSummary", stockSummary);
        result.put("categorySummary", categorySummary);
        result.put("topStockProducts", topStockProducts);
        result.put("highestValueProducts", highestValueProducts);
        return result;
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Long minQuantity,
            @RequestParam(required = false) Long maxQuantity,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "all") String stockStatus,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        validateFilter(minPrice, maxPrice, minQuantity, maxQuantity);

        List<Product> products = repo.findAll(
                buildProductSpecification(keyword, minPrice, maxPrice, minQuantity, maxQuantity, categoryId, stockStatus),
                buildSort(sortBy, sortDir));

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Name,Category,Price,Quantity,Inventory Value,Description,Image URL\n");
        for (Product p : products) {
            long quantity = p.getQuantity() == null ? 0 : p.getQuantity();
            double inventoryValue = p.getPrice() * quantity;
            csv.append(p.getId()).append(',')
                    .append(csvValue(p.getProduct_name())).append(',')
                    .append(csvValue(categoryName(p))).append(',')
                    .append(p.getPrice()).append(',')
                    .append(quantity).append(',')
                    .append(inventoryValue).append(',')
                    .append(csvValue(p.getDescription())).append(',')
                    .append(csvValue(p.getImg()))
                    .append('\n');
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=product-report.csv")
                .contentType(new MediaType("text", "csv"))
                .body(csv.toString());
    }

    private void applyProductRequest(Product product, ProductRequest request) {
        product.setProduct_name(request.getProductName().trim());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setDescription(blankToNull(request.getDescription()));
        product.setImg(blankToNull(request.getImg()));

        
            Category category = categoryRepo.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + request.getCategoryId()));
            product.setCategory(category);
        
    }

    private Specification<Product> buildProductSpecification(
            String keyword,
            Double minPrice,
            Double maxPrice,
            Long minQuantity,
            Long maxQuantity,
            Long categoryId,
            String stockStatus) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("productName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.join("category", jakarta.persistence.criteria.JoinType.LEFT).<String>get("name")), pattern)));
            }

            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.<Double>get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.<Double>get("price"), maxPrice));
            }
            if (minQuantity != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.<Long>get("quantity"), minQuantity));
            }
            if (maxQuantity != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.<Long>get("quantity"), maxQuantity));
            }
            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }

            if (stockStatus != null) {
                switch (stockStatus) {
                    case "inStock" -> predicates.add(criteriaBuilder.greaterThan(root.<Long>get("quantity"), 0L));
                    case "outOfStock" -> predicates.add(criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("quantity")),
                            criteriaBuilder.equal(root.<Long>get("quantity"), 0L)));
                    case "lowStock" -> predicates.add(criteriaBuilder.and(
                            criteriaBuilder.greaterThan(root.<Long>get("quantity"), 0L),
                            criteriaBuilder.lessThanOrEqualTo(root.<Long>get("quantity"), 5L)));
                    default -> {
                    }
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void validateFilter(Double minPrice, Double maxPrice, Long minQuantity, Long maxQuantity) {
        if (minPrice != null && minPrice < 0) {
            throw new BadRequestException("Minimum price cannot be negative");
        }
        if (maxPrice != null && maxPrice < 0) {
            throw new BadRequestException("Maximum price cannot be negative");
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new BadRequestException("Minimum price cannot be greater than maximum price");
        }
        if (minQuantity != null && minQuantity < 0) {
            throw new BadRequestException("Minimum quantity cannot be negative");
        }
        if (maxQuantity != null && maxQuantity < 0) {
            throw new BadRequestException("Maximum quantity cannot be negative");
        }
        if (minQuantity != null && maxQuantity != null && minQuantity > maxQuantity) {
            throw new BadRequestException("Minimum quantity cannot be greater than maximum quantity");
        }
    }

    private Sort buildSort(String sortBy, String sortDir) {
        String safeSortBy = switch (sortBy) {
            case "productName", "price", "quantity", "id" -> sortBy;
            default -> "id";
        };
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Sort.by(direction, safeSortBy);
    }

    private int normalizePageSize(int size) {
        return switch (size) {
            case 10, 20, 50, 100 -> size;
            default -> 10;
        };
    }

    private Map<String, Object> toProductSummary(Product p) {
        Map<String, Object> row = new LinkedHashMap<>();
        long quantity = p.getQuantity() == null ? 0 : p.getQuantity();
        row.put("id", p.getId());
        row.put("name", p.getProduct_name());
        row.put("category", categoryName(p));
        row.put("price", p.getPrice());
        row.put("quantity", quantity);
        row.put("inventoryValue", p.getPrice() * quantity);
        return row;
    }

    private String categoryName(Product p) {
        return p.getCategory() == null ? "Uncategorized" : p.getCategory().getName();
    }

    private String csvValue(String value) {
        if (value == null) {
            return "\"\"";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
