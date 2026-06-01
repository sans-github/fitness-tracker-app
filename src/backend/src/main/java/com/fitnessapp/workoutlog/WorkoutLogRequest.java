package com.fitnessapp.workoutlog;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Inbound DTO for creating a workout log entry. */
public class WorkoutLogRequest {

  @NotBlank(message = "exercise is required")
  @Size(max = 50, message = "exercise must be 50 characters or fewer")
  private String exercise;

  @NotNull(message = "weightLbs is required")
  @DecimalMin(value = "0.01", message = "weightLbs must be greater than 0")
  @Digits(integer = 4, fraction = 2,
      message = "weightLbs must have at most 4 integer digits and 2 decimal places")
  private BigDecimal weightLbs;

  @NotNull(message = "sets is required")
  @Min(value = 1, message = "sets must be at least 1")
  private Integer sets;

  @NotNull(message = "reps is required")
  @Min(value = 1, message = "reps must be at least 1")
  private Integer reps;

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
}
