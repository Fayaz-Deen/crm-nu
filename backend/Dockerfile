# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Railway uses PORT env variable
ENV PORT=8080
EXPOSE ${PORT}

# Use the neon profile for production with environment variables
ENTRYPOINT ["java", "-jar", "-Dserver.port=${PORT}", "-Dspring.profiles.active=neon", "app.jar"]
