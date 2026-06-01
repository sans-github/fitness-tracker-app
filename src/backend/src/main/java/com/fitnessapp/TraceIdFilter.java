package com.fitnessapp;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Servlet filter that injects a trace ID into MDC for every request.
 *
 * <p>Reads X-Trace-Id from the incoming request header. If absent, generates a
 * new UUID. The value is placed in MDC under "traceId" so every log line on
 * this thread includes it automatically via logback-spring.xml. The same value
 * is echoed back on the response header so callers can correlate FE and BE
 * logs.
 *
 * <p>MDC is always cleared in the finally block to prevent context leaking
 * across thread-pool reuse.
 */
@Component
@Order(1)
public class TraceIdFilter implements Filter {

  private static final String TRACE_HEADER = "X-Trace-Id";
  private static final String MDC_KEY = "traceId";

  @Override
  public void doFilter(
      ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    String traceId = Optional
        .ofNullable(((HttpServletRequest) request).getHeader(TRACE_HEADER))
        .filter(v -> !v.isBlank())
        .orElse(UUID.randomUUID().toString());

    MDC.put(MDC_KEY, traceId);
    ((HttpServletResponse) response).setHeader(TRACE_HEADER, traceId);

    try {
      chain.doFilter(request, response);
    } finally {
      MDC.clear();
    }
  }
}
