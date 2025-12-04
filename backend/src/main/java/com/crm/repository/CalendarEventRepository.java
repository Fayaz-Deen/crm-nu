package com.crm.repository;

import com.crm.entity.CalendarEvent;
import com.crm.entity.CalendarEvent.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, String> {
    List<CalendarEvent> findByUserId(String userId);
    List<CalendarEvent> findByUserIdAndContactId(String userId, String contactId);
    List<CalendarEvent> findByContactId(String contactId);
    Optional<CalendarEvent> findByExternalId(String externalId);

    @Query("SELECT e FROM CalendarEvent e WHERE e.userId = ?1 AND e.startTime >= ?2 AND e.startTime < ?3 ORDER BY e.startTime")
    List<CalendarEvent> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT e FROM CalendarEvent e WHERE e.userId = ?1 AND e.startTime >= ?2 AND e.status != 'CANCELLED' ORDER BY e.startTime")
    List<CalendarEvent> findUpcoming(String userId, LocalDateTime from);

    @Query("SELECT e FROM CalendarEvent e WHERE e.userId = ?1 AND DATE(e.startTime) = DATE(?2) ORDER BY e.startTime")
    List<CalendarEvent> findByUserIdAndDate(String userId, LocalDateTime date);

    @Query("SELECT e FROM CalendarEvent e WHERE e.reminderSent = false AND e.status = 'SCHEDULED' AND e.startTime <= ?1")
    List<CalendarEvent> findEventsNeedingReminder(LocalDateTime reminderTime);

    long countByUserIdAndStatus(String userId, EventStatus status);
}
