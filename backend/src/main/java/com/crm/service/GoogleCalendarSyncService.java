package com.crm.service;

import com.crm.dto.GoogleCalendarDto;
import com.crm.entity.CalendarEvent;
import com.crm.entity.User;
import com.crm.entity.UserGoogleToken;
import com.crm.repository.CalendarEventRepository;
import com.crm.repository.UserGoogleTokenRepository;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@Slf4j
public class GoogleCalendarSyncService {

    private static final String APPLICATION_NAME = "Nu-Connect CRM";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Arrays.asList(
            CalendarScopes.CALENDAR_READONLY,
            CalendarScopes.CALENDAR_EVENTS,
            "email",
            "profile"
    );

    private final UserGoogleTokenRepository tokenRepository;
    private final CalendarEventRepository eventRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String clientSecret;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${google.calendar.enabled:false}")
    private boolean calendarEnabled;

    public GoogleCalendarSyncService(
            UserGoogleTokenRepository tokenRepository,
            CalendarEventRepository eventRepository) {
        this.tokenRepository = tokenRepository;
        this.eventRepository = eventRepository;
    }

    public String getAuthorizationUrl(String redirectUri) {
        try {
            GoogleAuthorizationCodeFlow flow = getFlow();
            return flow.newAuthorizationUrl()
                    .setRedirectUri(redirectUri)
                    .setAccessType("offline")
                    .setApprovalPrompt("force")
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate authorization URL", e);
            throw new RuntimeException("Failed to generate authorization URL", e);
        }
    }

    @Transactional
    public GoogleCalendarDto.SyncStatus connect(User user, String authorizationCode, String redirectUri) {
        try {
            GoogleAuthorizationCodeFlow flow = getFlow();
            TokenResponse tokenResponse = flow.newTokenRequest(authorizationCode)
                    .setRedirectUri(redirectUri)
                    .execute();

            // Get user email from Google
            Credential credential = flow.createAndStoreCredential(tokenResponse, user.getId());
            Calendar calendarService = getCalendarService(credential);

            // Get primary calendar
            CalendarListEntry primaryCalendar = calendarService.calendarList()
                    .get("primary")
                    .execute();

            // Save or update token
            UserGoogleToken token = tokenRepository.findByUserId(user.getId())
                    .orElse(UserGoogleToken.builder().user(user).build());

            token.setAccessToken(tokenResponse.getAccessToken());
            token.setRefreshToken(tokenResponse.getRefreshToken() != null ?
                    tokenResponse.getRefreshToken() : token.getRefreshToken());
            token.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds()));
            token.setPrimaryCalendarId(primaryCalendar.getId());
            token.setCalendarSyncEnabled(true);
            token.setSyncStatus("CONNECTED");

            tokenRepository.save(token);

            log.info("Google Calendar connected for user: {}", user.getEmail());

