package com.furnituree.furnituree.dto;

import java.util.List;
import java.util.Random;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Tag;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.CategoryRepository;
import com.furnituree.furnituree.repo.TagRepository;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner initDatabase(product_repo productRepo,
                                   CategoryRepository categoryRepo,
                                   TagRepository tagRepo,
                                   user_repo userRepo,
                                   BCryptPasswordEncoder encoder,
                                   JdbcTemplate jdbcTemplate) {
        return args -> {
            runCompatibilityMigration(jdbcTemplate);
            seedUsers(userRepo, encoder);
            List<Category> categories = seedCategories(categoryRepo);
            List<Tag> tags = seedTags(tagRepo);
            seedProducts(productRepo, categories, tags);
        };
    }

    /**
     * Keeps the upgraded application compatible with the original furniture_store database.
     * Hibernate ddl-auto=update is convenient, but it may not safely alter old MySQL tables
     * when the previous schema used shorter ENUM/VARCHAR columns or when old junction-table
     * rows do not match the new foreign-key rules. This lightweight migration adds only the
     * missing columns required by the new entities and keeps existing data intact.
     */
    private void runCompatibilityMigration(JdbcTemplate jdbc) {
        executeSilently(jdbc, "ALTER TABLE `user` MODIFY COLUMN `role` VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER'");
        executeSilently(jdbc, "UPDATE `user` SET `role` = REPLACE(UPPER(`role`), 'ROLE_', '') WHERE `role` IS NOT NULL");

        ensureColumn(jdbc, "user", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "user", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "user", "created_by", "VARCHAR(255) DEFAULT 'system'");
        ensureColumn(jdbc, "user", "updated_by", "VARCHAR(255) NULL");
        ensureColumn(jdbc, "user", "active", "BIT(1) NOT NULL DEFAULT b'1'");
        ensureColumn(jdbc, "user", "email", "VARCHAR(120) NULL");
        ensureColumn(jdbc, "user", "full_name", "VARCHAR(120) NULL");
        ensureColumn(jdbc, "user", "email_verified", "BIT(1) NOT NULL DEFAULT b'1'");
        ensureColumn(jdbc, "user", "account_non_locked", "BIT(1) NOT NULL DEFAULT b'1'");

        ensureColumn(jdbc, "product", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "product", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "product", "created_by", "VARCHAR(255) DEFAULT 'system'");
        ensureColumn(jdbc, "product", "updated_by", "VARCHAR(255) NULL");
        ensureColumn(jdbc, "product", "active", "BIT(1) NOT NULL DEFAULT b'1'");
        ensureColumn(jdbc, "product", "material", "VARCHAR(80) NULL");
        ensureColumn(jdbc, "product", "color", "VARCHAR(60) NULL");
        ensureColumn(jdbc, "product", "dimensions", "VARCHAR(80) NULL");
        ensureColumn(jdbc, "product", "condition_status", "VARCHAR(50) DEFAULT 'NEW'");
        ensureColumn(jdbc, "product", "status", "VARCHAR(30) DEFAULT 'ACTIVE'");
        ensureColumn(jdbc, "product", "stock_threshold", "BIGINT DEFAULT 5");
        ensureColumn(jdbc, "product", "weight_kg", "DOUBLE NULL");
        ensureColumn(jdbc, "product", "category_id", "BIGINT NULL");

        ensureColumn(jdbc, "cart", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "cart", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "cart", "created_by", "VARCHAR(255) DEFAULT 'system'");
        ensureColumn(jdbc, "cart", "updated_by", "VARCHAR(255) NULL");
        ensureColumn(jdbc, "cart", "active", "BIT(1) NOT NULL DEFAULT b'1'");

        ensureColumn(jdbc, "cart_item", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "cart_item", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        ensureColumn(jdbc, "cart_item", "created_by", "VARCHAR(255) DEFAULT 'system'");
        ensureColumn(jdbc, "cart_item", "updated_by", "VARCHAR(255) NULL");
        ensureColumn(jdbc, "cart_item", "active", "BIT(1) NOT NULL DEFAULT b'1'");

        executeSilently(jdbc, "CREATE TABLE IF NOT EXISTS product_tags (product_id BIGINT NOT NULL, tag_id BIGINT NOT NULL)");
        executeSilently(jdbc, "DELETE pt FROM product_tags pt LEFT JOIN product p ON p.id = pt.product_id WHERE p.id IS NULL");
        executeSilently(jdbc, "DELETE pt FROM product_tags pt LEFT JOIN tags t ON t.id = pt.tag_id WHERE t.id IS NULL");
    }

    private void ensureColumn(JdbcTemplate jdbc, String tableName, String columnName, String definition) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class,
                tableName,
                columnName);
        if (count == null || count == 0) {
            executeSilently(jdbc, "ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + definition);
        }
    }

    private void executeSilently(JdbcTemplate jdbc, String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception ignored) {
            // Best-effort migration: if a statement is already applied or unsupported,
            // Hibernate and the repositories can continue with the next safe statement.
        }
    }

    private void seedUsers(user_repo repo, BCryptPasswordEncoder encoder) {
        createUser(repo, encoder, "admin", "admin@test.com", "Admin User", "Admin123!", "ADMIN");
        createUser(repo, encoder, "manager", "manager@test.com", "Manager User", "Manager123!", "MANAGER");
        createUser(repo, encoder, "customer", "customer@test.com", "Customer User", "Customer123!", "CUSTOMER");
    }

    private void createUser(user_repo repo, BCryptPasswordEncoder encoder, String username, String email,
                            String fullName, String password, String role) {
        User user = repo.findByUsername(username);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setAddress("Ho Chi Minh City, Vietnam");
            user.setPhonenumber(900000000);
        }
        // Keep demo accounts reliable even when the old local database already had users.
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        user.setEmailVerified(true);
        user.setAccountNonLocked(true);
        user.setActive(true);
        repo.save(user);
    }

    private List<Category> seedCategories(CategoryRepository repo) {
        String[][] data = {
                {"Sofas", "Comfortable sofas for living rooms"},
                {"Tables", "Dining, coffee, and work tables"},
                {"Chairs", "Office chairs, dining chairs, and lounge chairs"},
                {"Beds", "Bedroom furniture and bed frames"},
                {"Storage", "Wardrobes, cabinets, shelves, and TV stands"},
                {"Decor", "Lamps and decorative furniture pieces"}
        };
        for (int i = 0; i < data.length; i++) {
            final int order = i + 1;
            repo.findByNameIgnoreCase(data[i][0]).orElseGet(() -> {
                Category c = new Category();
                c.setName(data[order - 1][0]);
                c.setDescription(data[order - 1][1]);
                c.setDisplayOrder(order);
                return repo.save(c);
            });
        }
        return repo.findAll();
    }

    private List<Tag> seedTags(TagRepository repo) {
        for (String name : List.of("New", "Used", "Eco", "Premium", "Sale", "Handmade", "Modern", "Minimal")) {
            repo.findByNameIgnoreCase(name).orElseGet(() -> {
                Tag tag = new Tag();
                tag.setName(name);
                return repo.save(tag);
            });
        }
        return repo.findAll();
    }

    private void seedProducts(product_repo repo, List<Category> categories, List<Tag> tags) {
        long current = repo.count();
        if (current >= 100) {
            return;
        }
        Random random = new Random(7);
        String[] names = {"Nordic Sofa", "Oak Table", "Ergo Chair", "Queen Bed", "Walnut Wardrobe", "Study Desk", "Floor Lamp", "Wall Shelf", "TV Stand", "Coffee Cabinet"};
        String[] materials = {"Oak wood", "Walnut", "Metal", "Rattan", "Fabric", "Leather"};
        String[] colors = {"Natural", "White", "Black", "Brown", "Cream", "Gray"};
        for (long i = current + 1; i <= 100; i++) {
            Product p = new Product();
            p.setProductName(names[(int) (i % names.length)] + " " + i);
            p.setPrice(120 + random.nextInt(1800));
            p.setQuantity((long) (5 + random.nextInt(80)));
            p.setStockThreshold(5L + random.nextInt(8));
            p.setDescription("Realistic sample furniture product for demo and search/filter testing. Item number " + i + " includes material, color, stock, and category data.");
            p.setImg("https://picsum.photos/seed/furniture" + i + "/600/400");
            p.setMaterial(materials[random.nextInt(materials.length)]);
            p.setColor(colors[random.nextInt(colors.length)]);
            p.setDimensions((80 + random.nextInt(140)) + " x " + (60 + random.nextInt(80)) + " x " + (40 + random.nextInt(90)) + " cm");
            p.setConditionStatus(i % 4 == 0 ? "USED_GOOD" : "NEW");
            p.setStatus("ACTIVE");
            if (!categories.isEmpty()) p.setCategory(categories.get(random.nextInt(categories.size())));
            if (tags.size() >= 2) {
                Set<Tag> assignedTags = new LinkedHashSet<>();
                assignedTags.add(tags.get(random.nextInt(tags.size())));
                assignedTags.add(tags.get(random.nextInt(tags.size())));
                p.setTags(assignedTags);
            }
            repo.save(p);
        }
    }
}
