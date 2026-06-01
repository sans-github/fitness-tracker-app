package com.fitnessapp.workoutlog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** JPA entity mapping the workout_log table. */
@Entity
@Table(name = "workout_log")
public class WorkoutLog {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "exercise", nullable = false, length = 50)
  private String exercise;

  @Column(name = "weight_lbs", nullable = false, precision = 6, scale = 2)
  private BigDecimal weightLbs;

  @Column(name = "sets", nullable = false)
  private Integer sets;

  @Column(name = "reps", nullable = false)
  private Integer reps;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public LocalDateTime getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(LocalDateTime deletedAt) {
    this.deletedAt = deletedAt;
  }
}
