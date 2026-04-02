-- MySQL dump 10.13  Distrib 8.4.5, for Win64 (x86_64)
--
-- Host: localhost    Database: furniture_store
-- ------------------------------------------------------
-- Server version	8.4.5

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `cart_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `UK9emlp6m95v5er2bcqkjsw48he` (`user_id`),
  CONSTRAINT `FKl70asp4l4w0jmbm1tqyofho4o` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (1,3);
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `cart_item_id` bigint NOT NULL AUTO_INCREMENT,
  `price` double NOT NULL,
  `quantity` bigint NOT NULL,
  `id` bigint DEFAULT NULL,
  `cart_id` bigint DEFAULT NULL,
  PRIMARY KEY (`cart_item_id`),
  KEY `FKcf7vvhanu973gctf0c59e03vx` (`id`),
  KEY `FK60p518n9qi6o5tbqul8b7uqno` (`cart_id`),
  CONSTRAINT `FK60p518n9qi6o5tbqul8b7uqno` FOREIGN KEY (`cart_id`) REFERENCES `product` (`id`),
  CONSTRAINT `FKcf7vvhanu973gctf0c59e03vx` FOREIGN KEY (`id`) REFERENCES `cart` (`cart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item`
--

LOCK TABLES `cart_item` WRITE;
/*!40000 ALTER TABLE `cart_item` DISABLE KEYS */;
INSERT INTO `cart_item` VALUES (1,0,12,1,8);
/*!40000 ALTER TABLE `cart_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `price` double NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `quantity` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (17,100,'Back chair','','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuQn1DwpvSte_IU7_UC5fI0ILQlSpzbQuDZg&s',24),(18,300,'Roesler Rectangular Brown Wood Square','','https://images.thdstatic.com/productImages/1c654fe6-311b-4755-b501-a861c534988f/svn/brown-byblight-kitchen-dining-tables-bb-f1889yf-64_1000.jpg',123),(19,70,'Farmhouse Fiddle Back Chair ','','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpzoP_77-eAk6vOTGIUu2fUTK5uzG5Ifu_cw&s',60),(21,123,'Dust Bin','','https://cdn.hstatic.net/products/200000535717/1_d6ec0d188bc34c61b6ce993f62f9ab6c_master.jpg',189),(23,167,'Chair 1','High quality furniture item number 1','https://picsum.photos/200?random=1',14),(24,539,'TV Stand 2','High quality furniture item number 2','https://picsum.photos/200?random=2',4),(25,685,'Lamp 3','High quality furniture item number 3','https://picsum.photos/200?random=3',15),(26,402,'Shelf 4','High quality furniture item number 4','https://picsum.photos/200?random=4',47),(27,963,'Cabinet 5','High quality furniture item number 5','https://picsum.photos/200?random=5',8),(28,328,'Cabinet 6','High quality furniture item number 6','https://picsum.photos/200?random=6',37),(29,820,'Chair 7','High quality furniture item number 7','https://picsum.photos/200?random=7',32),(30,977,'Bed 8','High quality furniture item number 8','https://picsum.photos/200?random=8',16),(31,247,'Cabinet 9','High quality furniture item number 9','https://picsum.photos/200?random=9',8),(32,932,'Bed 10','High quality furniture item number 10','https://picsum.photos/200?random=10',6),(33,860,'Shelf 11','High quality furniture item number 11','https://picsum.photos/200?random=11',34),(34,829,'Chair 12','High quality furniture item number 12','https://picsum.photos/200?random=12',21),(35,548,'Bed 13','High quality furniture item number 13','https://picsum.photos/200?random=13',23),(36,658,'Bed 14','High quality furniture item number 14','https://picsum.photos/200?random=14',39),(37,495,'Lamp 15','High quality furniture item number 15','https://picsum.photos/200?random=15',28),(38,359,'Wardrobe 16','High quality furniture item number 16','https://picsum.photos/200?random=16',38),(39,567,'Cabinet 17','High quality furniture item number 17','https://picsum.photos/200?random=17',36),(40,520,'Cabinet 18','High quality furniture item number 18','https://picsum.photos/200?random=18',50),(41,421,'Sofa 19','High quality furniture item number 19','https://picsum.photos/200?random=19',15),(42,367,'TV Stand 20','High quality furniture item number 20','https://picsum.photos/200?random=20',50),(43,188,'Bed 21','High quality furniture item number 21','https://picsum.photos/200?random=21',15),(44,407,'Bed 22','High quality furniture item number 22','https://picsum.photos/200?random=22',35),(45,674,'Table 23','High quality furniture item number 23','https://picsum.photos/200?random=23',13),(46,387,'Cabinet 24','High quality furniture item number 24','https://picsum.photos/200?random=24',9),(47,239,'Table 25','High quality furniture item number 25','https://picsum.photos/200?random=25',9),(48,398,'TV Stand 26','High quality furniture item number 26','https://picsum.photos/200?random=26',8),(49,303,'Wardrobe 27','High quality furniture item number 27','https://picsum.photos/200?random=27',16),(50,817,'Cabinet 28','High quality furniture item number 28','https://picsum.photos/200?random=28',25),(51,635,'Lamp 29','High quality furniture item number 29','https://picsum.photos/200?random=29',28),(52,417,'Cabinet 30','High quality furniture item number 30','https://picsum.photos/200?random=30',4),(53,606,'Table 31','High quality furniture item number 31','https://picsum.photos/200?random=31',50),(54,740,'Table 32','High quality furniture item number 32','https://picsum.photos/200?random=32',37),(55,449,'Table 33','High quality furniture item number 33','https://picsum.photos/200?random=33',4),(56,766,'Chair 34','High quality furniture item number 34','https://picsum.photos/200?random=34',23),(57,460,'Lamp 35','High quality furniture item number 35','https://picsum.photos/200?random=35',15),(58,800,'Chair 36','High quality furniture item number 36','https://picsum.photos/200?random=36',21),(59,328,'Table 37','High quality furniture item number 37','https://picsum.photos/200?random=37',23),(60,662,'Bed 38','High quality furniture item number 38','https://picsum.photos/200?random=38',38),(61,770,'TV Stand 39','High quality furniture item number 39','https://picsum.photos/200?random=39',34),(62,441,'Chair 40','High quality furniture item number 40','https://picsum.photos/200?random=40',46),(63,755,'Sofa 41','High quality furniture item number 41','https://picsum.photos/200?random=41',17),(64,486,'Lamp 42','High quality furniture item number 42','https://picsum.photos/200?random=42',48),(65,452,'TV Stand 43','High quality furniture item number 43','https://picsum.photos/200?random=43',32),(66,166,'Lamp 44','High quality furniture item number 44','https://picsum.photos/200?random=44',48),(67,107,'Desk 45','High quality furniture item number 45','https://picsum.photos/200?random=45',19),(68,386,'Sofa 46','High quality furniture item number 46','https://picsum.photos/200?random=46',18),(69,767,'Sofa 47','High quality furniture item number 47','https://picsum.photos/200?random=47',19),(70,755,'Wardrobe 48','High quality furniture item number 48','https://picsum.photos/200?random=48',1),(71,115,'Chair 49','High quality furniture item number 49','https://picsum.photos/200?random=49',35),(72,475,'Desk 50','High quality furniture item number 50','https://picsum.photos/200?random=50',28),(73,1232132,'ád','','https://cdn.hstatic.net/products/200000535717/1_d6ec0d188bc34c61b6ce993f62f9ab6c_master.jpg',222);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phonenumber` int NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (3,'$2a$10$Z.FeATBiEKxSusOmt.Erwedk8eVctsA9s7rx6.NBTySbvMfKHFUu6','minhquan1213','123abc',123123123,'admin'),(28,'$2a$10$6mz5kkkQRxHGGb3e6Hnmpud6Qy.xFOBbd7MWU3Qy6KNbOBCV8pSh.','minhquan12134','321bca',321321321,'user'),(29,'$2a$10$FOVcn9svozRu8bo92S9bneqWUkXMqsrHBuY6.W6RT0da84LjAYeL.','',NULL,0,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-02 14:44:02
