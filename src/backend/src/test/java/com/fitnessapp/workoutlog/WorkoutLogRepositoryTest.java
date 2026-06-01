package com.fitnessapp.workoutlog;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.baseline-on-migrate=true",
    "spring.flyway.baseline-version=0",
    "spring.flyway.sql-migration-prefix=",
    "spring.flyway.sql-migration-separator=_"
})
class WorkoutLogRepositoryTest {

  @Autowired
  private WorkoutLogRepository repository;

  private WorkoutLog makeEntry(String exercise, LocalDateTime createdAt) {
    WorkoutLog e = new WorkoutLog();
    e.setExercise(exercise);
    e.setWeightLbs(new BigDecimal("50.00"));
    e.setSets(3);
    e.setReps(10);
    e.setCreatedAt(createdAt);
    e.setUpdatedAt(createdAt);
    return e;
  }

  @Test
  @DisplayName("findAllActiveNewestFirst_should_returnRecordsOrderedNewestFirst_when_multipleExist")
  void findAllActiveNewestFirst_should_returnRecordsOrderedNewestFirst_when_multipleExist() {
    LocalDateTime older = LocalDateTime.now().minusHours(2);
    LocalDateTime newer = LocalDateTime.now().minusHours(1);

    repository.save(makeEntry("Squat", older));
    repository.save(makeEntry("Bench Press", newer));

    List<WorkoutLog> results = repository.findAllActiveNewestFirst();

    assertThat(results).hasSize(2);
    assertThat(results.get(0).getExercise()).isEqualTo("Bench Press");
    assertThat(results.get(1).getExercise()).isEqualTo("Squat");
  }

  @Test
  @DisplayName("findAllActiveNewestFirst_should_excludeDeletedRows_when_deletedAtIsNotNull")
  void findAllActiveNewestFirst_should_excludeDeletedRows_when_deletedAtIsNotNull() {
    LocalDateTime now = LocalDateTime.now();

    WorkoutLog active = makeEntry("Deadlift", now.minusMinutes(5));
    WorkoutLog deleted = makeEntry("Squat", now.minusMinutes(10));
    deleted.setDeletedAt(now);

    repository.save(active);
    repository.save(deleted);

    List<WorkoutLog> results = repository.findAllActiveNewestFirst();

    assertThat(results).hasSize(1);
    assertThat(results.get(0).getExercise()).isEqualTo("Deadlift");
  }

  @Test
  @DisplayName("findAllActiveNewestFirst_should_returnEmptyList_when_noActiveRows")
  void findAllActiveNewestFirst_should_returnEmptyList_when_noActiveRows() {
    List<WorkoutLog> results = repository.findAllActiveNewestFirst();
    assertThat(results).isEmpty();
  }

  @Test
  @DisplayName("save_should_persistAllFields_when_entityIsValid")
  void save_should_persistAllFields_when_entityIsValid() {
    LocalDateTime now = LocalDateTime.now();
    WorkoutLog entity = makeEntry("OHP", now);
    entity.setWeightLbs(new BigDecimal("60.50"));
    entity.setSets(4);
    entity.setReps(8);

    WorkoutLog saved = repository.save(entity);

    assertThat(saved.getId()).isNotNull();
    assertThat(saved.getExercise()).isEqualTo("OHP");
    assertThat(saved.getWeightLbs()).isEqualByComparingTo("60.50");
    assertThat(saved.getSets()).isEqualTo(4);
    assertThat(saved.getReps()).isEqualTo(8);
    assertThat(saved.getCreatedAt()).isEqualTo(now);
    assertThat(saved.getUpdatedAt()).isEqualTo(now);
    assertThat(saved.getDeletedAt()).isNull();
  }
}
