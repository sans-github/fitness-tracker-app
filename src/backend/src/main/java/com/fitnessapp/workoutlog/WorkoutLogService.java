package com.fitnessapp.workoutlog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Business logic for workout log operations. */
@Service
public class WorkoutLogService {

  private static final Logger log = LoggerFactory.getLogger(WorkoutLogService.class);

  private final WorkoutLogRepository repository;

  public WorkoutLogService(WorkoutLogRepository repository) {
    this.repository = repository;
  }

  /** Returns all non-deleted entries, newest first. */
  public List<WorkoutLogResponse> findAll() {
    return repository.findAllActiveNewestFirst()
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  /** Stamps timestamps, persists, and returns the response DTO. */
  public WorkoutLogResponse create(WorkoutLogRequest request) {
    LocalDateTime now = LocalDateTime.now();

    WorkoutLog entity = new WorkoutLog();
    entity.setExercise(request.getExercise());
    entity.setWeightLbs(request.getWeightLbs());
    entity.setSets(request.getSets());
    entity.setReps(request.getReps());
    entity.setCreatedAt(now);
    entity.setUpdatedAt(now);

    WorkoutLog saved = repository.save(entity);

    log.info("workout_log_created exerciseName={} weightLbs={} sets={} reps={}",
        saved.getExercise(), saved.getWeightLbs(), saved.getSets(), saved.getReps());

    return toResponse(saved);
  }

  private WorkoutLogResponse toResponse(WorkoutLog entity) {
    WorkoutLogResponse response = new WorkoutLogResponse();
    response.setId(entity.getId());
    response.setExercise(entity.getExercise());
    response.setWeightLbs(entity.getWeightLbs());
    response.setSets(entity.getSets());
    response.setReps(entity.getReps());
    response.setCreatedAt(entity.getCreatedAt());
    return response;
  }
}
