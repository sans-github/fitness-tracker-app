package com.fitnessapp;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Global exception handler producing RFC 7807 problem+json responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private static final MediaType PROBLEM_JSON =
      MediaType.valueOf("application/problem+json");

  /** Handles Bean Validation failures -- returns 400 with field-level errors. */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {

    Map<String, String> fieldErrors = new LinkedHashMap<>();
    ex.getBindingResult().getFieldErrors()
        .forEach(fe -> fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));

    log.warn("validation_failed fields={}", fieldErrors.keySet());

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("type", "https://fitnessapp.local/errors/validation");
    body.put("title", "Validation Failed");
    body.put("status", HttpStatus.BAD_REQUEST.value());
    body.put("instance", request.getRequestURI());
    body.put("errors", fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .contentType(PROBLEM_JSON)
        .body(body);
  }

  /** Catch-all fallback -- returns 500 with no internal detail. */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneric(
      Exception ex, HttpServletRequest request) {

    log.error("unhandled_exception uri={}", request.getRequestURI(), ex);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("type", "https://fitnessapp.local/errors/internal");
    body.put("title", "Internal Server Error");
    body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
    body.put("instance", request.getRequestURI());

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .contentType(PROBLEM_JSON)
        .body(body);
  }
}