            return GoogleCalendarDto.SyncStatus.builder()
                    .connected(true)
                    .syncEnabled(true)
                    .primaryCalendarId(primaryCalendar.getId())
                    .email(primaryCalendar.getSummary())
                    .status("CONNECTED")
                    .build();

        } catch (Exception e) {
            log.error("Failed to connect Google Calendar for user: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to connect Google Calendar: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void disconnect(User user) {
        tokenRepository.findByUserId(user.getId()).ifPresent(token -> {
            tokenRepository.delete(token);
            log.info("Google Calendar disconnected for user: {}", user.getEmail());
        });
    }

    public GoogleCalendarDto.SyncStatus getSyncStatus(User user) {
        return tokenRepository.findByUserId(user.getId())
                .map(token -> GoogleCalendarDto.SyncStatus.builder()
                        .connected(true)
                        .syncEnabled(token.isCalendarSyncEnabled())
                        .lastSyncAt(token.getLastSyncAt())
                        .status(token.getSyncStatus())
                        .primaryCalendarId(token.getPrimaryCalendarId())
                        .build())
                .orElse(GoogleCalendarDto.SyncStatus.builder()
                        .connected(false)
                        .syncEnabled(false)
                        .status("NOT_CONNECTED")
                        .build());
    }

    @Transactional
    public GoogleCalendarDto.SyncResult triggerSync(User user) {
        UserGoogleToken token = tokenRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Google Calendar not connected"));

        if (!token.isCalendarSyncEnabled()) {
            throw new RuntimeException("Calendar sync is disabled");
        }

        try {
            Credential credential = refreshCredential(token);
            Calendar calendarService = getCalendarService(credential);

            int imported = syncFromGoogle(user, calendarService, token.getPrimaryCalendarId());
            int exported = syncToGoogle(user, calendarService, token.getPrimaryCalendarId());

            token.setLastSyncAt(LocalDateTime.now());
            token.setSyncStatus("SYNCED");
            tokenRepository.save(token);

            return GoogleCalendarDto.SyncResult.builder()
                    .eventsImported(imported)
                    .eventsExported(exported)
                    .conflicts(0)
                    .syncedAt(LocalDateTime.now())
                    .message("Sync completed successfully")
                    .build();

        } catch (Exception e) {
            log.error("Sync failed for user: {}", user.getEmail(), e);
            token.setSyncStatus("SYNC_FAILED");
            tokenRepository.save(token);
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }
    }

    private int syncFromGoogle(User user, Calendar calendarService, String calendarId) throws IOException {
        // Get events from last 30 days to next 90 days
        LocalDateTime now = LocalDateTime.now();
        DateTime timeMin = toGoogleDateTime(now.minusDays(30));
        DateTime timeMax = toGoogleDateTime(now.plusDays(90));

        Events events = calendarService.events().list(calendarId)
                .setTimeMin(timeMin)
                .setTimeMax(timeMax)
                .setMaxResults(500)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        int count = 0;
        for (Event googleEvent : events.getItems()) {
            if (googleEvent.getStatus().equals("cancelled")) {
                continue;
            }

            // Check if event already exists
            Optional<CalendarEvent> existing = eventRepository.findByExternalIdAndUserId(
                    googleEvent.getId(), user.getId());

            if (existing.isEmpty()) {
                CalendarEvent newEvent = convertGoogleEvent(googleEvent, user);
                eventRepository.save(newEvent);
                count++;
            } else {
                // Update if Google version is newer
                CalendarEvent localEvent = existing.get();
                DateTime googleUpdated = googleEvent.getUpdated();
                if (googleUpdated != null) {
                    LocalDateTime googleUpdateTime = fromGoogleDateTime(googleUpdated);
                    if (googleUpdateTime.isAfter(localEvent.getUpdatedAt())) {
                        updateFromGoogleEvent(localEvent, googleEvent);
                        eventRepository.save(localEvent);
                    }
                }
            }
        }

        log.info("Imported {} events from Google Calendar for user: {}", count, user.getEmail());
        return count;
    }

    private int syncToGoogle(User user, Calendar calendarService, String calendarId) throws IOException {
        // Find local events not synced to Google
        List<CalendarEvent> unsynced = eventRepository.findByUserIdAndExternalIdIsNull(user.getId());

        int count = 0;
        for (CalendarEvent localEvent : unsynced) {
            Event googleEvent = convertToGoogleEvent(localEvent);

            Event created = calendarService.events()
                    .insert(calendarId, googleEvent)
                    .setConferenceDataVersion(1)
                    .execute();

            localEvent.setExternalId(created.getId());
            localEvent.setExternalCalendarId(calendarId);
            if (created.getHangoutLink() != null) {
                localEvent.setMeetLink(created.getHangoutLink());
            }
            eventRepository.save(localEvent);
            count++;
        }

        log.info("Exported {} events to Google Calendar for user: {}", count, user.getEmail());
        return count;
    }

    @Scheduled(fixedRateString = "${google.calendar.sync-interval-minutes:15}000")
    public void scheduledSync() {
        if (!calendarEnabled) {
            return;
        }

        List<UserGoogleToken> tokens = tokenRepository.findAllWithSyncEnabled();
        for (UserGoogleToken token : tokens) {
            try {
                triggerSync(token.getUser());
            } catch (Exception e) {
                log.error("Scheduled sync failed for user: {}", token.getUser().getEmail(), e);
            }
        }
    }

    // Helper methods
    private GoogleAuthorizationCodeFlow getFlow() throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleClientSecrets.Details details = new GoogleClientSecrets.Details()
                .setClientId(clientId)
                .setClientSecret(clientSecret);

        GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setWeb(details);

        return new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                .setAccessType("offline")
                .build();
    }

    private Calendar getCalendarService(Credential credential) throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Calendar.Builder(httpTransport, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    private Credential refreshCredential(UserGoogleToken token) throws GeneralSecurityException, IOException {
        GoogleAuthorizationCodeFlow flow = getFlow();
        TokenResponse tokenResponse = new TokenResponse()
                .setAccessToken(token.getAccessToken())
                .setRefreshToken(token.getRefreshToken())
                .setExpiresInSeconds(3600L);

        Credential credential = flow.createAndStoreCredential(tokenResponse, token.getUser().getId());

        if (token.isTokenExpired() && token.getRefreshToken() != null) {
            credential.refreshToken();
            token.setAccessToken(credential.getAccessToken());
            token.setTokenExpiresAt(LocalDateTime.now().plusSeconds(credential.getExpiresInSeconds()));
            tokenRepository.save(token);
        }

        return credential;
    }

    private CalendarEvent convertGoogleEvent(Event googleEvent, User user) {
        CalendarEvent event = new CalendarEvent();
        event.setUser(user);
        event.setExternalId(googleEvent.getId());
        event.setTitle(googleEvent.getSummary() != null ? googleEvent.getSummary() : "Untitled");
        event.setDescription(googleEvent.getDescription());
        event.setLocation(googleEvent.getLocation());

        if (googleEvent.getStart().getDateTime() != null) {
            event.setStartTime(fromGoogleDateTime(googleEvent.getStart().getDateTime()));
        } else if (googleEvent.getStart().getDate() != null) {
            event.setStartTime(fromGoogleDateOnly(googleEvent.getStart().getDate()).atStartOfDay());
        }

        if (googleEvent.getEnd().getDateTime() != null) {
            event.setEndTime(fromGoogleDateTime(googleEvent.getEnd().getDateTime()));
        } else if (googleEvent.getEnd().getDate() != null) {
            event.setEndTime(fromGoogleDateOnly(googleEvent.getEnd().getDate()).atStartOfDay());
        }

        // Determine event type
        if (googleEvent.getHangoutLink() != null) {
            event.setType(CalendarEvent.EventType.VIDEO_CALL);
            event.setMeetLink(googleEvent.getHangoutLink());
        } else if (googleEvent.getLocation() != null && googleEvent.getLocation().toLowerCase().contains("call")) {
            event.setType(CalendarEvent.EventType.CALL);
        } else {
            event.setType(CalendarEvent.EventType.MEETING);
        }

        event.setStatus(CalendarEvent.EventStatus.SCHEDULED);

        // Handle attendees
        if (googleEvent.getAttendees() != null) {
            List<String> attendeeEmails = new ArrayList<>();
            for (EventAttendee attendee : googleEvent.getAttendees()) {
                attendeeEmails.add(attendee.getEmail());
            }
            event.setAttendees(String.join(",", attendeeEmails));
        }

        return event;
    }

    private void updateFromGoogleEvent(CalendarEvent localEvent, Event googleEvent) {
        localEvent.setTitle(googleEvent.getSummary() != null ? googleEvent.getSummary() : "Untitled");
        localEvent.setDescription(googleEvent.getDescription());
        localEvent.setLocation(googleEvent.getLocation());

        if (googleEvent.getStart().getDateTime() != null) {
            localEvent.setStartTime(fromGoogleDateTime(googleEvent.getStart().getDateTime()));
        }
        if (googleEvent.getEnd().getDateTime() != null) {
            localEvent.setEndTime(fromGoogleDateTime(googleEvent.getEnd().getDateTime()));
        }

        if (googleEvent.getHangoutLink() != null) {
            localEvent.setMeetLink(googleEvent.getHangoutLink());
        }
    }

    private Event convertToGoogleEvent(CalendarEvent localEvent) {
        Event event = new Event()
                .setSummary(localEvent.getTitle())
                .setDescription(localEvent.getDescription())
                .setLocation(localEvent.getLocation());

        EventDateTime start = new EventDateTime()
                .setDateTime(toGoogleDateTime(localEvent.getStartTime()))
                .setTimeZone("UTC");
        event.setStart(start);

        EventDateTime end = new EventDateTime()
                .setDateTime(toGoogleDateTime(localEvent.getEndTime()))
                .setTimeZone("UTC");
        event.setEnd(end);

        // Add Google Meet for video calls
        if (localEvent.getType() == CalendarEvent.EventType.VIDEO_CALL) {
            ConferenceData conferenceData = new ConferenceData();
            CreateConferenceRequest createRequest = new CreateConferenceRequest()
                    .setRequestId(UUID.randomUUID().toString())
                    .setConferenceSolutionKey(new ConferenceSolutionKey().setType("hangoutsMeet"));
            conferenceData.setCreateRequest(createRequest);
            event.setConferenceData(conferenceData);
        }

        // Add attendees
        if (localEvent.getAttendees() != null && !localEvent.getAttendees().isEmpty()) {
            List<EventAttendee> attendees = new ArrayList<>();
            for (String email : localEvent.getAttendees().split(",")) {
                attendees.add(new EventAttendee().setEmail(email.trim()));
            }
            event.setAttendees(attendees);
        }

        return event;
    }

    private DateTime toGoogleDateTime(LocalDateTime localDateTime) {
        ZonedDateTime zdt = localDateTime.atZone(ZoneId.systemDefault());
        return new DateTime(zdt.toInstant().toEpochMilli());
    }

    private LocalDateTime fromGoogleDateTime(DateTime googleDateTime) {
        return LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(googleDateTime.getValue()),
                ZoneId.systemDefault()
        );
    }

    private java.time.LocalDate fromGoogleDateOnly(DateTime date) {
        return java.time.Instant.ofEpochMilli(date.getValue())
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }
}
