package com.crm.service;

import com.crm.dto.ActivityDto;
import com.crm.entity.Contact;
import com.crm.entity.Meeting;
import com.crm.entity.Reminder;
import com.crm.entity.Task;
import com.crm.repository.ContactRepository;
import com.crm.repository.MeetingRepository;
import com.crm.repository.ReminderRepository;
import com.crm.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ActivityService {
    private final ContactRepository contactRepository;
    private final MeetingRepository meetingRepository;
    private final ReminderRepository reminderRepository;
    private final TaskRepository taskRepository;

    public ActivityService(ContactRepository contactRepository, MeetingRepository meetingRepository,
                           ReminderRepository reminderRepository, TaskRepository taskRepository) {
        this.contactRepository = contactRepository;
        this.meetingRepository = meetingRepository;
        this.reminderRepository = reminderRepository;
        this.taskRepository = taskRepository;
    }

    public List<ActivityDto> getRecentActivity(String userId, int limit) {
        List<ActivityDto> activities = new ArrayList<>();

        // Get recent meetings
        meetingRepository.findByUserId(userId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .forEach(meeting -> {
                    ActivityDto activity = new ActivityDto();
                    activity.setId(meeting.getId());
                    activity.setType("MEETING");
                    activity.setContactId(meeting.getContactId());
                    Contact contact = contactRepository.findById(meeting.getContactId()).orElse(null);
                    activity.setContactName(contact != null ? contact.getName() : "Unknown");
                    activity.setDescription(meeting.getMedium().name().replace("_", " ") + " with " + activity.getContactName());
                    activity.setTimestamp(meeting.getMeetingDate().toString());
                    Map<String, Object> details = new HashMap<>();
                    details.put("medium", meeting.getMedium().name());
                    details.put("notes", meeting.getNotes());
                    details.put("outcome", meeting.getOutcome());
                    activity.setDetails(details);
                    activities.add(activity);
                });

        // Get recent tasks
        taskRepository.findByUserId(userId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .forEach(task -> {
                    ActivityDto activity = new ActivityDto();
                    activity.setId(task.getId());
                    activity.setType("TASK");
                    activity.setContactId(task.getContactId());
                    if (task.getContactId() != null) {
                        Contact contact = contactRepository.findById(task.getContactId()).orElse(null);
                        activity.setContactName(contact != null ? contact.getName() : "Unknown");
                    }
                    activity.setDescription("Task: " + task.getTitle());
                    activity.setTimestamp(task.getCreatedAt().toString());
                    Map<String, Object> details = new HashMap<>();
                    details.put("status", task.getStatus().name());
                    details.put("priority", task.getPriority().name());
                    details.put("dueDate", task.getDueDate() != null ? task.getDueDate().toString() : null);
                    activity.setDetails(details);
                    activities.add(activity);
                });

        // Get recently created contacts
        contactRepository.findByUserId(userId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .forEach(contact -> {
                    ActivityDto activity = new ActivityDto();
                    activity.setId(contact.getId());
                    activity.setType("CONTACT_CREATED");
                    activity.setContactId(contact.getId());
                    activity.setContactName(contact.getName());
                    activity.setDescription("Added contact: " + contact.getName());
                    activity.setTimestamp(contact.getCreatedAt().toString());
                    activities.add(activity);
                });

        // Sort all activities by timestamp descending
        return activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<ActivityDto> getContactActivity(String userId, String contactId, int limit) {
        List<ActivityDto> activities = new ArrayList<>();

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!contact.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        // Get contact meetings
        meetingRepository.findByContactId(contactId).stream()
                .sorted((a, b) -> b.getMeetingDate().compareTo(a.getMeetingDate()))
                .forEach(meeting -> {
                    ActivityDto activity = new ActivityDto();
                    activity.setId(meeting.getId());
                    activity.setType("MEETING");
                    activity.setContactId(contactId);
                    activity.setContactName(contact.getName());
                    activity.setDescription(meeting.getMedium().name().replace("_", " "));
                    activity.setTimestamp(meeting.getMeetingDate().toString());
                    Map<String, Object> details = new HashMap<>();
                    details.put("medium", meeting.getMedium().name());
                    details.put("notes", meeting.getNotes());
                    details.put("outcome", meeting.getOutcome());
                    activity.setDetails(details);
                    activities.add(activity);
                });

        // Get contact tasks
        taskRepository.findByContactId(contactId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .forEach(task -> {
                    ActivityDto activity = new ActivityDto();
                    activity.setId(task.getId());
                    activity.setType("TASK");
                    activity.setContactId(contactId);
                    activity.setContactName(contact.getName());
                    activity.setDescription("Task: " + task.getTitle());
                    activity.setTimestamp(task.getCreatedAt().toString());
                    Map<String, Object> details = new HashMap<>();
                    details.put("status", task.getStatus().name());
                    details.put("priority", task.getPriority().name());
                    activity.setDetails(details);
                    activities.add(activity);
                });

        // Add contact creation
        ActivityDto created = new ActivityDto();
        created.setId(contact.getId());
        created.setType("CONTACT_CREATED");
        created.setContactId(contactId);
        created.setContactName(contact.getName());
        created.setDescription("Contact created");
        created.setTimestamp(contact.getCreatedAt().toString());
        activities.add(created);

        return activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
