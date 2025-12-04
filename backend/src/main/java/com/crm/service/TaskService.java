package com.crm.service;

import com.crm.dto.TaskDto;
import com.crm.entity.Contact;
import com.crm.entity.Task;
import com.crm.entity.Task.TaskPriority;
import com.crm.entity.Task.TaskStatus;
import com.crm.repository.ContactRepository;
import com.crm.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final ContactRepository contactRepository;

    public TaskService(TaskRepository taskRepository, ContactRepository contactRepository) {
        this.taskRepository = taskRepository;
        this.contactRepository = contactRepository;
    }

    public List<TaskDto> getAll(String userId) {
        return taskRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getActive(String userId) {
        return taskRepository.findActiveTasks(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getByStatus(String userId, String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase());
        return taskRepository.findByUserIdAndStatus(userId, taskStatus).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getByContact(String userId, String contactId) {
        return taskRepository.findByUserIdAndContactId(userId, contactId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getOverdue(String userId) {
        return taskRepository.findOverdueTasks(userId, LocalDate.now()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getDueToday(String userId) {
        return taskRepository.findTasksDueOn(userId, LocalDate.now()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TaskDto getById(String id, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        return toDto(task);
    }

    @Transactional
    public TaskDto create(TaskDto dto, String userId) {
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setContactId(dto.getContactId());
        task.setStatus(dto.getStatus() != null ? TaskStatus.valueOf(dto.getStatus()) : TaskStatus.PENDING);
        task.setPriority(dto.getPriority() != null ? TaskPriority.valueOf(dto.getPriority()) : TaskPriority.MEDIUM);
        if (dto.getDueDate() != null && !dto.getDueDate().isEmpty()) {
            task.setDueDate(LocalDate.parse(dto.getDueDate()));
        }
        task = taskRepository.save(task);
        return toDto(task);
    }

    @Transactional
    public TaskDto update(String id, TaskDto dto, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        if (dto.getTitle() != null) task.setTitle(dto.getTitle());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getContactId() != null) task.setContactId(dto.getContactId());
        if (dto.getStatus() != null) {
            TaskStatus newStatus = TaskStatus.valueOf(dto.getStatus());
            if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            }
            task.setStatus(newStatus);
        }
        if (dto.getPriority() != null) task.setPriority(TaskPriority.valueOf(dto.getPriority()));
        if (dto.getDueDate() != null) {
            task.setDueDate(dto.getDueDate().isEmpty() ? null : LocalDate.parse(dto.getDueDate()));
        }

        task = taskRepository.save(task);
        return toDto(task);
    }

    @Transactional
    public TaskDto complete(String id, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        task = taskRepository.save(task);
        return toDto(task);
    }

    @Transactional
    public void delete(String id, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        taskRepository.delete(task);
    }

    public TaskStatsDto getStats(String userId) {
        TaskStatsDto stats = new TaskStatsDto();
        stats.total = taskRepository.findByUserId(userId).size();
        stats.pending = taskRepository.countByUserIdAndStatus(userId, TaskStatus.PENDING);
        stats.inProgress = taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        stats.completed = taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);
        stats.overdue = taskRepository.findOverdueTasks(userId, LocalDate.now()).size();
        stats.dueToday = taskRepository.findTasksDueOn(userId, LocalDate.now()).size();
        return stats;
    }

    private TaskDto toDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setContactId(task.getContactId());
        if (task.getContactId() != null) {
            Contact contact = contactRepository.findById(task.getContactId()).orElse(null);
            dto.setContactName(contact != null ? contact.getName() : null);
        }
        dto.setStatus(task.getStatus().name());
        dto.setPriority(task.getPriority().name());
        dto.setDueDate(task.getDueDate() != null ? task.getDueDate().toString() : null);
        dto.setCompletedAt(task.getCompletedAt() != null ? task.getCompletedAt().toString() : null);
        dto.setCreatedAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        dto.setUpdatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null);
        return dto;
    }

    public static class TaskStatsDto {
        public long total;
        public long pending;
        public long inProgress;
        public long completed;
        public long overdue;
        public long dueToday;
    }
}
