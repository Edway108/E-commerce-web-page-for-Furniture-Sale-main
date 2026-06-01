package com.furnituree.furnituree.dto;

import java.util.List;
import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.furnituree.furnituree.model.Category;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.category_repo;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(product_repo productRepo, category_repo categoryRepo, user_repo userRepo,
            PasswordEncoder encoder) {
        return args -> {
            seedUsers(userRepo, encoder);
            List<Category> categories = seedCategories(categoryRepo);
            seedProducts(productRepo, categories);
        };
    }

    private void seedUsers(user_repo userRepo, PasswordEncoder encoder) {
        if (userRepo.findByUsername("admin") == null) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("123456"));
            admin.setRole("admin");
            admin.setAddress("Admin address");
            admin.setPhonenumber(123456789);
            userRepo.save(admin);
        }

        if (userRepo.findByUsername("user") == null) {
            User user = new User();
            user.setUsername("user");
            user.setPassword(encoder.encode("123456"));
            user.setRole("user");
            user.setAddress("User address");
            user.setPhonenumber(987654321);
            userRepo.save(user);
        }
    }

    private List<Category> seedCategories(category_repo categoryRepo) {
        String[][] categoryData = {
                { "Sofa", "Comfortable seating for living rooms", "https://picsum.photos/seed/sofa/300" },
                { "Table", "Dining, coffee and side tables", "https://picsum.photos/seed/table/300" },
                { "Chair", "Accent, office and dining chairs", "https://picsum.photos/seed/chair/300" },
                { "Bed", "Bedroom furniture and bed frames", "https://picsum.photos/seed/bed/300" },
                { "Storage", "Wardrobes, cabinets and shelves", "https://picsum.photos/seed/storage/300" },
                { "Lighting", "Lamps and decorative lighting", "https://picsum.photos/seed/light/300" }
        };

        for (String[] row : categoryData) {
            if (categoryRepo.findByNameIgnoreCase(row[0]).isEmpty()) {
                Category category = new Category();
                category.setName(row[0]);
                category.setDescription(row[1]);
                category.setImageUrl(row[2]);
                category.setStatus("ACTIVE");
                categoryRepo.save(category);
            }
        }

        return categoryRepo.findAll();
    }

    private void seedProducts(product_repo productRepo, List<Category> categories) {
        if (productRepo.count() > 0) {
            return;
        }

        String[] names = {
                "Sofa", "Table", "Chair", "Bed", "Wardrobe",
                "Desk", "Lamp", "Shelf", "Cabinet", "TV Stand"
        };

        Random rand = new Random(7);

        for (int i = 1; i <= 50; i++) {
            String baseName = names[rand.nextInt(names.length)];
            Product p = new Product();
            p.setProduct_name(baseName + " " + i);
            p.setPrice(100 + rand.nextInt(900));
            p.setQuantity((long) (rand.nextInt(51)));
            p.setDescription("High quality furniture item number " + i);
            p.setImg("https://picsum.photos/200?random=" + i);
            p.setCategory(matchCategory(baseName, categories));
            productRepo.save(p);
        }
    }

    private Category matchCategory(String productName, List<Category> categories) {
        String target = switch (productName) {
            case "Sofa" -> "Sofa";
            case "Table", "Desk", "TV Stand" -> "Table";
            case "Chair" -> "Chair";
            case "Bed" -> "Bed";
            case "Lamp" -> "Lighting";
            default -> "Storage";
        };

        return categories.stream()
                .filter(c -> c.getName().equalsIgnoreCase(target))
                .findFirst()
                .orElse(categories.isEmpty() ? null : categories.get(0));
    }
}
