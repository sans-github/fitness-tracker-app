package com.fitnessapp;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitnessapp.workoutlog.WorkoutLogResponse;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb-integration;DB_CLOSE_DELAY=-1",
    "spring.flyway.baseline-on-migrate=true",
    "spring.flyway.baseline-version=0",
    "spring.flyway.sql-migration-prefix=",
    "spring.flyway.sql-migration-separator=_",
    "server.tomcat.accesslog.enabled=false"
})
class WorkoutLogIntegrationTest {

  @Autowired
  private TestRestTemplate restTemplate;

  @Test
  @DisplayName("postThenGet_should_returnCreatedEntry_when_roundTripCompletes")
  void postThenGet_should_returnCreatedEntry_when_roundTripCompletes() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    String body = "{\"exercise\":\"Squat\",\"weightLbs\":100.00,\"sets\":3,\"reps\":5}";

    ResponseEntity<WorkoutLogResponse> postResponse = restTemplate.exchange(
        "/api/v1/workout-logs",
        HttpMethod.POST,
        new HttpEntity<>(body, headers),
        WorkoutLogResponse.class);

    assertThat(postResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    assertThat(postResponse.getBody()).isNotNull();
    assertThat(postResponse.getBody().getExercise()).isEqualTo("Squat");
    assertThat(postResponse.getBody().getId()).isNotNull();

    ResponseEntity<WorkoutLogResponse[]> getResponse = restTemplate.getForEntity(
        "/api/v1/workout-logs", WorkoutLogResponse[].class);

    assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(getResponse.getBody()).isNotNull();
    assertThat(getResponse.getBody().length).isGreaterThanOrEqualTo(1);

    boolean found = false;
    for (WorkoutLogResponse r : getResponse.getBody()) {
      if (postResponse.getBody().getId().equals(r.getId())) {
        found = true;
        break;
      }
    }
    assertThat(found).isTrue();
  }

  @Test
  @DisplayName("post_should_return400_when_bodyIsEmpty")
  void post_should_return400_when_bodyIsEmpty() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    ResponseEntity<Map> response = restTemplate.exchange(
        "/api/v1/workout-logs",
        HttpMethod.POST,
        new HttpEntity<>("{}", headers),
        Map.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody()).containsKey("errors");
  }
}
