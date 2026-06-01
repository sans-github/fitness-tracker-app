package com.fitnessapp.workoutlog;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Spring Data JPA repository for WorkoutLog entities. */
public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID> {

  @Query("SELECT w FROM WorkoutLog w WHERE w.deletedAt IS NULL ORDER BY w.createdAt DESC")
  List<WorkoutLog> findAllActiveNewestFirst();
}
