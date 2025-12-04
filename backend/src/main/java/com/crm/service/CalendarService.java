package com.crm.service;

import com.crm.dto.CalendarEventDto;
import com.crm.entity.CalendarEvent;
import com.crm.entity.CalendarEvent.EventStatus;
import com.crm.entity.CalendarEvent.EventType;
import com.crm.entity.Contact;
import com.crm.entity.Meeting;
import com.crm.repository.CalendarEventRepository;
import com.crm.repository.ContactRepository;
import com.crm.repository.MeetingRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CalendarService {
    private final CalendarEventRepository eventRepository;
    private final ContactRepository contactRepository;
    private final MeetingRepository meetingRepository;
    private final ObjectMapper objectMapper;

    public CalendarService(CalendarEventRepository eventRepository, ContactRepository contactRepository,
                           MeetingRepository meetingRepository, ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.contactRepository = contactRepository;
        this.meetingRepository = meetingRepository;
        this.objectMapper = objectMapper;
    }

    public List<CalendarEventDto> getAll(String userId) {
        return eventRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CalendarEventDto> getByDateRange(String userId, String startDate, String endDate) {
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(LocalTime.MAX);
        return eventRepository.findByUserIdAndDateRange(userId, start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CalendarEventDto> getUpcoming(String userId, int limit) {
        return eventRepository.findUpcoming(userId, LocalDateTime.now()).stream()
                .limit(limit)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CalendarEventDto> getByContact(String userId, String contactId) {
        return eventRepository.findByUserIdAndContactId(userId, contactId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CalendarEventDto> getToday(String userId) {
        return eventRepository.findByUserIdAndDate(userId, LocalDateTime.now()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CalendarEventDto getById(String id, String userId) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        return toDto(event);
    }

    @Transactional
    public CalendarEventDto create(CalendarEventDto dto, String userId) {
        CalendarEvent event = new CalendarEvent();
        event.setUserId(userId);
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setContactId(dto.getContactId());
        event.setStartTime(LocalDateTime.parse(dto.getStartTime()));
        event.setEndTime(LocalDateTime.parse(dto.getEndTime()));
        event.setLocation(dto.getLocation());
        event.setType(dto.getType() != null ? EventType.valueOf(dto.getType()) : EventType.MEETING);
        event.setStatus(EventStatus.SCHEDULED);
        event.setAttendees(toJson(dto.getAttendees()));
        event.setReminderMinutes(dto.getReminderMinutes() != null ? dto.getReminderMinutes() : 15);

        // Generate Google Meet link if requested
        if (Boolean.TRUE.equals(dto.getCreateMeetLink())) {
            event.setMeetLink(generateMeetLink());
            event.setType(EventType.VIDEO_CALL);
        } else if (dto.getMeetLink() != null) {
            event.setMeetLink(dto.getMeetLink());
        }

        event = eventRepository.save(event);
        return toDto(event);
    }

    @Transactional
    public CalendarEventDto update(String id, CalendarEventDto dto, String userId) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        if (dto.getTitle() != null) event.setTitle(dto.getTitle());
        if (dto.getDescription() != null) event.setDescription(dto.getDescription());
        if (dto.getContactId() != null) event.setContactId(dto.getContactId());
        if (dto.getStartTime() != null) event.setStartTime(LocalDateTime.parse(dto.getStartTime()));
        if (dto.getEndTime() != null) event.setEndTime(LocalDateTime.parse(dto.getEndTime()));
        if (dto.getLocation() != null) event.setLocation(dto.getLocation());
        if (dto.getMeetLink() != null) event.setMeetLink(dto.getMeetLink());
        if (dto.getType() != null) event.setType(EventType.valueOf(dto.getType()));
        if (dto.getStatus() != null) event.setStatus(EventStatus.valueOf(dto.getStatus()));
        if (dto.getAttendees() != null) event.setAttendees(toJson(dto.getAttendees()));
        if (dto.getReminderMinutes() != null) event.setReminderMinutes(dto.getReminderMinutes());

        // Generate Meet link if requested
        if (Boolean.TRUE.equals(dto.getCreateMeetLink()) && event.getMeetLink() == null) {
            event.setMeetLink(generateMeetLink());
        }

        event = eventRepository.save(event);
        return toDto(event);
    }

    @Transactional
    public void cancel(String id, String userId) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
    }

    @Transactional
    public CalendarEventDto complete(String id, String userId, String notes) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        event.setStatus(EventStatus.COMPLETED);
        event = eventRepository.save(event);

        // Create a meeting record if contact is associated
        if (event.getContactId() != null) {
            Meeting meeting = new Meeting();
            meeting.setUserId(userId);
            meeting.setContactId(event.getContactId());
            meeting.setMeetingDate(event.getStartTime());
            meeting.setNotes(notes != null ? notes : event.getDescription());

            if (event.getMeetLink() != null) {
                meeting.setMedium(Meeting.MeetingMedium.VIDEO_CALL);
            } else if (event.getType() == EventType.CALL) {
                meeting.setMedium(Meeting.MeetingMedium.PHONE_CALL);
            } else {
                meeting.setMedium(Meeting.MeetingMedium.IN_PERSON);
            }

            meetingRepository.save(meeting);

            // Update contact's last contacted time
            Contact contact = contactRepository.findById(event.getContactId()).orElse(null);
            if (contact != null) {
                contact.setLastContactedAt(event.getStartTime());
                contactRepository.save(contact);
            }
        }

        return toDto(event);
    }

    @Transactional
    public void delete(String id, String userId) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        eventRepository.delete(event);
    }

    // Generate ICS file for export
    public String exportToIcs(String userId) {
        List<CalendarEvent> events = eventRepository.findByUserId(userId);
        StringBuilder ics = new StringBuilder();
        ics.append("BEGIN:VCALENDAR\n");
        ics.append("VERSION:2.0\n");
        ics.append("PRODID:-//Personal CRM//EN\n");

        for (CalendarEvent event : events) {
            ics.append("BEGIN:VEVENT\n");
            ics.append("UID:").append(event.getId()).append("@crm\n");
            ics.append("DTSTART:").append(formatIcsDateTime(event.getStartTime())).append("\n");
            ics.append("DTEND:").append(formatIcsDateTime(event.getEndTime())).append("\n");
            ics.append("SUMMARY:").append(escapeIcs(event.getTitle())).append("\n");
            if (event.getDescription() != null) {
                ics.append("DESCRIPTION:").append(escapeIcs(event.getDescription())).append("\n");
            }
            if (event.getLocation() != null) {
                ics.append("LOCATION:").append(escapeIcs(event.getLocation())).append("\n");
            }
            if (event.getMeetLink() != null) {
                ics.append("URL:").append(event.getMeetLink()).append("\n");
            }
            ics.append("STATUS:").append(mapStatusToIcs(event.getStatus())).append("\n");
            ics.append("END:VEVENT\n");
        }

        ics.append("END:VCALENDAR\n");
        return ics.toString();
    }

    // Import from ICS
    @Transactional
    public List<CalendarEventDto> importFromIcs(String userId, String icsContent) {
        List<CalendarEventDto> imported = new ArrayList<>();
        String[] lines = icsContent.split("\n");
        CalendarEventDto current = null;

        for (String line : lines) {
            line = line.trim();
            if (line.equals("BEGIN:VEVENT")) {
                current = new CalendarEventDto();
            } else if (line.equals("END:VEVENT") && current != null) {
                if (current.getTitle() != null && current.getStartTime() != null) {
                    if (current.getEndTime() == null) {
                        current.setEndTime(current.getStartTime());
                    }
                    imported.add(create(current, userId));
                }
                current = null;
            } else if (current != null) {
                if (line.startsWith("SUMMARY:")) {
                    current.setTitle(unescapeIcs(line.substring(8)));
                } else if (line.startsWith("DESCRIPTION:")) {
                    current.setDescription(unescapeIcs(line.substring(12)));
                } else if (line.startsWith("DTSTART")) {
                    current.setStartTime(parseIcsDateTime(line));
                } else if (line.startsWith("DTEND")) {
                    current.setEndTime(parseIcsDateTime(line));
                } else if (line.startsWith("LOCATION:")) {
                    current.setLocation(unescapeIcs(line.substring(9)));
                } else if (line.startsWith("URL:")) {
                    String url = line.substring(4);
                    if (url.contains("meet.google.com")) {
                        current.setMeetLink(url);
                        current.setType("VIDEO_CALL");
                    }
                }
            }
        }

        return imported;
    }

    // Generate a pseudo-Google Meet link (in production, use Google API)
    private String generateMeetLink() {
        String code = UUID.randomUUID().toString().substring(0, 12).replace("-", "");
        return "https://meet.google.com/" + code.substring(0, 3) + "-" + code.substring(3, 7) + "-" + code.substring(7);
    }

    private String formatIcsDateTime(LocalDateTime dt) {
        return String.format("%04d%02d%02dT%02d%02d00Z",
                dt.getYear(), dt.getMonthValue(), dt.getDayOfMonth(),
                dt.getHour(), dt.getMinute());
    }

    private String parseIcsDateTime(String line) {
        String value = line.contains(":") ? line.substring(line.indexOf(":") + 1) : line;
        value = value.replace("Z", "").replace("T", "");
        if (value.length() >= 8) {
            int year = Integer.parseInt(value.substring(0, 4));
            int month = Integer.parseInt(value.substring(4, 6));
            int day = Integer.parseInt(value.substring(6, 8));
            int hour = value.length() >= 10 ? Integer.parseInt(value.substring(8, 10)) : 0;
            int minute = value.length() >= 12 ? Integer.parseInt(value.substring(10, 12)) : 0;
            return LocalDateTime.of(year, month, day, hour, minute).toString();
        }
        return null;
    }

    private String escapeIcs(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\n", "\\n");
    }

    private String unescapeIcs(String value) {
        if (value == null) return "";
        return value.replace("\\n", "\n")
                .replace("\\,", ",")
                .replace("\\;", ";")
                .replace("\\\\", "\\");
    }

    private String mapStatusToIcs(EventStatus status) {
        switch (status) {
            case CONFIRMED: return "CONFIRMED";
            case CANCELLED: return "CANCELLED";
            case COMPLETED: return "COMPLETED";
            default: return "TENTATIVE";
        }
    }

    private CalendarEventDto toDto(CalendarEvent event) {
        CalendarEventDto dto = new CalendarEventDto();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setContactId(event.getContactId());
        if (event.getContactId() != null) {
            Contact contact = contactRepository.findById(event.getContactId()).orElse(null);
            dto.setContactName(contact != null ? contact.getName() : null);
        }
        dto.setStartTime(event.getStartTime().toString());
        dto.setEndTime(event.getEndTime().toString());
        dto.setLocation(event.getLocation());
        dto.setMeetLink(event.getMeetLink());
        dto.setType(event.getType().name());
        dto.setStatus(event.getStatus().name());
        dto.setAttendees(parseJsonArray(event.getAttendees()));
        dto.setReminderMinutes(event.getReminderMinutes());
        dto.setCreatedAt(event.getCreatedAt() != null ? event.getCreatedAt().toString() : null);
        dto.setUpdatedAt(event.getUpdatedAt() != null ? event.getUpdatedAt().toString() : null);
        return dto;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        try {
            return json != null ? objectMapper.readValue(json, List.class) : new ArrayList<>();
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : new ArrayList<>());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
