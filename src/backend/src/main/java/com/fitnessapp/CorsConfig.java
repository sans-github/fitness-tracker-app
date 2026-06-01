package com.fitnessapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Applies CORS settings from application.properties to all API endpoints. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

  @Value("${spring.web.cors.allowed-origins}")
  private String allowedOrigins;

  @Value("${spring.web.cors.allowed-methods}")
  private String allowedMethods;

  @Value("${spring.web.cors.allowed-headers}")
  private String allowedHeaders;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(allowedOrigins.split(","))
        .allowedMethods(allowedMethods.split(","))
        .allowedHeaders(allowedHeaders.split(","));
  }
}
