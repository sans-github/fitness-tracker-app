package com.fitnessapp.workoutlog;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.GlobalExceptionHandler;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WorkoutLogController.class)
@Import(GlobalExceptionHandler.class)
class WorkoutLogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private WorkoutLogService service;

  private WorkoutLogResponse buildResponse() {
    WorkoutLogResponse r = new WorkoutLogResponse();
    r.setId(UUID.randomUUID());
    r.setExercise("Squat");
    r.setWeightLbs(new BigDecimal("100.00"));
    r.setSets(3);
    r.setReps(5);
    r.setCreatedAt(LocalDateTime.now());
    return r;
  }

  @Test
  @DisplayName("getAll_should_return200WithJsonArray_when_logsExist")
  void getAll_should_return200WithJsonArray_when_logsExist() throws Exception {
    when(service.findAll()).thenReturn(List.of(buildResponse()));

    mockMvc.perform(get("/api/v1/workout-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].exercise").value("Squat"));
  }

  @Test
  @DisplayName("getAll_should_returnEmptyArray_when_noLogsExist")
  void getAll_should_returnEmptyArray_when_noLogsExist() throws Exception {
    when(service.findAll()).thenReturn(Collections.emptyList());

    mockMvc.perform(get("/api/v1/workout-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("create_should_return201WithCreatedObject_when_bodyIsValid")
  void create_should_return201WithCreatedObject_when_bodyIsValid() throws Exception {
    WorkoutLogResponse response = buildResponse();
    when(service.create(any())).thenReturn(response);

    String body = "{\"exercise\":\"Squat\",\"weightLbs\":100.00,\"sets\":3,\"reps\":5}";

    mockMvc.perform(post("/api/v1/workout-logs")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.exercise").value("Squat"))
        .andExpect(jsonPath("$.sets").value(3));
  }

  static Object[][] invalidFieldCases() {
    return new Object[][]{
        {"{\"weightLbs\":100.00,\"sets\":3,\"reps\":5}", "exercise"},
        {"{\"exercise\":\"Squat\",\"weightLbs\":0,\"sets\":3,\"reps\":5}", "weightLbs"},
        {"{\"exercise\":\"Squat\",\"weightLbs\":100.00,\"sets\":0,\"reps\":5}", "sets"},
        {"{\"exercise\":\"Squat\",\"weightLbs\":100.00,\"sets\":3,\"reps\":0}", "reps"},
    };
  }

  @ParameterizedTest(name = "create_should_return400_when_{1}IsInvalid")
  @MethodSource("invalidFieldCases")
  @DisplayName("create_should_return400WithFieldError_when_fieldIsInvalid")
  void create_should_return400WithFieldError_when_fieldIsInvalid(
      String body, String field) throws Exception {

    mockMvc.perform(post("/api/v1/workout-logs")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.type").value("https://fitnessapp.local/errors/validation"))
        .andExpect(jsonPath("$.errors." + field).exists());
  }

  @Test
  @DisplayName("create_should_return400WithAllFieldErrors_when_allFieldsMissing")
  void create_should_return400WithAllFieldErrors_when_allFieldsMissing() throws Exception {
    mockMvc.perform(post("/api/v1/workout-logs")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.exercise").exists())
        .andExpect(jsonPath("$.errors.weightLbs").exists())
        .andExpect(jsonPath("$.errors.sets").exists())
        .andExpect(jsonPath("$.errors.reps").exists());
  }

  @Test
  @DisplayName("create_should_return500Shape_when_serviceThrowsException")
  void create_should_return500Shape_when_serviceThrowsException() throws Exception {
    when(service.create(any())).thenThrow(new RuntimeException("unexpected"));

    String body = "{\"exercise\":\"Squat\",\"weightLbs\":100.00,\"sets\":3,\"reps\":5}";

    mockMvc.perform(post("/api/v1/workout-logs")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.status").value(500))
        .andExpect(jsonPath("$.type").value("https://fitnessapp.local/errors/internal"))
        .andExpect(jsonPath("$.title").value("Internal Server Error"));
  }
}
