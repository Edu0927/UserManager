# Etapa 1: Compilacion
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests -B

# Etapa 2: Ejecucion
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl libstdc++ \
    && mkdir -p /app/database /app/logs /app/otel

# OpenTelemetry Java Agent
ARG OTEL_AGENT_VERSION=2.14.0

RUN curl -fSL --retry 3 \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar \
    -o /app/otel/opentelemetry-javaagent.jar

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
