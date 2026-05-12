package com.imunidata;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ImuniDataApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImuniDataApplication.class, args);
        System.out.println("==============================================");
        System.out.println("  ImuniData - Backend iniciado com sucesso!");
        System.out.println("  API:         http://localhost:8080/api/vacinacao");
        System.out.println("  H2 Console:  http://localhost:8080/h2-console");
        System.out.println("==============================================");
    }
}
