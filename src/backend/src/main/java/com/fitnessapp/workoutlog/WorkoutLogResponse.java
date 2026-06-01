package com.fitnessapp.workoutlog;

import java.math.BigDecimal;
import java.util.UUID;

/** Outbound DTO returned to API clients. Internal fields are not included. */
public class WorkoutLogResponse {

  private UUID id;
  private String exercise;
  private BigDecimal weightLbs;
  private Integer sets;
  private Integer reps;
  private String createdAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getExercise() {
    return exercise;
  }

  public void setExercise(String exercise) {
    this.exercise = exercise;
  }

  public BigDecimal getWeightLbs() {
    return weightLbs;
  }

  public void setWeightLbs(BigDecimal weightLbs) {
    this.weightLbs = weightLbs;
  }

  public Integer getSets() {
    return sets;
  }

  public void setSets(Integer sets) {
    this.sets = sets;
  }

  public Integer getReps() {
    return reps;
  }

  public void setReps(Integer reps) {
    this.reps = reps;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }
}
