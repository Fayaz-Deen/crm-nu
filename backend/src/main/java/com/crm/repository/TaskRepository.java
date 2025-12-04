package com.crm.repository;

import com.crm.entity.Task;
import com.crm.entity.Task.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findByUserId(String userId);
    List<Task> findByUserIdAndStatus(String userId, TaskStatus status);
    List<Task> findByUserIdAndContactId(String userId, String contactId);
    List<Task> findByContactId(String contactId);

    @Query("SELECT t FROM Task t WHERE t.userId = ?1 AND t.dueDate <= ?2 AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'")
    List<Task> findOverdueTasks(String userId, LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.userId = ?1 AND t.dueDate = ?2 AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'")
    List<Task> findTasksDueOn(String userId, LocalDate date);

    @Query("SELECT t FROM Task t WHERE t.userId = ?1 AND t.status != 'COMPLETED' AND t.status != 'CANCELLED' ORDER BY t.dueDate ASC NULLS LAST")
    List<Task> findActiveTasks(String userId);

    long countByUserIdAndStatus(String userId, TaskStatus status);
}
