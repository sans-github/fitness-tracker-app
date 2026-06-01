package com.fitnessapp.workoutlog;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST controller for workout log endpoints. */
@RestController
@RequestMapping("/api/v1/workout-logs")
public class WorkoutLogController {

  private static final Logger log = LoggerFactory.getLogger(WorkoutLogController.class);

  private final WorkoutLogService service;

  public WorkoutLogController(WorkoutLogService service) {
    this.service = service;
  }

  /** Returns all active workout log entries, newest first. */
  @GetMapping
  public ResponseEntity<List<WorkoutLogResponse>> getAll(HttpServletRequest request) {
    long start = Instant.now().toEpochMilli();
    log.info("request_received method={} uri={} remoteIp={}",
        request.getMethod(), request.getRequestURI(), request.getRemoteAddr());

    List<WorkoutLogResponse> results = service.findAll();

    long duration = Instant.now().toEpochMilli() - start;
    log.info("request_completed status={} durationMs={}", HttpStatus.OK.value(), duration);

    return ResponseEntity.ok(results);
  }

  /** Creates a new workout log entry. */
  @PostMapping
  public ResponseEntity<WorkoutLogResponse> create(
      @Valid @RequestBody WorkoutLogRequest body,
      HttpServletRequest request) {

    long start = Instant.now().toEpochMilli();
    log.info("request_received method={} uri={} remoteIp={}",
        request.getMethod(), request.getRequestURI(), request.getRemoteAddr());

    WorkoutLogResponse created = service.create(body);

    long duration = Instant.now().toEpochMilli() - start;
    log.info("request_completed status={} durationMs={}", HttpStatus.CREATED.value(), duration);

    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }
}
