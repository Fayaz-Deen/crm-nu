package com.crm.repository;

import com.crm.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, String> {
    List<Meeting> findByUserId(String userId);
    List<Meeting> findByContactId(String contactId);
    List<Meeting> findByContactIdOrderByMeetingDateDesc(String contactId);
    List<Meeting> findByUserIdAndFollowupDateGreaterThanEqualOrderByFollowupDate(String userId, LocalDate date);

    @Query("SELECT COUNT(m) FROM Meeting m WHERE m.userId = ?1 AND m.meetingDate BETWEEN ?2 AND ?3")
    long countByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT m.medium, COUNT(m) FROM Meeting m WHERE m.userId = ?1 GROUP BY m.medium")
    List<Object[]> getMediumBreakdown(String userId);
}
