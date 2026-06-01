package com.furnituree.furnituree.dto;

import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(product_repo productRepo, user_repo userRepo, PasswordEncoder encoder) {
        return args -> {

            // Seed admin account
            if (userRepo.findByUsername("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(encoder.encode("123456"));
                admin.setRole("admin");
                admin.setAddress("Admin address");
                admin.setPhonenumber(123456789);

                userRepo.save(admin);
                System.out.println("Seeded admin account!");
            }

            // Seed normal user account
            if (userRepo.findByUsername("user") == null) {
                User user = new User();
                user.setUsername("user");
                user.setPassword(encoder.encode("123456"));
                user.setRole("user");
                user.setAddress("User address");
                user.setPhonenumber(987654321);

                userRepo.save(user);
                System.out.println("Seeded user account!");
            }

            // Seed products
            if (productRepo.count() > 0) {
                System.out.println("Products already seeded!");
                return;
            }

            String[] names = {
                    "Sofa", "Table", "Chair", "Bed", "Wardrobe",
                    "Desk", "Lamp", "Shelf", "Cabinet", "TV Stand"
            };

            Random rand = new Random();

            for (int i = 1; i <= 50; i++) {
                Product p = new Product();

                p.setProduct_name(names[rand.nextInt(names.length)] + " " + i);
                p.setPrice(100 + rand.nextInt(900));
                p.setQuantity((long) (1 + rand.nextInt(50)));
                p.setDescription("High quality furniture item number " + i);
                p.setImg("https://picsum.photos/200?random=" + i);

                productRepo.save(p);
            }

            System.out.println("Seeded 50 products!");
        };
    }
}