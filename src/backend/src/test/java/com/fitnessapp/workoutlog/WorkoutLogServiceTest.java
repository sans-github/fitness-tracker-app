package com.fitnessapp.workoutlog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WorkoutLogServiceTest {

  @Mock
  private WorkoutLogRepository repository;

  @InjectMocks
  private WorkoutLogService service;

  private WorkoutLog buildEntity() {
    WorkoutLog e = new WorkoutLog();
    e.setId(UUID.randomUUID());
    e.setExercise("Squat");
    e.setWeightLbs(new BigDecimal("100.00"));
    e.setSets(3);
    e.setReps(5);
    e.setCreatedAt(LocalDateTime.now());
    e.setUpdatedAt(LocalDateTime.now());
    return e;
  }

  private WorkoutLogRequest buildRequest() {
    WorkoutLogRequest req = new WorkoutLogRequest();
    req.setExercise("Squat");
    req.setWeightLbs(new BigDecimal("100.00"));
    req.setSets(3);
    req.setReps(5);
    return req;
  }

  @Test
  @DisplayName("findAll_should_returnMappedDtos_when_repositoryHasRecords")
  void findAll_should_returnMappedDtos_when_repositoryHasRecords() {
    WorkoutLog entity = buildEntity();
    when(repository.findAllActiveNewestFirst()).thenReturn(List.of(entity));

    List<WorkoutLogResponse> result = service.findAll();

    assertThat(result).hasSize(1);
    assertThat(result.get(0).getExercise()).isEqualTo("Squat");
    assertThat(result.get(0).getWeightLbs()).isEqualByComparingTo("100.00");
    assertThat(result.get(0).getSets()).isEqualTo(3);
    assertThat(result.get(0).getReps()).isEqualTo(5);
    assertThat(result.get(0).getId()).isEqualTo(entity.getId());
    assertThat(result.get(0).getCreatedAt()).isNotNull();
  }

  @Test
  @DisplayName("findAll_should_returnEmptyList_when_repositoryIsEmpty")
  void findAll_should_returnEmptyList_when_repositoryIsEmpty() {
    when(repository.findAllActiveNewestFirst()).thenReturn(Collections.emptyList());

    List<WorkoutLogResponse> result = service.findAll();

    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("create_should_stampNonNullTimestamps_when_called")
  void create_should_stampNonNullTimestamps_when_called() {
    WorkoutLogRequest req = buildRequest();
    ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
    WorkoutLog saved = buildEntity();
    when(repository.save(captor.capture())).thenReturn(saved);

    service.create(req);

    assertThat(captor.getValue().getCreatedAt()).isNotNull();
    assertThat(captor.getValue().getUpdatedAt()).isNotNull();
  }

  @Test
  @DisplayName("create_should_passCorrectFieldsToRepository_when_requestIsValid")
  void create_should_passCorrectFieldsToRepository_when_requestIsValid() {
    WorkoutLogRequest req = buildRequest();
    ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
    WorkoutLog saved = buildEntity();
    when(repository.save(captor.capture())).thenReturn(saved);

    service.create(req);

    WorkoutLog captured = captor.getValue();
    assertThat(captured.getExercise()).isEqualTo("Squat");
    assertThat(captured.getWeightLbs()).isEqualByComparingTo("100.00");
    assertThat(captured.getSets()).isEqualTo(3);
    assertThat(captured.getReps()).isEqualTo(5);
  }

  @Test
  @DisplayName("create_should_returnDtoMatchingRequest_when_requestIsValid")
  void create_should_returnDtoMatchingRequest_when_requestIsValid() {
    WorkoutLogRequest req = buildRequest();
    WorkoutLog saved = buildEntity();
    when(repository.save(any(WorkoutLog.class))).thenReturn(saved);

    WorkoutLogResponse result = service.create(req);

    assertThat(result.getExercise()).isEqualTo(saved.getExercise());
    assertThat(result.getWeightLbs()).isEqualByComparingTo(saved.getWeightLbs());
    assertThat(result.getSets()).isEqualTo(saved.getSets());
    assertThat(result.getReps()).isEqualTo(saved.getReps());
    assertThat(result.getId()).isEqualTo(saved.getId());
  }
}
